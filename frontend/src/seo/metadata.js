import { SITE, fallbackContact } from '../config/site.js';

export const DEFAULT_DESCRIPTION = 'Desarrollo web, hosting, dominios, SEO y soporte técnico para personas y negocios de todo Uruguay.';

export function buildBusinessStructuredData(contact = fallbackContact, siteUrl = 'https://mandalestart.com') {
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
      name: 'Uruguay',
    },
    availableLanguage: 'es-UY',
    sameAs: [SITE.linkedin],
  };

  if (contact.phone?.e164) structuredData.telephone = contact.phone.e164;
  return structuredData;
}

export function buildMetadata(env = {}) {
  const siteUrl = (env.VITE_SITE_URL || 'https://mandalestart.com').replace(/\/$/, '');
  const socialImage = `${siteUrl}/img/og-cover.png`;
  // Keep staging non-indexable even if VITE_INDEXABLE_SITE is accidentally enabled.
  const isStagingSite = new URL(siteUrl).hostname.startsWith('dev.');
  const isIndexableSite = env.VITE_INDEXABLE_SITE === 'true' && !isStagingSite;
  const defaultRobots = isIndexableSite ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
  const businessStructuredData = buildBusinessStructuredData(fallbackContact, siteUrl);
  const staticPages = {
    '/': {
      title: 'Diseño web y soporte técnico en Uruguay | MandaleStart',
      description: 'Diseño web, hosting, dominios, SEO, redes e impresión 3D para personas y negocios de todo Uruguay. Consultá por tu proyecto.',
      robots: defaultRobots,
    },
    '/aboutme': {
      title: 'Sobre mí | Desarrollo web y soporte técnico en Uruguay | MandaleStart',
      description: 'Conocé a Nicolás, desarrollador web y técnico independiente. Servicios para personas y negocios de todo Uruguay.',
      robots: defaultRobots,
    },
    '/contact': {
      title: 'Contacto y presupuesto | Servicios en todo Uruguay | MandaleStart',
      description: 'Contame qué necesitás para tu web, hosting, redes o proyecto 3D. Atención a personas y negocios de todo Uruguay.',
      robots: defaultRobots,
    },
    '/projects': {
      title: 'Soluciones web y técnicas en Uruguay | MandaleStart',
      description: 'Ejemplos de soluciones de desarrollo web, acceso remoto, monitoreo e impresión 3D disponibles en todo Uruguay.',
      robots: defaultRobots,
    },
    '/services': {
      title: 'Servicios web, hosting, SEO e infraestructura en Uruguay | MandaleStart',
      description: 'Desarrollo web, hosting, dominios, correo, SEO, acceso remoto, monitoreo e impresión 3D en Uruguay.',
      robots: defaultRobots,
    },
    '/comments': {
      title: 'Opiniones de clientes | MandaleStart',
      description: 'Opiniones verificadas de clientes de MandaleStart.',
      robots: 'noindex, follow',
    },
    '/client-area': {
      title: 'Área de clientes | MandaleStart',
      description: 'Acceso al área de clientes de MandaleStart.',
      robots: 'noindex, nofollow',
    },
    '/admin': {
      title: 'Administración | MandaleStart',
      description: 'Panel privado de administración de clientes y servicios.',
      robots: 'noindex, nofollow',
    },
    '/cv': {
      title: 'Currículum de Nicolás Jorge | MandaleStart',
      description: 'Perfil profesional, habilidades y certificaciones de Nicolás Jorge.',
      robots: 'noindex, follow',
    },
    '/privacidad': {
      title: 'Política de privacidad | MandaleStart',
      description: 'Conocé cómo MandaleStart trata los datos del formulario, el área de clientes y las mediciones del sitio.',
      robots: defaultRobots,
    },
  };

  function getPageMetadata(pathname, serviceCatalog = []) {
    const requestedPath = pathname.replace(/\/+$/, '') || '/';
    const path = requestedPath === '/files' ? '/aboutme' : requestedPath;
    const fixedPage = staticPages[path];
    if (fixedPage) {
      return { ...fixedPage, path };
    }

    if (path.startsWith('/services/')) {
      const slug = path.slice('/services/'.length);
      const service = serviceCatalog.find((item) => item.slug === slug);
      if (service) {
        return {
          title: `${service.title} en Uruguay | MandaleStart`,
          description: `${service.description} Atención a personas y negocios de todo Uruguay.`,
          robots: defaultRobots,
          path,
        };
      }
    }

    return {
      title: 'Página no encontrada | MandaleStart',
      description: 'La página que buscás no está disponible.',
      robots: 'noindex, nofollow',
      path,
    };
  }

  return {
    SITE_URL: siteUrl,
    SOCIAL_IMAGE: socialImage,
    DEFAULT_ROBOTS: defaultRobots,
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
  IS_INDEXABLE_SITE,
  BUSINESS_STRUCTURED_DATA,
  staticPages,
  getPageMetadata,
} = metadata;
