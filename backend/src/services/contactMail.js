import nodemailer from 'nodemailer';

const serviceLabels = new Set([
  'web',
  'hosting',
  'correo',
  'seo',
  'ddns',
  'red',
  'impresion',
  'otro',
]);

function normalizedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateContactMessage(body) {
  const honeypotFilled = Boolean(normalizedString(body.website));
  const name = normalizedString(body.name);
  const email = normalizedString(body.email);
  const service = normalizedString(body.service);
  const message = normalizedString(body.message);
  const namePattern = /^[\p{L}\p{M} .’'-]+$/u;
  const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

  if (!name || !email || !service || !message) {
    return { ok: false, message: 'Completá nombre, email, servicio y mensaje.' };
  }
  if (name.length > 80 || !namePattern.test(name)) {
    return { ok: false, message: 'Ingresá un nombre válido de hasta 80 caracteres.' };
  }
  if (email.length > 160 || /[\u0000-\u001f\u007f]/u.test(email) || !emailPattern.test(email)) {
    return { ok: false, message: 'Ingresá un email válido de hasta 160 caracteres.' };
  }
  if (service.length > 40 || message.length > 5000) {
    return { ok: false, message: 'La consulta supera el límite permitido.' };
  }
  if (!serviceLabels.has(service)) {
    return { ok: false, message: 'Elegí una opción válida para el servicio.' };
  }

  return {
    ok: true,
    honeypotFilled,
    message: { name, email, service, message },
  };
}

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    const error = new Error('SMTP no configurado.');
    error.code = 'CONTACT_NOT_CONFIGURED';
    throw error;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendContactMessage(message) {
  const transporter = createTransporter();
  const serviceLabelsById = {
    web: 'Desarrollo web',
    hosting: 'Hosting y dominios',
    correo: 'Correo corporativo',
    seo: 'SEO',
    ddns: 'DDNS y acceso remoto',
    red: 'Redes, servidores y monitoreo',
    impresion: 'Diseño e impresión 3D',
    otro: 'Otro',
  };

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_TO || 'info@mandalestart.com',
    replyTo: { name: message.name, address: message.email },
    subject: `Consulta web: ${serviceLabelsById[message.service]}`,
    text: `Nombre: ${message.name}\nEmail: ${message.email}\nServicio: ${serviceLabelsById[message.service]}\n\nMensaje:\n${message.message}`,
  });
}
