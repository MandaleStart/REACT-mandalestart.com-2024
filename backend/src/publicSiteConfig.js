const DEFAULT_PUBLIC_EMAIL = 'info@mandalestart.com';

function isValidEmail(email) {
  return /^[A-Z0-9._+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}

export function getPublicSiteConfig(env = process.env) {
  const email = env.PUBLIC_CONTACT_EMAIL?.trim() || DEFAULT_PUBLIC_EMAIL;
  const phoneE164 = env.PUBLIC_CONTACT_PHONE_E164?.trim() || '';
  const phoneDisplay = env.PUBLIC_CONTACT_PHONE_DISPLAY?.trim() || '';

  if (!isValidEmail(email)) {
    throw new Error('PUBLIC_CONTACT_EMAIL debe ser una dirección de correo válida.');
  }
  if (Boolean(phoneE164) !== Boolean(phoneDisplay)) {
    throw new Error('PUBLIC_CONTACT_PHONE_E164 y PUBLIC_CONTACT_PHONE_DISPLAY deben configurarse juntos.');
  }
  if (phoneE164 && !/^\+[1-9]\d{7,14}$/.test(phoneE164)) {
    throw new Error('PUBLIC_CONTACT_PHONE_E164 debe estar en formato E.164.');
  }
  if (phoneDisplay && !/^[+()\d .-]+$/.test(phoneDisplay)) {
    throw new Error('PUBLIC_CONTACT_PHONE_DISPLAY solo puede contener números y separadores telefónicos.');
  }
  if (phoneE164 && phoneDisplay.replace(/\D/g, '') !== phoneE164.replace(/\D/g, '')) {
    throw new Error('PUBLIC_CONTACT_PHONE_DISPLAY debe corresponder al teléfono E.164 configurado.');
  }

  return {
    email,
    phone: phoneE164 ? { e164: phoneE164, display: phoneDisplay } : null,
    whatsapp: phoneE164 ? phoneE164.slice(1) : null,
  };
}
