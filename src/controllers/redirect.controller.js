// ===========================================
// LinkHub - Redirect Controller
// ===========================================

import * as linksService from '../services/links.service.js';
import * as analyticsService from '../services/analytics.service.js';
import { errors } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

import config from '../config/index.js';

/**
 * Handle shortlink redirect
 * GET /:code
 */
export const redirect = async (req, res, next) => {
    try {
        const { code } = req.params;

        // Get link from cache or database
        const link = await linksService.getLinkByCode(code);

        // Helper to handle error redirects for browser
        const handleError = (message, redirectPath) => {
            if (req.accepts('html')) {
                return res.redirect(`${config.app.url}${redirectPath}`);
            }
            throw errors.notFound(message);
        };

        if (!link) {
            return handleError('Link not found', '/not-found');
        }

        // Check if link is active
        if (!link.isActive) {
            return handleError('This link has been deactivated', '/link-inactive');
        }

        // Check expiration
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
            return handleError('This link has expired', '/link-inactive');
        }

        // Check password protection
        if (link.hasPassword || link.passwordHash) {
            // Return password form or prompt
            // For browser, we might want to redirect to a password entry page on frontend
            // e.g. /password-protect/:code
            if (req.accepts('html')) {
                // We don't have this page yet, but let's assume we might or just leave as JSON for now
                // or maybe redirect to a frontend page that handles password
                // For now, let's keep JSON or if user wants page, we'd need to create it.
                // The requirement didn't specify password page update, only inactivity/not-found.
                // But consistently, we should probably redirect to a frontend password page.
                // Let's assume there is one or leave it for now.
                // Actually, if we return JSON 401 to browser, it looks ugly.
                // Let's skipping this for now as per specific request.
            }

            return res.status(401).json({
                success: false,
                error: {
                    code: 'PASSWORD_REQUIRED',
                    message: 'This link is password protected',
                    linkId: link.id,
                },
            });
        }

        // Track click asynchronously (don't wait)
        analyticsService.trackClick({
            linkId: link.id,
            linkType: 'SHORTLINK',
            req,
        });

        // Increment click count asynchronously
        linksService.incrementClickCount(link.id);

        // Redirect
        logger.info(`Redirecting ${code} -> ${link.destinationUrl}`);
        res.redirect(302, link.destinationUrl);
    } catch (error) {
        next(error);
    }
};

/**
 * Handle password-protected redirect
 * POST /:code/verify
 */
export const verifyAndRedirect = async (req, res, next) => {
    try {
        const { code } = req.params;
        const { password } = req.body;

        // Get link
        const link = await linksService.getLinkByCode(code);

        if (!link) {
            throw errors.notFound('Link not found');
        }

        // Check if link is active
        if (!link.isActive) {
            throw errors.notFound('This link has been deactivated');
        }

        // Check expiration
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
            throw errors.notFound('This link has expired');
        }

        // Verify password
        const isValid = await linksService.verifyLinkPassword(link.id, password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_PASSWORD',
                    message: 'Incorrect password',
                },
            });
        }

        // Track click
        analyticsService.trackClick({
            linkId: link.id,
            linkType: 'SHORTLINK',
            req,
        });

        // Increment click count
        linksService.incrementClickCount(link.id);

        // Return destination URL (let frontend handle redirect)
        res.json({
            success: true,
            data: {
                destinationUrl: link.destinationUrl,
            },
        });
    } catch (error) {
        next(error);
    }
};

export default {
    redirect,
    verifyAndRedirect,
};
