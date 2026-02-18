// ===========================================
// Heisenlink - Helper Utilities
// ===========================================

/**
 * Format API response
 * @param {any} data - Response data
 * @param {object} meta - Pagination metadata
 * @returns {object} - Formatted response
 */
export const formatResponse = (data, meta = null) => {
    const response = {
        success: true,
        data,
    };

    if (meta) {
        response.meta = meta;
    }

    return response;
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {array} details - Error details
 * @returns {object} - Formatted error
 */
export const formatError = (message, code = 'ERROR', details = null) => {
    const error = {
        success: false,
        error: {
            code,
            message,
        },
    };

    if (details) {
        error.error.details = details;
    }

    return error;
};

/**
 * Parse pagination parameters
 * @param {object} query - Request query params
 * @returns {object} - Parsed pagination
 */
export const parsePagination = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Create pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination metadata
 */
export const createPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Sanitize URL (add https if missing)
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
export const sanitizeUrl = (url) => {
    if (!url) return url;

    const trimmed = url.trim();

    if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
    }

    return trimmed;
};

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string} - Domain name
 */
export const extractDomain = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.hostname;
    } catch {
        return null;
    }
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Omit properties from object
 * @param {object} obj - Source object
 * @param {array} keys - Keys to omit
 * @returns {object} - Object without omitted keys
 */
export const omit = (obj, keys) => {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
};

/**
 * Pick properties from object
 * @param {object} obj - Source object
 * @param {array} keys - Keys to pick
 * @returns {object} - Object with only picked keys
 */
export const pick = (obj, keys) => {
    const result = {};
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
};

export default {
    formatResponse,
    formatError,
    parsePagination,
    createPaginationMeta,
    isValidUrl,
    sanitizeUrl,
    extractDomain,
    sleep,
    omit,
    pick,
};
