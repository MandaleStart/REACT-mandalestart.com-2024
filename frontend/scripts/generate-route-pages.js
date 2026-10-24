import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import serviceCatalog from '../src/data/serviceCatalog.js';
import { DEFAULT_DESCRIPTION, getPageMetadata, SITE_URL, SOCIAL_IMAGE, staticPages } from '../src/seo/metadata.js';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectDirectory, 'dist');
const template = await readFile(path.join(outputDirectory, 'index.html'), 'utf8');

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

const routes = [
  ...Object.keys(staticPages),
  ...serviceCatalog.map(({ slug }) => `/services/${slug}`),
];

for (const route of routes) {
  const page = getPageMetadata(route, serviceCatalog);
  const canonicalUrl = `${SITE_URL}${page.path}`;
  let html = template.replace(/<html lang="[^"]*">/, '<html lang="es-UY">');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  html = setMeta(html, 'name="description"', 'content', page.description || DEFAULT_DESCRIPTION);
  html = setMeta(html, 'name="robots"', 'content', page.robots || 'index, follow, max-image-preview:large');
  html = setMeta(html, 'property="og:title"', 'content', page.title);
  html = setMeta(html, 'property="og:description"', 'content', page.description || DEFAULT_DESCRIPTION);
  html = setMeta(html, 'property="og:url"', 'content', canonicalUrl);
  html = setMeta(html, 'property="og:image"', 'content', SOCIAL_IMAGE);
  html = setMeta(html, 'property="og:image:alt"', 'content', 'MandaleStart: desarrollo web y soporte técnico en Uruguay');
  html = setMeta(html, 'property="og:image:width"', 'content', '1200');
  html = setMeta(html, 'property="og:image:height"', 'content', '630');
  html = setMeta(html, 'name="twitter:title"', 'content', page.title);
  html = setMeta(html, 'name="twitter:description"', 'content', page.description || DEFAULT_DESCRIPTION);
  html = setMeta(html, 'name="twitter:image"', 'content', SOCIAL_IMAGE);

  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`;
  if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i.test(html)) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'MandaleStart',
    url: SITE_URL,
    image: SOCIAL_IMAGE,
    description: DEFAULT_DESCRIPTION,
    email: 'info@mandalestart.com',
    telephone: '+59891598586',
    areaServed: { '@type': 'Country', name: 'Uruguay' },
    availableLanguage: 'es-UY',
    sameAs: ['https://www.linkedin.com/in/mandalestart'],
  };
  html = html.replace(
    '</head>',
    `  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>\n  </head>`,
  );

  const routeDirectory = path.join(outputDirectory, route.slice(1));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(path.join(routeDirectory, 'index.html'), html);
}

console.log(`Generated metadata HTML for ${routes.length} routes.`);
