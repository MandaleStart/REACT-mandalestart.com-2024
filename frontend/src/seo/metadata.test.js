import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBusinessStructuredData, buildMetadata } from './metadata.js';
import { fallbackContact } from '../config/site.js';

const serviceCatalog = [{ slug: 'web', title: 'Desarrollo web', description: 'Sitios web a medida.' }];

test('defaults public pages and known services to noindex when indexability is not enabled', () => {
  const metadata = buildMetadata({});

  assert.equal(metadata.getPageMetadata('/').robots, 'noindex, nofollow');
  assert.equal(metadata.getPageMetadata('/services/web', serviceCatalog).robots, 'noindex, nofollow');
});

test('allows indexing on production when explicitly enabled', () => {
  const metadata = buildMetadata({
    VITE_SITE_URL: 'https://mandalestart.com',
    VITE_INDEXABLE_SITE: 'true',
  });

  assert.equal(metadata.getPageMetadata('/').robots, 'index, follow, max-image-preview:large');
  assert.equal(metadata.getPageMetadata('/services/web', serviceCatalog).robots, 'index, follow, max-image-preview:large');
});

test('keeps staging sites noindex even when indexability is enabled', () => {
  const metadata = buildMetadata({
    VITE_SITE_URL: 'https://dev.mandalestart.com',
    VITE_INDEXABLE_SITE: 'true',
  });

  assert.equal(metadata.getPageMetadata('/').robots, 'noindex, nofollow');
  assert.equal(metadata.getPageMetadata('/services/web', serviceCatalog).robots, 'noindex, nofollow');
});

test('always keeps private and non-public pages out of search indexes', () => {
  for (const env of [
    {},
    { VITE_SITE_URL: 'https://mandalestart.com', VITE_INDEXABLE_SITE: 'true' },
    { VITE_SITE_URL: 'https://dev.mandalestart.com', VITE_INDEXABLE_SITE: 'true' },
  ]) {
    const metadata = buildMetadata(env);
    assert.equal(metadata.getPageMetadata('/admin').robots, 'noindex, nofollow');
    assert.equal(metadata.getPageMetadata('/client-area').robots, 'noindex, nofollow');
    assert.equal(metadata.getPageMetadata('/comments').robots, 'noindex, follow');
    assert.equal(metadata.getPageMetadata('/cv').robots, 'noindex, follow');
  }
});

test('business structured data uses public contact data and omits an unset telephone', () => {
  const fallbackStructuredData = buildBusinessStructuredData(fallbackContact);
  assert.equal(fallbackStructuredData.email, fallbackContact.email);
  assert.equal('telephone' in fallbackStructuredData, false);

  const contact = {
    email: 'contact@example.com',
    phone: { e164: '+59899123456', display: '+598 99 123 456' },
  };
  const configuredStructuredData = buildBusinessStructuredData(contact);
  assert.equal(configuredStructuredData.email, contact.email);
  assert.equal(configuredStructuredData.telephone, contact.phone.e164);
});
