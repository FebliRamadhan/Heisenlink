// ===========================================
// LinkHub - Validation Middleware
// ===========================================

import { errors } from './error.middleware.js';

/**
 * Create validation middleware from Zod schema
 * @param {object} schema - Zod schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {function} - Express middleware
 */
export const validate = (schema, source = 'body') => {
    return async (req, res, next) => {
        try {
            const data = req[source];
            const validated = await schema.parseAsync(data);

            // Replace with validated data
            req[source] = validated;

            next();
        } catch (error) {
            if (error.name === 'ZodError') {
                const details = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                next(errors.validation(details));
            } else {
                next(error);
            }
        }
    };
};

/**
 * Validate request body
 */
export const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = (schema) => validate(schema, 'params');

export default {
    validate,
    validateBody,
    validateQuery,
    validateParams,
};
