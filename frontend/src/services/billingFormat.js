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
  return {
    one_time: 'Pago único',
    monthly: 'Mensual',
    yearly: 'Anual',
  }[period] || 'Sin periodicidad';
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
