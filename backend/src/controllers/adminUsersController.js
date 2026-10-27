import { getAuth } from 'firebase-admin/auth';
import { firebaseState, isFirebaseReady } from '../firebase.js';
import { isPostgresConfigured } from '../postgres.js';
import { listClients } from '../portalRepository.js';
import { projectAdminUserRecord } from '../services/adminUserProjection.js';
import { setPrivateNoStore } from './responseCache.js';

export async function listAdminUsers(req, res, next) {
    setPrivateNoStore(res);
    if (!isFirebaseReady() || !firebaseState.app) {
        return res.status(503).json({ message: 'Firebase Authentication no está disponible.' });
    }

    try {
        const clients = isPostgresConfigured() ? await listClients() : [];
        const clientsByEmail = new Map(
            clients
                .filter((client) => typeof client.email === 'string')
                .map((client) => [client.email.trim().toLocaleLowerCase(), client]),
        );
        const auth = getAuth(firebaseState.app);
        const users = [];
        let pageToken;

        do {
            const page = await auth.listUsers(1000, pageToken);
            users.push(...page.users);
            pageToken = page.pageToken;
        } while (pageToken);

        return res.json(users.map((user) => projectAdminUserRecord(user, clientsByEmail)));
    } catch (error) {
        return next(error);
    }
}

export async function updateAdminUserStatus(req, res, next) {
    setPrivateNoStore(res);
    if (!isFirebaseReady() || !firebaseState.app) {
        return res.status(503).json({ message: 'Firebase Authentication no está disponible.' });
    }
    const { uid } = req.params;
    if (!/^[^/]{1,128}$/.test(uid) || uid === '.' || uid === '..') {
        return res.status(400).json({ message: 'El identificador del usuario no es válido.' });
    }
    if (typeof req.body?.disabled !== 'boolean') {
        return res.status(400).json({ message: 'Indicá si la cuenta debe quedar desactivada.' });
    }
    if (req.body.disabled && req.auth?.uid === uid) {
        return res.status(400).json({ message: 'No podés desactivar tu propia cuenta administrativa.' });
    }

    try {
        const auth = getAuth(firebaseState.app);
        const user = await auth.updateUser(uid, { disabled: req.body.disabled });
        if (req.body.disabled) await auth.revokeRefreshTokens(uid);
        return res.json(projectAdminUserRecord(user));
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        return next(error);
    }
}