// ===========================================
// LinkHub - QR Code Service
// ===========================================

import QRCode from 'qrcode';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Generate QR code as data URL
 * @param {string} url - URL to encode
 * @param {object} options - QR code options
 * @returns {Promise<string>} - Data URL
 */
export const generateDataUrl = async (url, options = {}) => {
    const defaultOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
        ...options,
    };

    try {
        return await QRCode.toDataURL(url, defaultOptions);
    } catch (error) {
        logger.error('QR code generation error:', error.message);
        throw error;
    }
};

/**
 * Generate QR code as buffer
 * @param {string} url - URL to encode
 * @param {object} options - QR code options
 * @returns {Promise<Buffer>} - PNG buffer
 */
export const generateBuffer = async (url, options = {}) => {
    const defaultOptions = {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
        ...options,
    };

    try {
        return await QRCode.toBuffer(url, defaultOptions);
    } catch (error) {
        logger.error('QR code generation error:', error.message);
        throw error;
    }
};

/**
 * Generate QR code as SVG string
 * @param {string} url - URL to encode
 * @param {object} options - QR code options
 * @returns {Promise<string>} - SVG string
 */
export const generateSvg = async (url, options = {}) => {
    const defaultOptions = {
        errorCorrectionLevel: 'M',
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
        ...options,
    };

    try {
        return await QRCode.toString(url, { ...defaultOptions, type: 'svg' });
    } catch (error) {
        logger.error('QR code generation error:', error.message);
        throw error;
    }
};

/**
 * Generate QR code for shortlink
 * @param {string} code - Short code
 * @param {string} format - Output format ('png', 'svg', 'dataurl')
 * @param {object} options - QR code options
 * @returns {Promise<string|Buffer>}
 */
export const generateForShortlink = async (code, format = 'png', options = {}) => {
    const url = `${config.domains.shortlink}/${code}`;

    switch (format) {
        case 'svg':
            return await generateSvg(url, options);
        case 'dataurl':
            return await generateDataUrl(url, options);
        case 'png':
        default:
            return await generateBuffer(url, options);
    }
};

/**
 * Generate QR code for bio page
 * @param {string} slug - Bio page slug
 * @param {string} format - Output format ('png', 'svg', 'dataurl')
 * @param {object} options - QR code options
 * @returns {Promise<string|Buffer>}
 */
export const generateForBioPage = async (slug, format = 'png', options = {}) => {
    const url = `${config.domains.bio}/${slug}`;

    switch (format) {
        case 'svg':
            return await generateSvg(url, options);
        case 'dataurl':
            return await generateDataUrl(url, options);
        case 'png':
        default:
            return await generateBuffer(url, options);
    }
};

export default {
    generateDataUrl,
    generateBuffer,
    generateSvg,
    generateForShortlink,
    generateForBioPage,
};
