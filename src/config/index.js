// ===========================================
// LinkHub - Configuration Loader
// ===========================================

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
    // Application
    app: {
        name: process.env.APP_NAME || 'LinkHub',
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT, 10) || 3000,
        url: process.env.APP_URL || 'http://localhost:3000',
        secret: process.env.APP_SECRET || 'change-this-secret',
    },

    // Domain Configuration
    domains: {
        shortlink: process.env.SHORTLINK_DOMAIN || 'http://localhost:3000',
        bio: process.env.BIO_DOMAIN || 'http://localhost:3000/bio',
    },

    // Database
    database: {
        url: process.env.DATABASE_URL,
    },

    // Redis
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'jwt-secret-change-this',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // LDAP
    ldap: {
        enabled: process.env.LDAP_ENABLED === 'true',
        url: process.env.LDAP_URL || 'ldap://localhost:389',
        bindDn: process.env.LDAP_BIND_DN,
        bindPassword: process.env.LDAP_BIND_PASSWORD,
        searchBase: process.env.LDAP_SEARCH_BASE,
        searchFilter: process.env.LDAP_SEARCH_FILTER || '(sAMAccountName={{username}})',
        usernameAttribute: process.env.LDAP_USERNAME_ATTRIBUTE || 'sAMAccountName',
        emailAttribute: process.env.LDAP_EMAIL_ATTRIBUTE || 'mail',
        displayNameAttribute: process.env.LDAP_DISPLAY_NAME_ATTRIBUTE || 'displayName',
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    },

    // File Upload
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
        dir: process.env.UPLOAD_DIR || './public/uploads',
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/app.log',
    },

    // Cache TTL (in seconds)
    cache: {
        shortlinkTTL: 3600, // 1 hour
        bioPageTTL: 300, // 5 minutes
        userTTL: 900, // 15 minutes
        analyticsTTL: 3600, // 1 hour
    },
};

// Validate required configuration
const validateConfig = () => {
    const required = ['database.url'];
    const missing = [];

    for (const key of required) {
        const keys = key.split('.');
        let value = config;
        for (const k of keys) {
            value = value?.[k];
        }
        if (!value) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error(`❌ Missing required configuration: ${missing.join(', ')}`);
        process.exit(1);
    }
};

// Only validate in production
if (config.app.env === 'production') {
    validateConfig();
}

export default config;
