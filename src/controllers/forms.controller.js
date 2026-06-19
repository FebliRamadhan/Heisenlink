// ===========================================
// Heisenlink - Form Controller
// ===========================================

import * as formsService from '../services/forms.service.js';
import * as submissionService from '../services/form-submission.service.js';
import * as aggregationService from '../services/form-aggregation.service.js';
import * as collaboratorsService from '../services/form-collaborators.service.js';
import * as storageService from '../services/storage.service.js';
import { formatResponse, parsePagination, createPaginationMeta } from '../utils/helpers.js';

const clientIp = (req) =>
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || req.ip;

// ===========================================
// Public
// ===========================================

/**
 * Get a published form by slug (public)
 * GET /api/forms/public/:slug
 */
export const getPublicForm = async (req, res, next) => {
    try {
        const form = await formsService.getPublicFormBySlug(req.params.slug);
        if (!form) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Form not found' },
            });
        }
        res.json(formatResponse(form));
    } catch (error) {
        next(error);
    }
};

/**
 * Submit a public response
 * POST /api/forms/public/:slug/submit
 */
export const submitForm = async (req, res, next) => {
    try {
        const result = await submissionService.submitResponse(req.params.slug, req.body, {
            ipAddress: clientIp(req),
            userAgent: req.get('user-agent'),
        });
        res.status(201).json(
            formatResponse({ id: result.id, duplicate: Boolean(result.duplicate) })
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Upload a file for a FILE_UPLOAD question (public)
 * POST /api/forms/public/:slug/upload
 */
export const uploadFormFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_FILE', message: 'No file uploaded' },
            });
        }
        const stored = await storageService.storeBuffer({
            buffer: req.file.buffer,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            prefix: `forms/${req.params.slug}`,
        });
        res.status(201).json(formatResponse(stored));
    } catch (error) {
        next(error);
    }
};

// ===========================================
// Authenticated CRUD
// ===========================================

/**
 * List current user's forms
 * GET /api/forms
 */
export const listForms = async (req, res, next) => {
    try {
        const { page, limit } = parsePagination(req.query);
        const result = await formsService.listForms(req.user.sub, {
            search: req.query.search,
            page,
            limit,
        });
        res.json(
            formatResponse(result.forms, createPaginationMeta(result.total, result.page, result.limit))
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Create a form
 * POST /api/forms
 */
export const createForm = async (req, res, next) => {
    try {
        const form = await formsService.createForm(req.user.sub, req.body);
        res.status(201).json(formatResponse(form));
    } catch (error) {
        next(error);
    }
};

/**
 * Check slug availability
 * GET /api/forms/slug-check?slug=foo[&formId=...]
 */
export const checkSlug = async (req, res, next) => {
    try {
        const slug = (req.query.slug || '').toString().toLowerCase();
        const result = await formsService.isSlugAvailable(slug, req.query.formId || null);
        res.json(formatResponse(result));
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single form (owner)
 * GET /api/forms/:id
 */
export const getForm = async (req, res, next) => {
    try {
        const form = await formsService.getFormById(req.params.id, req.user.sub, req.user.role);
        res.json(formatResponse(form));
    } catch (error) {
        next(error);
    }
};

/**
 * Update a form
 * PATCH /api/forms/:id
 */
export const updateForm = async (req, res, next) => {
    try {
        const form = await formsService.updateForm(
            req.params.id,
            req.user.sub,
            req.user.role,
            req.body
        );
        res.json(formatResponse(form));
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a form
 * DELETE /api/forms/:id
 */
export const deleteForm = async (req, res, next) => {
    try {
        await formsService.deleteForm(req.params.id, req.user.sub, req.user.role);
        res.json(formatResponse({ message: 'Form deleted successfully' }));
    } catch (error) {
        next(error);
    }
};

/**
 * Duplicate a form
 * POST /api/forms/:id/duplicate
 */
export const duplicateForm = async (req, res, next) => {
    try {
        const form = await formsService.duplicateForm(req.params.id, req.user.sub, req.user.role);
        res.status(201).json(formatResponse(form));
    } catch (error) {
        next(error);
    }
};

// ===========================================
// Questions
// ===========================================

export const addQuestion = async (req, res, next) => {
    try {
        const question = await formsService.addQuestion(
            req.params.id,
            req.user.sub,
            req.user.role,
            req.body
        );
        res.status(201).json(formatResponse(question));
    } catch (error) {
        next(error);
    }
};

export const reorderQuestions = async (req, res, next) => {
    try {
        await formsService.reorderQuestions(
            req.params.id,
            req.user.sub,
            req.user.role,
            req.body.questionIds
        );
        res.json(formatResponse({ message: 'Questions reordered successfully' }));
    } catch (error) {
        next(error);
    }
};

export const updateQuestion = async (req, res, next) => {
    try {
        const question = await formsService.updateQuestion(
            req.params.id,
            req.params.qid,
            req.user.sub,
            req.user.role,
            req.body
        );
        res.json(formatResponse(question));
    } catch (error) {
        next(error);
    }
};

export const deleteQuestion = async (req, res, next) => {
    try {
        await formsService.deleteQuestion(
            req.params.id,
            req.params.qid,
            req.user.sub,
            req.user.role
        );
        res.json(formatResponse({ message: 'Question deleted successfully' }));
    } catch (error) {
        next(error);
    }
};

/**
 * Upload a display image for the form builder (owner-only).
 * POST /api/forms/:id/image  → returns { url } to store in question.config.imageUrl
 */
export const uploadFormImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_FILE', message: 'No file uploaded' },
            });
        }
        // Editor-level access required before storing.
        await formsService.assertFormAccess(req.params.id, req.user.sub, req.user.role, 'EDITOR');
        const stored = await storageService.storeBuffer({
            buffer: req.file.buffer,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            prefix: `forms/${req.params.id}/images`,
        });
        res.status(201).json(formatResponse(stored));
    } catch (error) {
        next(error);
    }
};

// ===========================================
// Responses (owner-only)
// ===========================================

export const listResponses = async (req, res, next) => {
    try {
        const { page, limit } = parsePagination(req.query);
        const result = await aggregationService.listResponses(
            req.params.id,
            req.user.sub,
            req.user.role,
            { page, limit }
        );
        res.json(
            formatResponse(
                result.responses,
                createPaginationMeta(result.total, result.page, result.limit)
            )
        );
    } catch (error) {
        next(error);
    }
};

export const getSummary = async (req, res, next) => {
    try {
        const summary = await aggregationService.getSummary(
            req.params.id,
            req.user.sub,
            req.user.role
        );
        res.json(formatResponse(summary));
    } catch (error) {
        next(error);
    }
};

export const exportResponses = async (req, res, next) => {
    try {
        const format = (req.query.format || 'csv').toString().toLowerCase();

        if (format === 'xlsx' || format === 'excel') {
            const { filename, buffer } = await aggregationService.buildXlsx(
                req.params.id,
                req.user.sub,
                req.user.role
            );
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(buffer);
        }

        const { filename, csv } = await aggregationService.buildCsv(
            req.params.id,
            req.user.sub,
            req.user.role
        );
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

// ===========================================
// Collaborators (owner-only)
// ===========================================

export const listCollaborators = async (req, res, next) => {
    try {
        const collaborators = await collaboratorsService.listCollaborators(
            req.params.id,
            req.user.sub,
            req.user.role
        );
        res.json(formatResponse(collaborators));
    } catch (error) {
        next(error);
    }
};

export const addCollaborator = async (req, res, next) => {
    try {
        const collaborator = await collaboratorsService.addCollaborator(
            req.params.id,
            req.user.sub,
            req.user.role,
            req.body
        );
        res.status(201).json(formatResponse(collaborator));
    } catch (error) {
        next(error);
    }
};

export const removeCollaborator = async (req, res, next) => {
    try {
        await collaboratorsService.removeCollaborator(
            req.params.id,
            req.user.sub,
            req.user.role,
            req.params.userId
        );
        res.json(formatResponse({ message: 'Collaborator removed successfully' }));
    } catch (error) {
        next(error);
    }
};

export default {
    getPublicForm,
    submitForm,
    uploadFormFile,
    uploadFormImage,
    listResponses,
    getSummary,
    exportResponses,
    listForms,
    createForm,
    checkSlug,
    getForm,
    updateForm,
    deleteForm,
    duplicateForm,
    addQuestion,
    reorderQuestions,
    updateQuestion,
    deleteQuestion,
    listCollaborators,
    addCollaborator,
    removeCollaborator,
};
