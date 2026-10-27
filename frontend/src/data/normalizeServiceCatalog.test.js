import assert from 'node:assert/strict';
import { test } from 'node:test';
import normalizeServiceCatalog from './normalizeServiceCatalog.js';

test('fills static detail copy when the backend omits service details', () => {
  const [service] = normalizeServiceCatalog([
    {
      slug: 'web',
      title: 'Servicio web',
      points: ['Punto del backend'],
      includes: ['Incluido del backend'],
    },
  ]);

  assert.equal(service.title, 'Servicio web');
  assert.deepEqual(service.points, ['Punto del backend']);
  assert.deepEqual(service.includes, ['Incluido del backend']);
  assert.ok(Array.isArray(service.details));
  assert.ok(service.details.length > 0);
});

test('normalizes missing list fields and ignores invalid catalog entries', () => {
  const [service] = normalizeServiceCatalog([
    null,
    { slug: 'web', points: null, includes: undefined, details: null },
  ]);

  assert.ok(Array.isArray(service.points));
  assert.ok(Array.isArray(service.includes));
  assert.ok(Array.isArray(service.details));
});
