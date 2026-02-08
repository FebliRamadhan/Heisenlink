// ===========================================
// LinkHub - Cache Service
// ===========================================

import { getRedisClient } from '../config/redis.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached value or null
 */
export const get = async (key) => {
    try {
        const redis = getRedisClient();
        const value = await redis.get(key);

        if (value) {
            return JSON.parse(value);
        }

        return null;
    } catch (error) {
        logger.warn('Cache get error:', error.message);
        return null;
    }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - TTL in seconds (optional)
 */
export const set = async (key, value, ttl = null) => {
    try {
        const redis = getRedisClient();
        const serialized = JSON.stringify(value);

        if (ttl) {
            await redis.setex(key, ttl, serialized);
        } else {
            await redis.set(key, serialized);
        }
    } catch (error) {
        logger.warn('Cache set error:', error.message);
    }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 */
export const del = async (key) => {
    try {
        const redis = getRedisClient();
        await redis.del(key);
    } catch (error) {
        logger.warn('Cache delete error:', error.message);
    }
};

/**
 * Delete multiple keys by pattern
 * @param {string} pattern - Key pattern (e.g., "link:*")
 */
export const delByPattern = async (pattern) => {
    try {
        const redis = getRedisClient();
        const keys = await redis.keys(pattern);

        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        logger.warn('Cache delete pattern error:', error.message);
    }
};

/**
 * Check if key exists
 * @param {string} key - Cache key
 * @returns {Promise<boolean>}
 */
export const exists = async (key) => {
    try {
        const redis = getRedisClient();
        return (await redis.exists(key)) === 1;
    } catch (error) {
        logger.warn('Cache exists error:', error.message);
        return false;
    }
};

/**
 * Increment value
 * @param {string} key - Cache key
 * @returns {Promise<number>} - New value
 */
export const incr = async (key) => {
    try {
        const redis = getRedisClient();
        return await redis.incr(key);
    } catch (error) {
        logger.warn('Cache incr error:', error.message);
        return 0;
    }
};

// ===========================================
// Shortlink Cache Helpers
// ===========================================

/**
 * Cache shortlink
 * @param {string} code - Short code
 * @param {object} link - Link data
 */
export const cacheShortlink = async (code, link) => {
    await set(`link:${code}`, link, config.cache.shortlinkTTL);
};

/**
 * Get cached shortlink
 * @param {string} code - Short code
 * @returns {Promise<object|null>}
 */
export const getCachedShortlink = async (code) => {
    return await get(`link:${code}`);
};

/**
 * Invalidate shortlink cache
 * @param {string} code - Short code
 */
export const invalidateShortlink = async (code) => {
    await del(`link:${code}`);
};

// ===========================================
// Bio Page Cache Helpers
// ===========================================

/**
 * Cache bio page
 * @param {string} slug - Bio page slug
 * @param {object} bioPage - Bio page data
 */
export const cacheBioPage = async (slug, bioPage) => {
    await set(`bio:${slug}`, bioPage, config.cache.bioPageTTL);
};

/**
 * Get cached bio page
 * @param {string} slug - Bio page slug
 * @returns {Promise<object|null>}
 */
export const getCachedBioPage = async (slug) => {
    return await get(`bio:${slug}`);
};

/**
 * Invalidate bio page cache
 * @param {string} slug - Bio page slug
 */
export const invalidateBioPage = async (slug) => {
    await del(`bio:${slug}`);
};

export default {
    get,
    set,
    del,
    delByPattern,
    exists,
    incr,
    cacheShortlink,
    getCachedShortlink,
    invalidateShortlink,
    cacheBioPage,
    getCachedBioPage,
    invalidateBioPage,
};
