import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, loadEnv } from 'vite';
import serviceCatalog from '../src/data/serviceCatalog.js';
import { createSeoFiles } from '../src/seo/seoFiles.js';
import { fallbackContact, normalizeContactConfig } from '../src/config/site.js';

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

try {
  const siteConfig = await loadPublicContactConfig();
  const [renderer, metadata] = await Promise.all([
    vite.ssrLoadModule('/src/renderStaticPage.js'),
    vite.ssrLoadModule('/src/seo/metadata.js'),
  ]);
  const {
    DEFAULT_DESCRIPTION,
    DEFAULT_ROBOTS,
    buildBusinessStructuredData,
    getPageMetadata,
    IS_INDEXABLE_SITE,
    SITE_URL,
    staticPages,
  } = metadata;
  const routes = [
    ...Object.keys(staticPages),
    ...serviceCatalog.map(({ slug }) => `/services/${slug}`),
  ];

  function escapeHtml(value) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function setMeta(html, selector, attribute, value) {
    const escapedValue = escapeHtml(value);
    const selectorRegex = new RegExp(`<meta\\s+${selector}\\s+${attribute}="[^"]*"\\s*\\/?>`, 'i');
    if (selectorRegex.test(html)) {
      return html.replace(selectorRegex, `<meta ${selector} ${attribute}="${escapedValue}">`);
    }
    return html.replace('</head>', `  <meta ${selector} ${attribute}="${escapedValue}">\n  </head>`);
  }

  for (const route of routes) {
    const page = getPageMetadata(route, serviceCatalog);
    const canonicalUrl = `${SITE_URL}${page.path}`;
    const socialImage = `${SITE_URL}/img/og-cover.png`;
    let html = template.replace(/<html lang="[^"]*">/, '<html lang="es-UY">');
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
    html = setMeta(html, 'name="description"', 'content', page.description || DEFAULT_DESCRIPTION);
    html = setMeta(html, 'name="robots"', 'content', page.robots || DEFAULT_ROBOTS);
    html = setMeta(html, 'property="og:title"', 'content', page.title);
    html = setMeta(html, 'property="og:description"', 'content', page.description || DEFAULT_DESCRIPTION);
    html = setMeta(html, 'property="og:url"', 'content', canonicalUrl);
    html = setMeta(html, 'property="og:image"', 'content', socialImage);
    html = setMeta(html, 'property="og:image:alt"', 'content', 'MandaleStart: desarrollo web y soporte técnico en Uruguay');
    html = setMeta(html, 'property="og:image:width"', 'content', '1200');
    html = setMeta(html, 'property="og:image:height"', 'content', '630');
    html = setMeta(html, 'name="twitter:title"', 'content', page.title);
    html = setMeta(html, 'name="twitter:description"', 'content', page.description || DEFAULT_DESCRIPTION);
    html = setMeta(html, 'name="twitter:image"', 'content', socialImage);

    const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`;
    if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i.test(html)) {
      html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, canonicalTag);
    } else {
      html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
    }

    const safeConfigJson = JSON.stringify(siteConfig).replaceAll('<', '\\u003c');
    const businessStructuredData = buildBusinessStructuredData(siteConfig, SITE_URL);
    html = html.replace(
      '</head>',
      `  <script id="site-config" type="application/json">${safeConfigJson}</script>\n  <script id="business-structured-data" type="application/ld+json">${JSON.stringify(businessStructuredData)}</script>\n  </head>`,
    );

    const appHtml = await renderer.renderStaticPage(route, siteConfig);
    html = html.replace('<div id="root"></div>', `<div id="root" data-prerender-path="${escapeHtml(route)}">${appHtml}</div>`);
    if (!html.includes(`<div id="root" data-prerender-path="${escapeHtml(route)}">${appHtml}</div>`)) {
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
