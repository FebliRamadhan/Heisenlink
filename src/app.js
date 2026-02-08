// ===========================================
// LinkHub - Express Application Setup
// ===========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import config from './config/index.js';
import logger from './utils/logger.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { rateLimiters } from './middleware/rateLimiter.middleware.js';

// Import routes
import routes from './routes/index.js';

const app = express();

// ===========================================
// Security Middleware
// ===========================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ===========================================
// CORS Configuration
// ===========================================
app.use(cors({
    origin: config.app.env === 'production'
        ? [config.app.url, config.domains.bio]
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ===========================================
// Compression
// ===========================================
app.use(compression());

// ===========================================
// Body Parsing
// ===========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================================
// Request Logging
// ===========================================
if (config.app.env !== 'test') {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }));
}

// ===========================================
// Static Files
// ===========================================
app.use('/uploads', express.static('public/uploads'));

// ===========================================
// Health Check Endpoints
// ===========================================

// Prevent 401 on favicon requests which triggers logout
app.get(['/favicon.ico', '/api/**/favicon.ico'], (req, res) => res.status(204).end());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
    try {
        // Check database connection
        const { default: prisma } = await import('./config/database.js');
        await prisma.$queryRaw`SELECT 1`;

        // Check Redis connection
        const { getRedisClient } = await import('./config/redis.js');
        const redis = getRedisClient();
        await redis.ping();

        res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            services: {
                database: 'ok',
                redis: 'ok',
            },
        });
    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            error: error.message,
        });
    }
});

// ===========================================
// API Rate Limiting
// ===========================================
app.use('/api', rateLimiters.api);

// ===========================================
// API Routes
// ===========================================
app.use(routes);

// ===========================================
// Error Handling
// ===========================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
