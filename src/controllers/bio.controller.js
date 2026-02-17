// ===========================================
// LinkHub - Bio Controller
// ===========================================

import * as bioService from '../services/bio.service.js';
import * as qrcodeService from '../services/qrcode.service.js';
import { formatResponse } from '../utils/helpers.js';
import path from 'path';
import fs from 'fs/promises';
import config from '../config/index.js';

/**
 * Get current user's bio page
 * GET /api/bio
 */
export const getBioPage = async (req, res, next) => {
    try {
        const bioPage = await bioService.getOrCreateBioPage(req.user.sub);

        res.json(formatResponse(bioPage));
    } catch (error) {
        next(error);
    }
};

/**
 * Get public bio page by slug
 * GET /api/bio/:slug (public, no auth required)
 */
export const getPublicBioPage = async (req, res, next) => {
    try {
        const bioPage = await bioService.getBioPageBySlug(req.params.slug);

        if (!bioPage) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Bio page not found' },
            });
        }

        res.json(formatResponse(bioPage));
    } catch (error) {
        next(error);
    }
};

/**
 * Update bio page
 * PATCH /api/bio
 */
export const updateBioPage = async (req, res, next) => {
    try {
        const bioPage = await bioService.updateBioPage(req.user.sub, req.body);

        res.json(formatResponse(bioPage));
    } catch (error) {
        next(error);
    }
};

/**
 * Upload avatar
 * POST /api/bio/avatar
 */
export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_FILE', message: 'No file uploaded' },
            });
        }

        // Generate avatar URL
        const avatarUrl = `/uploads/${req.file.filename}`;

        // Update bio page with new avatar
        const bioPage = await bioService.updateAvatar(req.user.sub, avatarUrl);

        res.json(formatResponse({ avatarUrl: bioPage.avatarUrl }));
    } catch (error) {
        next(error);
    }
};

/**
 * Get QR code for bio page
 * GET /api/bio/qr
 */
export const getQRCode = async (req, res, next) => {
    try {
        const bioPage = await bioService.getOrCreateBioPage(req.user.sub);
        const { format = 'png', size = 300 } = req.query;

        const qrCode = await qrcodeService.generateForBioPage(bioPage.slug, format, {
            width: parseInt(size, 10),
        });

        if (format === 'svg') {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(qrCode);
        } else if (format === 'dataurl') {
            res.json(formatResponse({ qrCode }));
        } else {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `inline; filename="${bioPage.slug}-qr.png"`);
            res.send(qrCode);
        }
    } catch (error) {
        next(error);
    }
};

// ===========================================
// Bio Links
// ===========================================

/**
 * Add bio link
 * POST /api/bio/links
 */
export const addLink = async (req, res, next) => {
    try {
        const link = await bioService.addBioLink(req.user.sub, req.body);

        res.status(201).json(formatResponse(link));
    } catch (error) {
        next(error);
    }
};

/**
 * Update bio link
 * PATCH /api/bio/links/:id
 */
export const updateLink = async (req, res, next) => {
    try {
        const link = await bioService.updateBioLink(req.params.id, req.user.sub, req.body);

        res.json(formatResponse(link));
    } catch (error) {
        next(error);
    }
};

/**
 * Delete bio link
 * DELETE /api/bio/links/:id
 */
export const deleteLink = async (req, res, next) => {
    try {
        await bioService.deleteBioLink(req.params.id, req.user.sub);

        res.json(formatResponse({ message: 'Link deleted successfully' }));
    } catch (error) {
        next(error);
    }
};

/**
 * Reorder bio links
 * PATCH /api/bio/links/reorder
 */
export const reorderLinks = async (req, res, next) => {
    try {
        await bioService.reorderBioLinks(req.user.sub, req.body.linkIds);

        res.json(formatResponse({ message: 'Links reordered successfully' }));
    } catch (error) {
        next(error);
    }
};

export default {
    getBioPage,
    getPublicBioPage,
    updateBioPage,
    uploadAvatar,
    getQRCode,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
};
