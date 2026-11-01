import { randomUUID } from 'node:crypto';
import { getPostgresPool, query } from './postgres.js';

const planColumns = `id, service_slug, code, name, description, currency,
  amount_cents, billing_period, tax_rate_bp, features, is_public, is_active,
  created_at, to_char(updated_at AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`;
const subscriptionColumns = `id, client_id, plan_id, service_type, label,
  resource_name, status, currency, amount_cents, billing_period, started_on,
  renews_on, cancelled_on, auto_renew, details, internal_notes, created_at,
  to_char(updated_at AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`;
const invoiceColumns = `id, number, client_id, status, currency, subtotal_cents,
  tax_cents, total_cents, issued_on, due_on, paid_at, notes, created_at,
  to_char(updated_at AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`;
const invoiceListColumns = `i.id, i.number, i.client_id, i.status, i.currency,
  i.subtotal_cents, i.tax_cents, i.total_cents, i.issued_on, i.due_on, i.paid_at,
  i.notes, i.created_at,
  to_char(i.updated_at AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`;
const clientPaymentStatus = `CASE
  WHEN i.status = 'paid' OR COALESCE((
    SELECT SUM(p.amount_cents) FROM payments p
    WHERE p.invoice_id = i.id AND p.status = 'approved'
  ), 0) >= i.total_cents THEN 'approved'
  WHEN EXISTS (
    SELECT 1 FROM payments p
    WHERE p.invoice_id = i.id AND p.status = 'pending'
      AND p.method = 'mercadopago'
      AND (p.provider_payload->>'expires_at')::timestamptz > now()
  ) THEN 'pending'
  WHEN EXISTS (
    SELECT 1 FROM payments p
    WHERE p.invoice_id = i.id AND p.status = 'rejected'
  ) THEN 'rejected'
  ELSE NULL
END AS payment_status`;

async function transaction(callback) {
  const connection = await getPostgresPool().connect();
  try {
    await connection.query('BEGIN');
    const result = await callback(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}

function actorFields(actor) {
  if (
    !actor ||
    typeof actor.uid !== 'string' ||
    !actor.uid ||
    typeof actor.email !== 'string' ||
    !actor.email
  ) {
    throw Object.assign(
      new Error('No se pudo identificar al administrador para auditar el cambio.'),
      {
        code: 'INVALID_AUDIT_ACTOR',
      },
    );
  }
  return [actor.uid, actor.email];
}

async function writeAudit(connection, actor, action, entityType, entityId, changes) {
  const [actorUid, actorEmail] = actorFields(actor);
  await connection.query(
    `INSERT INTO audit_log
      (actor_uid, actor_email, action, entity_type, entity_id, changes)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [actorUid, actorEmail, action, entityType, entityId, JSON.stringify(changes)],
  );
}

async function hasActiveMercadoPagoCheckout(connection, invoiceId) {
  const pending = await connection.query(
    `SELECT 1 FROM payments
     WHERE invoice_id = $1 AND method = 'mercadopago'
       AND status = 'pending' AND provider_payment_id IS NULL
       AND (
         (provider_payload->>'expires_at')::timestamptz > now()
         OR (
           provider_payload->>'checkout_state' = 'creating'
           AND created_at > now() - interval '2 minutes'
         )
       )
     LIMIT 1`,
    [invoiceId],
  );
  return pending.rowCount > 0;
}

async function extendPaidInvoiceSubscriptions(connection, invoiceId) {
  await connection.query(
    `UPDATE subscriptions AS subscription
     SET renews_on = (
       GREATEST(
         COALESCE(subscription.renews_on, (now() AT TIME ZONE 'America/Montevideo')::date),
         (now() AT TIME ZONE 'America/Montevideo')::date
       ) + CASE subscription.billing_period
         WHEN 'monthly' THEN INTERVAL '1 month'
         WHEN 'yearly' THEN INTERVAL '1 year'
       END
     )::date,
       updated_at = now()
     WHERE subscription.status = 'active'
       AND subscription.billing_period IN ('monthly', 'yearly')
       AND subscription.id IN (
         SELECT subscription_id FROM invoice_items
         WHERE invoice_id = $1 AND subscription_id IS NOT NULL
       )`,
    [invoiceId],
  );
}

export async function recordAdminAudit(actor, action, entityType, entityId, changes) {
  return transaction((connection) =>
    writeAudit(connection, actor, action, entityType, entityId, changes),
  );
}

async function insertInvoiceItems(connection, invoiceId, clientId, items) {
  for (const item of items) {
    if (item.subscription_id) {
      const subscription = await connection.query(
        'SELECT 1 FROM subscriptions WHERE id = $1 AND client_id = $2',
        [item.subscription_id, clientId],
      );
      if (!subscription.rowCount) {
        throw Object.assign(
          new Error('La suscripción del concepto no pertenece al cliente de la factura.'),
          {
            code: 'INVALID_INVOICE_SUBSCRIPTION',
          },
        );
      }
    }
    await connection.query(
      `INSERT INTO invoice_items
        (id, invoice_id, subscription_id, description, quantity, unit_amount_cents, tax_rate_bp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        invoiceId,
        item.subscription_id,
        item.description,
        item.quantity,
        item.unit_amount_cents,
        item.tax_rate_bp,
      ],
    );
  }
}

export async function listPlans() {
  const result = await query(`SELECT ${planColumns} FROM plans ORDER BY service_slug, code`);
  return result.rows;
}

export async function createPlan(plan, actor) {
  return transaction(async (connection) => {
    const result = await connection.query(
      `INSERT INTO plans
        (service_slug, code, name, description, currency, amount_cents,
         billing_period, tax_rate_bp, features, is_public, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
       RETURNING ${planColumns}`,
      [
        plan.service_slug,
        plan.code,
        plan.name,
        plan.description,
        plan.currency,
        plan.amount_cents,
        plan.billing_period,
        plan.tax_rate_bp,
        JSON.stringify(plan.features),
        plan.is_public,
        plan.is_active,
      ],
    );
    const created = result.rows[0];
    await writeAudit(connection, actor, 'plan.create', 'plan', created.id, {
      after: created,
    });
    return created;
  });
}

export async function updatePlan(id, plan, updatedAt, actor) {
  return transaction(async (connection) => {
    const existing = await connection.query('SELECT 1 FROM plans WHERE id = $1', [id]);
    if (!existing.rowCount) return { status: 'not-found' };
    const result = await connection.query(
      `UPDATE plans
       SET service_slug = $2, code = $3, name = $4, description = $5,
           currency = $6, amount_cents = $7, billing_period = $8,
           tax_rate_bp = $9, features = $10::jsonb, is_public = $11,
           is_active = $12, updated_at = now()
       WHERE id = $1 AND updated_at = $13::timestamptz
       RETURNING ${planColumns}`,
      [
        id,
        plan.service_slug,
        plan.code,
        plan.name,
        plan.description,
        plan.currency,
        plan.amount_cents,
        plan.billing_period,
        plan.tax_rate_bp,
        JSON.stringify(plan.features),
        plan.is_public,
        plan.is_active,
        updatedAt,
      ],
    );
    const updated = result.rows[0];
    if (!updated) return { status: 'conflict' };
    await writeAudit(connection, actor, 'plan.update', 'plan', id, {
      after: updated,
    });
    return { status: 'updated', record: updated };
  });
}

export async function deactivatePlan(id, actor) {
  return transaction(async (connection) => {
    const result = await connection.query(
      `UPDATE plans SET is_active = false, updated_at = now()
       WHERE id = $1 AND is_active = true
       RETURNING ${planColumns}`,
      [id],
    );
    const plan = result.rows[0];
    if (!plan) return { status: 'not-found' };
    await writeAudit(connection, actor, 'plan.deactivate', 'plan', id, {
      after: plan,
    });
    return { status: 'deactivated', record: plan };
  });
}

export async function listSubscriptionsByClient(clientId) {
  const result = await query(
    `SELECT ${subscriptionColumns} FROM subscriptions
     WHERE client_id = $1 ORDER BY created_at DESC, id`,
    [clientId],
  );
  return result.rows;
}

export async function listClientSubscriptions(clientId) {
  const result = await query(
    `SELECT id, service_type, label, resource_name, status, currency,
      amount_cents, billing_period, started_on, renews_on, cancelled_on,
      auto_renew, details, created_at, updated_at
     FROM subscriptions
     WHERE client_id = $1
     ORDER BY created_at DESC, id`,
    [clientId],
  );
  return result.rows;
}

export async function listDashboardSubscriptions() {
  const result = await query(
    `SELECT id, client_id, label, resource_name, status, renews_on
     FROM subscriptions ORDER BY client_id, id`,
  );
  return result.rows;
}

export async function createSubscription(subscription, actor) {
  return transaction(async (connection) => {
    const result = await connection.query(
      `INSERT INTO subscriptions
        (client_id, plan_id, service_type, label, resource_name, status,
         currency, amount_cents, billing_period, started_on, renews_on,
         cancelled_on, auto_renew, details, internal_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15)
       RETURNING ${subscriptionColumns}`,
      [
        subscription.client_id,
        subscription.plan_id,
        subscription.service_type,
        subscription.label,
        subscription.resource_name,
        subscription.status,
        subscription.currency,
        subscription.amount_cents,
        subscription.billing_period,
        subscription.started_on,
        subscription.renews_on,
        subscription.cancelled_on,
        subscription.auto_renew,
        JSON.stringify(subscription.details),
        subscription.internal_notes,
      ],
    );
    const created = result.rows[0];
    await writeAudit(connection, actor, 'subscription.create', 'subscription', created.id, {
      after: created,
    });
    return created;
  });
}

export async function getSubscription(id) {
  const result = await query(`SELECT ${subscriptionColumns} FROM subscriptions WHERE id = $1`, [
    id,
  ]);
  return result.rows[0] || null;
}

export async function updateSubscription(id, subscription, updatedAt, actor) {
  return transaction(async (connection) => {
    const existing = await connection.query('SELECT 1 FROM subscriptions WHERE id = $1', [id]);
    if (!existing.rowCount) return { status: 'not-found' };
    const result = await connection.query(
      `UPDATE subscriptions
       SET client_id = $2, plan_id = $3, service_type = $4, label = $5,
           resource_name = $6, status = $7, currency = $8, amount_cents = $9,
           billing_period = $10, started_on = $11, renews_on = $12,
           cancelled_on = $13, auto_renew = $14, details = $15::jsonb,
           internal_notes = $16, updated_at = now()
       WHERE id = $1 AND updated_at = $17::timestamptz
       RETURNING ${subscriptionColumns}`,
      [
        id,
        subscription.client_id,
        subscription.plan_id,
        subscription.service_type,
        subscription.label,
        subscription.resource_name,
        subscription.status,
        subscription.currency,
        subscription.amount_cents,
        subscription.billing_period,
        subscription.started_on,
        subscription.renews_on,
        subscription.cancelled_on,
        subscription.auto_renew,
        JSON.stringify(subscription.details),
        subscription.internal_notes,
        updatedAt,
      ],
    );
    const updated = result.rows[0];
    if (!updated) return { status: 'conflict' };
    await writeAudit(connection, actor, 'subscription.update', 'subscription', id, {
      after: updated,
    });
    return { status: 'updated', record: updated };
  });
}

export async function cancelSubscription(id, actor) {
  return transaction(async (connection) => {
    const result = await connection.query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_on = CURRENT_DATE,
        auto_renew = false, updated_at = now()
       WHERE id = $1 AND status NOT IN ('cancelled', 'expired')
       RETURNING ${subscriptionColumns}`,
      [id],
    );
    const subscription = result.rows[0];
    if (!subscription) return { status: 'not-found' };
    await writeAudit(connection, actor, 'subscription.cancel', 'subscription', id, {
      after: subscription,
    });
    return { status: 'cancelled', record: subscription };
  });
}

export async function listInvoices(filters) {
  const conditions = [];
  const values = [];
  for (const [field, value] of Object.entries(filters)) {
    if (!['status', 'client_id', 'from', 'to'].includes(field)) continue;
    if (value === undefined || value === null || value === '') continue;
    values.push(value);
    if (field === 'from') conditions.push(`issued_on >= $${values.length}::date`);
    else if (field === 'to') conditions.push(`issued_on <= $${values.length}::date`);
    else conditions.push(`i.${field} = $${values.length}`);
  }
  if (filters.search) {
    const escapedSearch = filters.search.replace(/[\\%_]/g, '\\$&');
    values.push(`%${escapedSearch}%`);
    const textParameter = values.length;
    values.push(filters.amount_cents ?? null);
    const amountParameter = values.length;
    conditions.push(
      `(i.number ILIKE $${textParameter} ESCAPE E'\\\\' OR c.name ILIKE $${textParameter} ESCAPE E'\\\\' OR c.email ILIKE $${textParameter} ESCAPE E'\\\\' OR ($${amountParameter}::bigint IS NOT NULL AND i.total_cents = $${amountParameter}::bigint))`,
    );
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query(
    `SELECT COUNT(*)::integer AS total
     FROM invoices AS i
     JOIN client_accounts AS c ON c.id = i.client_id
     ${where}`,
    values,
  );
  const total = countResult.rows[0].total;
  values.push(filters.limit ?? 100);
  const limitParameter = values.length;
  values.push(filters.offset ?? 0);
  const result = await query(
    `SELECT ${invoiceListColumns} FROM invoices AS i
     JOIN client_accounts AS c ON c.id = i.client_id
     ${where}
     ORDER BY i.issued_on DESC NULLS LAST, i.created_at DESC
     LIMIT $${limitParameter} OFFSET $${values.length}`,
    values,
  );
  return {
    items: result.rows,
    total,
    limit: filters.limit ?? 100,
    offset: filters.offset ?? 0,
  };
}

async function buildNextInvoiceNumber(connection) {
  const yearParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
  }).formatToParts(new Date());
  const year = yearParts.find((part) => part.type === 'year')?.value;
  await connection.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`invoice-number:${year}`]);
  const result = await connection.query(
    `SELECT COALESCE(MAX(substring(number from 9)::integer), 0) + 1 AS next_number
     FROM invoices WHERE number LIKE $1`,
    [`MS-${year}-%`],
  );
  return `MS-${year}-${String(result.rows[0].next_number).padStart(4, '0')}`;
}

export async function createInvoice(invoice, actor) {
  return transaction(async (connection) => {
    const client = await connection.query(
      'SELECT id FROM client_accounts WHERE id = $1 AND archived_at IS NULL FOR KEY SHARE',
      [invoice.client_id],
    );
    if (!client.rowCount) {
      throw Object.assign(new Error('El cliente no existe o está archivado.'), {
        code: 'INVALID_INVOICE_CLIENT',
      });
    }
    const number = await buildNextInvoiceNumber(connection);
    const result = await connection.query(
      `INSERT INTO invoices
        (number, client_id, status, currency, subtotal_cents, tax_cents,
         total_cents, issued_on, due_on, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${invoiceColumns}`,
      [
        number,
        invoice.client_id,
        invoice.status,
        invoice.currency,
        invoice.subtotal_cents,
        invoice.tax_cents,
        invoice.total_cents,
        invoice.issued_on,
        invoice.due_on,
        invoice.notes,
      ],
    );
    const created = result.rows[0];
    await insertInvoiceItems(connection, created.id, created.client_id, invoice.items);
    await writeAudit(connection, actor, 'invoice.create', 'invoice', created.id, {
      after: created,
    });
    return created;
  });
}

export async function getInvoice(id) {
  const result = await query(`SELECT ${invoiceColumns} FROM invoices WHERE id = $1`, [id]);
  if (!result.rows[0]) return null;
  const [items, payments] = await Promise.all([
    query(
      `SELECT id, invoice_id, subscription_id, description, quantity,
        unit_amount_cents, tax_rate_bp FROM invoice_items WHERE invoice_id = $1 ORDER BY id`,
      [id],
    ),
    query(
      `SELECT id, invoice_id, method, status, currency, amount_cents,
        provider_payment_id, provider_payload, recorded_by, created_at
       FROM payments WHERE invoice_id = $1 ORDER BY created_at DESC`,
      [id],
    ),
  ]);
  return { ...result.rows[0], items: items.rows, payments: payments.rows };
}

export async function listClientInvoices(clientId) {
  const result = await query(
    `SELECT i.id, i.number, i.status, i.currency, i.subtotal_cents, i.tax_cents,
      i.total_cents, i.issued_on, i.due_on, i.paid_at, i.created_at, i.updated_at,
      ${clientPaymentStatus}
     FROM invoices i
     WHERE i.client_id = $1 AND i.status NOT IN ('draft', 'void')
     ORDER BY i.issued_on DESC NULLS LAST, i.created_at DESC`,
    [clientId],
  );
  return result.rows;
}

export async function getClientInvoice(clientId, invoiceId) {
  const result = await query(
    `SELECT i.id, i.number, i.status, i.currency, i.subtotal_cents, i.tax_cents,
      i.total_cents, i.issued_on, i.due_on, i.paid_at, i.notes, i.created_at,
      i.updated_at, ${clientPaymentStatus}
     FROM invoices i
     WHERE i.id = $1 AND i.client_id = $2 AND i.status NOT IN ('draft', 'void')`,
    [invoiceId, clientId],
  );
  const invoice = result.rows[0];
  if (!invoice) return null;
  const items = await query(
    `SELECT description, quantity, unit_amount_cents, tax_rate_bp
     FROM invoice_items WHERE invoice_id = $1 ORDER BY id`,
    [invoice.id],
  );
  return { ...invoice, items: items.rows };
}

export async function createMercadoPagoCheckout(clientId, invoiceId, createPreference) {
  const reservation = await transaction(async (connection) => {
    const invoiceResult = await connection.query(
      `SELECT i.id, i.number, i.status, i.currency, i.total_cents, c.email
       FROM invoices i
       JOIN client_accounts c ON c.id = i.client_id
       WHERE i.id = $1 AND i.client_id = $2 AND i.status NOT IN ('draft', 'void')
       FOR UPDATE OF i`,
      [invoiceId, clientId],
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) return { result: { status: 'not-found' } };
    if (!['open', 'overdue'].includes(invoice.status)) {
      return { result: { status: 'not-payable' } };
    }

    const paidResult = await connection.query(
      `SELECT COALESCE(SUM(amount_cents), 0)::numeric AS paid_cents
       FROM payments WHERE invoice_id = $1 AND status = 'approved'`,
      [invoiceId],
    );
    const balanceCents = BigInt(invoice.total_cents) - BigInt(paidResult.rows[0].paid_cents);
    if (balanceCents <= 0n) return { result: { status: 'not-payable' } };

    const pendingResult = await connection.query(
      `SELECT id, amount_cents, provider_payload, created_at
       FROM payments
       WHERE invoice_id = $1 AND method = 'mercadopago'
         AND status = 'pending' AND provider_payment_id IS NULL
       ORDER BY created_at DESC FOR UPDATE`,
      [invoiceId],
    );
    const pendingCheckout = pendingResult.rows.find(
      (checkout) =>
        BigInt(checkout.amount_cents) === balanceCents &&
        typeof checkout.provider_payload?.init_point === 'string' &&
        Date.parse(checkout.provider_payload?.expires_at) > Date.now(),
    );
    if (pendingCheckout) {
      return { result: {
        status: 'ready',
        checkout_url: pendingCheckout.provider_payload.init_point,
        expires_at: pendingCheckout.provider_payload.expires_at,
      } };
    }

    const creatingCheckout = pendingResult.rows.find(
      (checkout) =>
        checkout.provider_payload?.checkout_state === 'creating' &&
        Date.parse(checkout.created_at) > Date.now() - 2 * 60 * 1000,
    );
    if (creatingCheckout) return { result: { status: 'creating' } };

    await connection.query(
      `UPDATE payments
       SET status = 'rejected',
           provider_payload = COALESCE(provider_payload, '{}'::jsonb) ||
             jsonb_build_object('checkout_state', 'expired')
       WHERE invoice_id = $1 AND method = 'mercadopago'
         AND status = 'pending' AND provider_payment_id IS NULL`,
      [invoiceId],
    );
    const created = await connection.query(
      `INSERT INTO payments
        (invoice_id, method, status, currency, amount_cents, provider_payload)
       VALUES ($1, 'mercadopago', 'pending', $2, $3, $4::jsonb)
       RETURNING id`,
      [
        invoiceId,
        invoice.currency,
        Number(balanceCents),
        JSON.stringify({ checkout_state: 'creating' }),
      ],
    );
    return {
      invoice: { ...invoice, id: invoice.id, email: invoice.email },
      amountCents: Number(balanceCents),
      paymentId: created.rows[0].id,
      result: null,
    };
  });

  if (reservation.result) return reservation.result;

  let preference;
  try {
    preference = await createPreference({
      invoice: reservation.invoice,
      amountCents: reservation.amountCents,
      idempotencyKey: reservation.paymentId,
    });
  } catch (error) {
    await query(
      `UPDATE payments
       SET status = 'rejected',
           provider_payload = COALESCE(provider_payload, '{}'::jsonb) ||
             jsonb_build_object('checkout_state', 'failed')
       WHERE id = $1 AND status = 'pending' AND provider_payment_id IS NULL`,
      [reservation.paymentId],
    );
    throw error;
  }

  return transaction(async (connection) => {
    const invoiceResult = await connection.query(
      `SELECT id, status, currency, total_cents FROM invoices WHERE id = $1 FOR UPDATE`,
      [invoiceId],
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice || !['open', 'overdue'].includes(invoice.status)) {
      await connection.query(
        `UPDATE payments
         SET status = 'rejected',
             provider_payload = COALESCE(provider_payload, '{}'::jsonb) ||
               jsonb_build_object('checkout_state', 'not-payable')
         WHERE id = $1 AND status = 'pending' AND provider_payment_id IS NULL`,
        [reservation.paymentId],
      );
      return { status: 'not-payable' };
    }

    const paidResult = await connection.query(
      `SELECT COALESCE(SUM(amount_cents), 0)::numeric AS paid_cents
       FROM payments WHERE invoice_id = $1 AND status = 'approved'`,
      [invoiceId],
    );
    const balanceCents = BigInt(invoice.total_cents) - BigInt(paidResult.rows[0].paid_cents);
    if (invoice.currency !== reservation.invoice.currency ||
      balanceCents !== BigInt(reservation.amountCents)) {
      await connection.query(
        `UPDATE payments
         SET status = 'rejected',
             provider_payload = COALESCE(provider_payload, '{}'::jsonb) ||
               jsonb_build_object('checkout_state', 'stale')
         WHERE id = $1 AND status = 'pending' AND provider_payment_id IS NULL`,
        [reservation.paymentId],
      );
      return { status: 'not-payable' };
    }

    const payload = JSON.stringify({
      preference_id: preference.preference_id,
      init_point: preference.init_point,
      expires_at: preference.expires_at,
      checkout_state: 'ready',
    });
    const updated = await connection.query(
      `UPDATE payments SET provider_payload = $2::jsonb
       WHERE id = $1 AND status = 'pending' AND provider_payment_id IS NULL
       RETURNING id`,
      [reservation.paymentId, payload],
    );
    if (!updated.rowCount) return { status: 'not-payable' };
    return {
      status: 'ready',
      checkout_url: preference.init_point,
      expires_at: preference.expires_at,
    };
  });
}

export async function approveMercadoPagoPayment(payment) {
  return transaction(async (connection) => {
    const existingPayment = await connection.query(
      `SELECT id FROM payments
       WHERE method = 'mercadopago' AND provider_payment_id = $1`,
      [payment.provider_payment_id],
    );
    if (existingPayment.rowCount) return { status: 'duplicate' };

    const invoiceResult = await connection.query(
      `SELECT ${invoiceColumns} FROM invoices WHERE id = $1 FOR UPDATE`,
      [payment.external_reference],
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) return { status: 'invoice-not-found' };
    const confirmedDuplicate = await connection.query(
      `SELECT id FROM payments
       WHERE method = 'mercadopago' AND provider_payment_id = $1`,
      [payment.provider_payment_id],
    );
    if (confirmedDuplicate.rowCount) return { status: 'duplicate' };
    if (!['open', 'overdue'].includes(invoice.status)) return { status: 'not-payable' };

    const pendingResult = await connection.query(
      `SELECT id, amount_cents, currency, provider_payload
       FROM payments
       WHERE invoice_id = $1 AND method = 'mercadopago'
         AND status = 'pending' AND provider_payment_id IS NULL
         AND (provider_payload->>'expires_at')::timestamptz > now()
         AND ($2::text IS NULL OR provider_payload->>'preference_id' = $2)
       ORDER BY created_at DESC
       FOR UPDATE`,
      [invoice.id, payment.preference_id || null],
    );
    const matchingCheckouts = pendingResult.rows.filter((checkout) =>
      BigInt(checkout.amount_cents) === BigInt(payment.amount_cents) &&
      checkout.currency === payment.currency);
    const pendingCheckout =
      matchingCheckouts.length === 1 ? matchingCheckouts[0] : null;
    if (!pendingCheckout) return { status: 'checkout-not-found' };
    if (invoice.currency !== payment.currency || pendingCheckout.currency !== payment.currency) {
      return { status: 'currency-mismatch' };
    }

    const paidResult = await connection.query(
      `SELECT COALESCE(SUM(amount_cents), 0)::numeric AS paid_cents
       FROM payments WHERE invoice_id = $1 AND status = 'approved'`,
      [invoice.id],
    );
    const remaining = BigInt(invoice.total_cents) - BigInt(paidResult.rows[0].paid_cents);
    if (
      remaining <= 0n ||
      BigInt(payment.amount_cents) !== remaining ||
      BigInt(pendingCheckout.amount_cents) !== remaining
    )
      return { status: 'amount-mismatch' };

    const recorded = await connection.query(
      `UPDATE payments
       SET status = 'approved', provider_payment_id = $2, provider_payload = $3::jsonb
       WHERE id = $1
       RETURNING id, invoice_id, method, status, currency, amount_cents,
         provider_payment_id, created_at`,
      [pendingCheckout.id, payment.provider_payment_id, JSON.stringify(payment.provider_payload)],
    );
    const updatedInvoice = await connection.query(
      `UPDATE invoices SET status = 'paid', paid_at = now(), updated_at = now()
       WHERE id = $1 RETURNING ${invoiceColumns}`,
      [invoice.id],
    );
    await extendPaidInvoiceSubscriptions(connection, invoice.id);
    await writeAudit(
      connection,
      { uid: 'mercadopago-webhook', email: 'mercadopago@system.invalid' },
      'invoice.payment_mercadopago',
      'invoice',
      invoice.id,
      {
        payment: recorded.rows[0],
        invoice_status: updatedInvoice.rows[0].status,
      },
    );
    return { status: 'approved' };
  });
}

export async function enqueueMercadoPagoWebhook(providerPaymentId, requestId) {
  const result = await query(
    `INSERT INTO mercadopago_webhook_events (provider_payment_id, request_id)
     VALUES ($1, $2)
     ON CONFLICT (provider_payment_id, request_id) DO NOTHING
     RETURNING id`,
    [providerPaymentId, requestId],
  );
  return result.rowCount > 0;
}

export async function claimMercadoPagoWebhookEvents(limit = 5) {
  const result = await query(
    `WITH candidates AS (
       SELECT id FROM mercadopago_webhook_events
       WHERE processed_at IS NULL
         AND available_at <= now()
         AND (locked_until IS NULL OR locked_until < now())
       ORDER BY received_at, id
       FOR UPDATE SKIP LOCKED
       LIMIT $1
     )
     UPDATE mercadopago_webhook_events AS events
     SET locked_until = now() + interval '2 minutes',
         attempts = events.attempts + 1
     FROM candidates
     WHERE events.id = candidates.id
     RETURNING events.id, events.provider_payment_id, events.request_id, events.attempts`,
    [limit],
  );
  return result.rows;
}

export async function completeMercadoPagoWebhookEvent(id) {
  await query(
    `UPDATE mercadopago_webhook_events
     SET processed_at = now(), locked_until = NULL, last_error = NULL
     WHERE id = $1 AND processed_at IS NULL`,
    [id],
  );
}

export async function retryMercadoPagoWebhookEvent(id, errorCode) {
  await query(
    `UPDATE mercadopago_webhook_events
     SET available_at = now() + make_interval(secs => LEAST(300, 2 ^ LEAST(attempts, 8))),
         locked_until = NULL, last_error = $2
     WHERE id = $1 AND processed_at IS NULL`,
    [id, typeof errorCode === 'string' ? errorCode.slice(0, 100) : 'UNKNOWN_ERROR'],
  );
}

export async function recordUnappliedMercadoPagoPayment(payment, reason) {
  const invoiceResult = payment.external_reference
    ? await query('SELECT id FROM invoices WHERE id = $1', [payment.external_reference])
    : { rows: [] };
  const result = await query(
    `INSERT INTO unapplied_payments
       (provider_payment_id, invoice_id, external_reference, reason,
        amount_cents, currency, provider_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     ON CONFLICT (provider_payment_id) DO NOTHING
     RETURNING id`,
    [
      payment.provider_payment_id,
      invoiceResult.rows[0]?.id || null,
      payment.external_reference || null,
      reason,
      payment.amount_cents,
      payment.currency,
      JSON.stringify(payment.provider_payload),
    ],
  );
  return result.rowCount > 0;
}

export async function listUnappliedMercadoPagoPayments({ limit = 100, offset = 0 } = {}) {
  const result = await query(
    `SELECT up.id, up.provider_payment_id, up.invoice_id, up.external_reference,
       up.reason, up.amount_cents, up.currency, up.status, up.created_at,
       up.provider_payload->>'preference_id' AS preference_id,
       i.number AS invoice_number, c.name AS client_name
     FROM unapplied_payments up
     LEFT JOIN invoices i ON i.id = up.invoice_id
     LEFT JOIN client_accounts c ON c.id = i.client_id
     WHERE up.status = 'pending_review'
     ORDER BY up.created_at DESC, up.id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return result.rows;
}

export async function countPendingUnappliedMercadoPagoPayments(queryFn = query) {
  const table = await queryFn(`SELECT to_regclass('unapplied_payments') AS table_name`);
  if (!table.rows[0]?.table_name) return { available: false, count: null };
  const result = await queryFn(
    `SELECT COUNT(*)::integer AS count
     FROM unapplied_payments WHERE status = 'pending_review'`,
  );
  return { available: true, count: result.rows[0].count };
}

export async function getMercadoPagoWebhookBacklogSummary(queryFn = query) {
  const table = await queryFn(
    `SELECT to_regclass('public.mercadopago_webhook_events') AS table_name`,
  );
  if (!table.rows[0]?.table_name) {
    return {
      available: false,
      pending_count: null,
      oldest_pending_age_seconds: null,
      alert: false,
    };
  }
  const result = await queryFn(
    `SELECT COUNT(*)::integer AS pending_count,
       COALESCE(
         FLOOR(EXTRACT(EPOCH FROM (now() - MIN(received_at))))::bigint,
         0
       ) AS oldest_pending_age_seconds
     FROM mercadopago_webhook_events
     WHERE processed_at IS NULL`,
  );
  const pendingCount = Number(result.rows[0]?.pending_count ?? 0);
  const oldestAge = Number(result.rows[0]?.oldest_pending_age_seconds ?? 0);
  return {
    available: true,
    pending_count: pendingCount,
    oldest_pending_age_seconds: oldestAge,
    alert: pendingCount > 0 && oldestAge > 600,
  };
}

export async function applyUnappliedMercadoPagoPayment(id, invoiceId, actor) {
  return transaction(async (connection) => {
    const unappliedResult = await connection.query(
      `SELECT id, provider_payment_id, external_reference, reason, amount_cents,
         currency, status, provider_payload
       FROM unapplied_payments WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const unapplied = unappliedResult.rows[0];
    if (!unapplied) return { status: 'not-found' };
    if (unapplied.status !== 'pending_review') return { status: 'not-reviewable' };
    if (!unapplied.amount_cents || !unapplied.currency) {
      return { status: 'invalid-payment' };
    }

    const invoiceResult = await connection.query(
      `SELECT ${invoiceColumns} FROM invoices WHERE id = $1 FOR UPDATE`,
      [invoiceId],
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) return { status: 'invoice-not-found' };
    if (!['open', 'overdue'].includes(invoice.status)) return { status: 'not-payable' };
    if (invoice.currency !== unapplied.currency) return { status: 'currency-mismatch' };

    const paidResult = await connection.query(
      `SELECT COALESCE(SUM(amount_cents), 0)::numeric AS paid_cents
       FROM payments WHERE invoice_id = $1 AND status = 'approved'`,
      [invoiceId],
    );
    const remaining = BigInt(invoice.total_cents) - BigInt(paidResult.rows[0].paid_cents);
    const amount = BigInt(unapplied.amount_cents);
    if (remaining <= 0n || amount > remaining) return { status: 'overpayment' };

    const paymentResult = await connection.query(
      `INSERT INTO payments
         (invoice_id, method, status, currency, amount_cents, provider_payment_id,
          provider_payload, recorded_by)
       VALUES ($1, 'mercadopago', 'approved', $2, $3, $4, $5::jsonb, $6)
       RETURNING id, invoice_id, method, status, currency, amount_cents,
         provider_payment_id, created_at`,
      [
        invoiceId,
        unapplied.currency,
        unapplied.amount_cents,
        unapplied.provider_payment_id,
        JSON.stringify(unapplied.provider_payload),
        actor.uid,
      ],
    );
    const isPaid = amount === remaining;
    const invoiceUpdate = await connection.query(
      `UPDATE invoices
       SET status = CASE WHEN $2 THEN 'paid' ELSE status END,
           paid_at = CASE WHEN $2 THEN now() ELSE paid_at END,
           updated_at = now()
       WHERE id = $1 RETURNING ${invoiceColumns}`,
      [invoiceId, isPaid],
    );
    await connection.query(
      `UPDATE unapplied_payments
       SET status = 'applied', invoice_id = $2, updated_at = now()
       WHERE id = $1`,
      [id, invoiceId],
    );
    if (isPaid) await extendPaidInvoiceSubscriptions(connection, invoiceId);
    await writeAudit(connection, actor, 'mercadopago.unapplied_payment.apply', 'invoice', invoiceId, {
      unapplied_payment_id: id,
      payment: paymentResult.rows[0],
      invoice: invoiceUpdate.rows[0],
    });
    return {
      status: 'applied',
      payment: paymentResult.rows[0],
      invoice: invoiceUpdate.rows[0],
    };
  });
}

export async function dismissUnappliedMercadoPagoPayment(id, actor) {
  return transaction(async (connection) => {
    const result = await connection.query(
      `SELECT id, provider_payment_id, invoice_id, reason, amount_cents, currency, status
       FROM unapplied_payments WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const payment = result.rows[0];
    if (!payment) return { status: 'not-found' };
    if (payment.status !== 'pending_review') return { status: 'not-reviewable' };
    await connection.query(
      `UPDATE unapplied_payments SET status = 'dismissed', updated_at = now() WHERE id = $1`,
      [id],
    );
    await writeAudit(
      connection,
      actor,
      'mercadopago.unapplied_payment.dismiss',
      'invoice',
      payment.invoice_id || payment.provider_payment_id,
      { unapplied_payment: payment },
    );
    return { status: 'dismissed' };
  });
}

export async function recordMercadoPagoReversal(reversal) {
  return transaction(async (connection) => {
    const paymentResult = await connection.query(
      `SELECT id, invoice_id, status FROM payments
       WHERE method = 'mercadopago' AND provider_payment_id = $1
       FOR UPDATE`,
      [reversal.provider_payment_id],
    );
    const payment = paymentResult.rows[0];
    if (!payment) {
      const invoiceResult = reversal.external_reference
        ? await connection.query('SELECT id FROM invoices WHERE id = $1', [
            reversal.external_reference,
          ])
        : { rows: [] };
      await connection.query(
        `INSERT INTO unapplied_payments
           (provider_payment_id, invoice_id, external_reference, reason,
            amount_cents, currency, provider_payload)
         VALUES ($1, $2, $3, 'reversal_without_recorded_payment', $4, $5, $6::jsonb)
         ON CONFLICT (provider_payment_id) DO NOTHING`,
        [
          reversal.provider_payment_id,
          invoiceResult.rows[0]?.id || null,
          reversal.external_reference || null,
          reversal.amount_cents,
          reversal.currency,
          JSON.stringify(reversal.provider_payload),
        ],
      );
      return { status: 'unmatched' };
    }

    const targetStatus = reversal.provider_status === 'charged_back' ? 'charged_back' : 'refunded';
    if (payment.status === targetStatus) return { status: 'duplicate' };
    const updatedPayment = await connection.query(
      `UPDATE payments
       SET status = $2, provider_payload = $3::jsonb
       WHERE id = $1
       RETURNING id, invoice_id, status, amount_cents, currency, provider_payment_id`,
      [payment.id, targetStatus, JSON.stringify(reversal.provider_payload)],
    );
    const invoiceResult = await connection.query(
      `SELECT ${invoiceColumns} FROM invoices WHERE id = $1 FOR UPDATE`,
      [payment.invoice_id],
    );
    const invoice = invoiceResult.rows[0];
    let updatedInvoice = invoice;
    if (invoice?.status === 'paid') {
      const paidResult = await connection.query(
        `SELECT COALESCE(SUM(amount_cents), 0)::numeric AS paid_cents
         FROM payments WHERE invoice_id = $1 AND status = 'approved'`,
        [invoice.id],
      );
      const remainingPaid = BigInt(paidResult.rows[0].paid_cents);
      const stillPaid = remainingPaid >= BigInt(invoice.total_cents);
      const newStatus = stillPaid
        ? 'paid'
        : invoice.due_on &&
            invoice.due_on <
              (await connection.query(
                `SELECT (now() AT TIME ZONE 'America/Montevideo')::date::text AS today`,
              )).rows[0].today
          ? 'overdue'
          : 'open';
      const invoiceUpdate = await connection.query(
        `UPDATE invoices
         SET status = $2, paid_at = CASE WHEN $2 = 'paid' THEN paid_at ELSE NULL END,
             updated_at = now()
         WHERE id = $1 RETURNING ${invoiceColumns}`,
        [invoice.id, newStatus],
      );
      updatedInvoice = invoiceUpdate.rows[0];
    }
    await writeAudit(
      connection,
      { uid: 'mercadopago-webhook', email: 'mercadopago@system.invalid' },
      targetStatus === 'charged_back'
        ? 'invoice.payment_mercadopago_charged_back'
        : 'invoice.payment_mercadopago_refunded',
      'invoice',
      payment.invoice_id,
      { payment: updatedPayment.rows[0], invoice: updatedInvoice },
    );
    return { status: targetStatus, invoice: updatedInvoice };
  });
}

export async function updateInvoice(id, changes, updatedAt, actor) {
  return transaction(async (connection) => {
    const currentResult = await connection.query(
      `SELECT ${invoiceColumns} FROM invoices WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const current = currentResult.rows[0];
    if (!current) return { status: 'not-found' };
    if (current.updated_at !== updatedAt) {
      return { status: 'conflict' };
    }
    if (await hasActiveMercadoPagoCheckout(connection, id)) {
      return { status: 'not-editable' };
    }
    if (!['draft', 'open', 'overdue'].includes(current.status)) {
      return { status: 'not-editable' };
    }
    const updated = await connection.query(
      `UPDATE invoices
       SET notes = COALESCE($2, notes), issued_on = COALESCE($3::date, issued_on),
           due_on = $4::date, subtotal_cents = COALESCE($5, subtotal_cents),
           tax_cents = COALESCE($6, tax_cents), total_cents = COALESCE($7, total_cents),
           updated_at = now()
       WHERE id = $1 AND updated_at = $8::timestamptz
       RETURNING ${invoiceColumns}`,
      [
        id,
        changes.notes ?? null,
        changes.issued_on ?? null,
        changes.due_on === undefined ? current.due_on : changes.due_on,
        changes.subtotal_cents ?? null,
        changes.tax_cents ?? null,
        changes.total_cents ?? null,
        updatedAt,
      ],
    );
    const invoice = updated.rows[0];
    if (!invoice) return { status: 'conflict' };
    if (changes.items) {
      await connection.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
      await insertInvoiceItems(connection, id, invoice.client_id, changes.items);
    }
    await writeAudit(connection, actor, 'invoice.update', 'invoice', id, {
      before: current,
      after: invoice,
    });
    return { status: 'updated', record: invoice };
  });
}

export async function voidInvoice(id, actor) {
  return transaction(async (connection) => {
    const currentResult = await connection.query(
      `SELECT ${invoiceColumns} FROM invoices WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const current = currentResult.rows[0];
    if (!current) return { status: 'not-found' };
    if (await hasActiveMercadoPagoCheckout(connection, id)) {
      return { status: 'not-voidable' };
    }
    if (!['draft', 'open', 'overdue'].includes(current.status)) return { status: 'not-voidable' };
    const result = await connection.query(
      `UPDATE invoices SET status = 'void', updated_at = now()
       WHERE id = $1 RETURNING ${invoiceColumns}`,
      [id],
    );
    const invoice = result.rows[0];
    await writeAudit(connection, actor, 'invoice.void', 'invoice', id, {
      before: current,
      after: invoice,
    });
    return { status: 'voided', record: invoice };
  });
}

export async function recordManualPayment(invoiceId, payment, actor) {
  return transaction(async (connection) => {
    const invoiceResult = await connection.query(
      `SELECT ${invoiceColumns} FROM invoices WHERE id = $1 FOR UPDATE`,
      [invoiceId],
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) return { status: 'not-found' };
    if (!['open', 'overdue'].includes(invoice.status)) return { status: 'not-payable' };
    if (await hasActiveMercadoPagoCheckout(connection, invoiceId)) {
      return { status: 'checkout-pending' };
    }
    if (invoice.currency !== payment.currency) return { status: 'currency-mismatch' };
    const paidResult = await connection.query(
      `SELECT COALESCE(SUM(amount_cents), 0)::numeric AS paid_cents
       FROM payments WHERE invoice_id = $1 AND status = 'approved'`,
      [invoiceId],
    );
    const remaining = BigInt(invoice.total_cents) - BigInt(paidResult.rows[0].paid_cents);
    if (BigInt(payment.amount_cents) > remaining) return { status: 'overpayment' };
    const [actorUid] = actorFields(actor);
    const result = await connection.query(
      `INSERT INTO payments
        (invoice_id, method, status, currency, amount_cents, recorded_by)
       VALUES ($1, $2, 'approved', $3, $4, $5)
       RETURNING id, invoice_id, method, status, currency, amount_cents, recorded_by, created_at`,
      [invoiceId, payment.method, payment.currency, payment.amount_cents, actorUid],
    );
    const recorded = result.rows[0];
    const isPaid = BigInt(payment.amount_cents) === remaining;
    if (isPaid) {
      await connection.query(
        `UPDATE invoices SET status = 'paid', paid_at = now(), updated_at = now()
         WHERE id = $1`,
        [invoiceId],
      );
      await extendPaidInvoiceSubscriptions(connection, invoiceId);
    }
    await writeAudit(connection, actor, 'invoice.payment_manual', 'invoice', invoiceId, {
      payment: recorded,
      invoice_status: isPaid ? 'paid' : invoice.status,
    });
    return { status: 'recorded', payment: recorded, invoice_paid: isPaid };
  });
}

export async function listAudit(filters) {
  const conditions = [];
  const values = [];
  if (filters.entity_type) {
    values.push(filters.entity_type);
    conditions.push(`entity_type = $${values.length}`);
  }
  if (filters.entity_id) {
    values.push(filters.entity_id);
    conditions.push(`entity_id = $${values.length}`);
  }
  values.push(filters.limit ?? 100);
  const limitIndex = values.length;
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `SELECT id, actor_uid, actor_email, action, entity_type, entity_id, changes, created_at
     FROM audit_log ${where} ORDER BY created_at DESC, id DESC LIMIT $${limitIndex}`,
    values,
  );
  return result.rows;
}

export async function getRevenueReport(from, to) {
  const result = await query(
    `WITH period_revenue AS (
       SELECT date_trunc('month', paid_at AT TIME ZONE 'America/Montevideo')::date AS month,
         currency, SUM(total_cents)::numeric AS amount_cents
       FROM invoices
       WHERE status = 'paid' AND paid_at >= $1::date
         AND paid_at < ($2::date + INTERVAL '1 day')
       GROUP BY 1, 2
     ),
     overdue AS (
       SELECT COUNT(*)::integer AS count
       FROM invoices WHERE status IN ('open', 'overdue') AND due_on < CURRENT_DATE
     ),
     mrr AS (
       SELECT currency, SUM(amount_cents)::numeric AS amount_cents
       FROM subscriptions
       WHERE status = 'active' AND billing_period = 'monthly'
       GROUP BY currency
     )
     SELECT
       COALESCE((SELECT jsonb_agg(jsonb_build_object(
         'month', month, 'currency', currency, 'amount_cents', amount_cents
       ) ORDER BY month, currency) FROM period_revenue), '[]'::jsonb) AS monthly_revenue,
       COALESCE((SELECT jsonb_agg(jsonb_build_object(
         'currency', currency, 'amount_cents', amount_cents
       ) ORDER BY currency) FROM mrr), '[]'::jsonb) AS mrr,
       (SELECT count FROM overdue) AS overdue_invoices`,
    [from, to],
  );
  return result.rows[0];
}

export async function getReceivablesReport() {
  const result = await query(
    `WITH business_day AS (
       SELECT (now() AT TIME ZONE 'America/Montevideo')::date AS today
     ),
     unpaid AS (
       SELECT i.id, i.number, i.client_id, c.name AS client_name, i.currency,
         i.total_cents - COALESCE(SUM(p.amount_cents)
           FILTER (WHERE p.status = 'approved'), 0) AS balance_cents,
         i.due_on,
         CASE
           WHEN i.due_on < business_day.today THEN business_day.today - i.due_on
           ELSE 0
         END AS days_overdue
       FROM invoices AS i
       JOIN client_accounts AS c ON c.id = i.client_id
       CROSS JOIN business_day
       LEFT JOIN payments AS p ON p.invoice_id = i.id
       WHERE i.status IN ('open', 'overdue')
       GROUP BY i.id, c.name, business_day.today
       HAVING i.total_cents - COALESCE(SUM(p.amount_cents)
         FILTER (WHERE p.status = 'approved'), 0) > 0
     ),
     aging AS (
       SELECT currency,
         CASE
           WHEN days_overdue <= 30 THEN '0-30'
           WHEN days_overdue <= 60 THEN '31-60'
           ELSE '61+'
         END AS bucket,
         SUM(balance_cents)::numeric AS amount_cents,
         COUNT(*)::integer AS invoice_count
       FROM unpaid
       WHERE days_overdue > 0
       GROUP BY currency, bucket
     ),
     totals AS (
       SELECT currency, SUM(balance_cents)::numeric AS amount_cents,
         COUNT(*)::integer AS invoice_count
       FROM unpaid
       GROUP BY currency
     ),
     due_7 AS (
       SELECT currency, SUM(balance_cents)::numeric AS amount_cents,
         COUNT(*)::integer AS invoice_count
       FROM unpaid, business_day
       WHERE due_on BETWEEN business_day.today AND business_day.today + 7
       GROUP BY currency
     ),
     due_30 AS (
       SELECT currency, SUM(balance_cents)::numeric AS amount_cents,
         COUNT(*)::integer AS invoice_count
       FROM unpaid, business_day
       WHERE due_on BETWEEN business_day.today AND business_day.today + 30
       GROUP BY currency
     )
     SELECT
       COALESCE((SELECT jsonb_agg(jsonb_build_object(
         'currency', currency, 'amount_cents', amount_cents::text,
         'invoice_count', invoice_count
       ) ORDER BY currency) FROM totals), '[]'::jsonb) AS totals,
       COALESCE((SELECT jsonb_agg(jsonb_build_object(
         'currency', currency, 'bucket', bucket, 'amount_cents', amount_cents::text,
         'invoice_count', invoice_count
       ) ORDER BY currency, bucket) FROM aging), '[]'::jsonb) AS aging,
       COALESCE((SELECT jsonb_agg(jsonb_build_object(
         'currency', currency, 'amount_cents', amount_cents::text,
         'invoice_count', invoice_count
       ) ORDER BY currency) FROM due_7), '[]'::jsonb) AS due_7_days,
       COALESCE((SELECT jsonb_agg(jsonb_build_object(
         'currency', currency, 'amount_cents', amount_cents::text,
         'invoice_count', invoice_count
       ) ORDER BY currency) FROM due_30), '[]'::jsonb) AS due_30_days,
       COALESCE((SELECT jsonb_agg(jsonb_build_object(
         'id', id, 'number', number, 'client_id', client_id,
         'client_name', client_name, 'currency', currency,
         'balance_cents', balance_cents::text, 'due_on', due_on,
         'days_overdue', days_overdue
       ) ORDER BY days_overdue DESC, due_on NULLS LAST, number
       ) FROM (
         SELECT * FROM unpaid
         ORDER BY days_overdue DESC, due_on NULLS LAST, number
         LIMIT 20
       ) AS open_invoices), '[]'::jsonb) AS invoices`,
  );
  return result.rows[0];
}
