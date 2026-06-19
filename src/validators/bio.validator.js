// ===========================================
// Heisenlink - Bio Validators
// ===========================================

import { z } from 'zod';

/**
 * Update bio page schema
 */
export const updateBioPageSchema = z.object({
    title: z
        .string()
        .max(100, 'Title must be at most 100 characters')
        .optional(),
    bio: z
        .string()
        .max(500, 'Bio must be at most 500 characters')
        .optional()
        .nullable(),
    slug: z
        .string()
        .min(3, 'URL must be at least 3 characters')
        .max(50, 'URL must be at most 50 characters')
        .regex(/^[a-z0-9_-]+$/, 'URL can only contain lowercase letters, numbers, hyphens, and underscores')
        .optional(),
    theme: z
        .string()
        .max(50)
        .optional(),
    isPublished: z
        .boolean()
        .optional(),
    socialLinks: z
        .array(z.object({
            platform: z.string(),
            url: z.string(),
        }))
        .optional()
        .nullable(),
});

/**
 * Create bio link schema
 */
export const createBioLinkSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be at most 100 characters'),
    url: z
        .string()
        .min(1, 'URL is required')
        .max(2048, 'URL is too long'),
    icon: z
        .string()
        .max(50)
        .optional()
        .nullable(),
});

/**
 * Update bio link schema
 */
export const updateBioLinkSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be at most 100 characters')
        .optional(),
    url: z
        .string()
        .min(1, 'URL is required')
        .max(2048, 'URL is too long')
        .optional(),
    icon: z
        .string()
        .max(50)
        .optional()
        .nullable(),
    isVisible: z
        .boolean()
        .optional(),
});

/**
 * Bio link ID parameter schema
 */
export const bioLinkIdSchema = z.object({
    id: z.string().uuid('Invalid link ID'),
});

/**
 * Reorder links schema
 */
export const reorderLinksSchema = z.object({
    linkIds: z
        .array(z.string().uuid())
        .min(1, 'At least one link ID is required'),
});

/**
 * Track click schema
 */
export const trackClickSchema = z.object({
    linkId: z.string().uuid('Invalid link ID'),
});

export default {
    updateBioPageSchema,
    createBioLinkSchema,
    updateBioLinkSchema,
    bioLinkIdSchema,
    reorderLinksSchema,
    trackClickSchema,
};
