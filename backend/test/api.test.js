import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.FIREBASE_SERVICE_ACCOUNT_PATH = '';
process.env.FIREBASE_SERVICE_ACCOUNT = '';
process.env.GOOGLE_APPLICATION_CREDENTIALS = '';
process.env.FIREBASE_PROJECT_ID = '';
process.env.FIREBASE_DATABASE_URL = '';
process.env.DATABASE_URL = '';

const [{ default: app, projectClientRecord }, { hasAdminClaim }] = await Promise.all([
  import('../src/app.js'),
  import('../src/middleware/firebaseAuth.js'),
]);
import {
  projectPublicService,
  validateClientProfile,
  validateClientProjects,
  validateClientRecord,
  validatePublicService,
} from '../src/services/adminValidation.js';
import { projectAdminUserRecord } from '../src/services/adminUserProjection.js';
import {
  apiErrorHandler,
  buildAdminDashboard,
  buildClientDashboard,
} from '../src/controllers/apiController.js';
import { validateContactMessage } from '../src/services/contactMail.js';
import { logger } from '../src/logger.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('client projection accepts PostgreSQL rows and omits private fields', () => {
  const projected = projectClientRecord({
    id: 'client-1',
    name: 'Cliente',
    email: 'client@example.com',
    phone: '+598 99 123 456',
    privateNotes: 'internal',
    margin: 90,
    services: [{
      type: 'domain',
      name: 'example.com',
      cost: '$100',
      internalCost: '$5',
      details: [
        { label: 'DNS', value: 'active', hidden: 'private' },
      ],
    }],
    projects: [{
      id: 'project-1',
      title: 'Sitio web',
      description: 'Rediseño',
      status: 'in-progress',
      startDate: '2026-01-01',
      targetDate: '2026-02-01',
      internalBudget: 400,
      milestones: [{
        id: 'milestone-1',
        title: 'Diseño',
        description: 'Primera entrega',
        status: 'completed',
        dueDate: '2026-01-15',
        privateNotes: 'internal',
      }],
    }],
  }, 'client@example.com');

  assert.deepEqual(projected, {
    id: 'client-1',
    name: 'Cliente',
    email: 'client@example.com',
    phone: '+598 99 123 456',
    services: [{
      id: 'domain-0',
      type: 'domain',
      title: '',
      name: 'example.com',
      cost: '$100',
      expiry: '',
      status: '',
      details: [{ label: 'DNS', value: 'active' }],
    }],
    projects: [{
      id: 'project-1',
      title: 'Sitio web',
      description: 'Rediseño',
      status: 'in-progress',
      startDate: '2026-01-01',
      targetDate: '2026-02-01',
      milestones: [{
        id: 'milestone-1',
        title: 'Diseño',
        description: 'Primera entrega',
        status: 'completed',
        dueDate: '2026-01-15',
      }],
    }],
  });
});

test('contact payload validation rejects invalid input and recognizes honeypot spam', () => {
  assert.equal(validateContactMessage({}).ok, false);

  const valid = {
    name: 'Ana',
    email: 'ana@example.com',
    service: 'web',
    message: 'Necesito una web.',
  };
  assert.equal(validateContactMessage(valid).ok, true);
  assert.equal(validateContactMessage({ ...valid, website: 'spam' }).honeypotFilled, true);
});

test('logger emits structured entries with timestamp, level and message', () => {
  const entry = logger.info('healthcheck', { ok: true });

  assert.equal(entry.level, 'info');
  assert.equal(entry.message, 'healthcheck');
  assert.equal(entry.meta.ok, true);
  assert.ok(entry.timestamp);
});

test('unknown routes expose a request id in the response headers', async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);

  assert.equal(response.status, 404);
  assert.ok(response.headers.get('x-request-id'));
});

test('admin records are whitelisted and validate nested client services', () => {
  const client = validateClientRecord({
    name: 'Cliente',
    email: 'CLIENT@example.com',
    phone: '+598 99 123 456',
    notes: 'private',
    services: [{
      type: 'domain',
      title: 'Dominio',
      name: 'example.com',
      internalMargin: 50,
      details: [{ label: 'DNS', value: 'active', hidden: 'internal' }],
    }],
    projects: [{
      title: 'Proyecto web',
      description: 'Proyecto de prueba',
      status: 'planned',
      startDate: '2026-01-01',
      targetDate: '2026-02-01',
      internalBudget: 500,
      milestones: [{
        title: 'Diseño',
        status: 'pending',
        dueDate: '2026-01-15',
        privateNotes: 'hidden',
      }],
    }],
  });
  assert.equal(client.ok, true);
  assert.equal(client.value.email, 'client@example.com');
  assert.equal('notes' in client.value, false);
  assert.equal('internalMargin' in client.value.services[0], false);
  assert.equal('hidden' in client.value.services[0].details[0], false);
  assert.equal('internalBudget' in client.value.projects[0], false);
  assert.equal('privateNotes' in client.value.projects[0].milestones[0], false);
  assert.equal(validateClientRecord({ name: 'Cliente', email: 'bad', services: [] }).ok, false);
  assert.equal(validateClientRecord({
    name: 'Cliente',
    email: 'client@example.com',
    services: [{ type: 'domain', title: 'Dominio', name: 'example.com', expiry: '2026-02-30' }],
  }).ok, false);
  const profile = validateClientProfile({ name: 'Cliente', email: 'other@example.com', phone: '12345' });
  assert.deepEqual(profile.value, { name: 'Cliente', phone: '12345' });
  assert.equal(validateClientProfile({ name: 'Cliente', phone: 'phone' }).ok, false);
  assert.equal(validateClientProjects([{
    title: 'Proyecto web',
    status: 'in-progress',
    startDate: '2026-01-01',
    targetDate: '2026-02-01',
    milestones: [{ title: 'Diseño', status: 'pending', dueDate: '2026-01-15' }],
  }]).ok, true);
  assert.equal(validateClientProjects([{
    title: 'Proyecto',
    status: 'unknown',
  }]).ok, false);
  assert.equal(validateClientProjects([{
    title: 'Proyecto',
    status: 'planned',
    milestones: [{ title: 'Hito', status: 'pending', dueDate: '2026-02-30' }],
  }]).ok, false);
  assert.equal(validateClientProjects([{
    title: 'Proyecto',
    status: 'planned',
    startDate: '2026-02-01',
    targetDate: '2026-01-01',
  }]).ok, false);
});

test('admin service validation enforces slugs and public data projection removes private fields', () => {
  assert.equal(validatePublicService({
    slug: 'service/invalid',
    title: 'Servicio',
    category: 'Web',
    description: 'Descripción',
  }).ok, false);

  const service = validatePublicService({
    slug: 'web',
    title: 'Servicio',
    category: 'Web',
    description: 'Descripción',
    price: 'A medida',
    internalCost: 45,
  });
  assert.equal(service.ok, true);
  assert.equal('internalCost' in service.value, false);
  assert.equal('secret' in projectPublicService('web', { ...service.value, secret: true }), false);
  assert.equal(validatePublicService({
    slug: 'web',
    title: 'Servicio',
    category: 'Web',
    description: 'Descripción',
    status: 'hidden',
  }).ok, false);
});

test('admin claim must be explicitly true', () => {
  assert.equal(hasAdminClaim({ admin: true }), true);
  assert.equal(hasAdminClaim({ admin: 'true' }), false);
  assert.equal(hasAdminClaim({ role: 'admin' }), false);
});

test('admin user projection exposes account status and only an email-linked client reference', () => {
  const projection = projectAdminUserRecord({
    uid: 'user-1',
    email: 'CLIENT@example.com',
    displayName: 'Cliente',
    emailVerified: true,
    disabled: false,
    customClaims: { admin: true, internal: 'secret' },
    passwordHash: 'secret',
  }, new Map([
    ['client@example.com', { id: 'client-1', name: 'Cliente vinculado', phone: 'secret' }],
  ]));

  assert.deepEqual(projection, {
    uid: 'user-1',
    email: 'CLIENT@example.com',
    displayName: 'Cliente',
    emailVerified: true,
    disabled: false,
    isAdmin: true,
    clientId: 'client-1',
    clientName: 'Cliente vinculado',
  });
  assert.equal('passwordHash' in projection, false);
});

test('removed mock authentication endpoints are not available', async () => {
  const endpoints = [
    { path: '/api/auth/register', method: 'POST' },
    { path: '/api/auth/email', method: 'POST' },
    { path: '/api/auth/google', method: 'POST' },
    { path: '/api/auth/me', method: 'GET' },
  ];
  for (const { path, method } of endpoints) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    assert.equal(response.status, 404, path);
  }
});

test('admin routes do not expose records without Firebase authentication', async () => {
  for (const path of ['/api/admin/clients', '/api/admin/users']) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal('error' in body, false);
  }
});

test('public catalog fallback contains only statically routable service slugs', async () => {
  const response = await fetch(`${baseUrl}/api/services`);
  assert.equal(response.status, 200);
  const services = await response.json();
  assert.equal(services.length, 8);
  assert.equal(new Set(services.map((service) => service.slug)).size, services.length);

  const unknownService = await fetch(`${baseUrl}/api/services/new-service`);
  assert.equal(unknownService.status, 404);
});

test('client endpoint never serves records without Firebase authentication', async () => {
  const response = await fetch(`${baseUrl}/api/clients/me`);
  assert.notEqual(response.status, 200);
  const body = await response.json();
  assert.equal(typeof body.message, 'string');
  assert.equal('error' in body, false);
});

test('client profile writes remain protected by Firebase authentication', async () => {
  const response = await fetch(`${baseUrl}/api/clients/me/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Attacker', phone: '+598 99 123 456' }),
  });
  assert.notEqual(response.status, 200);
  const body = await response.json();
  assert.equal('error' in body, false);
});

test('unknown API routes return a not-found response instead of a success-shaped fallback', async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: 'Recurso no encontrado.' });
});

test('CORS only grants configured frontend origins', async () => {
  const allowed = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://mandalestart.com' },
  });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://mandalestart.com');

  const rejected = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://attacker.invalid' },
  });
  assert.equal(rejected.headers.get('access-control-allow-origin'), null);
});

test('health reports when PostgreSQL is not configured', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.databaseConfigured, false);
  assert.equal(health.databaseReady, false);
});

test('production hardening strips framework fingerprints and sets safe response headers', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
});

test('public catalog and service detail routes use a short cache window for CDN reuse', async () => {
  const listResponse = await fetch(`${baseUrl}/api/services`);
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=300');

  const detailResponse = await fetch(`${baseUrl}/api/services/web`);
  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=300');
});

test('private client and admin routes explicitly disable caching to avoid leaking sensitive data', async () => {
  const clientResponse = await fetch(`${baseUrl}/api/clients/me`);
  assert.match(clientResponse.headers.get('cache-control') || '', /no-store/i);

  const adminResponse = await fetch(`${baseUrl}/api/admin/clients`);
  assert.match(adminResponse.headers.get('cache-control') || '', /no-store/i);
});

test('public site config exposes only the configured contact fields and a short cache window', async () => {
  const response = await fetch(`${baseUrl}/api/site-config`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=300');

  const config = await response.json();
  assert.deepEqual(Object.keys(config).sort(), ['email', 'phone', 'whatsapp']);
  assert.match(config.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  if (config.phone) {
    assert.match(config.phone.e164, /^\+[1-9]\d{7,14}$/);
    assert.equal(config.whatsapp, config.phone.e164.slice(1));
  } else {
    assert.equal(config.whatsapp, null);
  }
});

test('API error logs include the request id for faster incident tracing', () => {
  const originalConsoleError = console.error;
  const entries = [];
  console.error = (...args) => { entries.push(args[0]); };

  try {
    const req = {
      id: 'req-trace-123',
      method: 'POST',
      originalUrl: '/api/admin/clients',
      route: { path: '/admin/clients' },
    };
    const res = {
      headersSent: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };

    apiErrorHandler(new Error('database failure'), req, res, () => { });

    assert.equal(entries.length, 1);
    const logged = JSON.parse(entries[0]);
    assert.equal(logged.message, 'Error de API');
    assert.equal(logged.meta.requestId, 'req-trace-123');
    assert.equal(logged.meta.method, 'POST');
    assert.equal(logged.meta.url, '/api/admin/clients');
  } finally {
    console.error = originalConsoleError;
  }
});

test('client and admin dashboard summaries surface key operational signals', () => {
  const client = {
    id: 'client-1',
    name: 'Cliente Demo',
    email: 'demo@example.com',
    phone: '+59899123456',
    services: [
      { id: 'service-1', type: 'web', title: 'Sitio web', name: 'demo.com', status: 'active', expiry: '2026-12-01' },
      { id: 'service-2', type: 'hosting', title: 'Hosting', name: 'demo.com', status: 'active', expiry: '2026-11-15' },
      { id: 'service-3', type: 'seo', title: 'SEO', name: 'demo.com', status: 'archived', expiry: '2026-03-01' },
    ],
    projects: [{
      id: 'project-1',
      title: 'Rediseño',
      status: 'in-progress',
      milestones: [
        { id: 'm-1', title: 'Brief', status: 'completed', dueDate: '2026-09-01' },
        { id: 'm-2', title: 'Entrega', status: 'pending', dueDate: '2026-10-20' },
      ],
    }],
  };

  const clientDashboard = buildClientDashboard(client);
  assert.equal(clientDashboard.overview.totalServices, 3);
  assert.equal(clientDashboard.overview.activeServices, 2);
  assert.equal(clientDashboard.nextMilestone.title, 'Entrega');
  assert.equal(clientDashboard.nextMilestone.projectTitle, 'Rediseño');

  const adminDashboard = buildAdminDashboard([
    client,
    {
      id: 'client-2',
      name: 'Cliente Dos',
      email: 'dos@example.com',
      phone: '+59899123457',
      services: [{ id: 'service-4', type: 'email', title: 'Correo', name: 'dos.com', status: 'active', expiry: '2026-10-28' }],
      projects: [{
        id: 'project-2',
        title: 'Migración',
        status: 'planned',
        milestones: [{ id: 'm-3', title: 'Planificación', status: 'pending', dueDate: '2026-10-28' }],
      }],
    },
  ]);

  assert.equal(adminDashboard.overview.clients, 2);
  assert.equal(adminDashboard.overview.activeServices, 3);
  assert.equal(adminDashboard.overview.projects, 2);
  assert.equal(adminDashboard.priorityItems.length >= 2, true);
});
