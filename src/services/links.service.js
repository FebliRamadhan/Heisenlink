// ===========================================
// Heisenlink - Links Service
// ===========================================

import prisma from '../config/database.js';
import config from '../config/index.js';
import { generateCode, isValidAlias, isReservedAlias, normalizeAlias } from '../utils/shortcode.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { sanitizeUrl, isValidUrl } from '../utils/helpers.js';
import { cacheShortlink, invalidateShortlink, getCachedShortlink } from './cache.service.js';
import { errors } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

/**
 * Create a new shortlink
 * @param {object} data - Link data
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Created link
 */
export const createLink = async (data, userId) => {
    const { url, alias, title, startsAt, expiresAt, password, showConfirmation } = data;

    // Validate URL
    const destinationUrl = sanitizeUrl(url);
    if (!isValidUrl(destinationUrl)) {
        throw errors.badRequest('Invalid URL format');
    }

    // Generate or validate alias
    let code = alias ? normalizeAlias(alias) : generateCode();

    if (alias) {
        if (!isValidAlias(code)) {
            throw errors.badRequest('Alias must be 3-50 alphanumeric characters with hyphens or underscores');
        }

        if (isReservedAlias(code)) {
            throw errors.badRequest('This alias is reserved and cannot be used');
        }

        // Check if alias already exists
        const existing = await prisma.shortLink.findUnique({
            where: { code },
        });

        if (existing) {
            throw errors.conflict('This alias is already in use');
        }
    } else {
        // Ensure generated code is unique
        let attempts = 0;
        while (attempts < 5) {
            const existing = await prisma.shortLink.findUnique({
                where: { code },
            });
            if (!existing) break;
            code = generateCode();
            attempts++;
        }
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
        passwordHash = await hashPassword(password);
    }

    // Create link
    const link = await prisma.shortLink.create({
        data: {
            code,
            destinationUrl,
            title,
            userId,
            startsAt: startsAt ? new Date(startsAt) : null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            passwordHash,
            showConfirmation: showConfirmation || false,
            isActive: true,
        },
    });

    // Cache the link
    await cacheShortlink(code, {
        id: link.id,
        code: link.code,
        destinationUrl: link.destinationUrl,
        startsAt: link.startsAt,
        expiresAt: link.expiresAt,
        hasPassword: !!link.passwordHash,
        showConfirmation: link.showConfirmation,
        isActive: link.isActive,
    });

    logger.info(`Created shortlink: ${code} -> ${destinationUrl}`);

    return formatLinkResponse(link);
};

/**
 * Get user's links with pagination
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<object>} - Links and pagination
 */
export const getUserLinks = async (userId, options = {}) => {
    const { page = 1, limit = 20, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const where = {
        userId,
        ...(search && {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { destinationUrl: { contains: search, mode: 'insensitive' } },
            ],
        }),
    };

    const [links, total] = await Promise.all([
        prisma.shortLink.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.shortLink.count({ where }),
    ]);

    return {
        links: links.map(formatLinkResponse),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get link by ID
 * @param {string} id - Link ID
 * @param {string} userId - User ID (for ownership check)
 * @returns {Promise<object>} - Link data
 */
export const getLinkById = async (id, userId = null) => {
    const link = await prisma.shortLink.findUnique({
        where: { id },
    });

    if (!link) {
        throw errors.notFound('Link not found');
    }

    if (userId && link.userId !== userId) {
        throw errors.forbidden('You do not have access to this link');
    }

    return formatLinkResponse(link);
};

/**
 * Get link by code (for redirect)
 * @param {string} code - Short code
 * @returns {Promise<object|null>} - Link data or null
 */
export const getLinkByCode = async (code) => {
    // Check cache first
    const cached = await getCachedShortlink(code);
    if (cached) {
        return cached;
    }

    // Fetch from database
    const link = await prisma.shortLink.findUnique({
        where: { code },
        select: {
            id: true,
            code: true,
            destinationUrl: true,
            title: true,
            startsAt: true,
            expiresAt: true,
            passwordHash: true,
            showConfirmation: true,
            isActive: true,
        },
    });

    if (link) {
        // Cache for future requests
        await cacheShortlink(code, {
            id: link.id,
            code: link.code,
            destinationUrl: link.destinationUrl,
            title: link.title,
            startsAt: link.startsAt,
            expiresAt: link.expiresAt,
            hasPassword: !!link.passwordHash,
            showConfirmation: link.showConfirmation,
            isActive: link.isActive,
        });
    }

    return link;
};

/**
 * Update link
 * @param {string} id - Link ID
 * @param {object} data - Update data
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Updated link
 */
export const updateLink = async (id, data, userId) => {
    const link = await prisma.shortLink.findUnique({
        where: { id },
    });

    if (!link) {
        throw errors.notFound('Link not found');
    }

    if (link.userId !== userId) {
        throw errors.forbidden('You do not have access to this link');
    }

    const { url, title, startsAt, expiresAt, password, showConfirmation, isActive } = data;
    const updateData = {};

    if (url !== undefined) {
        const destinationUrl = sanitizeUrl(url);
        if (!isValidUrl(destinationUrl)) {
            throw errors.badRequest('Invalid URL format');
        }
        updateData.destinationUrl = destinationUrl;
    }

    if (title !== undefined) updateData.title = title;
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (showConfirmation !== undefined) updateData.showConfirmation = showConfirmation;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (password !== undefined) {
        updateData.passwordHash = password ? await hashPassword(password) : null;
    }

    const updated = await prisma.shortLink.update({
        where: { id },
        data: updateData,
    });

    // Invalidate cache
    await invalidateShortlink(link.code);

    logger.info(`Updated shortlink: ${link.code}`);

    return formatLinkResponse(updated);
};

/**
 * Delete link
 * @param {string} id - Link ID
 * @param {string} userId - User ID
 */
export const deleteLink = async (id, userId) => {
    const link = await prisma.shortLink.findUnique({
        where: { id },
    });

    if (!link) {
        throw errors.notFound('Link not found');
    }

    if (link.userId !== userId) {
        throw errors.forbidden('You do not have access to this link');
    }

    await prisma.shortLink.delete({
        where: { id },
    });

    // Invalidate cache
    await invalidateShortlink(link.code);

    logger.info(`Deleted shortlink: ${link.code}`);
};

/**
 * Verify link password
 * @param {string} id - Link ID
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>}
 */
export const verifyLinkPassword = async (id, password) => {
    const link = await prisma.shortLink.findUnique({
        where: { id },
        select: { passwordHash: true },
    });

    if (!link || !link.passwordHash) {
        return false;
    }

    return await comparePassword(password, link.passwordHash);
};

/**
 * Increment link click count
 * @param {string} id - Link ID
 */
export const incrementClickCount = async (id) => {
    try {
        await prisma.shortLink.update({
            where: { id },
            data: { clickCount: { increment: 1 } },
        });
    } catch (error) {
        logger.error('Failed to increment click count:', error.message);
    }
};

/**
 * Bulk create links from array
 * @param {array} links - Array of link data
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Created and failed links
 */
export const bulkCreateLinks = async (links, userId) => {
    const results = {
        created: [],
        failed: [],
    };

    for (const linkData of links) {
        try {
            const link = await createLink(linkData, userId);
            results.created.push(link);
        } catch (error) {
            results.failed.push({
                url: linkData.url,
                alias: linkData.alias,
                error: error.message,
            });
        }
    }

    return results;
};

/**
 * Format link response (remove sensitive data)
 */
const formatLinkResponse = (link) => ({
    id: link.id,
    code: link.code,
    shortUrl: `${config.domains.shortlink}/${link.code}`,
    destinationUrl: link.destinationUrl,
    title: link.title,
    startsAt: link.startsAt,
    expiresAt: link.expiresAt,
    hasPassword: !!link.passwordHash,
    showConfirmation: link.showConfirmation,
    isActive: link.isActive,
    clickCount: link.clickCount,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
});

export default {
    createLink,
    getUserLinks,
    getLinkById,
    getLinkByCode,
    updateLink,
    deleteLink,
    verifyLinkPassword,
    incrementClickCount,
    bulkCreateLinks,
};
