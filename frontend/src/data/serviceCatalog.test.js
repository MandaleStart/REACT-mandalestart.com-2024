import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCatalogServices } from '../../../backend/src/serviceCatalogFallback.js';
import { serviceCatalog } from './serviceCatalog.js';

test('keeps the frontend catalog aligned with the backend fallback copy', () => {
  const fallbackBySlug = new Map(getCatalogServices().map((service) => [service.slug, service]));
  assert.equal(serviceCatalog.length, fallbackBySlug.size);

  for (const service of serviceCatalog) {
    const fallback = fallbackBySlug.get(service.slug);
    assert.ok(fallback, `Missing backend fallback for ${service.slug}`);
    for (const field of ['description', 'summary', 'outcome', 'price']) {
      assert.equal(fallback[field], service[field], `${field} differs for ${service.slug}`);
    }
    assert.deepEqual(fallback.includes, service.includes, `Includes differ for ${service.slug}`);
    assert.equal(service.price, 'Presupuesto a medida');
  }
});

test('does not advertise monitoring work as domotics or promise SEO positions', () => {
  const monitoring = serviceCatalog.find((service) => service.slug === 'monitoring');
  const seo = serviceCatalog.find((service) => service.slug === 'seo');
  assert.equal(monitoring.points.includes('Domótica y automatización'), false);
  assert.match(seo.outcome, /No se garantizan posiciones/);
});
