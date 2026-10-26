import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServiceCatalogCache } from './serviceCatalogCache.js';

test('shares an in-flight request and caches the normalized service catalog', async () => {
  let requestCount = 0;
  let resolveRequest;
  const cache = createServiceCatalogCache(() => {
    requestCount += 1;
    return new Promise((resolve) => { resolveRequest = resolve; });
  });

  const firstRequest = cache.load();
  const secondRequest = cache.load();
  assert.equal(requestCount, 1);

  resolveRequest([{ slug: 'web', title: 'Sitios web' }]);
  const [firstCatalog, secondCatalog] = await Promise.all([firstRequest, secondRequest]);

  assert.strictEqual(firstCatalog, secondCatalog);
  assert.strictEqual(cache.getCachedServices(), firstCatalog);
  assert.equal(firstCatalog.find((service) => service.slug === 'web').title, 'Sitios web');
  assert.strictEqual(await cache.load(), firstCatalog);
  assert.equal(requestCount, 1);
});

test('refreshes stale cached data while sharing the revalidation request', async () => {
  let requestCount = 0;
  let resolveRefresh;
  const cache = createServiceCatalogCache(() => {
    requestCount += 1;
    if (requestCount === 1) return Promise.resolve([{ slug: 'web', title: 'Versión inicial' }]);
    return new Promise((resolve) => { resolveRefresh = resolve; });
  });

  await cache.load();
  const firstRefresh = cache.refresh();
  const secondRefresh = cache.refresh();
  assert.equal(requestCount, 2);

  resolveRefresh([{ slug: 'web', title: 'Versión actualizada' }]);
  const [firstCatalog, secondCatalog] = await Promise.all([firstRefresh, secondRefresh]);

  assert.strictEqual(firstCatalog, secondCatalog);
  assert.equal(cache.getCachedServices().find((service) => service.slug === 'web').title, 'Versión actualizada');
});
