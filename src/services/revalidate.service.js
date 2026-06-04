// ===========================================
// Heisenlink - Next.js ISR Revalidation
// ===========================================
//
// Express posts to a Next.js Route Handler so Next can drop its fetch-cache
// entry for a given bio slug as soon as we mutate it. Without this, public
// pages stay stale up to `revalidate: 60` seconds.

import config from '../config/index.js';
import logger from '../utils/logger.js';

const isEnabled = () => Boolean(config.revalidate.url && config.revalidate.secret);

/**
 * Fire-and-forget revalidation request to Next.js.
 * Failures are logged at warn level — they do not block the originating
 * mutation, since stale-for-up-to-60s is acceptable degradation.
 *
 * @param {{tag?: string, path?: string}} payload
 */
export const revalidate = async (payload) => {
    if (!isEnabled()) return;
    if (!payload?.tag && !payload?.path) return;

    try {
        const res = await fetch(`${config.revalidate.url}/internal/revalidate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-revalidate-secret': config.revalidate.secret,
            },
            body: JSON.stringify(payload),
            // Keep this snappy — never let it hang a user mutation.
            signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) {
            logger.warn(`Revalidate ${JSON.stringify(payload)} returned ${res.status}`);
        }
    } catch (error) {
        logger.warn(`Revalidate failed for ${JSON.stringify(payload)}: ${error.message}`);
    }
};

export const revalidateBioTag = (slug) => {
    if (!slug) return;
    return revalidate({ tag: `bio:${slug}` });
};

export const revalidateFormTag = (slug) => {
    if (!slug) return;
    return revalidate({ tag: `form:${slug}` });
};

export default { revalidate, revalidateBioTag, revalidateFormTag };
