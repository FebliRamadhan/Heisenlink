// ===========================================
// Heisenlink - Links Controller
// ===========================================

import prisma from '../config/database.js';
import config from '../config/index.js';
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

        // Filter out entries with empty or whitespace-only URLs
        const validLinks = links.filter(link => link.url && link.url.trim().length > 0);

        if (validLinks.length === 0) {
            return res.status(400).json(formatResponse(null, null, 'No valid links provided'));
        }

        const result = await linksService.bulkCreateLinks(validLinks, req.user.sub);

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

/**
 * Export user's links as CSV or JSON
 * GET /api/links/export
 */
export const exportLinks = async (req, res, next) => {
    try {
        const { format = 'csv' } = req.query;
        const userId = req.user.sub;

        const links = await prisma.shortLink.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="my-links-export.json"');
            return res.json(links.map(link => ({
                code: link.code,
                shortUrl: `${config.domains.shortlink}/${link.code}`,
                destinationUrl: link.destinationUrl,
                title: link.title,
                clickCount: link.clickCount,
                isActive: link.isActive,
                startsAt: link.startsAt,
                expiresAt: link.expiresAt,
                createdAt: link.createdAt,
            })));
        }

        // CSV format
        const csvHeader = 'Code,Short URL,Destination URL,Title,Clicks,Active,Starts At,Expires At,Created At\n';
        const csvRows = links.map(link =>
            `"${link.code}","${config.domains.shortlink}/${link.code}","${link.destinationUrl}","${link.title || ''}",${link.clickCount},${link.isActive},"${link.startsAt || ''}","${link.expiresAt || ''}","${link.createdAt}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="my-links-export.csv"');
        res.send(csvHeader + csvRows);
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
    exportLinks,
};
