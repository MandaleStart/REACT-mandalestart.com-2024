import {
    createClient,
    deleteClient,
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
        const clients = (await listClients()).map((client) => projectClientRecord(client));
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
        const client = await createClient(result.value);
        return res.status(201).json(projectClientRecord(client, result.value.email));
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

    const result = validateClientRecord(req.body);
    if (!result.ok) return res.status(400).json({ message: result.message });

    try {
        const client = await updateClient(req.params.id, result.value);
        if (!client) return res.status(404).json({ message: 'Cliente no encontrado.' });
        return res.json(projectClientRecord(client, result.value.email));
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
        if (!await deleteClient(req.params.id)) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}