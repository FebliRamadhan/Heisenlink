// ===========================================
// Heisenlink - Bio Routes
// ===========================================

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';
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
// Multer Configuration for Avatar Upload
// ===========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `avatar-${req.user.sub}-${nanoid(8)}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
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
 * @route   GET /api/bio/:slug
 * @desc    Get public bio page by slug
 * @access  Public
 */
router.get('/:slug', (req, res, next) => {
    // Skip reserved sub-paths so they fall through to authenticated routes
    const reserved = ['qr', 'avatar', 'links'];
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
