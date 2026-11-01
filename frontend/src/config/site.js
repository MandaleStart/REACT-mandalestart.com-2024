export const SITE = {
  name: 'MandaleStart',
  url: 'https://mandalestart.com',
  email: 'info@mandalestart.com',
  phone: null,
  whatsapp: null,
  areaServed: 'Uruguay',
  brand: {
    subtitle: 'Webs, hosting y soporte técnico',
    ctaLabel: 'Pedir presupuesto',
  },
  nav: {
    home: 'Inicio',
    projects: 'Proyectos',
    about: 'Sobre mí',
    contact: 'Contacto',
    services: 'Servicios',
    more: 'Más',
    clientArea: 'Ingresar',
  },
  home: {
    heroTitle: 'Tu web, tu dominio y tu correo,',
    heroHighlight: 'funcionando y a cargo de una sola persona.',
    intro:
      'Soy Nicolás. Hago sitios web y me encargo de lo que hay detrás: dominio, hosting, correo, SEO y redes. Vos me contás qué necesitás; yo me ocupo de la parte técnica y te explico todo en simple.',
    proof: ['Webs y tiendas online', 'Dominio, hosting y correo', 'Soporte técnico en Uruguay'],
    ctaPrimary: 'Pedir presupuesto',
    ctaSecondary: 'Ver servicios y planes',
    whatIDo: 'Servicios',
    servicesHeadline: 'Todo lo que tu negocio necesita para estar en internet.',
    infrastructure: 'Más allá de la web',
    infrastructureHeadline: 'También cuido servidores, redes y equipos.',
    process: 'Cómo trabajo',
    processHeadline: 'Cuatro pasos, sin sorpresas.',
    faqLabel: 'Antes de escribirme',
    faqHeadline: 'Preguntas frecuentes',
    ctaBandLabel: '¿Hablamos?',
    ctaBandHeadline: 'Contame qué querés lograr o qué no está funcionando. Te respondo con los próximos pasos.',
    ctaBandButton: 'Escribime',
  },
  services: {
    menu: [
      { to: '/services', label: 'Todos los servicios' },
      { to: '/services/web', label: 'Desarrollo web' },
      { to: '/services/hosting', label: 'Hosting web' },
      { to: '/services/email', label: 'Correo empresarial' },
      { to: '/services/domains', label: 'Dominios' },
      { to: '/services/seo', label: 'SEO' },
      { to: '/services/ddns', label: 'DDNS' },
      { to: '/services/monitoring', label: 'Infraestructura' },
      { to: '/services/impresion-3d', label: 'Diseño e impresión 3D' },
    ],
  },
  social: {
    telegram: {
      url: 'https://t.me/MandaleStart',
      handle: '@MandaleStart',
    },
    linkedin: {
      url: 'https://www.linkedin.com/in/mandalestart',
      label: 'MandaleStart',
    },
  },
};

export const fallbackContact = {
  email: SITE.email,
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
};

const emailPattern = /^[A-Z0-9._+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const phonePattern = /^\+[1-9]\d{7,14}$/;

export function normalizeContactConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('La configuración pública de contacto no es válida.');
  }

  if (typeof value.email !== 'string' || !emailPattern.test(value.email.trim())) {
    throw new Error('La configuración pública de contacto no incluye un email válido.');
  }

  if (value.phone === null) {
    if (value.whatsapp !== null) {
      throw new Error('WhatsApp debe estar vacío cuando no hay un teléfono configurado.');
    }
    return { email: value.email.trim(), phone: null, whatsapp: null };
  }

  if (
    !value.phone ||
    !phonePattern.test(value.phone.e164) ||
    typeof value.phone.display !== 'string' ||
    !value.phone.display.trim() ||
    value.phone.display.replace(/\D/g, '') !== value.phone.e164.replace(/\D/g, '') ||
    value.whatsapp !== value.phone.e164.slice(1)
  ) {
    throw new Error('La configuración pública del teléfono no es válida.');
  }

  return {
    email: value.email.trim(),
    phone: { e164: value.phone.e164, display: value.phone.display },
    whatsapp: value.whatsapp,
  };
}

export function telUrl(contact) {
  return contact.phone ? `tel:${contact.phone.e164}` : null;
}

export function whatsappUrl(contact, text = '') {
  if (!contact.whatsapp) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${contact.whatsapp}${query}`;
}

export function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(contact, subject = '', body = '') {
  const parameters = new URLSearchParams();
  if (subject) parameters.set('subject', subject);
  if (body) parameters.set('body', body);
  const encodedParameters = parameters.toString().replace(/\+/g, '%20');
  const query = encodedParameters ? `?${encodedParameters}` : '';
  return `mailto:${contact.email}${query}`;
}
