// ===========================================
// LinkHub - Links Controller
// ===========================================

import * as linksService from '../services/links.service.js';
import * as qrcodeService from '../services/qrcode.service.js';
import { formatResponse } from '../utils/helpers.js';

/**
 * Get user's links
 * GET /api/links
 */
export const getLinks = async (req, res, next) => {
    try {
        const result = await linksService.getUserLinks(req.user.sub, req.query);

        res.json(formatResponse(result.links, result.pagination));
    } catch (error) {
        next(error);
    }
};

/**
 * Create new link
 * POST /api/links
 */
export const createLink = async (req, res, next) => {
    try {
        const link = await linksService.createLink(req.body, req.user.sub);

        res.status(201).json(formatResponse(link));
    } catch (error) {
        next(error);
    }
};

/**
 * Get link by ID
 * GET /api/links/:id
 */
export const getLinkById = async (req, res, next) => {
    try {
        const link = await linksService.getLinkById(req.params.id, req.user.sub);

        res.json(formatResponse(link));
    } catch (error) {
        next(error);
    }
};

/**
 * Update link
 * PATCH /api/links/:id
 */
export const updateLink = async (req, res, next) => {
    try {
        const link = await linksService.updateLink(req.params.id, req.body, req.user.sub);

        res.json(formatResponse(link));
    } catch (error) {
        next(error);
    }
};

/**
 * Delete link
 * DELETE /api/links/:id
 */
export const deleteLink = async (req, res, next) => {
    try {
        await linksService.deleteLink(req.params.id, req.user.sub);

        res.json(formatResponse({ message: 'Link deleted successfully' }));
    } catch (error) {
        next(error);
    }
};

/**
 * Get QR code for link
 * GET /api/links/:id/qr
 */
export const getQRCode = async (req, res, next) => {
    try {
        const link = await linksService.getLinkById(req.params.id, req.user.sub);
        const { format = 'png', size = 300 } = req.query;

        const qrCode = await qrcodeService.generateForShortlink(link.code, format, {
            width: parseInt(size, 10),
        });

        if (format === 'svg') {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(qrCode);
        } else if (format === 'dataurl') {
            res.json(formatResponse({ qrCode }));
        } else {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `inline; filename="${link.code}-qr.png"`);
            res.send(qrCode);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk create links
 * POST /api/links/bulk
 */
export const bulkCreate = async (req, res, next) => {
    try {
        const { links } = req.body;

        const result = await linksService.bulkCreateLinks(links, req.user.sub);

        res.status(201).json(formatResponse(result));
    } catch (error) {
        next(error);
    }
};

/**
 * Verify link password
 * POST /api/links/:id/verify-password
 */
export const verifyPassword = async (req, res, next) => {
    try {
        const { password } = req.body;

        const isValid = await linksService.verifyLinkPassword(req.params.id, password);

        if (isValid) {
            const link = await linksService.getLinkById(req.params.id);
            res.json(formatResponse({ valid: true, destinationUrl: link.destinationUrl }));
        } else {
            res.json(formatResponse({ valid: false }));
        }
    } catch (error) {
        next(error);
    }
};

export default {
    getLinks,
    createLink,
    getLinkById,
    updateLink,
    deleteLink,
    getQRCode,
    bulkCreate,
    verifyPassword,
};
