// ===========================================
// Heisenlink - Auth Controller
// ===========================================

import * as authService from '../services/auth.service.js';
import * as ssoService from '../services/sso.service.js';
import config from '../config/index.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0];
        const userAgent = req.headers['user-agent'];

        const result = await authService.login(username, password, { ipAddress, userAgent });

        res.json(formatResponse(result));
    } catch (error) {
        next(error);
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
    try {
        // In a stateless JWT setup, just return success
        // Client should remove the token
        // For added security, you could blacklist the token in Redis

        res.json(formatResponse({ message: 'Logged out successfully' }));
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.sub);

        res.json(formatResponse(user));
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        const tokens = await authService.refreshAccessToken(refreshToken);

        res.json(formatResponse(tokens));
    } catch (error) {
        next(error);
    }
};

/**
 * Update password
 * PATCH /api/auth/password
 */
export const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        await authService.updatePassword(req.user.sub, currentPassword, newPassword);

        res.json(formatResponse({ message: 'Password updated successfully' }));
    } catch (error) {
        next(error);
    }
};

/**
 * Get SSO configuration (public)
 * GET /api/auth/sso/config
 */
export const getSsoConfig = async (req, res, next) => {
    try {
        const { enabled, clientId, authorizeUrl, redirectUri, scopes, logoutUrl } = config.sso;

        res.json(formatResponse({
            enabled,
            clientId,
            authorizeUrl,
            redirectUri,
            logoutUrl,
            scopes,
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * Handle SSO callback
 * POST /api/auth/sso/callback
 */
export const ssoCallback = async (req, res, next) => {
    try {
        const { code, codeVerifier } = req.body;
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0];
        const userAgent = req.headers['user-agent'];

        const result = await ssoService.handleCallback(code, codeVerifier, { ipAddress, userAgent });

        res.json(formatResponse(result));
    } catch (error) {
        next(error);
    }
};

export default {
    login,
    logout,
    getMe,
    refreshToken,
    updatePassword,
    getSsoConfig,
    ssoCallback,
};
