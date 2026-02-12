// ===========================================
// LinkHub - LDAP Service
// ===========================================

import ldap from 'ldapjs';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Authenticate user via LDAP
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<object|null>} - User attributes or null if failed
 */
export const authenticateLdap = async (username, password) => {
    if (!config.ldap.enabled) {
        logger.warn('LDAP is disabled, skipping LDAP authentication');
        return null;
    }

    logger.info(`[LDAP] Attempting auth for user: ${username}`);
    logger.info(`[LDAP] URL: ${config.ldap.url}`);
    logger.info(`[LDAP] Bind DN: ${config.ldap.bindDn}`);
    logger.info(`[LDAP] Search Base: ${config.ldap.searchBase}`);
    logger.info(`[LDAP] Search Filter: ${config.ldap.searchFilter}`);

    return new Promise((resolve, reject) => {
        const client = ldap.createClient({
            url: config.ldap.url,
            timeout: 5000,
            connectTimeout: 10000,
        });

        client.on('error', (err) => {
            logger.error('[LDAP] Connection error:', err.message);
            resolve(null);
        });

        // First, bind with service account to search for user
        client.bind(config.ldap.bindDn, config.ldap.bindPassword, (bindErr) => {
            if (bindErr) {
                logger.error(`[LDAP] Service bind FAILED - code: ${bindErr.code}, name: ${bindErr.name}, message: ${bindErr.message}`);
                logger.error(`[LDAP] Full error:`, JSON.stringify(bindErr, Object.getOwnPropertyNames(bindErr)));
                client.destroy();
                resolve(null);
                return;
            }

            logger.info('[LDAP] Service bind OK, searching for user...');

            // Search for user
            const searchFilter = config.ldap.searchFilter.replace('{{username}}', username);
            const searchOptions = {
                filter: searchFilter,
                scope: 'sub',
                attributes: [
                    config.ldap.usernameAttribute,
                    config.ldap.emailAttribute,
                    config.ldap.displayNameAttribute,
                    'dn',
                ],
            };

            client.search(config.ldap.searchBase, searchOptions, (searchErr, searchRes) => {
                if (searchErr) {
                    logger.error('LDAP search failed:', searchErr.message);
                    client.destroy();
                    resolve(null);
                    return;
                }

                let userEntry = null;

                searchRes.on('searchEntry', (entry) => {
                    userEntry = {
                        dn: entry.dn.toString(),
                        username: entry.attributes.find(
                            (a) => a.type === config.ldap.usernameAttribute
                        )?.values[0],
                        email: entry.attributes.find(
                            (a) => a.type === config.ldap.emailAttribute
                        )?.values[0],
                        displayName: entry.attributes.find(
                            (a) => a.type === config.ldap.displayNameAttribute
                        )?.values[0],
                    };
                });

                searchRes.on('error', (err) => {
                    logger.error('LDAP search result error:', err.message);
                    client.destroy();
                    resolve(null);
                });

                searchRes.on('end', (result) => {
                    if (!userEntry) {
                        logger.warn(`LDAP user not found: ${username}`);
                        client.destroy();
                        resolve(null);
                        return;
                    }

                    // Verify user's password by binding with their DN
                    const userClient = ldap.createClient({
                        url: config.ldap.url,
                        timeout: 5000,
                        connectTimeout: 10000,
                    });

                    userClient.bind(userEntry.dn, password, (userBindErr) => {
                        userClient.destroy();
                        client.destroy();

                        if (userBindErr) {
                            logger.warn(`LDAP auth failed for user: ${username}`);
                            resolve(null);
                            return;
                        }

                        logger.info(`LDAP auth successful for user: ${username}`);
                        resolve(userEntry);
                    });
                });
            });
        });
    });
};

/**
 * Search LDAP users
 * @param {string} searchTerm - Search term
 * @returns {Promise<array>} - Array of users
 */
export const searchLdapUsers = async (searchTerm) => {
    if (!config.ldap.enabled) {
        return [];
    }

    return new Promise((resolve) => {
        const client = ldap.createClient({
            url: config.ldap.url,
            timeout: 5000,
            connectTimeout: 10000,
        });

        client.on('error', () => resolve([]));

        client.bind(config.ldap.bindDn, config.ldap.bindPassword, (bindErr) => {
            if (bindErr) {
                client.destroy();
                resolve([]);
                return;
            }

            const searchOptions = {
                filter: `(|(${config.ldap.usernameAttribute}=*${searchTerm}*)(${config.ldap.displayNameAttribute}=*${searchTerm}*))`,
                scope: 'sub',
                sizeLimit: 20,
                attributes: [
                    config.ldap.usernameAttribute,
                    config.ldap.emailAttribute,
                    config.ldap.displayNameAttribute,
                ],
            };

            const users = [];

            client.search(config.ldap.searchBase, searchOptions, (searchErr, searchRes) => {
                if (searchErr) {
                    client.destroy();
                    resolve([]);
                    return;
                }

                searchRes.on('searchEntry', (entry) => {
                    users.push({
                        username: entry.attributes.find(
                            (a) => a.type === config.ldap.usernameAttribute
                        )?.values[0],
                        email: entry.attributes.find(
                            (a) => a.type === config.ldap.emailAttribute
                        )?.values[0],
                        displayName: entry.attributes.find(
                            (a) => a.type === config.ldap.displayNameAttribute
                        )?.values[0],
                    });
                });

                searchRes.on('end', () => {
                    client.destroy();
                    resolve(users);
                });

                searchRes.on('error', () => {
                    client.destroy();
                    resolve(users);
                });
            });
        });
    });
};

export default {
    authenticateLdap,
    searchLdapUsers,
};
