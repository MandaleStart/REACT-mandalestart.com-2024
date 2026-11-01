const currencies = new Set(['UYU', 'USD']);
const billingPeriods = new Set(['one_time', 'monthly', 'yearly']);
const subscriptionStatuses = new Set(['pending', 'active', 'suspended', 'cancelled', 'expired']);
const invoiceStatuses = new Set(['draft', 'open']);
const serviceTypes = new Set([
  'domain',
  'hosting',
  'email',
  'web',
  'seo',
  'ddns',
  'monitoring',
  '3d-printing',
  'other',
]);
const paymentMethods = new Set(['transfer', 'cash', 'paypal', 'other']);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxMoneyCents = BigInt(Number.MAX_SAFE_INTEGER);

function invalid(message) {
  return { ok: false, message };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function string(value, { min = 0, max = 5000 } = {}) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length >= min && normalized.length <= max ? normalized : null;
}

function date(value, label) {
  if (value === undefined || value === null || value === '') return { ok: true, value: null };
  if (typeof value !== 'string' || !isoDatePattern.test(value)) {
    return invalid(`${label} debe tener formato AAAA-MM-DD.`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) return invalid(`${label} no es una fecha válida.`);
  return { ok: true, value };
}

function moneyCents(value, label, { allowZero = true } = {}) {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) {
    return invalid(`${label} debe expresarse en centavos enteros.`);
  }
  return { ok: true, value };
}

function taxRate(value, label = 'La tasa de IVA') {
  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    return invalid(`${label} debe ser un entero entre 0 y 10000 puntos básicos.`);
  }
  return { ok: true, value };
}

function validateFeatures(value) {
  if (value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value) || value.length > 50) {
    return invalid('Las características deben ser una lista de hasta 50 textos.');
  }
  const features = value.map((feature) => string(feature, { min: 1, max: 250 }));
  if (features.some((feature) => feature === null)) {
    return invalid('Cada característica debe ser un texto de hasta 250 caracteres.');
  }
  return { ok: true, value: features };
}

function validateDetails(value) {
  if (value === undefined) return { ok: true, value: [] };
  if (!Array.isArray(value) || value.length > 50) {
    return invalid('Los detalles deben ser una lista de hasta 50 elementos.');
  }
  const details = [];
  for (const item of value) {
    if (!isRecord(item)) return invalid('Cada detalle debe tener etiqueta y valor.');
    const label = string(item.label, { min: 1, max: 100 });
    const detailValue = string(item.value, { min: 1, max: 500 });
    if (label === null || detailValue === null) {
      return invalid('Cada detalle debe tener etiqueta y valor válidos.');
    }
    details.push({ label, value: detailValue });
  }
  return { ok: true, value: details };
}

export function validatePlan(input) {
  if (!isRecord(input)) return invalid('El plan debe ser un objeto válido.');
  const serviceSlug = string(input.service_slug, { min: 1, max: 100 });
  const code = string(input.code, { min: 1, max: 100 });
  const name = string(input.name, { min: 1, max: 160 });
  const description = string(input.description ?? '', { max: 2000 });
  const amount = moneyCents(input.amount_cents, 'El precio');
  const tax = taxRate(input.tax_rate_bp ?? 2200);
  const features = validateFeatures(input.features);
  if (!serviceSlug || !slugPattern.test(serviceSlug)) return invalid('El servicio del plan no es válido.');
  if (!code || !slugPattern.test(code)) return invalid('El código del plan no es válido.');
  if (!name) return invalid('El nombre del plan es obligatorio.');
  if (description === null) return invalid('La descripción del plan es demasiado larga.');
  if (!currencies.has(input.currency)) return invalid('Elegí una moneda válida (UYU o USD).');
  if (!billingPeriods.has(input.billing_period)) return invalid('Elegí una periodicidad válida.');
  if (!amount.ok) return amount;
  if (!tax.ok) return tax;
  if (!features.ok) return features;
  if (input.is_public !== undefined && typeof input.is_public !== 'boolean') {
    return invalid('La visibilidad pública debe ser verdadera o falsa.');
  }
  if (input.is_active !== undefined && typeof input.is_active !== 'boolean') {
    return invalid('El estado activo debe ser verdadero o falso.');
  }
  return {
    ok: true,
    value: {
      service_slug: serviceSlug,
      code,
      name,
      description,
      currency: input.currency,
      amount_cents: amount.value,
      billing_period: input.billing_period,
      tax_rate_bp: tax.value,
      features: features.value,
      is_public: input.is_public ?? false,
      is_active: input.is_active ?? true,
    },
  };
}

export function validateSubscription(input, clientId) {
  if (!isRecord(input)) return invalid('La suscripción debe ser un objeto válido.');
  const label = string(input.label, { min: 1, max: 200 });
  const resourceName = string(input.resource_name ?? '', { max: 255 });
  const amount = moneyCents(input.amount_cents, 'El precio');
  const details = validateDetails(input.details);
  const internalNotes = string(input.internal_notes ?? '', { max: 5000 });
  const startedOn = date(input.started_on, 'La fecha de inicio');
  const renewsOn = date(input.renews_on, 'La fecha de renovación');
  const cancelledOn = date(input.cancelled_on, 'La fecha de baja');
  if (typeof clientId !== 'string' || !clientId.trim() || clientId.length > 150) {
    return invalid('El identificador del cliente no es válido.');
  }
  if (!serviceTypes.has(input.service_type)) return invalid('Elegí un tipo de servicio válido.');
  if (!label) return invalid('La etiqueta de la suscripción es obligatoria.');
  if (input.plan_id !== undefined && input.plan_id !== null && (
    typeof input.plan_id !== 'string' || input.plan_id.length > 150
  )) return invalid('El plan seleccionado no es válido.');
  if (!subscriptionStatuses.has(input.status)) return invalid('Elegí un estado válido.');
  if (!currencies.has(input.currency)) return invalid('Elegí una moneda válida (UYU o USD).');
  if (!billingPeriods.has(input.billing_period)) return invalid('Elegí una periodicidad válida.');
  if (!amount.ok) return amount;
  if (!details.ok) return details;
  if (internalNotes === null) return invalid('Las notas internas son demasiado largas.');
  if (!startedOn.ok) return startedOn;
  if (!renewsOn.ok) return renewsOn;
  if (!cancelledOn.ok) return cancelledOn;
  if (input.auto_renew !== undefined && typeof input.auto_renew !== 'boolean') {
    return invalid('La renovación automática debe ser verdadera o falsa.');
  }
  return {
    ok: true,
    value: {
      client_id: clientId,
      plan_id: input.plan_id || null,
      service_type: input.service_type,
      label,
      resource_name: resourceName,
      status: input.status,
      currency: input.currency,
      amount_cents: amount.value,
      billing_period: input.billing_period,
      started_on: startedOn.value,
      renews_on: renewsOn.value,
      cancelled_on: cancelledOn.value,
      auto_renew: input.auto_renew ?? true,
      details: details.value,
      internal_notes: internalNotes,
    },
  };
}

function validateInvoiceItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
    return invalid('La factura debe tener entre 1 y 100 conceptos.');
  }
  const normalizedItems = [];
  let subtotal = 0n;
  let taxTotal = 0n;
  for (const item of items) {
    if (!isRecord(item)) return invalid('Cada concepto debe ser un objeto válido.');
    const description = string(item.description, { min: 1, max: 500 });
    const quantity = item.quantity ?? 1;
    const amount = moneyCents(item.unit_amount_cents, 'El precio unitario');
    const tax = taxRate(item.tax_rate_bp, 'La tasa de IVA del concepto');
    const subscriptionId = item.subscription_id ?? null;
    if (!description) return invalid('Cada concepto necesita una descripción.');
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) {
      return invalid('La cantidad debe ser un entero positivo.');
    }
    if (!amount.ok) return amount;
    if (!tax.ok) return tax;
    if (subscriptionId !== null && (
      typeof subscriptionId !== 'string' || !subscriptionId || subscriptionId.length > 150
    )) return invalid('La suscripción del concepto no es válida.');
    const lineSubtotal = BigInt(amount.value) * BigInt(quantity);
    const lineTax = (lineSubtotal * BigInt(tax.value) + 5000n) / 10000n;
    subtotal += lineSubtotal;
    taxTotal += lineTax;
    if (subtotal > maxMoneyCents || taxTotal > maxMoneyCents || subtotal + taxTotal > maxMoneyCents) {
      return invalid('El total de la factura excede el máximo permitido.');
    }
    normalizedItems.push({
      subscription_id: subscriptionId,
      description,
      quantity,
      unit_amount_cents: amount.value,
      tax_rate_bp: tax.value,
    });
  }
  return {
    ok: true,
    value: {
      items: normalizedItems,
      subtotal_cents: Number(subtotal),
      tax_cents: Number(taxTotal),
      total_cents: Number(subtotal + taxTotal),
    },
  };
}

export function validateInvoice(input) {
  if (!isRecord(input)) return invalid('La factura debe ser un objeto válido.');
  const notes = string(input.notes ?? '', { max: 5000 });
  const issuedOn = date(input.issued_on, 'La fecha de emisión');
  const dueOn = date(input.due_on, 'La fecha de vencimiento');
  const items = validateInvoiceItems(input.items);
  if (typeof input.client_id !== 'string' || !input.client_id.trim() || input.client_id.length > 150) {
    return invalid('El cliente de la factura no es válido.');
  }
  if (!currencies.has(input.currency)) return invalid('Elegí una moneda válida (UYU o USD).');
  if (!invoiceStatuses.has(input.status ?? 'open')) return invalid('La factura debe crearse como borrador o abierta.');
  if (notes === null) return invalid('Las notas de la factura son demasiado largas.');
  if (!issuedOn.ok) return issuedOn;
  if (!dueOn.ok) return dueOn;
  if (!items.ok) return items;
  if (issuedOn.value && dueOn.value && dueOn.value < issuedOn.value) {
    return invalid('El vencimiento no puede ser anterior a la emisión.');
  }
  return {
    ok: true,
    value: {
      client_id: input.client_id.trim(),
      currency: input.currency,
      status: input.status ?? 'open',
      issued_on: issuedOn.value,
      due_on: dueOn.value,
      notes,
      ...items.value,
    },
  };
}

export function validateInvoiceUpdate(input) {
  if (!isRecord(input)) return invalid('La actualización de la factura no es válida.');
  if (Object.keys(input).some((key) => !['notes', 'issued_on', 'due_on', 'items'].includes(key))) {
    return invalid('La actualización incluye campos que no se pueden modificar.');
  }
  const result = {};
  if ('notes' in input) {
    result.notes = string(input.notes, { max: 5000 });
    if (result.notes === null) return invalid('Las notas de la factura son demasiado largas.');
  }
  if ('issued_on' in input) {
    const value = date(input.issued_on, 'La fecha de emisión');
    if (!value.ok) return value;
    result.issued_on = value.value;
  }
  if ('due_on' in input) {
    const value = date(input.due_on, 'La fecha de vencimiento');
    if (!value.ok) return value;
    result.due_on = value.value;
  }
  if (result.issued_on && result.due_on && result.due_on < result.issued_on) {
    return invalid('El vencimiento no puede ser anterior a la emisión.');
  }
  if ('items' in input) {
    const items = validateInvoiceItems(input.items);
    if (!items.ok) return items;
    Object.assign(result, items.value);
  }
  if (Object.keys(result).length === 0) return invalid('Indicá al menos un campo para actualizar.');
  return { ok: true, value: result };
}

export function validateManualPayment(input) {
  if (!isRecord(input)) return invalid('El pago debe ser un objeto válido.');
  const amount = moneyCents(input.amount_cents, 'El importe del pago', { allowZero: false });
  if (!paymentMethods.has(input.method)) return invalid('Elegí un medio de pago manual válido.');
  if (!currencies.has(input.currency)) return invalid('Elegí una moneda válida (UYU o USD).');
  if (!amount.ok) return amount;
  return {
    ok: true,
    value: {
      method: input.method,
      currency: input.currency,
      amount_cents: amount.value,
    },
  };
}
