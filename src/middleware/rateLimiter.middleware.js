// ===========================================
// Heisenlink - Rate Limiter Middleware
// ===========================================

import { getRedisClient } from '../config/redis.js';
import config from '../config/index.js';
import { errors } from './error.middleware.js';
import logger from '../utils/logger.js';

/**
 * Create rate limiter middleware
 * @param {object} options - Rate limit options
 * @returns {function} - Express middleware
 */
export const createRateLimiter = (options = {}) => {
    const {
        windowMs = config.rateLimit.windowMs,
        max = config.rateLimit.maxRequests,
        keyPrefix = 'rate',
        keyGenerator = (req) => req.ip,
        message = 'Too many requests, please try again later',
    } = options;

    return async (req, res, next) => {
        try {
            const redis = getRedisClient();

            // Generate unique key for this client
            const key = `${keyPrefix}:${keyGenerator(req)}`;

            // Get current count
            const current = await redis.get(key);
            const count = parseInt(current, 10) || 0;

            // Check if limit exceeded
            if (count >= max) {
                const ttl = await redis.ttl(key);
                res.set('Retry-After', Math.ceil(ttl));
                res.set('X-RateLimit-Limit', max);
                res.set('X-RateLimit-Remaining', 0);
                res.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);

                throw errors.tooManyRequests(message);
            }

            // Increment counter
            const newCount = await redis.incr(key);

            // Set expiry on first request
            if (newCount === 1) {
                await redis.pexpire(key, windowMs);
            }

            // Set rate limit headers
            const remaining = Math.max(0, max - newCount);
            const ttl = await redis.pttl(key);

            res.set('X-RateLimit-Limit', max);
            res.set('X-RateLimit-Remaining', remaining);
            res.set('X-RateLimit-Reset', Math.ceil((Date.now() + ttl) / 1000));

            next();
        } catch (error) {
            if (error.statusCode === 429) {
                next(error);
            } else {
                // If Redis fails, allow the request but log the error
                logger.warn('Rate limiter Redis error, allowing request:', error.message);
                next();
            }
        }
    };
};

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
    // General API rate limit
    api: createRateLimiter({
        windowMs: 60000, // 1 minute
        max: 100,
        keyPrefix: 'rate:api',
    }),

    // Strict limit for auth endpoints
    auth: createRateLimiter({
        windowMs: 60000, // 1 minute
        max: 5,
        keyPrefix: 'rate:auth',
        message: 'Too many login attempts, please try again later',
    }),

    // Limit for link creation
    createLink: createRateLimiter({
        windowMs: 60000, // 1 minute
        max: 30,
        keyPrefix: 'rate:create-link',
    }),

    // Limit for redirects (higher limit)
    redirect: createRateLimiter({
        windowMs: 60000, // 1 minute
        max: 200,
        keyPrefix: 'rate:redirect',
    }),
};

export default createRateLimiter;
