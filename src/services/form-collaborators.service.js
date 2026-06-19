// ===========================================
// Heisenlink - Form Collaborators Service
// ===========================================
//
// Owner-only management of form collaborators. The original form owner (or a
// global ADMIN) may invite registered users by email as EDITOR or VIEWER, list
// the current collaborators, and remove them. Access enforcement for the shared
// forms themselves lives in forms.service.js (assertFormAccess).

import prisma from '../config/database.js';
import { assertFormOwner } from './forms.service.js';
import { errors } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

const COLLABORATOR_USER_SELECT = {
    id: true,
    username: true,
    email: true,
    displayName: true,
    avatarUrl: true,
};

const formatCollaborator = (row) => ({
    id: row.id,
    role: row.role,
    createdAt: row.createdAt,
    user: row.user,
});

/**
 * List the collaborators of a form (owner-only).
 */
export const listCollaborators = async (formId, ownerId, role) => {
    await assertFormOwner(formId, ownerId, role);
    const rows = await prisma.formCollaborator.findMany({
        where: { formId },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: COLLABORATOR_USER_SELECT } },
    });
    return rows.map(formatCollaborator);
};

/**
 * Add (or re-invite / update the role of) a collaborator by email (owner-only).
 * @param {{email: string, role?: 'EDITOR'|'VIEWER'}} data
 */
export const addCollaborator = async (formId, ownerId, role, data = {}) => {
    const form = await assertFormOwner(formId, ownerId, role);

    const accessRole = data.role ?? 'VIEWER';
    if (accessRole !== 'EDITOR' && accessRole !== 'VIEWER') {
        throw errors.badRequest('Invalid role');
    }

    const email = (data.email ?? '').trim().toLowerCase();
    if (!email) {
        throw errors.badRequest('Email is required');
    }

    const target = await prisma.user.findUnique({ where: { email } });
    if (!target || !target.isActive) {
        throw errors.badRequest('User not found');
    }
    if (target.id === form.userId) {
        throw errors.badRequest('The owner already has full access to this form');
    }

    const row = await prisma.formCollaborator.upsert({
        where: { formId_userId: { formId, userId: target.id } },
        create: { formId, userId: target.id, role: accessRole, invitedById: ownerId },
        update: { role: accessRole },
        include: { user: { select: COLLABORATOR_USER_SELECT } },
    });

    logger.info(`Added collaborator ${target.id} (${accessRole}) to form ${formId}`);
    return formatCollaborator(row);
};

/**
 * Remove a collaborator from a form (owner-only).
 */
export const removeCollaborator = async (formId, ownerId, role, collaboratorUserId) => {
    await assertFormOwner(formId, ownerId, role);
    await prisma.formCollaborator.deleteMany({
        where: { formId, userId: collaboratorUserId },
    });
    logger.info(`Removed collaborator ${collaboratorUserId} from form ${formId}`);
};

export default {
    listCollaborators,
    addCollaborator,
    removeCollaborator,
};
