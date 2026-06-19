// ===========================================
// Heisenlink - Admin Middleware
// ===========================================

import { errors } from './error.middleware.js';

/**
 * Require admin role
 * Should be used after authenticate middleware
 */
export const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            throw errors.unauthorized('Authentication required');
        }

        if (req.user.role !== 'ADMIN') {
            throw errors.forbidden('Admin access required');
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Require admin or owner
 * Allows access if user is admin OR owner of the resource
 * Resource owner ID should be passed as a function
 * @param {function} getOwnerId - Function to get owner ID from request
 */
export const requireAdminOrOwner = (getOwnerId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw errors.unauthorized('Authentication required');
            }

            // Admin can access anything
            if (req.user.role === 'ADMIN') {
                return next();
            }

            // Check if user is owner
            const ownerId = await getOwnerId(req);

            if (ownerId !== req.user.sub) {
                throw errors.forbidden('You do not have permission to access this resource');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default {
    requireAdmin,
    requireAdminOrOwner,
};
