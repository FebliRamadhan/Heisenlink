// ===========================================
// Heisenlink - Prisma Database Client
// ===========================================

import { PrismaClient } from '@prisma/client';
import config from './index.js';

// Prevent multiple instances in development
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: config.app.env === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
});

if (config.app.env !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
