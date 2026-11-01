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
