// ===========================================
// Heisenlink - Bio Controller
// ===========================================

import { nanoid } from 'nanoid';
import * as bioService from '../services/bio.service.js';
import * as qrcodeService from '../services/qrcode.service.js';
import * as s3Service from '../services/s3.service.js';
import { formatResponse } from '../utils/helpers.js';

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
 * Upload avatar to S3
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

        if (!s3Service.isEnabled()) {
            return res.status(503).json({
                success: false,
                error: { code: 'S3_DISABLED', message: 'Object storage is not configured on the server' },
            });
        }

        const keyPrefix = `avatars/avatar-${req.user.sub}-${nanoid(8)}`;

        const { key, url: avatarUrl } = await s3Service.uploadAvatar({
            buffer: req.file.buffer,
            keyPrefix,
        });

        // Best-effort cleanup of previous avatar if it lived in our bucket
        const previous = await bioService.getAvatarUrl(req.user.sub);
        if (previous) {
            const oldKey = s3Service.extractKeyFromUrl(previous);
            if (oldKey && oldKey !== key) {
                await s3Service.deleteObject(oldKey);
            }
        }

        const bioPage = await bioService.updateAvatar(req.user.sub, avatarUrl);

        res.json(formatResponse({ avatarUrl: bioPage.avatarUrl }));
    } catch (error) {
        next(error);
    }
};

/**
 * Remove avatar
 * DELETE /api/bio/avatar
 */
export const removeAvatar = async (req, res, next) => {
    try {
        const previous = await bioService.getAvatarUrl(req.user.sub);
        if (previous && s3Service.isEnabled()) {
            const oldKey = s3Service.extractKeyFromUrl(previous);
            if (oldKey) {
                await s3Service.deleteObject(oldKey);
            }
        }
        const bioPage = await bioService.updateAvatar(req.user.sub, null);
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

/**
 * Check slug availability for the authenticated user
 * GET /api/bio/slug-check?slug=foo
 */
export const checkSlug = async (req, res, next) => {
    try {
        const slug = (req.query.slug || '').toString().toLowerCase();
        const result = await bioService.isSlugAvailable(slug, req.user.sub);
        res.json(formatResponse(result));
    } catch (error) {
        next(error);
    }
};

/**
 * Track click and redirect to destination.
 * GET /api/bio/click/:linkId
 * Public — no auth.
 */
export const clickAndRedirect = async (req, res, next) => {
    try {
        const link = await bioService.getPublicBioLink(req.params.linkId);
        if (!link) {
            return res.redirect(302, '/not-found');
        }
        // Fire-and-forget; don't block redirect
        bioService.trackBioLinkClick(link.id);
        return res.redirect(302, link.url);
    } catch (error) {
        next(error);
    }
};

export default {
    getBioPage,
    getPublicBioPage,
    updateBioPage,
    uploadAvatar,
    removeAvatar,
    getQRCode,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    checkSlug,
    clickAndRedirect,
};
