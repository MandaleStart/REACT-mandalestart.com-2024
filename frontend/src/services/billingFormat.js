export function formatMoneyCents(amountCents, currency) {
  const amount = Number(amountCents);
  if (!Number.isSafeInteger(amount) || !['UYU', 'USD'].includes(currency)) {
    return 'Importe no disponible';
  }
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatBillingPeriod(period) {
  return (
    {
      one_time: 'Pago único',
      monthly: 'Mensual',
      yearly: 'Anual',
    }[period] || 'Sin periodicidad'
  );
}

export function toBillingApiUnits(amountInput, vatRatePercent) {
  const amount = String(amountInput ?? '')
    .trim()
    .replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    throw new Error('Ingresá un importe válido con hasta dos decimales.');
  }
  const [whole, fraction = ''] = amount.split('.');
  const amountCents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amountCents)) {
    throw new Error('El importe supera el máximo permitido.');
  }
  const result = { amount_cents: amountCents };
  if (vatRatePercent !== undefined) {
    const vatRateInput = String(vatRatePercent).trim();
    if (!['0', '10', '22'].includes(vatRateInput)) {
      throw new Error('Elegí una tasa de IVA válida.');
    }
    const vatRate = Number(vatRateInput);
    result.tax_rate_bp = vatRate * 100;
  }
  return result;
}

export function amountCentsToInput(amountCents) {
  const amount = Number(amountCents);
  if (!Number.isSafeInteger(amount) || amount < 0) return '';
  return (amount / 100).toFixed(2);
}

export function calculateInvoiceTotals(items) {
  return items.reduce(
    (totals, item) => {
      const { amount_cents: amount, tax_rate_bp: taxRate } = toBillingApiUnits(
        item.amount,
        item.vat_rate,
      );
      const quantity = Number(item.quantity);
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) {
        throw new Error('La cantidad debe ser un entero entre 1 y 100000.');
      }
      const lineSubtotal = amount * quantity;
      if (!Number.isSafeInteger(lineSubtotal)) {
        throw new Error('El total de la factura supera el máximo permitido.');
      }
      const lineTax = Number((BigInt(lineSubtotal) * BigInt(taxRate) + 5000n) / 10000n);
      const subtotal = totals.subtotal_cents + lineSubtotal;
      const tax = totals.tax_cents + lineTax;
      if (
        !Number.isSafeInteger(subtotal) ||
        !Number.isSafeInteger(tax) ||
        !Number.isSafeInteger(subtotal + tax)
      ) {
        throw new Error('El total de la factura supera el máximo permitido.');
      }
      return {
        subtotal_cents: subtotal,
        tax_cents: tax,
        total_cents: subtotal + tax,
      };
    },
    { subtotal_cents: 0, tax_cents: 0, total_cents: 0 },
  );
}

export function getMontevideoDateInputValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}
