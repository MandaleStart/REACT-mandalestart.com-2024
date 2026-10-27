import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, loadEnv } from 'vite';
import fallbackServiceCatalog from '../src/data/serviceCatalog.js';
import normalizeServiceCatalog from '../src/data/normalizeServiceCatalog.js';
import { createSeoFiles } from '../src/seo/seoFiles.js';
import { extractHeadElements } from '../src/seo/extractHeadElements.js';
import { fallbackContact, normalizeContactConfig } from '../src/config/site.js';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectDirectory, 'dist');
const template = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

async function loadPublicContactConfig() {
  const env = loadEnv('production', projectDirectory, 'VITE_');
  const apiBaseUrl = (
    process.env.VITE_API_BASE_URL ||
    env.VITE_API_BASE_URL ||
    'http://localhost:4000'
  ).replace(/\/$/, '');
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
  const apiBaseUrl = (
    process.env.VITE_API_BASE_URL ||
    env.VITE_API_BASE_URL ||
    'http://localhost:4000'
  ).replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${apiBaseUrl}/api/services`, { signal: controller.signal });
    if (!response.ok) throw new Error(`La API respondió con estado ${response.status}.`);
    const services = await response.json();
    if (!Array.isArray(services))
      throw new Error('El catálogo recibido no tiene un formato válido.');
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
  const { getPageMetadata, IS_INDEXABLE_SITE, SITE_URL, staticPages } = metadata;
  const routes = [
    ...Object.keys(staticPages).filter(
      (route) =>
        ![
          '/admin',
          '/client-area',
          '/administracion',
          '/area-cliente',
          '/perfil',
          '/configuraciones',
          '/configuraciones/catalogo',
        ].includes(route),
    ),
    ...serviceCatalog.map(({ slug }) => `/services/${slug}`),
  ];

  function escapeHtml(value) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  for (const route of routes) {
    let html = template.replace(/<html lang="[^"]*">/, '<html lang="es-UY">');
    const safeConfigJson = JSON.stringify(siteConfig).replaceAll('<', '\\u003c');
    const safeCatalogJson = JSON.stringify(serviceCatalog).replaceAll('<', '\\u003c');
    const renderedPage = await renderer.renderStaticPage(route, siteConfig, serviceCatalog);
    const { headMarkup, bodyMarkup } = extractHeadElements(renderedPage);
    html = html.replace(
      '</head>',
      `  ${headMarkup}\n  <script id="site-config" type="application/json">${safeConfigJson}</script>\n  <script id="service-catalog" type="application/json">${safeCatalogJson}</script>\n  </head>`,
    );
    const routeRoot = `<div id="root" data-prerender-path="${escapeHtml(route)}">${bodyMarkup}</div>`;
    html = html.replace('<div id="root"></div>', routeRoot);
    if (!html.includes(routeRoot)) {
      throw new Error(`Could not insert rendered content for route ${route}.`);
    }
    const structuredDataScript = html.match(
      /<script id="page-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    if (!structuredDataScript) {
      throw new Error(`Prerendered route ${route} is missing structured data.`);
    }
    const structuredData = JSON.parse(structuredDataScript[1]);
    if (!Array.isArray(structuredData) || structuredData.length === 0) {
      throw new Error(`Prerendered route ${route} has invalid structured data.`);
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
  });
  await writeFile(path.join(outputDirectory, 'robots.txt'), robots);
  if (sitemap) {
    await writeFile(path.join(outputDirectory, 'sitemap.xml'), sitemap);
  } else {
    await rm(path.join(outputDirectory, 'sitemap.xml'), { force: true });
  }

  console.log(`Generated prerendered HTML for ${routes.length} routes.`);
  if (
    new URL(SITE_URL).hostname === 'mandalestart.com' ||
    new URL(SITE_URL).hostname === 'www.mandalestart.com'
  ) {
    if (!IS_INDEXABLE_SITE) {
      console.warn(
        '\nATENCIÓN: build de producción sin indexación; falta VITE_INDEXABLE_SITE=true\n',
      );
      if (process.env.STRICT_SEO === '1') {
        throw new Error(
          'STRICT_SEO=1: la compilación de producción requiere VITE_INDEXABLE_SITE=true.',
        );
      }
    }
  }
} finally {
  await vite.close();
}
