// ===========================================
// LinkHub - Admin Controller
// ===========================================

import prisma from '../config/database.js';
import * as auditService from '../services/audit.service.js';
import * as analyticsService from '../services/analytics.service.js';
import { formatResponse, createPaginationMeta } from '../utils/helpers.js';
import { errors } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

/**
 * Get all users
 * GET /api/admin/users
 */
export const getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, role, isActive } = req.query;
        const skip = (page - 1) * limit;

        const where = {};
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role) where.role = role;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    displayName: true,
                    role: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    _count: {
                        select: { shortLinks: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.user.count({ where }),
        ]);

        const formattedUsers = users.map(u => ({
            ...u,
            linksCount: u._count.shortLinks,
            _count: undefined,
        }));

        res.json(formatResponse(formattedUsers, createPaginationMeta(total, parseInt(page), parseInt(limit))));
    } catch (error) {
        next(error);
    }
};

/**
 * Update user status/role
 * PATCH /api/admin/users/:id
 */
export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive, role } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw errors.notFound('User not found');
        }

        // Prevent self-deactivation
        if (id === req.user.sub && isActive === false) {
            throw errors.badRequest('You cannot deactivate your own account');
        }

        const updateData = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (role !== undefined) updateData.role = role;

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                role: true,
                isActive: true,
            },
        });

        // Audit log
        await auditService.log({
            userId: req.user.sub,
            action: isActive !== undefined
                ? (isActive ? auditService.ACTIONS.USER_ACTIVATE : auditService.ACTIONS.USER_DEACTIVATE)
                : auditService.ACTIONS.USER_ROLE_CHANGE,
            entityType: 'user',
            entityId: id,
            oldValues: { isActive: user.isActive, role: user.role },
            newValues: updateData,
            ipAddress: req.ip,
        });

        logger.info(`Admin updated user ${user.username}: ${JSON.stringify(updateData)}`);

        res.json(formatResponse(updated));
    } catch (error) {
        next(error);
    }
};

/**
 * Get all links (admin)
 * GET /api/admin/links
 */
export const getAllLinks = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, userId } = req.query;
        const skip = (page - 1) * limit;

        const where = {};
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { destinationUrl: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (userId) where.userId = userId;

        const [links, total] = await Promise.all([
            prisma.shortLink.findMany({
                where,
                include: {
                    user: {
                        select: { username: true, displayName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.shortLink.count({ where }),
        ]);

        res.json(formatResponse(links, createPaginationMeta(total, parseInt(page), parseInt(limit))));
    } catch (error) {
        next(error);
    }
};

/**
 * Delete any link (admin)
 * DELETE /api/admin/links/:id
 */
export const deleteLink = async (req, res, next) => {
    try {
        const { id } = req.params;

        const link = await prisma.shortLink.findUnique({ where: { id } });
        if (!link) {
            throw errors.notFound('Link not found');
        }

        await prisma.shortLink.delete({ where: { id } });

        // Audit log
        await auditService.log({
            userId: req.user.sub,
            action: auditService.ACTIONS.ADMIN_LINK_DELETE,
            entityType: 'shortLink',
            entityId: id,
            oldValues: { code: link.code, destinationUrl: link.destinationUrl },
            ipAddress: req.ip,
        });

        logger.info(`Admin deleted link: ${link.code}`);

        res.json(formatResponse({ message: 'Link deleted successfully' }));
    } catch (error) {
        next(error);
    }
};

/**
 * Get all bio pages (admin)
 * GET /api/admin/bio
 */
export const getAllBioPages = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, userId } = req.query;
        const skip = (page - 1) * limit;

        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { urlHandle: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (userId) where.userId = userId;

        const [bios, total] = await Promise.all([
            prisma.bioPage.findMany({
                where,
                include: {
                    user: {
                        select: { username: true, displayName: true },
                    },
                    _count: {
                        select: { bioLinks: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma.bioPage.count({ where }),
        ]);

        const formattedBios = bios.map(b => ({
            ...b,
            linksCount: b._count.bioLinks,
            _count: undefined,
        }));

        res.json(formatResponse(formattedBios, createPaginationMeta(total, parseInt(page), parseInt(limit))));
    } catch (error) {
        next(error);
    }
};

/**
 * Get global analytics (admin)
 * GET /api/admin/analytics
 */
export const getGlobalAnalytics = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        const dateFilter = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) dateFilter.lte = new Date(to);

        // Get counts
        const [totalUsers, activeUsers, totalLinks, totalClicks, recentUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.shortLink.count(),
            prisma.clickEvent.count({
                where: Object.keys(dateFilter).length > 0 ? { clickedAt: dateFilter } : undefined,
            }),
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    username: true,
                    displayName: true,
                    createdAt: true,
                },
            }),
        ]);

        // Top users by links
        const topUsersByLinks = await prisma.user.findMany({
            select: {
                username: true,
                displayName: true,
                _count: { select: { shortLinks: true } },
            },
            orderBy: { shortLinks: { _count: 'desc' } },
            take: 5,
        });

        res.json(formatResponse({
            totalUsers,
            activeUsers,
            totalLinks,
            totalClicks,
            recentUsers,
            topUsersByLinks: topUsersByLinks.map(u => ({
                username: u.username,
                displayName: u.displayName,
                linksCount: u._count.shortLinks,
            })),
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req, res, next) => {
    try {
        const result = await auditService.getLogs(req.query);
        logger.info(`[DEBUG] Audit Logs Request: Query=${JSON.stringify(req.query)}, Found=${result.logs.length}`);

        res.json(formatResponse(result.logs, result.pagination));
    } catch (error) {
        next(error);
    }
};

/**
 * Export links as CSV or JSON
 * GET /api/admin/links/export
 */
export const exportLinks = async (req, res, next) => {
    try {
        const { format = 'csv', userId } = req.query;

        const where = userId ? { userId } : {};

        const links = await prisma.shortLink.findMany({
            where,
            include: {
                user: {
                    select: { username: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="links-export.json"');
            return res.json(links.map(link => ({
                code: link.code,
                destinationUrl: link.destinationUrl,
                title: link.title,
                owner: link.user?.username,
                ownerEmail: link.user?.email,
                clickCount: link.clickCount,
                isActive: link.isActive,
                startsAt: link.startsAt,
                expiresAt: link.expiresAt,
                createdAt: link.createdAt,
            })));
        }

        // CSV format
        const csvHeader = 'Code,Destination URL,Title,Owner,Owner Email,Clicks,Active,Starts At,Expires At,Created At\n';
        const csvRows = links.map(link =>
            `"${link.code}","${link.destinationUrl}","${link.title || ''}","${link.user?.username || ''}","${link.user?.email || ''}",${link.clickCount},${link.isActive},"${link.startsAt || ''}","${link.expiresAt || ''}","${link.createdAt}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="links-export.csv"');
        res.send(csvHeader + csvRows);
    } catch (error) {
        next(error);
    }
};

/**
 * Export audit logs as CSV or JSON
 * GET /api/admin/audit-logs/export
 */
export const exportAuditLogs = async (req, res, next) => {
    try {
        const { format = 'csv', action, entityType, from, to } = req.query;

        const where = {};
        if (action) where.action = { contains: action, mode: 'insensitive' };
        if (entityType) where.entityType = entityType;
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { username: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10000 // Limit export to 10k records
        });

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="audit-logs-export.json"');
            return res.json(logs.map(log => ({
                user: log.user?.username,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                ipAddress: log.ipAddress,
                createdAt: log.createdAt,
            })));
        }

        // CSV format
        const csvHeader = 'User,Action,Entity Type,Entity ID,IP Address,Created At\n';
        const csvRows = logs.map(log =>
            `"${log.user?.username || ''}","${log.action}","${log.entityType}","${log.entityId || ''}","${log.ipAddress || ''}","${log.createdAt}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs-export.csv"');
        res.send(csvHeader + csvRows);
    } catch (error) {
        next(error);
    }
};

export default {
    getUsers,
    updateUser,
    getAllLinks,
    getAllBioPages,
    deleteLink,
    getGlobalAnalytics,
    getAuditLogs,
    exportLinks,
    exportAuditLogs,
};
