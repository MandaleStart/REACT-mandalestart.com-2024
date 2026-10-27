export function createSeoFiles({ siteUrl, isIndexable, routes, getPageMetadata, serviceCatalog }) {
  if (!isIndexable) {
    return {
      robots: [
        'User-agent: Yoast-SEO-Checker',
        'Allow: /',
        '',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n'),
      sitemap: null,
    };
  }

  const sitemapRoutes = routes.filter(
    (route) => !getPageMetadata(route, serviceCatalog).robots?.startsWith('noindex'),
  );
  const sitemapEntries = sitemapRoutes.map((route) => {
    const page = getPageMetadata(route, serviceCatalog);
    return `  <url><loc>${siteUrl}${page.path}</loc></url>`;
  });
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries,
    '</urlset>',
    '',
  ].join('\n');
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /client-area',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  return { robots, sitemap };
}
