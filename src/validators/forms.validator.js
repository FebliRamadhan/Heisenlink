// ===========================================
// Heisenlink - Form Validators
// ===========================================

import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9_-]+$/;

export const CHOICE_TYPES = ['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'];

export const questionTypeEnum = z.enum([
    'SHORT_TEXT',
    'LONG_TEXT',
    'MULTIPLE_CHOICE',
    'CHECKBOXES',
    'DROPDOWN',
    'LINEAR_SCALE',
    'DATE',
    'TIME',
    'FILE_UPLOAD',
    'SECTION',
    'STATEMENT',
    'IMAGE',
]);

const optionSchema = z.object({
    id: z.string().min(1).max(64),
    label: z.string().min(1, 'Option label is required').max(200),
});

const configSchema = z
    .object({
        // text
        maxLength: z.number().int().positive().max(10000).optional(),
        // linear scale
        min: z.number().int().optional(),
        max: z.number().int().optional(),
        minLabel: z.string().max(50).optional(),
        maxLabel: z.string().max(50).optional(),
        // date
        allowFuture: z.boolean().optional(),
        // file
        accept: z.array(z.string()).optional(),
        maxSizeMb: z.number().positive().max(50).optional(),
        maxFiles: z.number().int().positive().max(10).optional(),
        // image (display-only)
        imageUrl: z.string().max(2048).optional(),
        alt: z.string().max(200).optional(),
    })
    .partial()
    .nullable()
    .optional();

// ===========================================
// Form schemas
// ===========================================

export const createFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255).optional(),
    description: z.string().max(2000).optional().nullable(),
    slug: z
        .string()
        .min(3, 'URL must be at least 3 characters')
        .max(50, 'URL must be at most 50 characters')
        .regex(SLUG_REGEX, 'URL can only contain lowercase letters, numbers, hyphens, and underscores')
        .optional(),
});

export const updateFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255).optional(),
    description: z.string().max(2000).optional().nullable(),
    slug: z
        .string()
        .min(3, 'URL must be at least 3 characters')
        .max(50, 'URL must be at most 50 characters')
        .regex(SLUG_REGEX, 'URL can only contain lowercase letters, numbers, hyphens, and underscores')
        .optional(),
    theme: z.string().max(50).optional(),
    isPublished: z.boolean().optional(),
    acceptingResponses: z.boolean().optional(),
    collectEmail: z.boolean().optional(),
    oneResponsePerSession: z.boolean().optional(),
    closesAt: z.string().datetime().optional().nullable(),
    confirmationMessage: z.string().max(2000).optional().nullable(),
    closedMessage: z.string().max(2000).optional().nullable(),
    settings: z.record(z.any()).optional().nullable(),
});

// ===========================================
// Question schemas (discriminated by type via superRefine)
// ===========================================

const questionBase = {
    type: questionTypeEnum,
    title: z.string().max(2000).optional(),
    description: z.string().max(2000).optional().nullable(),
    position: z.number().int().min(0).optional(),
    isRequired: z.boolean().optional(),
    options: z.array(optionSchema).max(100).optional().nullable(),
    config: configSchema,
};

const refineQuestion = (data, ctx) => {
    if (CHOICE_TYPES.includes(data.type)) {
        if (!data.options || data.options.length < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['options'],
                message: 'At least one option is required for choice questions',
            });
        }
    }
    if (data.type === 'LINEAR_SCALE' && data.config) {
        const { min, max } = data.config;
        if (min !== undefined && max !== undefined && min >= max) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['config', 'max'],
                message: 'Scale max must be greater than min',
            });
        }
    }
};

export const createQuestionSchema = z.object(questionBase).superRefine(refineQuestion);

export const updateQuestionSchema = z
    .object({ ...questionBase, type: questionTypeEnum.optional() })
    .superRefine((data, ctx) => {
        if (data.type) refineQuestion(data, ctx);
    });

export const reorderQuestionsSchema = z.object({
    questionIds: z.array(z.string().uuid()).min(1, 'At least one question ID is required'),
});

// ===========================================
// Public submit schema (value validation done in service vs. question defs)
// ===========================================

const answerInputSchema = z.object({
    questionId: z.string().uuid('Invalid question ID'),
    value: z.any().optional(),
});

export const submitFormSchema = z.object({
    idempotencyKey: z.string().min(8, 'Invalid idempotency key').max(100),
    // Honeypot: accept any value here so bots pass validation; the service
    // detects a filled honeypot and returns a fake success without saving.
    website: z.string().max(200).optional(),
    respondentEmail: z.string().email('Invalid email').optional().nullable(),
    answers: z.array(answerInputSchema),
});

// ===========================================
// Param & query schemas
// ===========================================

export const formIdParamSchema = z.object({
    id: z.string().uuid('Invalid form ID'),
});

export const questionIdParamSchema = z.object({
    id: z.string().uuid('Invalid form ID'),
    qid: z.string().uuid('Invalid question ID'),
});

export const slugParamSchema = z.object({
    slug: z.string().min(1),
});

export const slugQuerySchema = z.object({
    slug: z.string().min(1),
});

export const listFormsQuerySchema = z.object({
    search: z.string().max(255).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listResponsesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export default {
    createFormSchema,
    updateFormSchema,
    createQuestionSchema,
    updateQuestionSchema,
    reorderQuestionsSchema,
    submitFormSchema,
    formIdParamSchema,
    questionIdParamSchema,
    slugParamSchema,
    slugQuerySchema,
    listFormsQuerySchema,
    listResponsesQuerySchema,
};
