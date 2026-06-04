// ===========================================
// Heisenlink - Form Submission Service
// ===========================================
//
// Validates a public submission against the form's question definitions,
// normalizes answers into FormAnswer rows, and persists transactionally with
// idempotency (duplicate submits with the same idempotencyKey are no-ops).

import prisma from '../config/database.js';
import { errors } from '../middleware/error.middleware.js';
import { validateAndNormalize } from './answer-normalizer.js';
import logger from '../utils/logger.js';

/**
 * Submit a public response.
 * @param {string} slug
 * @param {object} payload - { idempotencyKey, website (honeypot), respondentEmail, answers }
 * @param {object} meta - { ipAddress, userAgent }
 * @returns {Promise<{id: string|null, duplicate?: boolean, honeypot?: boolean}>}
 */
export const submitResponse = async (slug, payload, meta = {}) => {
    const { idempotencyKey, website, respondentEmail, answers } = payload;

    // Honeypot: a filled hidden field means a bot. Return fake success.
    if (typeof website === 'string' && website.trim() !== '') {
        logger.info(`Honeypot triggered on form ${slug}`);
        return { id: null, honeypot: true };
    }

    const form = await prisma.form.findUnique({
        where: { slug },
        include: { questions: { orderBy: { position: 'asc' } } },
    });

    if (!form || !form.isPublished) {
        throw errors.notFound('Form not found');
    }
    if (!form.acceptingResponses) {
        throw errors.badRequest('This form is no longer accepting responses');
    }
    if (form.closesAt && new Date(form.closesAt).getTime() < Date.now()) {
        throw errors.badRequest('This form is closed');
    }

    // Idempotent replay: return existing response for the same key.
    const existing = await prisma.formResponse.findUnique({
        where: { formId_idempotencyKey: { formId: form.id, idempotencyKey } },
        select: { id: true },
    });
    if (existing) {
        return { id: existing.id, duplicate: true };
    }

    const rows = validateAndNormalize(form, answers);

    try {
        const response = await prisma.$transaction(async (tx) => {
            const created = await tx.formResponse.create({
                data: {
                    formId: form.id,
                    idempotencyKey,
                    respondentEmail: form.collectEmail ? respondentEmail ?? null : null,
                    ipAddress: meta.ipAddress ?? null,
                    userAgent: meta.userAgent ?? null,
                    answers: { create: rows },
                },
                select: { id: true },
            });
            await tx.form.update({
                where: { id: form.id },
                data: { responseCount: { increment: 1 } },
            });
            return created;
        });
        return { id: response.id, duplicate: false };
    } catch (error) {
        // Race: another request inserted the same idempotencyKey first.
        if (error.code === 'P2002') {
            const dup = await prisma.formResponse.findUnique({
                where: { formId_idempotencyKey: { formId: form.id, idempotencyKey } },
                select: { id: true },
            });
            if (dup) return { id: dup.id, duplicate: true };
        }
        throw error;
    }
};

export default { submitResponse };
