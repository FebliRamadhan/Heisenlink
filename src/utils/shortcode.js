// ===========================================
// Heisenlink - Short Code Generator
// ===========================================

import { nanoid, customAlphabet } from 'nanoid';

// Custom alphabet for short codes (URL-safe, no ambiguous characters)
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateShortCode = customAlphabet(alphabet, 6);

/**
 * Generate a random short code
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} - Generated short code
 */
export const generateCode = (length = 6) => {
    if (length === 6) {
        return generateShortCode();
    }
    return customAlphabet(alphabet, length)();
};

/**
 * Validate a custom alias
 * @param {string} alias - Custom alias to validate
 * @returns {boolean} - True if valid
 */
export const isValidAlias = (alias) => {
    // Must be 3-50 characters, alphanumeric with hyphens and underscores
    const pattern = /^[a-zA-Z0-9_-]{3,50}$/;
    return pattern.test(alias);
};

/**
 * Normalize an alias (lowercase, trim)
 * @param {string} alias - Alias to normalize
 * @returns {string} - Normalized alias
 */
export const normalizeAlias = (alias) => {
    return alias.trim().toLowerCase();
};

/**
 * List of reserved words that cannot be used as aliases
 */
export const reservedWords = [
    // App routes
    'api',
    'admin',
    'login',
    'logout',
    'register',
    'settings',
    'dashboard',
    'analytics',
    'bio',
    'health',
    'forbidden',
    'link-expired',
    'link-inactive',
    'not-found',
    'too-many-requests',
    'error',
    'loading',
    // Static / asset paths
    'static',
    'public',
    'assets',
    'images',
    'css',
    'js',
    'favicon',
    // Next.js internals
    '_next',
    '_error',
    '_app',
    // Common reserved paths
    'auth',
    'signup',
    'reset-password',
    'verify',
    'callback',
    'redirect',
    'sitemap',
    'robots',
    'manifest',
];

/**
 * Check if an alias is reserved
 * @param {string} alias - Alias to check
 * @returns {boolean} - True if reserved
 */
export const isReservedAlias = (alias) => {
    return reservedWords.includes(alias.toLowerCase());
};

export default {
    generateCode,
    isValidAlias,
    normalizeAlias,
    isReservedAlias,
    reservedWords,
};
