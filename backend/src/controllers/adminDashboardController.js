import { listClients } from '../portalRepository.js';
import { isPostgresConfigured } from '../postgres.js';
import { projectClientRecord } from '../services/clientProjection.js';
import { buildAdminDashboard } from '../services/dashboardMetrics.js';
import { setPrivateNoStore } from './responseCache.js';

export async function getAdminDashboard(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });

    try {
        const clients = (await listClients()).map((client) => projectClientRecord(client));
        return res.json(buildAdminDashboard(clients));
    } catch (error) {
        return next(error);
    }
}