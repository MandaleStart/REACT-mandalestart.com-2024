import { isPostgresConfigured, query } from '../postgres.js';
import { isFirebaseReady } from '../firebase.js';
import { logger } from '../logger.js';
import { setPublicCache } from './responseCache.js';
import { getPublicSiteConfig } from '../publicSiteConfig.js';

export function getHealth(req, res) {
    return (async () => {
        let databaseReady = false;
        if (isPostgresConfigured()) {
            try {
                const result = await query(`
          SELECT
            to_regclass('public.client_accounts') IS NOT NULL AS clients_ready,
            to_regclass('public.catalog_services') IS NOT NULL AS services_ready
        `);
                databaseReady = result.rows[0]?.clients_ready === true
                    && result.rows[0]?.services_ready === true;
            } catch (error) {
                logger.error('PostgreSQL health check failed', {
                    code: error.code || error.name,
                    message: error.message,
                });
            }
        }

        res.json({
            ok: true,
            service: 'mandalestart-backend',
            firebaseReady: isFirebaseReady(),
            databaseConfigured: isPostgresConfigured(),
            databaseReady,
            timestamp: new Date().toISOString(),
        });
    })();
}

export function getSiteConfig(req, res) {
    const publicSiteConfig = getPublicSiteConfig(process.env);
    setPublicCache(res);
    res.json(publicSiteConfig);
}