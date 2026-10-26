// ===========================================
// Heisenlink - Background File Compression
// ===========================================
//
// Shrinks uploaded form files after they have already been stored, so the
// respondent never waits on it. The compressed result overwrites the same
// object/path (URL stays valid) and is only kept when it is meaningfully
// smaller. Jobs live in memory: a restart just leaves the original file.
//
// - JPEG/PNG/WebP → sharp (downscale to maxImageDimension, re-encode same format)
// - PDF           → Ghostscript (/ebook preset, ~150 dpi images)
// - Others        → skipped (docx/xlsx/zip are already deflate-compressed)

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const execFileAsync = promisify(execFile);

// Keep the result only if it saves at least this fraction of the original.
const MIN_SAVING_RATIO = 0.1;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const queue = [];
let running = 0;
let ghostscriptMissing = false;

const compressImage = async (buffer, mimetype) => {
    const max = config.compression.maxImageDimension;
    const pipeline = sharp(buffer, { failOn: 'error' })
        .rotate() // honor EXIF orientation before metadata is stripped
        .resize(max, max, { fit: 'inside', withoutEnlargement: true });

    if (mimetype === 'image/jpeg') return pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    if (mimetype === 'image/png') return pipeline.png({ compressionLevel: 9, effort: 10 }).toBuffer();
    return pipeline.webp({ quality: 80 }).toBuffer();
};

const compressPdf = async (buffer) => {
    if (ghostscriptMissing) return null;

    const base = path.join(os.tmpdir(), `pdf-${nanoid(10)}`);
    const input = `${base}-in.pdf`;
    const output = `${base}-out.pdf`;
    try {
        await fs.writeFile(input, buffer);
        await execFileAsync('gs', [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.5',
            '-dPDFSETTINGS=/ebook',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            '-dSAFER',
            `-sOutputFile=${output}`,
            input,
        ], { timeout: config.compression.timeoutMs });
        return await fs.readFile(output);
    } catch (error) {
        if (error.code === 'ENOENT' && error.path === 'gs') {
            ghostscriptMissing = true;
            logger.warn('Ghostscript (gs) not installed; PDF compression disabled');
            return null;
        }
        throw error;
    } finally {
        await Promise.all([fs.rm(input, { force: true }), fs.rm(output, { force: true })]);
    }
};

/**
 * Compress a buffer. Returns the smaller buffer, or null when the type is not
 * supported or compression did not save enough.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {Promise<Buffer|null>}
 */
export const compressBuffer = async (buffer, mimetype) => {
    let result = null;
    if (IMAGE_TYPES.has(mimetype)) result = await compressImage(buffer, mimetype);
    else if (mimetype === 'application/pdf') result = await compressPdf(buffer);

    if (!result || result.length > buffer.length * (1 - MIN_SAVING_RATIO)) return null;
    return result;
};

export const isCompressible = (mimetype) => IMAGE_TYPES.has(mimetype) || mimetype === 'application/pdf';

const runNext = () => {
    if (running >= config.compression.concurrency || queue.length === 0) return;
    const job = queue.shift();
    running += 1;

    (async () => {
        const started = Date.now();
        try {
            const compressed = await compressBuffer(job.buffer, job.mimetype);
            if (!compressed) {
                logger.info(`Compression skipped (no gain): ${job.label}`);
                return;
            }
            await job.write(compressed);
            logger.info(
                `Compressed ${job.label}: ${job.buffer.length} -> ${compressed.length} bytes in ${Date.now() - started}ms`
            );
        } catch (error) {
            logger.warn(`Compression failed for ${job.label}: ${error.message}`);
        } finally {
            running -= 1;
            runNext();
        }
    })();
};

/**
 * Queue a stored file for background compression. Never throws and never
 * blocks the caller; drops the job when disabled, unsupported, too small, or
 * the queue is full (bounds memory, since each job holds its buffer).
 * @param {object} params
 * @param {Buffer} params.buffer - Original file contents
 * @param {string} params.mimetype
 * @param {string} params.label - Key/path, for logs
 * @param {(buffer: Buffer) => Promise<void>} params.write - Overwrites the stored file
 */
export const scheduleCompression = ({ buffer, mimetype, label, write }) => {
    const { enabled, minBytes, maxQueue } = config.compression;
    if (!enabled || !isCompressible(mimetype) || buffer.length < minBytes) return;
    if (queue.length >= maxQueue) {
        logger.warn(`Compression queue full, leaving original: ${label}`);
        return;
    }
    queue.push({ buffer, mimetype, label, write });
    runNext();
};

export default { compressBuffer, isCompressible, scheduleCompression };
