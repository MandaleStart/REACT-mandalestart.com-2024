import { SITE, fallbackContact } from '../config/site.js';

export const DEFAULT_DESCRIPTION = 'Desarrollo web, hosting, dominios, SEO y soporte técnico para personas y negocios de todo Uruguay.';

export function buildBusinessStructuredData(contact = fallbackContact, siteUrl = SITE.url) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: SITE.name,
    url: siteUrl,
    image: `${siteUrl}/img/og-cover.png`,
    description: DEFAULT_DESCRIPTION,
    email: contact.email,
    areaServed: {
      '@type': 'Country',
      name: SITE.areaServed,
    },
    availableLanguage: 'es-UY',
    sameAs: [SITE.social.linkedin.url, SITE.social.telegram.url],
  };

  if (contact.phone?.e164) structuredData.telephone = contact.phone.e164;
  return structuredData;
}

export function buildMetadata(env = {}) {
  const siteUrl = (env.VITE_SITE_URL || SITE.url).replace(/\/$/, '');
  const socialImage = `${siteUrl}/img/og-cover.png`;
  const isIndexableSite = env.VITE_INDEXABLE_SITE === 'true';
  const defaultRobots = isIndexableSite ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';

  function getRobots(robots = defaultRobots) {
    if (!isIndexableSite && !robots.startsWith('noindex')) return 'noindex, nofollow';
    return robots;
  }

  const businessStructuredData = buildBusinessStructuredData(fallbackContact, siteUrl);
  const staticPages = {
    '/': {
      title: `Diseño web y soporte técnico en Uruguay | ${SITE.name}`,
      description: 'Diseño web, hosting, dominios, SEO, redes e impresión 3D para personas y negocios de todo Uruguay. Consultá por tu proyecto.',
      robots: defaultRobots,
    },
    '/aboutme': {
      title: `Sobre mí | Desarrollo web y soporte técnico en Uruguay | ${SITE.name}`,
      description: 'Conocé a Nicolás, desarrollador web y técnico independiente. Servicios para personas y negocios de todo Uruguay.',
      robots: defaultRobots,
    },
    '/contact': {
      title: `Contacto y presupuesto | Servicios en todo Uruguay | ${SITE.name}`,
      description: 'Contame qué necesitás para tu web, hosting, redes o proyecto 3D. Atención a personas y negocios de todo Uruguay.',
      robots: defaultRobots,
    },
    '/projects': {
      title: `Soluciones web y técnicas en Uruguay | ${SITE.name}`,
      description: 'Ejemplos de soluciones de desarrollo web, acceso remoto, monitoreo e impresión 3D disponibles en todo Uruguay.',
      robots: defaultRobots,
    },
    '/services': {
      title: `Servicios web, hosting, SEO e infraestructura en Uruguay | ${SITE.name}`,
      description: 'Desarrollo web, hosting, dominios, correo, SEO, acceso remoto, monitoreo e impresión 3D en Uruguay.',
      robots: defaultRobots,
    },
    '/comments': {
      title: `Opiniones de clientes | ${SITE.name}`,
      description: `Opiniones verificadas de clientes de ${SITE.name}.`,
      robots: 'noindex, follow',
    },
    '/client-area': {
      title: `Área de clientes | ${SITE.name}`,
      description: `Acceso al área de clientes de ${SITE.name}.`,
      robots: 'noindex, nofollow',
    },
    '/admin': {
      title: `Administración | ${SITE.name}`,
      description: `Panel privado de administración de clientes y servicios de ${SITE.name}.`,
      robots: 'noindex, nofollow',
    },
    '/cv': {
      title: `Currículum de Nicolás Jorge | ${SITE.name}`,
      description: 'Perfil profesional, habilidades y certificaciones de Nicolás Jorge.',
      robots: 'noindex, follow',
    },
    '/privacidad': {
      title: `Política de privacidad | ${SITE.name}`,
      description: `Conocé cómo ${SITE.name} trata los datos del formulario, el área de clientes y las mediciones del sitio.`,
      robots: defaultRobots,
    },
  };

  function getPageMetadata(pathname, serviceCatalog = []) {
    const requestedPath = pathname.replace(/\/+$/, '') || '/';
    const path = requestedPath === '/files' ? '/aboutme' : requestedPath;
    const fixedPage = staticPages[path];
    if (fixedPage) {
      return { ...fixedPage, robots: getRobots(fixedPage.robots), path };
    }

    if (path.startsWith('/services/')) {
      const slug = path.slice('/services/'.length);
      const service = serviceCatalog.find((item) => item.slug === slug);
      if (service) {
        return {
          title: `${service.title} en Uruguay | ${SITE.name}`,
          description: `${service.description} Atención a personas y negocios de todo Uruguay.`,
          robots: getRobots(defaultRobots),
          path,
        };
      }
    }

    return {
      title: `Página no encontrada | ${SITE.name}`,
      description: 'La página que buscás no está disponible.',
      robots: 'noindex, nofollow',
      path,
    };
  }

  return {
    SITE_URL: siteUrl,
    SOCIAL_IMAGE: socialImage,
    DEFAULT_ROBOTS: defaultRobots,
    getRobots,
    IS_INDEXABLE_SITE: isIndexableSite,
    BUSINESS_STRUCTURED_DATA: businessStructuredData,
    staticPages,
    getPageMetadata,
  };
}

const env = import.meta.env ?? {};
const metadata = buildMetadata(env);

export const {
  SITE_URL,
  SOCIAL_IMAGE,
  DEFAULT_ROBOTS,
  getRobots,
  IS_INDEXABLE_SITE,
  BUSINESS_STRUCTURED_DATA,
  staticPages,
  getPageMetadata,
} = metadata;
