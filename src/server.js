// ===========================================
// Heisenlink - Server Entry Point
// ===========================================

import app from './app.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import prisma from './config/database.js';
import { getRedisClient, closeRedis } from './config/redis.js';

const PORT = config.app.port;

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✅ Database connected');

        // Connect to Redis
        const redis = getRedisClient();
        await redis.connect();

        // Start HTTP server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 ${config.app.name} server running on port ${PORT}`);
            logger.info(`📍 Environment: ${config.app.env}`);
            logger.info(`🔗 URL: ${config.app.url}`);
        });

        // Graceful shutdown
        const shutdown = async (signal) => {
            logger.info(`\n${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                logger.info('HTTP server closed');

                // Close database connection
                await prisma.$disconnect();
                logger.info('Database connection closed');

                // Close Redis connection
                await closeRedis();

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
