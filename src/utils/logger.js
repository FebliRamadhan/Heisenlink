// ===========================================
// LinkHub - Winston Logger Configuration
// ===========================================

import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
    level: config.logging.level,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            ),
        }),
    ],
});

// Add file transport in production
if (config.app.env === 'production') {
    logger.add(
        new winston.transports.File({
            filename: config.logging.file,
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
        })
    );

    logger.add(
        new winston.transports.File({
            filename: config.logging.file.replace('.log', '-error.log'),
            level: 'error',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        })
    );
}

export default logger;
