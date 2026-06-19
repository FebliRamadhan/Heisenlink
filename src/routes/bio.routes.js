// ===========================================
// Heisenlink - Bio Routes
// ===========================================

import { Router } from 'express';
import multer from 'multer';
import * as bioController from '../controllers/bio.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import config from '../config/index.js';
import {
    updateBioPageSchema,
    createBioLinkSchema,
    updateBioLinkSchema,
    bioLinkIdSchema,
    reorderLinksSchema,
} from '../validators/bio.validator.js';
import { qrCodeQuerySchema } from '../validators/links.validator.js';

const router = Router();

// ===========================================
// Multer Configuration for Avatar Upload (memory -> S3)
// ===========================================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: config.upload.maxFileSize,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
        }
    },
});

// ===========================================
// Public Routes (no auth required)
// ===========================================

/**
 * @route   GET /api/bio/click/:linkId
 * @desc    Track click and redirect to destination
 * @access  Public
 */
router.get('/click/:linkId', bioController.clickAndRedirect);

/**
 * @route   GET /api/bio/:slug
 * @desc    Get public bio page by slug
 * @access  Public
 */
router.get('/:slug', (req, res, next) => {
    // Skip reserved sub-paths so they fall through to authenticated routes
    const reserved = ['qr', 'avatar', 'links', 'slug-check', 'click'];
    if (reserved.includes(req.params.slug)) {
        return next('route');
    }
    return bioController.getPublicBioPage(req, res, next);
});

// All routes below require authentication
router.use(authenticate);

// ===========================================
// Bio Page Routes
// ===========================================

/**
 * @route   GET /api/bio
 * @desc    Get current user's bio page
 * @access  Private
 */
router.get('/', bioController.getBioPage);

/**
 * @route   GET /api/bio/slug-check?slug=foo
 * @desc    Check slug availability for the current user
 * @access  Private
 */
router.get('/slug-check', bioController.checkSlug);

/**
 * @route   PATCH /api/bio
 * @desc    Update bio page
 * @access  Private
 */
router.patch(
    '/',
    validateBody(updateBioPageSchema),
    bioController.updateBioPage
);

/**
 * @route   POST /api/bio/avatar
 * @desc    Upload avatar
 * @access  Private
 */
router.post(
    '/avatar',
    upload.single('avatar'),
    bioController.uploadAvatar
);

/**
 * @route   DELETE /api/bio/avatar
 * @desc    Remove avatar
 * @access  Private
 */
router.delete('/avatar', bioController.removeAvatar);

/**
 * @route   GET /api/bio/qr
 * @desc    Get QR code for bio page
 * @access  Private
 */
router.get(
    '/qr',
    validateQuery(qrCodeQuerySchema),
    bioController.getQRCode
);

// ===========================================
// Bio Links Routes
// ===========================================

/**
 * @route   POST /api/bio/links
 * @desc    Add new bio link
 * @access  Private
 */
router.post(
    '/links',
    validateBody(createBioLinkSchema),
    bioController.addLink
);

/**
 * @route   PATCH /api/bio/links/reorder
 * @desc    Reorder bio links
 * @access  Private
 */
router.patch(
    '/links/reorder',
    validateBody(reorderLinksSchema),
    bioController.reorderLinks
);

/**
 * @route   PATCH /api/bio/links/:id
 * @desc    Update bio link
 * @access  Private
 */
router.patch(
    '/links/:id',
    validateParams(bioLinkIdSchema),
    validateBody(updateBioLinkSchema),
    bioController.updateLink
);

/**
 * @route   DELETE /api/bio/links/:id
 * @desc    Delete bio link
 * @access  Private
 */
router.delete(
    '/links/:id',
    validateParams(bioLinkIdSchema),
    bioController.deleteLink
);

export default router;
