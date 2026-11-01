import nodemailer from 'nodemailer';
import { createHash } from 'node:crypto';

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

function formatInvoiceAmount(amountCents, currency) {
  const cents = BigInt(amountCents);
  const major = (cents / 100n).toLocaleString('es-UY');
  const minor = String(cents % 100n).padStart(2, '0');
  return `${currency} ${major},${minor}`;
}

function formatDueDate(value) {
  const date = typeof value === 'string' ? value.slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return new Intl.DateTimeFormat('es-UY', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

export async function sendBillingReminder(reminder, transporterFactory = createTransporter) {
  const transporter = transporterFactory();
  const amount = formatInvoiceAmount(reminder.total_cents, reminder.currency);
  const dueDate = formatDueDate(reminder.due_on);
  const overdue = reminder.reminder_type.startsWith('D+');
  const appUrl = (process.env.PUBLIC_APP_URL || 'https://mandalestart.com').replace(/\/+$/, '');
  const invoiceUrl = `${appUrl}/area-cliente/invoices/${encodeURIComponent(reminder.invoice_id)}`;
  const subject = overdue
    ? `Factura vencida ${reminder.invoice_number}`
    : `Recordatorio de factura ${reminder.invoice_number}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: reminder.email,
    messageId: `<billing-reminder-${reminder.id}@mandalestart.com>`,
    subject,
    text: [
      `Hola ${reminder.client_name || ''},`,
      '',
      overdue
        ? `La factura ${reminder.invoice_number} está vencida desde el ${dueDate}.`
        : `La factura ${reminder.invoice_number} vence el ${dueDate}.`,
      `Total: ${amount}`,
      `Podés consultar la factura y los medios de pago en: ${invoiceUrl}`,
      '',
      'Si ya realizaste el pago, podés ignorar este aviso.',
    ].join('\n'),
  });
}

export async function sendAdminUnappliedPaymentAlert(
  payment,
  transporterFactory = createTransporter,
) {
  const transporter = transporterFactory();
  const paymentKey = createHash('sha256')
    .update(String(payment.provider_payment_id))
    .digest('hex');
  const amount =
    payment.amount_cents && payment.currency
      ? formatInvoiceAmount(payment.amount_cents, payment.currency)
      : 'Importe o moneda no disponibles';
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_TO || 'info@mandalestart.com',
    messageId: `<unapplied-payment-${paymentKey}@mandalestart.com>`,
    subject: 'Pago de Mercado Pago pendiente de revisión',
    text: [
      'Mercado Pago notificó un pago aprobado que no pudo aplicarse automáticamente.',
      `Identificador del pago: ${payment.provider_payment_id}`,
      `Importe: ${amount}`,
      `Motivo: ${payment.reason}`,
      'Revisalo desde el panel de administración, en “Pagos para revisar”.',
    ].join('\n'),
  });
}

export async function sendAdminMercadoPagoReversalAlert(
  reversal,
  transporterFactory = createTransporter,
) {
  const transporter = transporterFactory();
  const paymentKey = createHash('sha256')
    .update(String(reversal.provider_payment_id))
    .digest('hex');
  const amount =
    reversal.amount_cents && reversal.currency
      ? formatInvoiceAmount(reversal.amount_cents, reversal.currency)
      : 'Importe o moneda no disponibles';
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_TO || 'info@mandalestart.com',
    messageId: `<mercadopago-reversal-${paymentKey}@mandalestart.com>`,
    subject: 'Reembolso o contracargo de Mercado Pago',
    text: [
      `Mercado Pago notificó el estado ${reversal.provider_status} para un pago.`,
      `Identificador del pago: ${reversal.provider_payment_id}`,
      `Importe: ${amount}`,
      'Revisá la factura y la auditoría desde el panel de administración.',
    ].join('\n'),
  });
}
