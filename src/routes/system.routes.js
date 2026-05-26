// ===========================================
// Heisenlink - System Info Route
// ===========================================
//
// Read-only flags so the dashboard can render accurate status
// (e.g. show a callout when S3 isn't configured and avatar uploads
// will fail at the boundary). Authed but not admin — every
// signed-in user can hit this.

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import config from '../config/index.js';
import { formatResponse } from '../utils/helpers.js';

const router = Router();

router.get('/info', authenticate, (req, res) => {
    res.json(
        formatResponse({
            s3: { enabled: Boolean(config.s3.enabled) },
            sso: { enabled: Boolean(config.sso.enabled) },
            ldap: { enabled: Boolean(config.ldap.enabled) },
            revalidate: { enabled: Boolean(config.revalidate.url && config.revalidate.secret) },
        }),
    );
});

export default router;
