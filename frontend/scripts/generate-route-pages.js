import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, loadEnv } from 'vite';
import fallbackServiceCatalog from '../src/data/serviceCatalog.js';
import normalizeServiceCatalog from '../src/data/normalizeServiceCatalog.js';
import { createSeoFiles } from '../src/seo/seoFiles.js';
import { getPageHeadMetadata } from '../src/seo/pageHeadMetadata.js';
import { SITE, fallbackContact, normalizeContactConfig } from '../src/config/site.js';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectDirectory, 'dist');
const template = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

async function loadPublicContactConfig() {
  const env = loadEnv('production', projectDirectory, 'VITE_');
  const apiBaseUrl = (process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || 'http://localhost:4000')
    .replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${apiBaseUrl}/api/site-config`, { signal: controller.signal });
    if (!response.ok) throw new Error(`La API respondió con estado ${response.status}.`);
    return normalizeContactConfig(await response.json());
  } catch (error) {
    console.warn(
      `No se pudo cargar /api/site-config durante el build; se usará el contacto de respaldo (${error.message}).`,
    );
    return fallbackContact;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadPublicServiceCatalog() {
  const env = loadEnv('production', projectDirectory, 'VITE_');
  const apiBaseUrl = (process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || 'http://localhost:4000')
    .replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${apiBaseUrl}/api/services`, { signal: controller.signal });
    if (!response.ok) throw new Error(`La API respondió con estado ${response.status}.`);
    const services = await response.json();
    if (!Array.isArray(services)) throw new Error('El catálogo recibido no tiene un formato válido.');
    return normalizeServiceCatalog(services);
  } catch (error) {
    console.warn(
      `No se pudo cargar /api/services durante el build; se usará el catálogo estático (${error.message}).`,
    );
    return fallbackServiceCatalog;
  } finally {
    clearTimeout(timeout);
  }
}

try {
  const [siteConfig, serviceCatalog] = await Promise.all([
    loadPublicContactConfig(),
    loadPublicServiceCatalog(),
  ]);
  const [renderer, metadata] = await Promise.all([
    vite.ssrLoadModule('/src/renderStaticPage.js'),
    vite.ssrLoadModule('/src/seo/metadata.js'),
  ]);
  const {
    DEFAULT_ROBOTS,
    getRobots,
    getPageMetadata,
    IS_INDEXABLE_SITE,
    SITE_URL,
    SOCIAL_IMAGE,
    staticPages,
  } = metadata;
  const routes = [
    ...Object.keys(staticPages).filter((route) => route !== '/admin' && route !== '/client-area'),
    ...serviceCatalog.map(({ slug }) => `/services/${slug}`),
  ];

  function escapeHtml(value) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function setMeta(html, { attribute, key, content }) {
    const escapedContent = escapeHtml(content);
    const regex = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
    if (regex.test(html)) {
      return html.replace(regex, `<meta ${attribute}="${key}" content="${escapedContent}">`);
    }
    return html.replace('</head>', `  <meta ${attribute}="${key}" content="${escapedContent}">\n  </head>`);
  }

  for (const route of routes) {
    const page = getPageMetadata(route, serviceCatalog);
    const head = getPageHeadMetadata({
      page,
      siteUrl: SITE_URL,
      socialImage: SOCIAL_IMAGE,
      robots: getRobots(page.robots || DEFAULT_ROBOTS),
      siteName: SITE.name,
      areaServed: SITE.areaServed,
    });
    let html = template.replace(/<html lang="[^"]*">/, '<html lang="es-UY">');
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(head.title)}</title>`);
    for (const meta of head.meta) html = setMeta(html, meta);
    const canonicalTag = `<link rel="canonical" href="${escapeHtml(head.canonicalUrl)}">`;
    if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i.test(html)) {
      html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, canonicalTag);
    } else {
      html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
    }

    const safeConfigJson = JSON.stringify(siteConfig).replaceAll('<', '\\u003c');
    const safeCatalogJson = JSON.stringify(serviceCatalog).replaceAll('<', '\\u003c');
    html = html.replace(
      '</head>',
      `  <script id="site-config" type="application/json">${safeConfigJson}</script>\n  <script id="service-catalog" type="application/json">${safeCatalogJson}</script>\n  <script id="business-structured-data" type="application/ld+json">${JSON.stringify(metadata.buildBusinessStructuredData(siteConfig, SITE_URL)).replaceAll('<', '\\u003c')}</script>\n  </head>`,
    );
    const appHtml = await renderer.renderStaticPage(route, siteConfig, serviceCatalog);
    const routeRoot = `<div id="root" data-prerender-path="${escapeHtml(route)}">${appHtml}</div>`;
    html = html.replace('<div id="root"></div>', routeRoot);
    if (!html.includes(routeRoot)) {
      throw new Error(`Could not insert rendered content for route ${route}.`);
    }

    const routeDirectory = path.join(outputDirectory, route.slice(1));
    await mkdir(routeDirectory, { recursive: true });
    await writeFile(path.join(routeDirectory, 'index.html'), html);
  }

  const { robots, sitemap } = createSeoFiles({
    siteUrl: SITE_URL,
    isIndexable: IS_INDEXABLE_SITE,
    routes,
    getPageMetadata,
    serviceCatalog,
    date: new Date().toISOString().slice(0, 10),
  });
  await writeFile(path.join(outputDirectory, 'robots.txt'), robots);
  if (sitemap) {
    await writeFile(path.join(outputDirectory, 'sitemap.xml'), sitemap);
  } else {
    await rm(path.join(outputDirectory, 'sitemap.xml'), { force: true });
  }

  console.log(`Generated prerendered HTML for ${routes.length} routes.`);
  if (new URL(SITE_URL).hostname === 'mandalestart.com'
    || new URL(SITE_URL).hostname === 'www.mandalestart.com') {
    if (!IS_INDEXABLE_SITE) {
      console.warn('\nATENCIÓN: build de producción sin indexación; falta VITE_INDEXABLE_SITE=true\n');
      if (process.env.STRICT_SEO === '1') {
        throw new Error('STRICT_SEO=1: la compilación de producción requiere VITE_INDEXABLE_SITE=true.');
      }
    }
  }
} finally {
  await vite.close();
}
