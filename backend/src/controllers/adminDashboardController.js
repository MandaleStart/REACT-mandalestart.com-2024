import { listClients } from '../portalRepository.js';
import {
    countPendingUnappliedMercadoPagoPayments,
    getMercadoPagoWebhookBacklogSummary,
    listDashboardSubscriptions,
} from '../billingRepository.js';
import { isPostgresConfigured } from '../postgres.js';
import { projectClientRecord } from '../services/clientProjection.js';
import { buildAdminDashboard } from '../services/dashboardMetrics.js';
import { logger } from '../logger.js';
import { setPrivateNoStore } from './responseCache.js';

export async function getAdminDashboard(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });

    try {
        const clients = (await listClients()).map((client) => projectClientRecord(client));
        const subscriptions = await listDashboardSubscriptions();
        const unappliedPayments = await countPendingUnappliedMercadoPagoPayments();
        const webhookBacklog = await getMercadoPagoWebhookBacklogSummary();
        if (!unappliedPayments.available) {
            logger.warn('admin_dashboard_billing_migration_pending', {
                migration: '004_unapplied_mercadopago_payments.sql',
            });
        }
        return res.json({
            ...buildAdminDashboard(clients, { subscriptions }),
            pending_unapplied_payments: unappliedPayments.count,
            unapplied_payments_ready: unappliedPayments.available,
            webhook_backlog: webhookBacklog,
        });
    } catch (error) {
        return next(error);
    }
}