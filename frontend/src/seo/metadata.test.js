import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBusinessStructuredData, buildMetadata } from './metadata.js';
import { buildPageStructuredData } from './structuredData.js';
import { fallbackContact } from '../config/site.js';

const serviceCatalog = [
  { slug: 'web', title: 'Desarrollo web', description: 'Sitios web a medida.' },
];

test('defaults public pages and known services to noindex when indexability is not enabled', () => {
  const metadata = buildMetadata({});

  assert.equal(metadata.getPageMetadata('/').robots, 'noindex, nofollow');
  assert.equal(
    metadata.getPageMetadata('/services/web', serviceCatalog).robots,
    'noindex, nofollow',
  );
});

test('allows indexing on production when explicitly enabled', () => {
  const metadata = buildMetadata({
    VITE_SITE_URL: 'https://mandalestart.com',
    VITE_INDEXABLE_SITE: 'true',
  });

  assert.equal(metadata.getPageMetadata('/').robots, 'index, follow, max-image-preview:large');
  assert.equal(
    metadata.getPageMetadata('/services/web', serviceCatalog).robots,
    'index, follow, max-image-preview:large',
  );
});

test('keeps staging sites noindex when VITE_INDEXABLE_SITE is disabled', () => {
  const metadata = buildMetadata({
    VITE_SITE_URL: 'https://dev.mandalestart.com',
    VITE_INDEXABLE_SITE: 'false',
  });

  assert.equal(metadata.getPageMetadata('/').robots, 'noindex, nofollow');
  assert.equal(
    metadata.getPageMetadata('/services/web', serviceCatalog).robots,
    'noindex, nofollow',
  );
});

test('uses the explicit indexability setting instead of inferring from the hostname', () => {
  const metadata = buildMetadata({
    VITE_SITE_URL: 'https://preview.example.test',
    VITE_INDEXABLE_SITE: 'true',
  });

  assert.equal(metadata.getPageMetadata('/').robots, 'index, follow, max-image-preview:large');
  assert.equal(metadata.getRobots('index, follow'), 'index, follow');
  assert.equal(metadata.getRobots('noindex, follow'), 'noindex, follow');

  const stagingMetadata = buildMetadata({
    VITE_SITE_URL: 'https://dev.mandalestart.com',
    VITE_INDEXABLE_SITE: 'false',
  });
  assert.equal(stagingMetadata.getRobots('index, follow'), 'noindex, nofollow');
});

test('does not map the legacy files route to the about page metadata', () => {
  const metadata = buildMetadata({});
  assert.equal(metadata.getPageMetadata('/files').title, 'Página no encontrada | MandaleStart');
  assert.equal(metadata.getPageMetadata('/files').path, '/files');
});

test('keeps public page titles and descriptions within search snippet lengths', () => {
  const metadata = buildMetadata({ VITE_INDEXABLE_SITE: 'true' });
  for (const page of Object.values(metadata.staticPages)) {
    assert.ok(page.title.length <= 60, `Title is too long: ${page.title}`);
    assert.ok(page.description.length <= 155, `Description is too long: ${page.description}`);
  }
  const servicePage = metadata.getPageMetadata('/services/web', serviceCatalog);
  assert.ok(servicePage.title.length <= 60, `Title is too long: ${servicePage.title}`);
  assert.ok(
    servicePage.description.length <= 155,
    `Description is too long: ${servicePage.description}`,
  );
});

test('always keeps private and non-public pages out of search indexes', () => {
  for (const env of [
    {},
    { VITE_SITE_URL: 'https://mandalestart.com', VITE_INDEXABLE_SITE: 'true' },
    { VITE_SITE_URL: 'https://dev.mandalestart.com', VITE_INDEXABLE_SITE: 'false' },
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

test('adds visible homepage FAQs to FAQPage structured data', () => {
  const entities = buildPageStructuredData({
    pagePath: '/',
    siteUrl: 'https://mandalestart.com',
    businessData: buildBusinessStructuredData(fallbackContact),
    serviceCatalog,
  });
  const faq = entities.find((entity) => entity['@type'] === 'FAQPage');

  assert.ok(faq);
  assert.equal(faq.mainEntity.length, 6);
  assert.ok(faq.mainEntity.every((item) => item.acceptedAnswer.text));
});

test('adds Service and BreadcrumbList structured data for a known service', () => {
  const entities = buildPageStructuredData({
    pagePath: '/services/web',
    siteUrl: 'https://mandalestart.com',
    businessData: buildBusinessStructuredData(fallbackContact),
    serviceCatalog,
  });
  const service = entities.find((entity) => entity['@type'] === 'Service');
  const breadcrumbs = entities.find((entity) => entity['@type'] === 'BreadcrumbList');

  assert.equal(service.name, 'Desarrollo web');
  assert.equal(service.provider['@id'], 'https://mandalestart.com/#business');
  assert.equal(service.areaServed.name, 'Uruguay');
  assert.equal(breadcrumbs.itemListElement.length, 3);
  assert.equal(breadcrumbs.itemListElement[2].item, 'https://mandalestart.com/services/web');
});

test('adds Person structured data to the about page', () => {
  const entities = buildPageStructuredData({
    pagePath: '/aboutme',
    siteUrl: 'https://mandalestart.com',
    businessData: buildBusinessStructuredData(fallbackContact),
    serviceCatalog,
  });
  const person = entities.find((entity) => entity['@type'] === 'Person');

  assert.equal(person.name, 'Nicolás Jorge');
  assert.equal(person.worksFor['@id'], 'https://mandalestart.com/#business');
});
