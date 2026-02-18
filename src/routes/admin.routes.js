// ===========================================
// Heisenlink - Admin Routes
// ===========================================

import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication AND admin role
router.use(authenticate);
router.use(requireAdmin);

// ===========================================
// Validation Schemas
// ===========================================

const usersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    role: z.enum(['ADMIN', 'USER']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
});

const updateUserSchema = z.object({
    isActive: z.boolean().optional(),
    role: z.enum(['ADMIN', 'USER']).optional(),
});

const userIdSchema = z.object({
    id: z.string().uuid('Invalid user ID'),
});

const linksQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    userId: z.string().uuid().optional(),
});

const linkIdSchema = z.object({
    id: z.string().uuid('Invalid link ID'),
});

const auditLogsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    userId: z.string().uuid().optional(),
    entityType: z.string().optional(),
    action: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});

const dateRangeSchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});

// ===========================================
// User Management Routes
// ===========================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get(
    '/users',
    validateQuery(usersQuerySchema),
    adminController.getUsers
);

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Update user status/role
 * @access  Admin
 */
router.patch(
    '/users/:id',
    validateParams(userIdSchema),
    validateBody(updateUserSchema),
    adminController.updateUser
);

// ===========================================
// Link Management Routes
// ===========================================

/**
 * @route   GET /api/admin/links
 * @desc    Get all links
 * @access  Admin
 */
router.get(
    '/links',
    validateQuery(linksQuerySchema),
    adminController.getAllLinks
);

/**
 * @route   DELETE /api/admin/links/:id
 * @desc    Delete any link
 * @access  Admin
 */
router.delete(
    '/links/:id',
    validateParams(linkIdSchema),
    adminController.deleteLink
);

// ===========================================
// Bio Page Management Routes
// ===========================================

/**
 * @route   GET /api/admin/bio
 * @desc    Get all bio pages
 * @access  Admin
 */
router.get(
    '/bio',
    validateQuery(linksQuerySchema), // reuse links schema as it has similar fields (page, limit, search, userId)
    adminController.getAllBioPages
);

// ===========================================
// Analytics Routes
// ===========================================

/**
 * @route   GET /api/admin/analytics
 * @desc    Get global analytics
 * @access  Admin
 */
router.get(
    '/analytics',
    validateQuery(dateRangeSchema),
    adminController.getGlobalAnalytics
);

// ===========================================
// Audit Logs Routes
// ===========================================

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs
 * @access  Admin
 */
router.get(
    '/audit-logs',
    validateQuery(auditLogsQuerySchema),
    adminController.getAuditLogs
);

// ===========================================
// Export Routes
// ===========================================

const exportQuerySchema = z.object({
    format: z.enum(['csv', 'json']).default('csv'),
    userId: z.string().uuid().optional(),
});

const auditExportQuerySchema = z.object({
    format: z.enum(['csv', 'json']).default('csv'),
    action: z.string().optional(),
    entityType: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});

/**
 * @route   GET /api/admin/links/export
 * @desc    Export all links as CSV or JSON
 * @access  Admin
 */
router.get(
    '/links/export',
    validateQuery(exportQuerySchema),
    adminController.exportLinks
);

/**
 * @route   GET /api/admin/audit-logs/export
 * @desc    Export audit logs as CSV or JSON
 * @access  Admin
 */
router.get(
    '/audit-logs/export',
    validateQuery(auditExportQuerySchema),
    adminController.exportAuditLogs
);

export default router;
