// ===========================================
// LinkHub - LDAP Configuration
// ===========================================

import ldap from 'ldapjs';
import config from './index.js';
import logger from '../utils/logger.js';

/**
 * Create LDAP client
 * @returns {object} - LDAP client instance
 */
export const createLdapClient = () => {
    if (!config.ldap.enabled) {
        return null;
    }

    const client = ldap.createClient({
        url: config.ldap.url,
        timeout: 5000,
        connectTimeout: 10000,
        reconnect: true,
    });

    client.on('error', (err) => {
        logger.error('LDAP client error:', err.message);
    });

    client.on('connect', () => {
        logger.info('LDAP client connected');
    });

    return client;
};

/**
 * Get LDAP configuration
 */
export const getLdapConfig = () => ({
    enabled: config.ldap.enabled,
    url: config.ldap.url,
    bindDn: config.ldap.bindDn,
    bindPassword: config.ldap.bindPassword,
    searchBase: config.ldap.searchBase,
    searchFilter: config.ldap.searchFilter,
    usernameAttribute: config.ldap.usernameAttribute,
    emailAttribute: config.ldap.emailAttribute,
    displayNameAttribute: config.ldap.displayNameAttribute,
});

export default {
    createLdapClient,
    getLdapConfig,
};
