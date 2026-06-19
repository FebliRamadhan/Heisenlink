// ===========================================
// Heisenlink - Auth Middleware
// ===========================================

import { verifyToken } from '../services/auth.service.js';
import { errors } from './error.middleware.js';
import prisma from '../config/database.js';

/**
 * Authenticate JWT token
 * Attaches user info to req.user
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw errors.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw errors.unauthorized('No token provided');
        }

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to request
        req.user = decoded;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication
 * Does not throw error if no token, but attaches user if valid token
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            if (token) {
                try {
                    const decoded = verifyToken(token);
                    req.user = decoded;
                } catch {
                    // Token invalid, continue without user
                }
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Verify user is active
 * Should be used after authenticate middleware
 */
export const requireActiveUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw errors.unauthorized('Authentication required');
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: { isActive: true },
        });

        if (!user || !user.isActive) {
            throw errors.forbidden('Your account has been deactivated');
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default {
    authenticate,
    optionalAuth,
    requireActiveUser,
};
