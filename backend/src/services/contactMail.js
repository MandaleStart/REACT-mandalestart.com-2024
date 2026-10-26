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

function boundedString(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function validateContactMessage(body) {
  const honeypotFilled = Boolean(boundedString(body.website, 200));
  const name = boundedString(body.name, 120);
  const email = boundedString(body.email, 254);
  const service = boundedString(body.service, 40);
  const message = boundedString(body.message, 5000);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email || !service || !message) {
    return { ok: false, message: 'Completá nombre, email, servicio y mensaje.' };
  }
  if (!emailPattern.test(email)) {
    return { ok: false, message: 'Ingresá una dirección de email válida.' };
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
