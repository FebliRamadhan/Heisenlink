// ===========================================
// LinkHub - Error Handling Middleware
// ===========================================

import logger from '../utils/logger.js';
import { formatError } from '../utils/helpers.js';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Common error factory functions
 */
export const errors = {
    badRequest: (message = 'Bad request', details = null) =>
        new ApiError(message, 400, 'BAD_REQUEST', details),

    unauthorized: (message = 'Unauthorized') =>
        new ApiError(message, 401, 'UNAUTHORIZED'),

    forbidden: (message = 'Forbidden') =>
        new ApiError(message, 403, 'FORBIDDEN'),

    notFound: (message = 'Resource not found') =>
        new ApiError(message, 404, 'NOT_FOUND'),

    conflict: (message = 'Resource already exists') =>
        new ApiError(message, 409, 'CONFLICT'),

    validation: (details) =>
        new ApiError('Validation failed', 422, 'VALIDATION_ERROR', details),

    tooManyRequests: (message = 'Too many requests') =>
        new ApiError(message, 429, 'TOO_MANY_REQUESTS'),

    internal: (message = 'Internal server error') =>
        new ApiError(message, 500, 'INTERNAL_ERROR'),
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
    next(errors.notFound(`Route ${req.method} ${req.path} not found`));
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    // Default error values
    let statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNAL_ERROR';
    let message = err.message || 'Internal server error';
    let details = err.details || null;

    // Handle Prisma errors
    if (err.code === 'P2002') {
        statusCode = 409;
        code = 'CONFLICT';
        message = 'A record with this value already exists';
    } else if (err.code === 'P2025') {
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'Record not found';
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token expired';
    }

    // Handle validation errors (Zod)
    if (err.name === 'ZodError') {
        statusCode = 422;
        code = 'VALIDATION_ERROR';
        message = 'Validation failed';
        details = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
    }

    // Log error
    if (statusCode >= 500) {
        logger.error(`${code}: ${message}`, {
            stack: err.stack,
            path: req.path,
            method: req.method,
        });
    } else {
        logger.warn(`${code}: ${message}`, {
            path: req.path,
            method: req.method
        });
    }

    // Send error response
    res.status(statusCode).json(formatError(message, code, details));
};

export default {
    ApiError,
    errors,
    notFoundHandler,
    errorHandler,
};
