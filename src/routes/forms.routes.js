// ===========================================
// Heisenlink - Form Routes
// ===========================================

import { Router } from 'express';
import multer from 'multer';
import * as formsController from '../controllers/forms.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiters } from '../middleware/rateLimiter.middleware.js';
import config from '../config/index.js';
import {
    createFormSchema,
    updateFormSchema,
    createQuestionSchema,
    updateQuestionSchema,
    reorderQuestionsSchema,
    submitFormSchema,
    formIdParamSchema,
    questionIdParamSchema,
    slugParamSchema,
    listFormsQuerySchema,
    listResponsesQuerySchema,
} from '../validators/forms.validator.js';

const router = Router();

// ===========================================
// Multer Configuration for Form File Upload (memory -> S3)
// ===========================================
const ALLOWED_UPLOAD_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-zip-compressed',
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.upload.maxFileSize },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_UPLOAD_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'));
        }
    },
});

// ===========================================
// Public Routes (no auth required)
// ===========================================

/**
 * @route   GET /api/forms/public/:slug
 * @desc    Get a published form for public rendering
 * @access  Public
 */
router.get('/public/:slug', validateParams(slugParamSchema), formsController.getPublicForm);

/**
 * @route   POST /api/forms/public/:slug/submit
 * @desc    Submit a public response (rate-limited, honeypot, idempotent)
 * @access  Public
 */
router.post(
    '/public/:slug/submit',
    rateLimiters.formSubmit,
    validateParams(slugParamSchema),
    validateBody(submitFormSchema),
    formsController.submitForm
);

/**
 * @route   POST /api/forms/public/:slug/upload
 * @desc    Upload a file for a FILE_UPLOAD question
 * @access  Public
 */
router.post(
    '/public/:slug/upload',
    rateLimiters.formUpload,
    validateParams(slugParamSchema),
    upload.single('file'),
    formsController.uploadFormFile
);

// All routes below require authentication
router.use(authenticate);

// ===========================================
// Form CRUD
// ===========================================

router.get('/', validateQuery(listFormsQuerySchema), formsController.listForms);
router.post('/', validateBody(createFormSchema), formsController.createForm);

// Static path BEFORE dynamic :id
router.get('/slug-check', formsController.checkSlug);

router.get('/:id', validateParams(formIdParamSchema), formsController.getForm);
router.patch('/:id', validateParams(formIdParamSchema), validateBody(updateFormSchema), formsController.updateForm);
router.delete('/:id', validateParams(formIdParamSchema), formsController.deleteForm);
router.post('/:id/duplicate', validateParams(formIdParamSchema), formsController.duplicateForm);

// Owner uploads a display image for an IMAGE question (stored in question config).
router.post(
    '/:id/image',
    validateParams(formIdParamSchema),
    upload.single('image'),
    formsController.uploadFormImage
);

// ===========================================
// Responses (owner-only)
// ===========================================

router.get(
    '/:id/responses',
    validateParams(formIdParamSchema),
    validateQuery(listResponsesQuerySchema),
    formsController.listResponses
);
router.get('/:id/summary', validateParams(formIdParamSchema), formsController.getSummary);
router.get('/:id/responses/export', validateParams(formIdParamSchema), formsController.exportResponses);

// ===========================================
// Questions
// ===========================================

router.post(
    '/:id/questions',
    validateParams(formIdParamSchema),
    validateBody(createQuestionSchema),
    formsController.addQuestion
);

// Static-ish path BEFORE dynamic :qid
router.patch(
    '/:id/questions/reorder',
    validateParams(formIdParamSchema),
    validateBody(reorderQuestionsSchema),
    formsController.reorderQuestions
);

router.patch(
    '/:id/questions/:qid',
    validateParams(questionIdParamSchema),
    validateBody(updateQuestionSchema),
    formsController.updateQuestion
);

router.delete(
    '/:id/questions/:qid',
    validateParams(questionIdParamSchema),
    formsController.deleteQuestion
);

export default router;
