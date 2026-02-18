// ===========================================
// Heisenlink - Redis Client Configuration
// ===========================================

import Redis from 'ioredis';
import config from './index.js';
import logger from '../utils/logger.js';

let redis = null;

/**
 * Get Redis client instance (singleton)
 */
export const getRedisClient = () => {
    if (redis) {
        return redis;
    }

    redis = new Redis(config.redis.url, {
        password: config.redis.password,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        retryDelayOnClusterDown: 100,
        enableReadyCheck: true,
        lazyConnect: true,
    });

    redis.on('connect', () => {
        logger.info('✅ Redis connected');
    });

    redis.on('error', (err) => {
        logger.error('❌ Redis error:', err.message);
    });

    redis.on('close', () => {
        logger.warn('⚠️ Redis connection closed');
    });

    return redis;
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
    if (redis) {
        await redis.quit();
        redis = null;
        logger.info('Redis connection closed');
    }
};

export default getRedisClient;
