// ===========================================
// LinkHub - Bio Service
// ===========================================

import prisma from '../config/database.js';
import config from '../config/index.js';
import { cacheBioPage, invalidateBioPage, getCachedBioPage } from './cache.service.js';
import { errors } from '../middleware/error.middleware.js';
import { sanitizeUrl, isValidUrl } from '../utils/helpers.js';
import { isReservedAlias } from '../utils/shortcode.js';
import logger from '../utils/logger.js';

/**
 * Get or create bio page for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Bio page
 */
export const getOrCreateBioPage = async (userId) => {
    let bioPage = await prisma.bioPage.findUnique({
        where: { userId },
        include: {
            bioLinks: {
                orderBy: { position: 'asc' },
            },
        },
    });

    // Auto-create bio page if doesn't exist
    if (!bioPage) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, displayName: true, avatarUrl: true },
        });

        bioPage = await prisma.bioPage.create({
            data: {
                userId,
                slug: user.username.toLowerCase(),
                title: user.displayName || user.username,
                avatarUrl: user.avatarUrl,
                theme: 'gradient',
                isPublished: false,
            },
            include: {
                bioLinks: {
                    orderBy: { position: 'asc' },
                },
            },
        });
    }

    return formatBioPageResponse(bioPage);
};

/**
 * Get bio page by slug (public)
 * @param {string} slug - Bio page slug
 * @returns {Promise<object|null>} - Bio page or null
 */
export const getBioPageBySlug = async (slug) => {
    // Check cache first
    const cached = await getCachedBioPage(slug);
    if (cached) {
        return cached;
    }

    const bioPage = await prisma.bioPage.findUnique({
        where: { slug },
        include: {
            bioLinks: {
                where: { isVisible: true },
                orderBy: { position: 'asc' },
            },
            user: {
                select: { username: true },
            },
        },
    });

    if (!bioPage || !bioPage.isPublished) {
        return null;
    }

    const formatted = formatBioPageResponse(bioPage);

    // Cache for future requests
    await cacheBioPage(slug, formatted);

    return formatted;
};

/**
 * Update bio page
 * @param {string} userId - User ID
 * @param {object} data - Update data
 * @returns {Promise<object>} - Updated bio page
 */
export const updateBioPage = async (userId, data) => {
    const bioPage = await prisma.bioPage.findUnique({
        where: { userId },
    });

    if (!bioPage) {
        throw errors.notFound('Bio page not found');
    }

    const { title, bio, theme, isPublished, socialLinks, slug } = data;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (bio !== undefined) updateData.bio = bio;
    if (theme !== undefined) updateData.theme = theme;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

    // Handle slug change
    if (slug !== undefined && slug !== bioPage.slug) {
        const normalizedSlug = slug.toLowerCase();

        // Check if slug is reserved
        if (isReservedAlias(normalizedSlug)) {
            throw errors.badRequest('This URL is reserved and cannot be used');
        }

        // Check if new slug is available
        const existing = await prisma.bioPage.findUnique({
            where: { slug: normalizedSlug },
        });
        if (existing) {
            throw errors.conflict('This URL is already taken');
        }
        updateData.slug = normalizedSlug;
    }

    const updated = await prisma.bioPage.update({
        where: { userId },
        data: updateData,
        include: {
            bioLinks: {
                orderBy: { position: 'asc' },
            },
        },
    });

    // Invalidate cache
    await invalidateBioPage(bioPage.slug);
    if (updateData.slug) {
        await invalidateBioPage(updateData.slug);
    }

    logger.info(`Updated bio page for user: ${userId}`);

    return formatBioPageResponse(updated);
};

/**
 * Update avatar URL
 * @param {string} userId - User ID
 * @param {string} avatarUrl - Avatar URL
 * @returns {Promise<object>} - Updated bio page
 */
export const updateAvatar = async (userId, avatarUrl) => {
    const bioPage = await prisma.bioPage.findUnique({
        where: { userId },
    });

    if (!bioPage) {
        throw errors.notFound('Bio page not found');
    }

    const updated = await prisma.bioPage.update({
        where: { userId },
        data: { avatarUrl },
        include: {
            bioLinks: {
                orderBy: { position: 'asc' },
            },
        },
    });

    await invalidateBioPage(bioPage.slug);

    return formatBioPageResponse(updated);
};

// ===========================================
// Bio Links Management
// ===========================================

/**
 * Add bio link
 * @param {string} userId - User ID
 * @param {object} data - Link data
 * @returns {Promise<object>} - Created link
 */
export const addBioLink = async (userId, data) => {
    const bioPage = await prisma.bioPage.findUnique({
        where: { userId },
    });

    if (!bioPage) {
        throw errors.notFound('Bio page not found');
    }

    const { title, url, icon } = data;

    // Validate URL
    const sanitizedUrl = sanitizeUrl(url);
    if (!isValidUrl(sanitizedUrl)) {
        throw errors.badRequest('Invalid URL format');
    }

    // Get max position
    const maxPosition = await prisma.bioLink.aggregate({
        where: { bioPageId: bioPage.id },
        _max: { position: true },
    });

    const bioLink = await prisma.bioLink.create({
        data: {
            bioPageId: bioPage.id,
            title,
            url: sanitizedUrl,
            icon,
            position: (maxPosition._max.position ?? -1) + 1,
            isVisible: true,
        },
    });

    await invalidateBioPage(bioPage.slug);

    return bioLink;
};

/**
 * Update bio link
 * @param {string} linkId - Link ID
 * @param {string} userId - User ID
 * @param {object} data - Update data
 * @returns {Promise<object>} - Updated link
 */
export const updateBioLink = async (linkId, userId, data) => {
    const bioLink = await prisma.bioLink.findUnique({
        where: { id: linkId },
        include: { bioPage: true },
    });

    if (!bioLink) {
        throw errors.notFound('Bio link not found');
    }

    if (bioLink.bioPage.userId !== userId) {
        throw errors.forbidden('You do not have access to this link');
    }

    const { title, url, icon, isVisible } = data;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (icon !== undefined) updateData.icon = icon;
    if (isVisible !== undefined) updateData.isVisible = isVisible;

    if (url !== undefined) {
        const sanitizedUrl = sanitizeUrl(url);
        if (!isValidUrl(sanitizedUrl)) {
            throw errors.badRequest('Invalid URL format');
        }
        updateData.url = sanitizedUrl;
    }

    const updated = await prisma.bioLink.update({
        where: { id: linkId },
        data: updateData,
    });

    await invalidateBioPage(bioLink.bioPage.slug);

    return updated;
};

/**
 * Delete bio link
 * @param {string} linkId - Link ID
 * @param {string} userId - User ID
 */
export const deleteBioLink = async (linkId, userId) => {
    const bioLink = await prisma.bioLink.findUnique({
        where: { id: linkId },
        include: { bioPage: true },
    });

    if (!bioLink) {
        throw errors.notFound('Bio link not found');
    }

    if (bioLink.bioPage.userId !== userId) {
        throw errors.forbidden('You do not have access to this link');
    }

    await prisma.bioLink.delete({
        where: { id: linkId },
    });

    await invalidateBioPage(bioLink.bioPage.slug);
};

/**
 * Reorder bio links
 * @param {string} userId - User ID
 * @param {array} linkIds - Ordered array of link IDs
 */
export const reorderBioLinks = async (userId, linkIds) => {
    const bioPage = await prisma.bioPage.findUnique({
        where: { userId },
    });

    if (!bioPage) {
        throw errors.notFound('Bio page not found');
    }

    // Update positions in transaction
    await prisma.$transaction(
        linkIds.map((id, index) =>
            prisma.bioLink.update({
                where: { id },
                data: { position: index },
            })
        )
    );

    await invalidateBioPage(bioPage.slug);
};

/**
 * Track bio link click
 * @param {string} linkId - Link ID
 */
export const trackBioLinkClick = async (linkId) => {
    try {
        await prisma.bioLink.update({
            where: { id: linkId },
            data: { clickCount: { increment: 1 } },
        });
    } catch (error) {
        logger.error('Failed to track bio link click:', error.message);
    }
};

/**
 * Format bio page response
 */
const formatBioPageResponse = (bioPage) => ({
    id: bioPage.id,
    slug: bioPage.slug,
    url: `${config.domains.bio}/${bioPage.slug}`,
    title: bioPage.title,
    bio: bioPage.bio,
    avatarUrl: bioPage.avatarUrl,
    theme: bioPage.theme,
    socialLinks: bioPage.socialLinks,
    isPublished: bioPage.isPublished,
    links: bioPage.bioLinks?.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        position: link.position,
        isVisible: link.isVisible,
        clickCount: link.clickCount,
    })) || [],
    createdAt: bioPage.createdAt,
    updatedAt: bioPage.updatedAt,
});

export default {
    getOrCreateBioPage,
    getBioPageBySlug,
    updateBioPage,
    updateAvatar,
    addBioLink,
    updateBioLink,
    deleteBioLink,
    reorderBioLinks,
    trackBioLinkClick,
};
