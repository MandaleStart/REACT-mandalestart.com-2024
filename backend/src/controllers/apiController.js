import { getAuth } from 'firebase-admin/auth';
import { isFirebaseReady, verifyFirebaseToken } from '../firebase.js';
import { firebaseState } from '../firebase.js';
import { isPostgresConfigured, query } from '../postgres.js';
import {
    createClient,
    deleteClient,
    getCatalogService,
    getClientByEmail,
    listCatalogServices,
    listClients,
    saveCatalogService,
    updateClient,
    updateClientProfile,
} from '../portalRepository.js';
import { getCatalogServices, getCatalogServiceBySlug, staticServiceSlugs } from '../serviceCatalogFallback.js';
import { requireFirebaseAdmin, requireVerifiedFirebaseUser } from '../middleware/firebaseAuth.js';
import {
    projectPublicService,
    validateClientProfile,
    validateClientRecord,
    validatePublicService,
} from '../services/adminValidation.js';
import { sendContactMessage, validateContactMessage } from '../services/contactMail.js';
import { getPublicSiteConfig } from '../publicSiteConfig.js';
import { projectClientRecord } from '../services/clientProjection.js';
import { projectAdminUserRecord } from '../services/adminUserProjection.js';
import { logger } from '../logger.js';

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

function setPublicCache(res) {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300');
}

function setPrivateNoStore(res) {
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
}

function parseDate(value) {
    if (typeof value !== 'string' || !value) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

export function buildClientDashboard(clientRecord) {
    const client = clientRecord && typeof clientRecord === 'object' && typeof clientRecord.data === 'function'
        ? clientRecord.data()
        : clientRecord || {};

    const services = Array.isArray(client.services) ? client.services : [];
    const projects = Array.isArray(client.projects) ? client.projects : [];
    const activeServices = services.filter((service) => service && service.status === 'active');
    const milestones = projects.flatMap((project) => (Array.isArray(project.milestones) ? project.milestones : []).map((milestone) => ({
        projectTitle: project.title || 'Proyecto',
        ...milestone,
    }))).filter((milestone) => milestone && milestone.dueDate && milestone.status !== 'completed');
    milestones.sort((a, b) => {
        const left = parseDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const right = parseDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return left - right;
    });

    const alerts = [];
    for (const service of services) {
        const dueDate = parseDate(service.expiry);
        if (!service || !dueDate) continue;
        const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
        if (diffDays <= 30) {
            alerts.push({
                type: 'service-expiry',
                serviceTitle: service.title || service.name || 'Servicio',
                dueDate: service.expiry,
                diffDays,
            });
        }
    }

    return {
        overview: {
            totalServices: services.length,
            activeServices: activeServices.length,
            totalProjects: projects.length,
            upcomingMilestones: milestones.length,
        },
        nextMilestone: milestones[0] ? {
            title: milestones[0].title,
            projectTitle: milestones[0].projectTitle,
            dueDate: milestones[0].dueDate,
            status: milestones[0].status,
        } : null,
        alerts: alerts.slice(0, 5),
        activeServices: activeServices.slice(0, 5),
    };
}

export function buildAdminDashboard(clientRecords) {
    const clients = Array.isArray(clientRecords) ? clientRecords : [];
    const priorities = [];

    for (const client of clients) {
        const record = client && typeof client === 'object' && typeof client.data === 'function' ? client.data() : client || {};
        const services = Array.isArray(record.services) ? record.services : [];
        const projects = Array.isArray(record.projects) ? record.projects : [];

        for (const service of services) {
            const dueDate = parseDate(service.expiry);
            if (!service || !dueDate) continue;
            const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
            if (service.status === 'active' && diffDays <= 30) {
                priorities.push({
                    kind: 'service-expiry',
                    client: record.name || record.email || 'Cliente',
                    title: service.title || service.name || 'Servicio',
                    dueDate: service.expiry,
                    diffDays,
                });
            }
        }

        for (const project of projects) {
            if (!project || !Array.isArray(project.milestones)) continue;
            for (const milestone of project.milestones) {
                if (!milestone || !milestone.dueDate || milestone.status === 'completed') continue;
                const dueDate = parseDate(milestone.dueDate);
                if (!dueDate) continue;
                const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
                if (diffDays <= 30) {
                    priorities.push({
                        kind: 'milestone',
                        client: record.name || record.email || 'Cliente',
                        project: project.title || 'Proyecto',
                        title: milestone.title || 'Hito',
                        dueDate: milestone.dueDate,
                        diffDays,
                    });
                }
            }
        }
    }

    priorities.sort((a, b) => a.diffDays - b.diffDays);

    const allServices = clients.flatMap((client) => {
        const record = client && typeof client === 'object' && typeof client.data === 'function' ? client.data() : client || {};
        return Array.isArray(record.services) ? record.services : [];
    });
    const allProjects = clients.flatMap((client) => {
        const record = client && typeof client === 'object' && typeof client.data === 'function' ? client.data() : client || {};
        return Array.isArray(record.projects) ? record.projects : [];
    });

    return {
        overview: {
            clients: clients.length,
            activeServices: allServices.filter((service) => service && service.status === 'active').length,
            projects: allProjects.length,
            priorityItems: priorities.length,
        },
        priorityItems: priorities.slice(0, 8),
        recentClients: clients.slice(0, 5).map((client) => {
            const record = client && typeof client === 'object' && typeof client.data === 'function' ? client.data() : client || {};
            return {
                id: record.id || client?.id,
                name: record.name || 'Cliente',
                email: record.email || '',
                activeServices: (Array.isArray(record.services) ? record.services : []).filter((service) => service && service.status === 'active').length,
            };
        }),
    };
}

export function getSiteConfig(req, res) {
    const publicSiteConfig = getPublicSiteConfig(process.env);
    setPublicCache(res);
    res.json(publicSiteConfig);
}

export async function listServices(req, res, next) {
    try {
        setPublicCache(res);
        if (isPostgresConfigured()) {
            const records = await listCatalogServices();
            const servicesBySlug = new Map(getCatalogServices().map((service) => [
                service.slug,
                projectPublicService(service.slug, service),
            ]));
            for (const record of records) {
                if (!staticServiceSlugs.has(record.slug)) continue;
                const service = projectPublicService(record.slug, record.data);
                if (service.status === 'archived') servicesBySlug.delete(record.slug);
                else if (service.status === 'active') servicesBySlug.set(record.slug, service);
                else servicesBySlug.delete(record.slug);
            }
            const services = [...servicesBySlug.values()];
            return res.json(services);
        }

        return res.json(getCatalogServices());
    } catch (error) {
        return next(error);
    }
}

export async function getServiceBySlug(req, res, next) {
    try {
        setPublicCache(res);
        if (!staticServiceSlugs.has(req.params.slug)) {
            return res.status(404).json({ message: 'Servicio no encontrado' });
        }

        if (isPostgresConfigured()) {
            const record = await getCatalogService(req.params.slug);
            if (!record) {
                const fallback = getCatalogServiceBySlug(req.params.slug);
                if (!fallback) return res.status(404).json({ message: 'Servicio no encontrado' });
                return res.json(projectPublicService(fallback.slug, fallback));
            }
            const service = projectPublicService(record.slug, record.data);
            if (service.status !== 'active') return res.status(404).json({ message: 'Servicio no encontrado' });
            return res.json(service);
        }

        const service = getCatalogServiceBySlug(req.params.slug);
        if (!service) {
            return res.status(404).json({ message: 'Servicio no encontrado' });
        }
        return res.json(service);
    } catch (error) {
        return next(error);
    }
}

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

export async function listAdminServices(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });

    try {
        const records = await listCatalogServices();
        const servicesBySlug = new Map(getCatalogServices().map((service) => [
            service.slug,
            projectPublicService(service.slug, service),
        ]));
        for (const record of records) {
            if (!staticServiceSlugs.has(record.slug)) continue;
            servicesBySlug.set(record.slug, projectPublicService(record.slug, record.data));
        }
        return res.json([...servicesBySlug.values()]);
    } catch (error) {
        return next(error);
    }
}

export async function updateAdminService(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });
    const result = validatePublicService(req.body, req.params.slug);
    if (!result.ok) return res.status(400).json({ message: result.message });

    try {
        const service = await saveCatalogService(result.value.slug, result.value);
        return res.json(projectPublicService(service.slug, service.data));
    } catch (error) {
        return next(error);
    }
}

export async function deleteAdminService(req, res, next) {
    setPrivateNoStore(res);
    if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });
    if (!staticServiceSlugs.has(req.params.slug)) {
        return res.status(400).json({ message: 'El identificador del servicio no es válido.' });
    }
    try {
        const service = await getCatalogService(req.params.slug);
        if (!service && !getCatalogServiceBySlug(req.params.slug)) {
            return res.status(404).json({ message: 'Servicio no encontrado.' });
        }
        const current = service
            ? projectPublicService(service.slug, service.data)
            : projectPublicService(req.params.slug, getCatalogServiceBySlug(req.params.slug));
        await saveCatalogService(req.params.slug, { ...current, status: 'archived' });
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}

export async function submitContact(req, res, next) {
    const result = validateContactMessage(req.body || {});
    if (!result.ok) {
        return res.status(400).json({ message: result.message });
    }

    if (result.honeypotFilled) {
        return res.status(202).json({ ok: true, message: 'Recibimos tu consulta.' });
    }

    try {
        await sendContactMessage(result.message);
        return res.status(202).json({ ok: true, message: 'Recibimos tu consulta. Gracias por escribir.' });
    } catch (error) {
        return next(error);
    }
}

export function apiLanding(req, res) {
    res.json({
        message: 'API de mandalestart funcionando',
        endpoints: [
            '/api/health',
            '/api/services',
            '/api/services/:slug',
            '/api/clients/me',
            '/api/admin/clients',
            '/api/admin/services',
            '/api/contact',
        ],
    });
}

export function notFound(req, res) {
    res.status(404).json({ message: 'Recurso no encontrado.' });
}

export function apiErrorHandler(error, req, res, next) {
    if (res.headersSent) {
        next(error);
        return;
    }

    logger.error('Error de API', {
        requestId: req.id,
        code: error.code || error.name || 'UnknownError',
        message: error.message,
        url: req.originalUrl,
        method: req.method,
        route: req.route?.path || req.path,
    });
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        res.status(400).json({ message: 'El cuerpo de la solicitud no es JSON válido.' });
        return;
    }

    if (error.code === 'CONTACT_NOT_CONFIGURED') {
        res.status(503).json({ message: 'El envío del formulario no está disponible ahora. Probá escribir por WhatsApp.' });
        return;
    }

    if (error.code === 'DATABASE_NOT_CONFIGURED'
        || error.code?.startsWith('08')
        || ['28P01', '3D000', '42P01', '57P01', 'ECONNREFUSED', 'ENOTFOUND'].includes(error.code)) {
        res.status(503).json({ message: 'La base de datos del portal no está disponible. Revisá su conexión y configuración.' });
        return;
    }

    res.status(500).json({ message: 'Ocurrió un error interno. Intentá nuevamente más tarde.' });
}
