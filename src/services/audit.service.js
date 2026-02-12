// ===========================================
// LinkHub - Audit Service
// ===========================================

import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Log an audit event
 * @param {object} data - Audit data
 */
export const log = async (data) => {
    const { userId, action, entityType, entityId, oldValues, newValues, ipAddress } = data;

    try {
        await prisma.auditLog.create({
            data: {
                user: { connect: { id: userId } },
                action,
                entityType,
                entityId,
                oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
                newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
                ipAddress,
            },
        });
    } catch (error) {
        logger.error('Failed to create audit log:', error.message);
    }
};

/**
 * Get audit logs with pagination
 * @param {object} options - Query options
 * @returns {Promise<object>}
 */
export const getLogs = async (options = {}) => {
    const {
        page = 1,
        limit = 50,
        userId,
        entityType,
        action,
        from,
        to,
    } = options;

    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { username: true, displayName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        logs: logs.map(log => ({
            id: log.id,
            user: log.user ? {
                username: log.user.username,
                displayName: log.user.displayName,
            } : null,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            oldValues: log.oldValues,
            newValues: log.newValues,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Audit action constants
 */
export const ACTIONS = {
    // Auth
    LOGIN: 'user.login',
    LOGOUT: 'user.logout',
    PASSWORD_CHANGE: 'user.password_change',

    // Links
    LINK_CREATE: 'link.create',
    LINK_UPDATE: 'link.update',
    LINK_DELETE: 'link.delete',

    // Bio
    BIO_UPDATE: 'bio.update',
    BIO_LINK_CREATE: 'bio.link.create',
    BIO_LINK_UPDATE: 'bio.link.update',
    BIO_LINK_DELETE: 'bio.link.delete',

    // Admin
    USER_ACTIVATE: 'admin.user.activate',
    USER_DEACTIVATE: 'admin.user.deactivate',
    USER_ROLE_CHANGE: 'admin.user.role_change',
    ADMIN_LINK_DELETE: 'admin.link.delete',
};

export default {
    log,
    getLogs,
    ACTIONS,
};
