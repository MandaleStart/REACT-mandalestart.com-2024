export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://dev.mandalestart.com').replace(/\/$/, '');
export const SOCIAL_IMAGE = `${SITE_URL}/img/og-cover.png`;
export const DEFAULT_DESCRIPTION = 'Desarrollo web, hosting, dominios, SEO y soporte técnico para personas y negocios de todo Uruguay.';

export const staticPages = {
  '/': {
    title: 'Diseño web y soporte técnico en Uruguay | MandaleStart',
    description: 'Diseño web, hosting, dominios, SEO, redes e impresión 3D para personas y negocios de todo Uruguay. Consultá por tu proyecto.',
  },
  '/aboutme': {
    title: 'Sobre mí | Desarrollo web y soporte técnico en Uruguay | MandaleStart',
    description: 'Conocé a Nicolás, desarrollador web y técnico independiente. Servicios para personas y negocios de todo Uruguay.',
  },
  '/contact': {
    title: 'Contacto y presupuesto | Servicios en todo Uruguay | MandaleStart',
    description: 'Contame qué necesitás para tu web, hosting, redes o proyecto 3D. Atención a personas y negocios de todo Uruguay.',
  },
  '/projects': {
    title: 'Soluciones web y técnicas en Uruguay | MandaleStart',
    description: 'Ejemplos de soluciones de desarrollo web, acceso remoto, monitoreo e impresión 3D disponibles en todo Uruguay.',
  },
  '/services': {
    title: 'Servicios web, hosting, SEO e infraestructura en Uruguay | MandaleStart',
    description: 'Desarrollo web, hosting, dominios, correo, SEO, acceso remoto, monitoreo e impresión 3D en Uruguay.',
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
  '/cv': {
    title: 'Currículum de Nicolás Jorge | MandaleStart',
    description: 'Perfil profesional, habilidades y certificaciones de Nicolás Jorge.',
    robots: 'noindex, follow',
  },
  '/files': {
    title: 'Sobre mí | Desarrollo web y soporte técnico en Uruguay | MandaleStart',
    description: 'Conocé a Nicolás, desarrollador web y técnico independiente. Servicios para personas y negocios de todo Uruguay.',
  },
};

export function getPageMetadata(pathname, serviceCatalog) {
  const requestedPath = pathname.replace(/\/+$/, '') || '/';
  const path = requestedPath === '/files' ? '/aboutme' : requestedPath;
  const fixedPage = staticPages[path];
  if (fixedPage) return { ...fixedPage, path };

  if (path.startsWith('/services/')) {
    const slug = path.slice('/services/'.length);
    const service = serviceCatalog.find((item) => item.slug === slug);
    if (service) {
      return {
        title: `${service.title} en Uruguay | MandaleStart`,
        description: `${service.description} Atención a personas y negocios de todo Uruguay.`,
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
