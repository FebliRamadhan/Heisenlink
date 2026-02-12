// ===========================================
// LinkHub - Auth Service
// ===========================================

import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import config from '../config/index.js';
import { authenticateLdap } from './ldap.service.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { errors } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

/**
 * Generate JWT tokens
 * @param {object} user - User object
 * @returns {object} - Access and refresh tokens
 */
export const generateTokens = (user) => {
    const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(
        { sub: user.id, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        throw errors.unauthorized('Invalid or expired token');
    }
};

/**
 * Login user with LDAP or local credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {object} context - Request context (ipAddress, userAgent)
 * @returns {Promise<object>} - User and tokens
 */
export const login = async (username, password, context = {}) => {
    let user = null;
    let ldapUser = null;

    username = username.includes('@') ? username.split('@')[0] : username;

    // Try LDAP authentication first (if enabled)
    try {
        ldapUser = await authenticateLdap(username, password);
        if (ldapUser) {
            logger.info(`User ${username} authenticated via LDAP`);

            // Find or create local user from LDAP
            user = await prisma.user.findUnique({ where: { username } });

            if (user) {
                // Update existing user with LDAP data
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        email: ldapUser.email || user.email,
                        displayName: ldapUser.displayName || user.displayName,
                        ldapDn: ldapUser.dn || user.ldapDn,
                        lastLoginAt: new Date(),
                    },
                });
            } else {
                // Auto-create local user from LDAP
                user = await prisma.user.create({
                    data: {
                        username: ldapUser.username || username,
                        email: ldapUser.email || `${username}@ldap.local`,
                        displayName: ldapUser.displayName || username,
                        ldapDn: ldapUser.dn,
                        isActive: true,
                        role: 'USER',
                        lastLoginAt: new Date(),
                    },
                });
                logger.info(`Auto-created local user from LDAP: ${username}`);
            }
        }
    } catch (ldapErr) {
        logger.error(`LDAP login failed for ${username}:`, ldapErr);
        logger.error(`Error details: ${JSON.stringify(ldapErr, Object.getOwnPropertyNames(ldapErr))}`);
        // Fall through to local authentication
    }

    // Fallback to local authentication
    if (!user) {
        user = await prisma.user.findUnique({ where: { username } });

        if (!user) throw errors.unauthorized('Invalid credentials');
        if (!user.passwordHash) throw errors.unauthorized('Please use LDAP login or reset your password');

        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) throw errors.unauthorized('Invalid credentials');

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        logger.info(`User ${username} authenticated via local credentials`);
    }

    // Check if user is active
    if (!user.isActive) throw errors.forbidden('Your account has been deactivated');

    // Create Audit Log
    try {
        await prisma.auditLog.create({
            data: {
                user: { connect: { id: user.id } },
                action: 'user.login',
                entityType: 'USER',
                entityId: user.id,
                ipAddress: context.ipAddress || 'unknown',
                newValues: context.userAgent ? { userAgent: context.userAgent } : undefined,
            }
        });
        logger.info(`Login audit log created for user: ${user.id}`);
    } catch (logError) {
        logger.error('Failed to create login audit log', logError);
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Return user data (without sensitive fields)
    const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
    };

    return {
        user: userData,
        ...tokens,
    };
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<object>} - New tokens
 */
export const refreshAccessToken = async (refreshToken) => {
    try {
        const payload = jwt.verify(refreshToken, config.jwt.secret);

        if (payload.type !== 'refresh') {
            throw errors.unauthorized('Invalid refresh token');
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user || !user.isActive) {
            throw errors.unauthorized('User not found or inactive');
        }

        return generateTokens(user);
    } catch (error) {
        if (error.statusCode) throw error;
        throw errors.unauthorized('Invalid or expired refresh token');
    }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} - User data
 */
export const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
        },
    });

    if (!user) {
        throw errors.notFound('User not found');
    }

    return user;
};

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
export const updatePassword = async (userId, currentPassword, newPassword) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw errors.notFound('User not found');
    }

    // If user has a password, verify current password
    if (user.passwordHash) {
        const isValid = await comparePassword(currentPassword, user.passwordHash);
        if (!isValid) {
            throw errors.badRequest('Current password is incorrect');
        }
    }

    // Hash and save new password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
    });

    logger.info(`Password updated for user: ${user.username}`);
};

export default {
    generateTokens,
    verifyToken,
    login,
    refreshAccessToken,
    getUserById,
    updatePassword,
};
