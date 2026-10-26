import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPageHeadMetadata } from './pageHeadMetadata.js';

test('builds shared page metadata for runtime and prerender use', () => {
  const pageHead = getPageHeadMetadata({
    page: {
      title: 'Desarrollo web | MandaleStart',
      description: 'Sitios web para negocios.',
      path: '/services/web',
    },
    siteUrl: 'https://example.test',
    socialImage: 'https://example.test/img/og-cover.png',
    robots: 'noindex, nofollow',
    siteName: 'MandaleStart',
    areaServed: 'Uruguay',
  });

  assert.equal(pageHead.title, 'Desarrollo web | MandaleStart');
  assert.equal(pageHead.robots, 'noindex, nofollow');
  assert.equal(pageHead.canonicalUrl, 'https://example.test/services/web');
  assert.deepEqual(pageHead.meta.find(({ key }) => key === 'og:url'), {
    attribute: 'property',
    key: 'og:url',
    content: 'https://example.test/services/web',
  });
  assert.equal(pageHead.meta.find(({ key }) => key === 'og:image:alt').content,
    'MandaleStart: desarrollo web y soporte técnico en Uruguay');
});
