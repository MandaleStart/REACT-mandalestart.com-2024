import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { initFirebase, isFirebaseReady } from './firebase.js';
import { isPostgresConfigured, query } from './postgres.js';
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
} from './portalRepository.js';
import { getCatalogServices, getCatalogServiceBySlug, staticServiceSlugs } from './serviceCatalogFallback.js';
import { requireFirebaseAdmin, requireVerifiedFirebaseUser } from './middleware/firebaseAuth.js';
import {
  projectPublicService,
  validateClientProfile,
  validateClientRecord,
  validatePublicService,
} from './services/adminValidation.js';
import { sendContactMessage, validateContactMessage } from './services/contactMail.js';
import { getPublicSiteConfig } from './publicSiteConfig.js';

dotenv.config();
const publicSiteConfig = getPublicSiteConfig(process.env);

const app = express();
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS || [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://dev.mandalestart.com',
    'https://mandalestart.com',
    'https://www.mandalestart.com',
  ].join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const proxyHops = Number(
  process.env.TRUST_PROXY_HOPS || (process.env.NODE_ENV === 'production' ? '1' : '0'),
);

if (!Number.isInteger(proxyHops) || proxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS debe ser un entero mayor o igual a cero.');
}

app.set('trust proxy', proxyHops);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: false,
}));
app.use(express.json({ limit: '20kb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes. Esperá un momento y volvé a intentar.' },
});
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Se alcanzó el límite de consultas. Intentá nuevamente más tarde.' },
});

app.use('/api', apiLimiter);
initFirebase();

function pickString(value) {
  return typeof value === 'string' ? value : '';
}

export function projectClientRecord(client, email) {
  const clientData = typeof client.data === 'function' ? client.data() : client;
  const services = Array.isArray(clientData.services) ? clientData.services : [];
  const clientEmail = email || pickString(clientData.email);

  return {
    id: client.id,
    name: pickString(clientData.name),
    email: clientEmail,
    phone: pickString(clientData.phone),
    services: services.map((service, index) => ({
      id: pickString(service.id) || `${pickString(service.type) || 'service'}-${index}`,
      type: pickString(service.type),
      title: pickString(service.title),
      name: pickString(service.name),
      cost: pickString(service.cost),
      expiry: pickString(service.expiry),
      status: pickString(service.status),
      details: Array.isArray(service.details)
        ? service.details
          .filter((detail) => detail && typeof detail === 'object')
          .map((detail) => ({
            label: pickString(detail.label),
            value: pickString(detail.value),
          }))
        : [],
    })),
    projects: Array.isArray(clientData.projects)
      ? clientData.projects.filter((project) => project && typeof project === 'object').slice(0, 50).map((project, projectIndex) => ({
        id: pickString(project.id) || `project-${projectIndex}`,
        title: pickString(project.title),
        description: pickString(project.description),
        status: pickString(project.status),
        startDate: pickString(project.startDate),
        targetDate: pickString(project.targetDate),
        milestones: Array.isArray(project.milestones)
          ? project.milestones.filter((milestone) => milestone && typeof milestone === 'object').slice(0, 50).map((milestone, milestoneIndex) => ({
            id: pickString(milestone.id) || `milestone-${projectIndex}-${milestoneIndex}`,
            title: pickString(milestone.title),
            description: pickString(milestone.description),
            status: pickString(milestone.status),
            dueDate: pickString(milestone.dueDate),
          }))
          : [],
      }))
      : [],
  };
}

app.get('/api/health', async (req, res) => {
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
      console.error('PostgreSQL health check failed:', error.code || error.name);
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
});

app.get('/api/site-config', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300');
  res.json(publicSiteConfig);
});

app.get('/api/services', async (req, res, next) => {
  try {
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
});

app.get('/api/services/:slug', async (req, res, next) => {
  try {
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
});

app.get('/api/clients/me', requireVerifiedFirebaseUser, async (req, res, next) => {
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
});

app.put('/api/clients/me/profile', requireVerifiedFirebaseUser, async (req, res, next) => {
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
});

app.get('/api/admin/clients', requireFirebaseAdmin, async (req, res, next) => {
  if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });

  try {
    const clients = (await listClients()).map((client) => projectClientRecord(client));
    return res.json(clients);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/clients', requireFirebaseAdmin, async (req, res, next) => {
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
});

app.put('/api/admin/clients/:id', requireFirebaseAdmin, async (req, res, next) => {
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
});

app.delete('/api/admin/clients/:id', requireFirebaseAdmin, async (req, res, next) => {
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
});

app.get('/api/admin/services', requireFirebaseAdmin, async (req, res, next) => {
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
});

app.put('/api/admin/services/:slug', requireFirebaseAdmin, async (req, res, next) => {
  if (!isPostgresConfigured()) return res.status(503).json({ message: 'PostgreSQL no está configurado.' });
  const result = validatePublicService(req.body, req.params.slug);
  if (!result.ok) return res.status(400).json({ message: result.message });

  try {
    const service = await saveCatalogService(result.value.slug, result.value);
    return res.json(projectPublicService(service.slug, service.data));
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/services/:slug', requireFirebaseAdmin, async (req, res, next) => {
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
});

app.post('/api/contact', contactLimiter, async (req, res, next) => {
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
});

app.get('/', (req, res) => {
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
});

app.use((req, res) => {
  res.status(404).json({ message: 'Recurso no encontrado.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  console.error('Error de API:', error.code || error.name || 'UnknownError');
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
});

export default app;
