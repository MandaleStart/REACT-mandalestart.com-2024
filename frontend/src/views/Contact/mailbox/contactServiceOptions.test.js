import assert from 'node:assert/strict';
import { test } from 'node:test';
import serviceCatalog from '../../../data/serviceCatalog.js';
import { getContactServiceOptions } from './contactServiceOptions.js';

test('uses service titles from the catalog while preserving contact API values', () => {
  const options = getContactServiceOptions([
    { slug: 'web', title: 'Sitios y tiendas' },
    ...serviceCatalog.filter((service) => service.slug !== 'web'),
  ]);

  assert.deepEqual(options, [
    { value: 'web', label: 'Sitios y tiendas' },
    { value: 'hosting', label: 'Hosting web' },
    { value: 'correo', label: 'Correo corporativo' },
    { value: 'seo', label: 'SEO y posicionamiento' },
    { value: 'ddns', label: 'DDNS y acceso remoto' },
    { value: 'red', label: 'Monitoreo de infraestructura' },
    { value: 'impresion', label: 'Diseño e impresión 3D' },
    { value: 'otro', label: 'Otro' },
  ]);
});

test('falls back to the established contact options when catalog entries are unavailable', () => {
  const options = getContactServiceOptions([]);

  assert.equal(options.length, 8);
  assert.deepEqual(options.map(({ value }) => value), [
    'web', 'hosting', 'correo', 'seo', 'ddns', 'red', 'impresion', 'otro',
  ]);
  assert.equal(options[1].label, 'Hosting y dominios');
});
