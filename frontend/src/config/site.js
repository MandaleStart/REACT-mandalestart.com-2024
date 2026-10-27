export const SITE = {
  name: 'MandaleStart',
  url: 'https://mandalestart.com',
  email: 'info@mandalestart.com',
  phone: null,
  whatsapp: null,
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
  areaServed: 'Uruguay',
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

export function mailtoUrl(contact, subject = '') {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${contact.email}${query}`;
}
