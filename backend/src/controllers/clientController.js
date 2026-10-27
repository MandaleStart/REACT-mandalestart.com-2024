import {
    getClientByEmail,
    updateClientProfile,
} from '../portalRepository.js';
import { isPostgresConfigured } from '../postgres.js';
import { validateClientProfile } from '../services/adminValidation.js';
import { projectClientRecord } from '../services/clientProjection.js';
import { buildClientDashboard } from '../services/dashboardMetrics.js';
import { setPrivateNoStore } from './responseCache.js';

export async function getClientDashboard(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) {
        return res.status(503).json({ message: 'La base de datos del área de clientes no está configurada.' });
    }

    try {
        const client = await getClientByEmail(req.auth.email);
        if (!client) {
            return res.status(404).json({ message: 'No encontramos servicios asociados a esta cuenta.' });
        }

        return res.json(buildClientDashboard(projectClientRecord(client, req.auth.email)));
    } catch (error) {
        return next(error);
    }
}

export async function getCurrentClient(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) {
        return res.status(503).json({ message: 'La base de datos del área de clientes no está configurada.' });
    }

    try {
        const client = await getClientByEmail(req.auth.email);
        if (!client) {
            return res.status(404).json({ message: 'No encontramos servicios asociados a esta cuenta.' });
        }

        return res.json(projectClientRecord(client, req.auth.email));
    } catch (error) {
        return next(error);
    }
}

export async function updateCurrentClientProfile(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) {
        return res.status(503).json({ message: 'La base de datos del área de clientes no está configurada.' });
    }
    const result = validateClientProfile(req.body);
    if (!result.ok) return res.status(400).json({ message: result.message });

    try {
        const existingClient = await getClientByEmail(req.auth.email);
        if (!existingClient) {
            return res.status(404).json({ message: 'No encontramos una ficha asociada a este correo. Contactanos para solicitar acceso.' });
        }

        const client = await updateClientProfile(existingClient.id, result.value);
        if (!client) {
            return res.status(404).json({ message: 'No encontramos una ficha asociada a este correo. Contactanos para solicitar acceso.' });
        }
        return res.json(projectClientRecord(client, req.auth.email));
    } catch (error) {
        return next(error);
    }
}