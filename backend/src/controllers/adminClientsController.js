import {
    createClient,
    archiveClient,
    listClients,
    updateClient,
} from '../portalRepository.js';
import { isPostgresConfigured } from '../postgres.js';
import { validateClientRecord } from '../services/adminValidation.js';
import { projectClientRecord } from '../services/clientProjection.js';
import { setPrivateNoStore } from './responseCache.js';

export async function listAdminClients(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });

    try {
        const clients = (await listClients()).map((client) => ({
            ...projectClientRecord(client),
            updated_at: client.updated_at,
        }));
        return res.json(clients);
    } catch (error) {
        return next(error);
    }
}

export async function createAdminClient(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });
    const result = validateClientRecord(req.body);
    if (!result.ok) return res.status(400).json({ message: result.message });

    try {
        const client = await createClient(result.value, { uid: req.auth.uid, email: req.auth.email });
        return res.status(201).json({
            ...projectClientRecord(client, result.value.email),
            updated_at: client.updated_at,
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Ya existe un cliente con ese email.' });
        }
        return next(error);
    }
}

export async function updateAdminClient(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });
    if (!/^[^/]{1,150}$/.test(req.params.id) || req.params.id === '.' || req.params.id === '..') {
        return res.status(400).json({ message: 'El identificador del cliente no es válido.' });
    }

    const ifMatch = req.get('if-match');
    if (!ifMatch) {
        return res.status(428).json({ message: 'Enviá If-Match con la versión updated_at actual.' });
    }
    const updatedAt = ifMatch.startsWith('"') && ifMatch.endsWith('"')
        ? ifMatch.slice(1, -1)
        : ifMatch;
    if (ifMatch.startsWith('W/') || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(updatedAt)) {
        return res.status(400).json({ message: 'El encabezado If-Match no contiene un updated_at válido.' });
    }

    const result = validateClientRecord(req.body);
    if (!result.ok) return res.status(400).json({ message: result.message });

    try {
        const outcome = await updateClient(
            req.params.id,
            result.value,
            updatedAt,
            { uid: req.auth.uid, email: req.auth.email },
        );
        if (outcome.status === 'not-found') return res.status(404).json({ message: 'Cliente no encontrado.' });
        if (outcome.status === 'conflict') {
            return res.status(409).json({ message: 'El cliente cambió desde que lo cargaste. Actualizá la vista y volvé a intentar.' });
        }
        return res.json({
            ...projectClientRecord(outcome.record, result.value.email),
            updated_at: outcome.record.updated_at,
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Ya existe otro cliente con ese email.' });
        }
        return next(error);
    }
}

export async function deleteAdminClient(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });
    if (!/^[^/]{1,150}$/.test(req.params.id) || req.params.id === '.' || req.params.id === '..') {
        return res.status(400).json({ message: 'El identificador del cliente no es válido.' });
    }

    try {
        const result = await archiveClient(req.params.id, { uid: req.auth.uid, email: req.auth.email });
        if (result.status === 'not-found') {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        if (result.status === 'has-invoices') {
            return res.status(409).json({ message: 'No podés archivar un cliente con facturas registradas.' });
        }
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}