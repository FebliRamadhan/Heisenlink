// ===========================================
// Heisenlink - Auth Validators
// ===========================================

import { z } from 'zod';

/**
 * Login request schema
 */
export const loginSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be at most 50 characters'),
    password: z
        .string()
        .min(1, 'Password is required'),
});

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
    refreshToken: z
        .string()
        .min(1, 'Refresh token is required'),
});

/**
 * Update password request schema
 */
export const updatePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one lowercase, one uppercase, and one number'
        ),
    confirmPassword: z
        .string()
        .min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

/**
 * SSO callback request schema
 */
export const ssoCallbackSchema = z.object({
    code: z
        .string()
        .min(1, 'Authorization code is required'),
    codeVerifier: z
        .string()
        .min(1, 'Code verifier is required'),
});

export default {
    loginSchema,
    refreshTokenSchema,
    updatePasswordSchema,
    ssoCallbackSchema,
};
