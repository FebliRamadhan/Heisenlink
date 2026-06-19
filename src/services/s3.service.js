// ===========================================
// Heisenlink - S3 Service
// ===========================================

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let s3Client = null;

const getClient = () => {
    if (!config.s3.enabled) {
        throw new Error('S3 storage is not enabled. Set S3_ENABLED=true');
    }
    if (!config.s3.bucket || !config.s3.accessKeyId || !config.s3.secretAccessKey) {
        throw new Error('S3 configuration is incomplete (bucket, accessKeyId, secretAccessKey required)');
    }
    if (!s3Client) {
        s3Client = new S3Client({
            region: config.s3.region,
            endpoint: config.s3.endpoint,
            forcePathStyle: config.s3.forcePathStyle,
            credentials: {
                accessKeyId: config.s3.accessKeyId,
                secretAccessKey: config.s3.secretAccessKey,
            },
        });
    }
    return s3Client;
};

const buildPublicUrl = (key) => {
    if (config.s3.publicUrl) {
        return `${config.s3.publicUrl.replace(/\/$/, '')}/${key}`;
    }
    if (config.s3.endpoint) {
        const base = config.s3.endpoint.replace(/\/$/, '');
        return config.s3.forcePathStyle
            ? `${base}/${config.s3.bucket}/${key}`
            : `${base.replace('://', `://${config.s3.bucket}.`)}/${key}`;
    }
    return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
};

/**
 * Upload a buffer to S3
 * @param {object} params
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.key - Object key (path within bucket)
 * @param {string} params.contentType - MIME type
 * @param {string} [params.cacheControl] - Optional Cache-Control header
 * @returns {Promise<{key: string, url: string}>}
 */
export const uploadObject = async ({ buffer, key, contentType, cacheControl }) => {
    const client = getClient();
    await client.send(new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl,
    }));

    const url = buildPublicUrl(key);
    logger.info(`Uploaded object to S3: ${key}`);
    return { key, url };
};

/**
 * Process and upload an avatar: resize to 512x512 webp, strip EXIF.
 * @param {object} params
 * @param {Buffer} params.buffer - Source image buffer
 * @param {string} params.keyPrefix - Path prefix (no extension)
 * @returns {Promise<{key: string, url: string, width: number, height: number}>}
 */
export const uploadAvatar = async ({ buffer, keyPrefix }) => {
    const processed = await sharp(buffer, { failOn: 'error' })
        .rotate() // honor EXIF orientation, then strip metadata
        .resize(512, 512, { fit: 'cover', position: 'attention' })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

    const key = `${keyPrefix}.webp`;
    const result = await uploadObject({
        buffer: processed,
        key,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
    });

    return { ...result, width: 512, height: 512 };
};

/**
 * Delete an object from S3
 * @param {string} key - Object key
 */
export const deleteObject = async (key) => {
    const client = getClient();
    try {
        await client.send(new DeleteObjectCommand({
            Bucket: config.s3.bucket,
            Key: key,
        }));
        logger.info(`Deleted object from S3: ${key}`);
    } catch (error) {
        logger.warn(`Failed to delete S3 object ${key}: ${error.message}`);
    }
};

/**
 * Extract S3 key from a previously stored URL (best-effort).
 * Returns null if the URL doesn't appear to be from this bucket.
 */
export const extractKeyFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    try {
        if (config.s3.publicUrl && url.startsWith(config.s3.publicUrl)) {
            return url.slice(config.s3.publicUrl.replace(/\/$/, '').length + 1);
        }
        const parsed = new URL(url);
        const pathname = parsed.pathname.replace(/^\//, '');
        // path-style: bucket/key/...
        if (pathname.startsWith(`${config.s3.bucket}/`)) {
            return pathname.slice(config.s3.bucket.length + 1);
        }
        // virtual-hosted-style: bucket is part of host
        if (parsed.hostname.startsWith(`${config.s3.bucket}.`)) {
            return pathname;
        }
    } catch {
        return null;
    }
    return null;
};

export const isEnabled = () => config.s3.enabled;

export default { uploadObject, uploadAvatar, deleteObject, extractKeyFromUrl, isEnabled };
