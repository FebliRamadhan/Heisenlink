// ===========================================
// LinkHub - Public Routes (Redirects & Bio)
// ===========================================

import { Router } from 'express';
import * as redirectController from '../controllers/redirect.controller.js';
import { rateLimiters } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// List of paths to skip (handled elsewhere)
const skipPaths = [
    'api',
    'health',
    'uploads',
    'favicon.ico',
    '_next',
    'static',
    'not-found',
    'link-inactive',
];

/**
 * @route   GET /:code
 * @desc    Redirect shortlink
 * @access  Public
 */
router.get('/:code', rateLimiters.redirect, async (req, res, next) => {
    const { code } = req.params;

    // Skip reserved paths
    if (skipPaths.some(path => code.startsWith(path))) {
        return next();
    }

    // Skip bio page paths (handled by frontend)
    if (code === 'bio' || code.startsWith('bio/')) {
        return next();
    }

    redirectController.redirect(req, res, next);
});

/**
 * @route   POST /:code/verify
 * @desc    Verify password and get destination URL
 * @access  Public
 */
router.post('/:code/verify', rateLimiters.auth, async (req, res, next) => {
    const { code } = req.params;

    // Skip reserved paths
    if (skipPaths.some(path => code.startsWith(path))) {
        return next();
    }

    redirectController.verifyAndRedirect(req, res, next);
});

export default router;
