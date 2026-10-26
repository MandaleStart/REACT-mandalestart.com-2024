import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emptyClient,
  emptyPublicService,
  formatDetails,
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
  assert.equal(isSessionError({ status: 403 }), true);
  assert.equal(isSessionError({ status: 500 }), false);
});

test('converts a public service into its editable representation', () => {
  assert.deepEqual(serviceToForm({
    slug: 'web',
    details: [{ label: 'Tipo', value: 'Landing' }],
  }), {
    slug: 'web',
    details: [{ label: 'Tipo', value: 'Landing' }],
    detailsText: 'Tipo: Landing',
  });
});
