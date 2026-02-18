// ===========================================
// Heisenlink - Links Routes
// ===========================================

import { Router } from 'express';
import * as linksController from '../controllers/links.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiters } from '../middleware/rateLimiter.middleware.js';
import {
    createLinkSchema,
    updateLinkSchema,
    linkIdSchema,
    linksQuerySchema,
    verifyPasswordSchema,
    bulkCreateSchema,
    qrCodeQuerySchema,
} from '../validators/links.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// Links CRUD Routes
// ===========================================

/**
 * @route   GET /api/links
 * @desc    Get user's links with pagination
 * @access  Private
 */
router.get(
    '/',
    validateQuery(linksQuerySchema),
    linksController.getLinks
);

/**
 * @route   POST /api/links
 * @desc    Create new shortlink
 * @access  Private
 */
router.post(
    '/',
    rateLimiters.createLink,
    validateBody(createLinkSchema),
    linksController.createLink
);

/**
 * @route   POST /api/links/bulk
 * @desc    Bulk create links
 * @access  Private
 */
router.post(
    '/bulk',
    validateBody(bulkCreateSchema),
    linksController.bulkCreate
);

/**
 * @route   GET /api/links/:id
 * @desc    Get link details
 * @access  Private
 */
router.get(
    '/:id',
    validateParams(linkIdSchema),
    linksController.getLinkById
);

/**
 * @route   PATCH /api/links/:id
 * @desc    Update link
 * @access  Private
 */
router.patch(
    '/:id',
    validateParams(linkIdSchema),
    validateBody(updateLinkSchema),
    linksController.updateLink
);

/**
 * @route   DELETE /api/links/:id
 * @desc    Delete link
 * @access  Private
 */
router.delete(
    '/:id',
    validateParams(linkIdSchema),
    linksController.deleteLink
);

/**
 * @route   GET /api/links/:id/qr
 * @desc    Get QR code for link
 * @access  Private
 */
router.get(
    '/:id/qr',
    validateParams(linkIdSchema),
    validateQuery(qrCodeQuerySchema),
    linksController.getQRCode
);

/**
 * @route   POST /api/links/:id/verify-password
 * @desc    Verify password for protected link
 * @access  Public (no auth required for redirect)
 */
router.post(
    '/:id/verify-password',
    validateParams(linkIdSchema),
    validateBody(verifyPasswordSchema),
    linksController.verifyPassword
);

export default router;
