function pick(value, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => value?.[field] !== undefined)
      .map((field) => [field, value[field]]),
  );
}

const profileFields = [
  'name',
  'email',
  'phone',
  'company',
  'tax_id',
  'billing_email',
  'billing_address',
];
const projectFields = [
  'id',
  'title',
  'description',
  'status',
  'startDate',
  'targetDate',
];
const subscriptionFields = [
  'id',
  'service_type',
  'label',
  'resource_name',
  'status',
  'currency',
  'amount_cents',
  'billing_period',
  'started_on',
  'renews_on',
  'cancelled_on',
  'auto_renew',
];
const invoiceFields = [
  'id',
  'number',
  'status',
  'currency',
  'subtotal_cents',
  'tax_cents',
  'total_cents',
  'issued_on',
  'due_on',
  'paid_at',
  'payment_status',
  'created_at',
  'notes',
];

export function buildClientDataExport({ account, subscriptions, invoices, exportedAt }) {
  return {
    format_version: 1,
    exported_at: exportedAt,
    profile: pick(account, profileFields),
    projects: Array.isArray(account?.projects)
      ? account.projects.map((project) => ({
          ...pick(project, projectFields),
          milestones: Array.isArray(project.milestones)
            ? project.milestones.map((milestone) =>
                pick(milestone, ['id', 'title', 'description', 'status', 'dueDate']),
              )
            : [],
        }))
      : [],
    subscriptions: Array.isArray(subscriptions)
      ? subscriptions.map((subscription) => ({
          ...pick(subscription, subscriptionFields),
          details: Array.isArray(subscription.details)
            ? subscription.details.map((detail) => pick(detail, ['label', 'value']))
            : [],
        }))
      : [],
    invoices: Array.isArray(invoices)
      ? invoices.map((invoice) => ({
          ...pick(invoice, invoiceFields),
          items: Array.isArray(invoice.items)
            ? invoice.items.map((item) =>
                pick(item, ['description', 'quantity', 'unit_amount_cents', 'tax_rate_bp']),
              )
            : [],
        }))
      : [],
  };
}
