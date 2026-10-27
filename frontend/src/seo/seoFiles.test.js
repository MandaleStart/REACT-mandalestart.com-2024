import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeoFiles } from './seoFiles.js';

const routes = ['/', '/admin', '/client-area', '/services/web'];
const serviceCatalog = [{ slug: 'web', title: 'Desarrollo web', description: 'Sitios a medida.' }];
const getPageMetadata = (path) => ({
  path,
  robots: ['/admin', '/client-area'].includes(path) ? 'noindex, nofollow' : 'index, follow',
});

test('creates a closed robots file and no sitemap for non-indexable sites', () => {
  const files = createSeoFiles({
    siteUrl: 'https://dev.mandalestart.com',
    isIndexable: false,
    routes,
    getPageMetadata,
    serviceCatalog,
  });

  assert.equal(
    files.robots,
    [
      'User-agent: Yoast-SEO-Checker',
      'Allow: /',
      '',
      'User-agent: *',
      'Disallow: /',
      '',
    ].join('\n'),
  );
  assert.equal(files.sitemap, null);
});

test('creates an open robots file and sitemap containing only indexable routes', () => {
  const files = createSeoFiles({
    siteUrl: 'https://mandalestart.com',
    isIndexable: true,
    routes,
    getPageMetadata,
    serviceCatalog,
  });

  assert.equal(
    files.robots,
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /client-area',
      'Sitemap: https://mandalestart.com/sitemap.xml',
      '',
    ].join('\n'),
  );
  assert.ok(files.sitemap.includes('<loc>https://mandalestart.com/</loc>'));
  assert.ok(files.sitemap.includes('<loc>https://mandalestart.com/services/web</loc>'));
  assert.ok(!files.sitemap.includes('<lastmod>'));
  assert.ok(!files.sitemap.includes('/admin'));
  assert.ok(!files.sitemap.includes('/client-area'));
});
