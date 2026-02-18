// ===========================================
// Heisenlink - Analytics Routes
// ===========================================

import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Query schema for date range
const dateRangeSchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});

// Link ID param schema
const linkIdSchema = z.object({
    id: z.string().uuid('Invalid link ID'),
});

// Export query schema
const exportQuerySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    format: z.enum(['csv', 'json']).default('csv'),
});

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics overview
 * @access  Private
 */
router.get(
    '/overview',
    validateQuery(dateRangeSchema),
    analyticsController.getOverview
);

/**
 * @route   GET /api/analytics/links/:id
 * @desc    Get link-specific analytics
 * @access  Private
 */
router.get(
    '/links/:id',
    validateParams(linkIdSchema),
    validateQuery(dateRangeSchema),
    analyticsController.getLinkAnalytics
);

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data
 * @access  Private
 */
router.get(
    '/export',
    validateQuery(exportQuerySchema),
    analyticsController.exportAnalytics
);

export default router;
