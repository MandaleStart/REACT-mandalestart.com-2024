import { isPostgresConfigured, query } from '../postgres.js';
import { isFirebaseReady } from '../firebase.js';
import { logger } from '../logger.js';
import { setPublicCache } from './responseCache.js';
import { getPublicSiteConfig } from '../publicSiteConfig.js';

export function createHealthController({
    queryFn = query,
    postgresConfigured = isPostgresConfigured,
    firebaseReady = isFirebaseReady,
    log = logger,
} = {}) {
    return async function getHealth(req, res) {
        let databaseReady = false;
        let webhookQueueReady = false;
        let pendingWebhookCount = null;
        let oldestPendingWebhookAgeSeconds = null;

        if (postgresConfigured()) {
            try {
                const result = await queryFn(`
                    SELECT
                      to_regclass('public.client_accounts') IS NOT NULL AS clients_ready,
                      to_regclass('public.catalog_services') IS NOT NULL AS services_ready,
                      to_regclass('public.mercadopago_webhook_events') IS NOT NULL AS webhook_queue_ready
                `);
                databaseReady = result.rows[0]?.clients_ready === true
                    && result.rows[0]?.services_ready === true;
                webhookQueueReady = result.rows[0]?.webhook_queue_ready === true;

                if (webhookQueueReady) {
                    const queue = await queryFn(`
                        SELECT
                          COUNT(*)::integer AS pending_count,
                          COALESCE(
                            FLOOR(EXTRACT(EPOCH FROM (now() - MIN(received_at))))::bigint,
                            0
                          ) AS oldest_pending_age_seconds
                        FROM mercadopago_webhook_events
                        WHERE processed_at IS NULL
                    `);
                    pendingWebhookCount = Number(queue.rows[0]?.pending_count ?? 0);
                    oldestPendingWebhookAgeSeconds = Number(
                        queue.rows[0]?.oldest_pending_age_seconds ?? 0,
                    );
                }
            } catch (error) {
                log.error('PostgreSQL health check failed', {
                    code: error.code || error.name,
                    message: error.message,
                });
            }
        }

        const pendingWebhookAlert = oldestPendingWebhookAgeSeconds > 600;
        res.json({
            ok: true,
            service: 'mandalestart-backend',
            firebaseReady: firebaseReady(),
            databaseConfigured: postgresConfigured(),
            databaseReady,
            webhookQueueReady,
            pendingWebhookCount,
            oldestPendingWebhookAgeSeconds,
            pendingWebhookAlert,
            alerts: pendingWebhookAlert ? ['pending_webhook_over_10_minutes'] : [],
            timestamp: new Date().toISOString(),
        });
    };
}

export const getHealth = createHealthController();

export function getSiteConfig(req, res) {
    const publicSiteConfig = getPublicSiteConfig(process.env);
    setPublicCache(res);
    res.json(publicSiteConfig);
}