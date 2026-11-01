function text(value) {
  return typeof value === 'string' ? value : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

export function projectClientSubscription(subscription) {
  return {
    id: text(subscription.id),
    service_type: text(subscription.service_type),
    label: text(subscription.label),
    resource_name: text(subscription.resource_name),
    status: text(subscription.status),
    currency: text(subscription.currency),
    amount_cents: subscription.amount_cents,
    billing_period: text(subscription.billing_period),
    started_on: subscription.started_on,
    renews_on: subscription.renews_on,
    cancelled_on: subscription.cancelled_on,
    auto_renew: subscription.auto_renew === true,
    details: list(subscription.details)
      .filter((detail) => detail && typeof detail === 'object' && !Array.isArray(detail))
      .map((detail) => ({
        label: text(detail.label),
        value: text(detail.value),
      })),
  };
}

function projectInvoiceItem(item) {
  return {
    description: text(item.description),
    quantity: item.quantity,
    unit_amount_cents: item.unit_amount_cents,
    tax_rate_bp: item.tax_rate_bp,
  };
}

export function projectClientInvoice(invoice) {
  const paymentStatus = ['pending', 'approved', 'rejected'].includes(invoice.payment_status)
    ? invoice.payment_status
    : undefined;
  return {
    id: text(invoice.id),
    number: text(invoice.number),
    status: text(invoice.status),
    currency: text(invoice.currency),
    subtotal_cents: invoice.subtotal_cents,
    tax_cents: invoice.tax_cents,
    total_cents: invoice.total_cents,
    issued_on: invoice.issued_on,
    due_on: invoice.due_on,
    paid_at: invoice.paid_at,
    ...(paymentStatus ? { payment_status: paymentStatus } : {}),
    created_at: invoice.created_at,
    ...(invoice.notes === undefined ? {} : { notes: text(invoice.notes) }),
    ...(Array.isArray(invoice.items) ? { items: invoice.items.map(projectInvoiceItem) } : {}),
  };
}
