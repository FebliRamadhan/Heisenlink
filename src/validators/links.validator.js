// ===========================================
// Heisenlink - Links Validators
// ===========================================

import { z } from 'zod';

/**
 * Create link schema
 */
export const createLinkSchema = z.object({
    url: z
        .string()
        .min(1, 'URL is required')
        .max(2048, 'URL is too long'),
    alias: z
        .string()
        .min(3, 'Alias must be at least 3 characters')
        .max(50, 'Alias must be at most 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Alias can only contain letters, numbers, hyphens, and underscores')
        .optional(),
    title: z
        .string()
        .max(200, 'Title must be at most 200 characters')
        .optional(),
    startsAt: z
        .string()
        .optional()
        .nullable()
        .transform(val => val === '' ? null : val),
    expiresAt: z
        .string()
        .optional()
        .nullable()
        .transform(val => val === '' ? null : val),
    password: z
        .string()
        .min(4, 'Password must be at least 4 characters')
        .max(50, 'Password must be at most 50 characters')
        .or(z.literal(''))
        .optional(),
    showConfirmation: z
        .boolean()
        .optional(),
});

/**
 * Update link schema
 */
export const updateLinkSchema = z.object({
    url: z
        .string()
        .min(1, 'URL is required')
        .max(2048, 'URL is too long')
        .optional(),
    title: z
        .string()
        .max(200, 'Title must be at most 200 characters')
        .optional()
        .nullable(),
    startsAt: z
        .string()
        .optional()
        .nullable()
        .transform(val => val === '' ? null : val),
    expiresAt: z
        .string()
        .optional()
        .nullable()
        .transform(val => val === '' ? null : val),
    password: z
        .string()
        .min(4, 'Password must be at least 4 characters')
        .max(50, 'Password must be at most 50 characters')
        .or(z.literal(''))
        .optional()
        .nullable(),
    showConfirmation: z
        .boolean()
        .optional(),
    isActive: z
        .boolean()
        .optional(),
});

/**
 * Link ID parameter schema
 */
export const linkIdSchema = z.object({
    id: z.string().uuid('Invalid link ID'),
});

/**
 * Links query schema
 */
export const linksQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'clickCount', 'title']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Verify password schema
 */
export const verifyPasswordSchema = z.object({
    password: z.string().min(1, 'Password is required'),
});

/**
 * Bulk create schema
 */
export const bulkCreateSchema = z.object({
    links: z.array(createLinkSchema).min(1).max(100),
});

/**
 * QR code query schema
 */
export const qrCodeQuerySchema = z.object({
    format: z.enum(['png', 'svg', 'dataurl']).default('png'),
    size: z.coerce.number().int().min(100).max(1000).default(300),
});

export default {
    createLinkSchema,
    updateLinkSchema,
    linkIdSchema,
    linksQuerySchema,
    verifyPasswordSchema,
    bulkCreateSchema,
    qrCodeQuerySchema,
};
