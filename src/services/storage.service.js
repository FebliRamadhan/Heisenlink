// ===========================================
// Heisenlink - Storage Service
// ===========================================
//
// Stores uploaded files to S3 when configured, otherwise to local disk under
// config.upload.dir (served by Express `static('public/uploads')` and proxied
// by Next at /uploads/*). Lets form image/file uploads work without S3.

import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import config from '../config/index.js';
import * as s3Service from './s3.service.js';
import logger from '../utils/logger.js';

const sanitizeName = (name) => (name || 'file').replace(/[^\w.\-]/g, '_').slice(0, 100);

/**
 * Persist a file buffer. Returns a public URL.
 * - S3 enabled  → absolute S3 URL
 * - otherwise   → relative `/uploads/<prefix>/<file>` (served by Express static)
 *
 * @param {object} params
 * @param {Buffer} params.buffer
 * @param {string} params.originalName
 * @param {string} params.mimetype
 * @param {string} [params.prefix] - logical folder (e.g. "forms")
 * @returns {Promise<{url: string, name: string, size: number, mime: string}>}
 */
export const storeBuffer = async ({ buffer, originalName, mimetype, prefix = 'forms' }) => {
    const safe = sanitizeName(originalName);
    const filename = `${nanoid(12)}-${safe}`;

    if (s3Service.isEnabled()) {
        const key = `${prefix}/${filename}`;
        const { url } = await s3Service.uploadObject({ buffer, key, contentType: mimetype });
        return { url, name: originalName, size: buffer.length, mime: mimetype };
    }

    // Local disk fallback
    const dir = path.join(config.upload.dir, prefix);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buffer);
    logger.info(`Stored upload on disk: ${prefix}/${filename}`);

    return { url: `/uploads/${prefix}/${filename}`, name: originalName, size: buffer.length, mime: mimetype };
};

export default { storeBuffer };
