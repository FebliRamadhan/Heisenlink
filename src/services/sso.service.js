// ===========================================
// Heisenlink - SSO Service (SADA SSO OAuth2)
// ===========================================

import prisma from '../config/database.js';
import config from '../config/index.js';
import { generateTokens } from './auth.service.js';
import { errors } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

/**
 * Exchange authorization code for tokens with SADA SSO
 * @param {string} code - Authorization code from SSO callback
 * @param {string} codeVerifier - PKCE code verifier
 * @returns {Promise<object>} - SSO token set
 */
export const exchangeCode = async (code, codeVerifier) => {
    const { tokenUrl, clientId, clientSecret, redirectUri } = config.sso;

    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        logger.error('SSO token exchange failed:', err);
        throw errors.unauthorized(err?.error_description || 'SSO token exchange failed');
    }

    return res.json();
};

/**
 * Fetch user info from SADA SSO
 * @param {string} accessToken - SSO access token
 * @returns {Promise<object>} - User info
 */
export const fetchUserInfo = async (accessToken) => {
    const res = await fetch(config.sso.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
        logger.error('SSO userinfo fetch failed:', res.status);
        throw errors.unauthorized('Failed to fetch user info from SSO');
    }

    return res.json();
};

/**
 * Find or create local user from SSO user info
 * @param {object} ssoUser - User info from SSO { sub, name, email, preferred_username }
 * @returns {Promise<object>} - Local user record
 */
const upsertUserFromSSO = async (ssoUser) => {
    const { sub, name, email, preferred_username } = ssoUser;
    const username = preferred_username || email?.split('@')[0] || sub;

    // Try to find by SSO provider ID first
    let user = await prisma.user.findFirst({
        where: {
            ssoProvider: 'sada',
            ssoProviderId: sub,
        },
    });

    if (user) {
        // Update existing SSO user
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                displayName: name || user.displayName,
                email: email || user.email,
                lastLoginAt: new Date(),
            },
        });
        return user;
    }

    // Try to find by email (link existing account)
    if (email) {
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    ssoProvider: 'sada',
                    ssoProviderId: sub,
                    displayName: name || user.displayName,
                    lastLoginAt: new Date(),
                },
            });
            return user;
        }
    }

    // Try to find by username (link existing account)
    user = await prisma.user.findUnique({ where: { username } });
    if (user) {
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                ssoProvider: 'sada',
                ssoProviderId: sub,
                email: email || user.email,
                displayName: name || user.displayName,
                lastLoginAt: new Date(),
            },
        });
        return user;
    }

    // Create new user
    user = await prisma.user.create({
        data: {
            username,
            email: email || `${username}@sso.local`,
            displayName: name || username,
            ssoProvider: 'sada',
            ssoProviderId: sub,
            isActive: true,
            role: 'USER',
            lastLoginAt: new Date(),
        },
    });

    logger.info(`Auto-created local user from SSO: ${username}`);
    return user;
};

/**
 * Handle SSO callback - exchange code, fetch user, issue local tokens
 * @param {string} code - Authorization code
 * @param {string} codeVerifier - PKCE code verifier
 * @param {object} context - Request context (ipAddress, userAgent)
 * @returns {Promise<object>} - { user, accessToken, refreshToken }
 */
export const handleCallback = async (code, codeVerifier, context = {}) => {
    // 1. Exchange code for SSO tokens
    const ssoTokens = await exchangeCode(code, codeVerifier);

    // 2. Fetch user info from SSO
    const ssoUser = await fetchUserInfo(ssoTokens.access_token);

    // 3. Find or create local user
    const user = await upsertUserFromSSO(ssoUser);

    // 4. Check if user is active
    if (!user.isActive) {
        throw errors.forbidden('Your account has been deactivated');
    }

    // 5. Audit log
    try {
        await prisma.auditLog.create({
            data: {
                user: { connect: { id: user.id } },
                action: 'user.login.sso',
                entityType: 'USER',
                entityId: user.id,
                ipAddress: context.ipAddress || 'unknown',
                newValues: context.userAgent ? { userAgent: context.userAgent, provider: 'sada' } : undefined,
            },
        });
    } catch (logError) {
        logger.error('Failed to create SSO login audit log', logError);
    }

    // 6. Generate local JWT tokens
    const tokens = generateTokens(user);

    const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
    };

    return { user: userData, ...tokens };
};

export default { exchangeCode, fetchUserInfo, handleCallback };
