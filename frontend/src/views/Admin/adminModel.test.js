import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emptyClient,
  emptyPublicService,
  filterContractedServices,
  filterPublicServices,
  formatDetails,
  getContractedServices,
  isAuthorizationError,
  isSessionError,
  parseDetails,
  projectToForm,
  serviceToForm,
} from './adminModel.js';

test('provides clean, independent defaults for each admin editor', () => {
  assert.deepEqual(emptyClient, {
    id: '',
    name: '',
    email: '',
    phone: '',
    services: [],
    projects: [],
  });
  assert.deepEqual(emptyPublicService.points, []);
  assert.deepEqual(emptyPublicService.includes, []);
});

test('round-trips service details through the client editor representation', () => {
  const details = [
    { label: 'Plan', value: 'Anual' },
    { label: 'Servidor', value: 'Producción' },
  ];

  assert.equal(formatDetails(details), 'Plan: Anual\nServidor: Producción');
  assert.deepEqual(parseDetails(formatDetails(details)), details);
  assert.deepEqual(parseDetails(''), []);
  assert.throws(() => parseDetails('Dato sin etiqueta'), /Etiqueta: valor/);
});

test('normalizes project milestones and identifies expired admin requests', () => {
  assert.deepEqual(projectToForm({ id: 'project-1', milestones: null }), {
    id: 'project-1',
    milestones: [],
  });
  assert.equal(isSessionError({ status: 401 }), true);
  assert.equal(isSessionError({ status: 403 }), false);
  assert.equal(isSessionError({ status: 500 }), false);
  assert.equal(isAuthorizationError({ status: 403 }), true);
  assert.equal(isAuthorizationError({ status: 401 }), false);
});

test('converts a public service into its editable representation', () => {
  assert.deepEqual(
    serviceToForm({
      slug: 'web',
      details: [{ label: 'Tipo', value: 'Landing' }],
    }),
    {
      slug: 'web',
      details: [{ label: 'Tipo', value: 'Landing' }],
      detailsText: 'Tipo: Landing',
    },
  );
});

test('filters public services by searchable fields and visibility status', () => {
  const services = [
    { slug: 'web', title: 'Desarrollo web', category: 'Digital', status: 'active' },
    { slug: 'hosting', title: 'Hosting', category: 'Infraestructura', status: 'active' },
    { slug: 'seo', title: 'SEO', category: 'Digital', status: 'archived' },
  ];

  assert.deepEqual(filterPublicServices(services, 'DIGITAL', 'all'), [services[0], services[2]]);
  assert.deepEqual(filterPublicServices(services, 'host', 'active'), [services[1]]);
  assert.deepEqual(filterPublicServices(services, '', 'archived'), [services[2]]);
});

test('lists and filters contracted services with their client references', () => {
  const clients = [
    {
      id: 'client-1',
      name: 'Ana Pérez',
      email: 'ana@example.com',
      services: [{ id: 'hosting-1', title: 'Hosting', name: 'ana.uy', status: 'Activo' }],
    },
    {
      id: 'client-2',
      name: 'Luis Díaz',
      email: 'luis@example.com',
      services: [{ id: 'domain-1', title: 'Dominio', name: 'luis.uy', status: 'Vencido' }],
    },
  ];
  const contracts = getContractedServices(clients);

  assert.equal(contracts.length, 2);
  assert.equal(contracts[0].clientId, 'client-1');
  assert.deepEqual(filterContractedServices(contracts, 'ana.uy', 'Activo'), [contracts[0]]);
  assert.deepEqual(filterContractedServices(contracts, 'luis@example.com', 'all'), [contracts[1]]);
});
