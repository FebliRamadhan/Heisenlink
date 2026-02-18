// ===========================================
// Heisenlink - Auth Routes
// ===========================================

import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiters } from '../middleware/rateLimiter.middleware.js';
import {
    loginSchema,
    refreshTokenSchema,
    updatePasswordSchema
} from '../validators/auth.validator.js';

const router = Router();

// ===========================================
// Public Routes
// ===========================================

/**
 * @route   POST /api/auth/login
 * @desc    Login with username and password
 * @access  Public
 */
router.post(
    '/login',
    rateLimiters.auth,
    validateBody(loginSchema),
    authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh',
    validateBody(refreshTokenSchema),
    authController.refreshToken
);

// ===========================================
// Protected Routes
// ===========================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PATCH /api/auth/password
 * @desc    Update password
 * @access  Private
 */
router.patch(
    '/password',
    authenticate,
    validateBody(updatePasswordSchema),
    authController.updatePassword
);

export default router;
