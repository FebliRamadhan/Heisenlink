// ===========================================
// Heisenlink - Form Service (CRUD + questions)
// ===========================================

import prisma from '../config/database.js';
import config from '../config/index.js';
import { cacheForm, getCachedForm, invalidateForm } from './cache.service.js';
import { revalidateFormTag } from './revalidate.service.js';
import { errors } from '../middleware/error.middleware.js';
import { isReservedAlias, generateCode } from '../utils/shortcode.js';
import logger from '../utils/logger.js';

const SLUG_REGEX = /^[a-z0-9_-]{3,50}$/;

// ===========================================
// Slug helpers
// ===========================================

/**
 * Whether a slug is available (globally unique across forms).
 * @param {string} slug
 * @param {string|null} excludeFormId - Ignore this form's own slug (for edits)
 * @returns {Promise<{available: boolean, reason?: 'invalid'|'reserved'|'taken'}>}
 */
export const isSlugAvailable = async (slug, excludeFormId = null) => {
    if (typeof slug !== 'string' || !SLUG_REGEX.test(slug)) {
        return { available: false, reason: 'invalid' };
    }
    if (isReservedAlias(slug)) {
        return { available: false, reason: 'reserved' };
    }
    const existing = await prisma.form.findUnique({
        where: { slug },
        select: { id: true },
    });
    if (existing && existing.id !== excludeFormId) {
        return { available: false, reason: 'taken' };
    }
    return { available: true };
};

/**
 * Generate a unique random slug for a new form.
 * @returns {Promise<string>}
 */
const generateUniqueSlug = async () => {
    // Try a handful of times; collisions are astronomically rare.
    for (let i = 0; i < 5; i += 1) {
        const candidate = generateCode(8).toLowerCase();
        const existing = await prisma.form.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });
        if (!existing) return candidate;
    }
    // Fallback with extra entropy
    return `${generateCode(8)}${Date.now().toString(36)}`.toLowerCase();
};

// ===========================================
// Ownership
// ===========================================

/**
 * Fetch a form and assert the requesting user owns it (ADMIN bypasses).
 * @param {string} formId
 * @param {string} userId
 * @param {string} [role]
 * @param {object} [options] - extra prisma args (e.g. include)
 * @returns {Promise<object>} The form
 */
export const assertFormOwner = async (formId, userId, role = 'USER', options = {}) => {
    const form = await prisma.form.findUnique({ where: { id: formId }, ...options });
    if (!form) {
        throw errors.notFound('Form not found');
    }
    if (form.userId !== userId && role !== 'ADMIN') {
        throw errors.forbidden('You do not have access to this form');
    }
    return form;
};

// Collaboration access levels, ordered from least to most privileged.
const ACCESS_LEVELS = { VIEWER: 1, EDITOR: 2, OWNER: 3 };

/**
 * Resolve a user's effective access level on a form.
 * OWNER = form owner or global ADMIN; otherwise the collaborator role (EDITOR/VIEWER); null if none.
 * @returns {Promise<{form: object, accessLevel: 'OWNER'|'EDITOR'|'VIEWER'|null}>}
 */
export const getFormAccess = async (formId, userId, role = 'USER', options = {}) => {
    const form = await prisma.form.findUnique({
        where: { id: formId },
        ...options,
        include: {
            ...(options.include || {}),
            collaborators: { where: { userId }, select: { role: true } },
        },
    });
    if (!form) {
        throw errors.notFound('Form not found');
    }
    let accessLevel = null;
    if (form.userId === userId || role === 'ADMIN') {
        accessLevel = 'OWNER';
    } else if (form.collaborators.length > 0) {
        accessLevel = form.collaborators[0].role; // EDITOR | VIEWER
    }
    return { form, accessLevel };
};

/**
 * Fetch a form and assert the requesting user has at least `requiredLevel` access.
 * Owners/ADMINs always pass; collaborators pass when their role is privileged enough.
 * @param {'VIEWER'|'EDITOR'|'OWNER'} [requiredLevel]
 * @returns {Promise<{form: object, accessLevel: string}>}
 */
export const assertFormAccess = async (
    formId,
    userId,
    role = 'USER',
    requiredLevel = 'VIEWER',
    options = {}
) => {
    const { form, accessLevel } = await getFormAccess(formId, userId, role, options);
    if (!accessLevel || ACCESS_LEVELS[accessLevel] < ACCESS_LEVELS[requiredLevel]) {
        throw errors.forbidden('You do not have access to this form');
    }
    return { form, accessLevel };
};

// ===========================================
// Form CRUD
// ===========================================

export const createForm = async (userId, data = {}) => {
    const { title, description, slug: requestedSlug } = data;

    let slug;
    if (requestedSlug) {
        const normalized = requestedSlug.toLowerCase();
        const availability = await isSlugAvailable(normalized);
        if (!availability.available) {
            if (availability.reason === 'reserved') {
                throw errors.badRequest('This URL is reserved and cannot be used');
            }
            if (availability.reason === 'invalid') {
                throw errors.badRequest('Invalid URL format');
            }
            throw errors.conflict('This URL is already taken');
        }
        slug = normalized;
    } else {
        slug = await generateUniqueSlug();
    }

    const form = await prisma.form.create({
        data: {
            userId,
            slug,
            title: title || 'Untitled form',
            description: description ?? null,
        },
        include: { questions: { orderBy: { position: 'asc' } } },
    });

    logger.info(`Created form ${form.id} for user ${userId}`);
    return formatFormResponse(form);
};

export const listForms = async (userId, { search, page = 1, limit = 20 } = {}) => {
    // Owned forms plus forms shared with this user as a collaborator.
    const where = {
        OR: [{ userId }, { collaborators: { some: { userId } } }],
    };
    if (search) {
        where.title = { contains: search, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [forms, total] = await Promise.all([
        prisma.form.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit,
            include: {
                _count: { select: { responses: true, questions: true } },
                collaborators: { where: { userId }, select: { role: true } },
            },
        }),
        prisma.form.count({ where }),
    ]);

    return {
        forms: forms.map((form) => formatFormListItem(form, userId)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

export const getFormById = async (formId, userId, role = 'USER') => {
    const { form, accessLevel } = await assertFormAccess(formId, userId, role, 'VIEWER', {
        include: { questions: { orderBy: { position: 'asc' } } },
    });
    return formatFormResponse(form, accessLevel);
};

export const updateForm = async (formId, userId, role, data = {}) => {
    const { form, accessLevel } = await assertFormAccess(formId, userId, role, 'EDITOR');

    const updateData = {};
    const assignable = [
        'title',
        'description',
        'theme',
        'isPublished',
        'acceptingResponses',
        'collectEmail',
        'oneResponsePerSession',
        'confirmationMessage',
        'closedMessage',
        'settings',
    ];
    for (const key of assignable) {
        if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.closesAt !== undefined) {
        updateData.closesAt = data.closesAt ? new Date(data.closesAt) : null;
    }

    // Handle slug change
    if (data.slug !== undefined && data.slug.toLowerCase() !== form.slug) {
        const normalized = data.slug.toLowerCase();
        const availability = await isSlugAvailable(normalized, formId);
        if (!availability.available) {
            if (availability.reason === 'reserved') {
                throw errors.badRequest('This URL is reserved and cannot be used');
            }
            if (availability.reason === 'invalid') {
                throw errors.badRequest('Invalid URL format');
            }
            throw errors.conflict('This URL is already taken');
        }
        updateData.slug = normalized;
    }

    const updated = await prisma.form.update({
        where: { id: formId },
        data: updateData,
        include: { questions: { orderBy: { position: 'asc' } } },
    });

    await invalidateForm(form.slug);
    revalidateFormTag(form.slug);
    if (updateData.slug) {
        await invalidateForm(updateData.slug);
        revalidateFormTag(updateData.slug);
    }

    logger.info(`Updated form ${formId}`);
    return formatFormResponse(updated, accessLevel);
};

export const deleteForm = async (formId, userId, role) => {
    const form = await assertFormOwner(formId, userId, role);
    await prisma.form.delete({ where: { id: formId } });
    await invalidateForm(form.slug);
    revalidateFormTag(form.slug);
    logger.info(`Deleted form ${formId}`);
};

export const duplicateForm = async (formId, userId, role) => {
    const { form } = await assertFormAccess(formId, userId, role, 'VIEWER', {
        include: { questions: { orderBy: { position: 'asc' } } },
    });

    const slug = await generateUniqueSlug();
    const created = await prisma.form.create({
        data: {
            userId,
            slug,
            title: `${form.title} (copy)`,
            description: form.description,
            theme: form.theme,
            settings: form.settings ?? undefined,
            collectEmail: form.collectEmail,
            oneResponsePerSession: form.oneResponsePerSession,
            confirmationMessage: form.confirmationMessage,
            closedMessage: form.closedMessage,
            isPublished: false,
            questions: {
                create: form.questions.map((q) => ({
                    type: q.type,
                    title: q.title,
                    description: q.description,
                    position: q.position,
                    isRequired: q.isRequired,
                    options: q.options ?? undefined,
                    config: q.config ?? undefined,
                })),
            },
        },
        include: { questions: { orderBy: { position: 'asc' } } },
    });

    logger.info(`Duplicated form ${formId} -> ${created.id}`);
    return formatFormResponse(created);
};

// ===========================================
// Questions
// ===========================================

export const addQuestion = async (formId, userId, role, data) => {
    const { form } = await assertFormAccess(formId, userId, role, 'EDITOR');

    const maxPosition = await prisma.formQuestion.aggregate({
        where: { formId },
        _max: { position: true },
    });

    const question = await prisma.formQuestion.create({
        data: {
            formId,
            type: data.type,
            title: data.title ?? '',
            description: data.description ?? null,
            position: data.position ?? (maxPosition._max.position ?? -1) + 1,
            isRequired: data.isRequired ?? false,
            options: data.options ?? undefined,
            config: data.config ?? undefined,
        },
    });

    await invalidateForm(form.slug);
    revalidateFormTag(form.slug);
    return formatQuestion(question);
};

export const updateQuestion = async (formId, questionId, userId, role, data) => {
    const { form } = await assertFormAccess(formId, userId, role, 'EDITOR');

    const existing = await prisma.formQuestion.findUnique({ where: { id: questionId } });
    if (!existing || existing.formId !== formId) {
        throw errors.notFound('Question not found');
    }

    const updateData = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;
    if (data.options !== undefined) updateData.options = data.options ?? undefined;
    if (data.config !== undefined) updateData.config = data.config ?? undefined;

    const updated = await prisma.formQuestion.update({
        where: { id: questionId },
        data: updateData,
    });

    await invalidateForm(form.slug);
    revalidateFormTag(form.slug);
    return formatQuestion(updated);
};

export const deleteQuestion = async (formId, questionId, userId, role) => {
    const { form } = await assertFormAccess(formId, userId, role, 'EDITOR');

    const existing = await prisma.formQuestion.findUnique({ where: { id: questionId } });
    if (!existing || existing.formId !== formId) {
        throw errors.notFound('Question not found');
    }

    await prisma.formQuestion.delete({ where: { id: questionId } });

    await invalidateForm(form.slug);
    revalidateFormTag(form.slug);
};

export const reorderQuestions = async (formId, userId, role, questionIds) => {
    const { form } = await assertFormAccess(formId, userId, role, 'EDITOR');

    await prisma.$transaction(
        questionIds.map((id, index) =>
            prisma.formQuestion.update({
                where: { id },
                data: { position: index },
            })
        )
    );

    await invalidateForm(form.slug);
    revalidateFormTag(form.slug);
};

// ===========================================
// Public resolution
// ===========================================

/**
 * Get a published form by slug for public rendering (cache-first).
 * Returns null when the form does not exist or is not published.
 */
export const getPublicFormBySlug = async (slug) => {
    const cached = await getCachedForm(slug);
    if (cached) {
        return cached;
    }

    const form = await prisma.form.findUnique({
        where: { slug },
        include: { questions: { orderBy: { position: 'asc' } } },
    });

    if (!form || !form.isPublished) {
        return null;
    }

    const formatted = formatPublicForm(form);
    await cacheForm(slug, formatted);
    return formatted;
};

// ===========================================
// Formatters
// ===========================================

const buildPublicUrl = (slug) => `${config.domains.shortlink}/f/${slug}`;

export const formatQuestion = (q) => ({
    id: q.id,
    type: q.type,
    title: q.title,
    description: q.description,
    position: q.position,
    isRequired: q.isRequired,
    options: q.options ?? null,
    config: q.config ?? null,
});

const formatFormResponse = (form, accessLevel = 'OWNER') => ({
    id: form.id,
    slug: form.slug,
    url: buildPublicUrl(form.slug),
    title: form.title,
    description: form.description,
    theme: form.theme,
    settings: form.settings ?? null,
    isPublished: form.isPublished,
    acceptingResponses: form.acceptingResponses,
    collectEmail: form.collectEmail,
    oneResponsePerSession: form.oneResponsePerSession,
    closesAt: form.closesAt,
    confirmationMessage: form.confirmationMessage,
    closedMessage: form.closedMessage,
    responseCount: form.responseCount,
    questions: form.questions ? form.questions.map(formatQuestion) : [],
    myRole: accessLevel,
    isOwner: accessLevel === 'OWNER',
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
});

const formatFormListItem = (form, userId) => {
    const myRole = form.userId === userId ? 'OWNER' : form.collaborators?.[0]?.role ?? 'OWNER';
    return {
        id: form.id,
        slug: form.slug,
        url: buildPublicUrl(form.slug),
        title: form.title,
        description: form.description,
        isPublished: form.isPublished,
        acceptingResponses: form.acceptingResponses,
        closesAt: form.closesAt,
        responseCount: form.responseCount,
        questionCount: form._count?.questions ?? 0,
        myRole,
        isOwner: myRole === 'OWNER',
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
    };
};

const formatPublicForm = (form) => ({
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    theme: form.theme,
    collectEmail: form.collectEmail,
    acceptingResponses: form.acceptingResponses,
    closesAt: form.closesAt,
    confirmationMessage: form.confirmationMessage,
    closedMessage: form.closedMessage,
    questions: form.questions ? form.questions.map(formatQuestion) : [],
});

export default {
    isSlugAvailable,
    assertFormOwner,
    createForm,
    listForms,
    getFormById,
    updateForm,
    deleteForm,
    duplicateForm,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    getPublicFormBySlug,
    formatQuestion,
};
