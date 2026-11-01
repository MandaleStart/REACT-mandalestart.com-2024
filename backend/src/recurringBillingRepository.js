import { randomUUID } from 'node:crypto';
import { getPostgresPool, query } from './postgres.js';

const systemActor = { uid: 'system', email: 'system@mandalestart.com' };
const invoiceColumns = `id, number, client_id, status, currency, subtotal_cents,
  tax_cents, total_cents, issued_on, due_on, paid_at, notes, created_at,
  to_char(updated_at AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`;

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

async function writeSystemAudit(connection, action, entityType, entityId, changes) {
  await connection.query(
    `INSERT INTO audit_log
      (actor_uid, actor_email, action, entity_type, entity_id, changes)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      systemActor.uid,
      systemActor.email,
      action,
      entityType,
      entityId,
      JSON.stringify(changes),
    ],
  );
}

async function buildNextInvoiceNumber(connection, invoiceDate) {
  const year = String(invoiceDate).slice(0, 4);
  await connection.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`invoice-number:${year}`]);
  const result = await connection.query(
    `SELECT COALESCE(MAX(substring(number from 9)::integer), 0) + 1 AS next_number
     FROM invoices WHERE number LIKE $1`,
    [`MS-${year}-%`],
  );
  return `MS-${year}-${String(result.rows[0].next_number).padStart(4, '0')}`;
}

export async function runRecurringBillingJob(today = null) {
  return transaction(async (connection) => {
    const dateResult = await connection.query(
      `SELECT COALESCE($1::date, (now() AT TIME ZONE 'America/Montevideo')::date)::text AS today`,
      [today],
    );
    const businessDate = dateResult.rows[0].today;
    let invoicesCreated = 0;
    let invoicesMarkedOverdue = 0;
    let subscriptionsSuspended = 0;

    const renewals = await connection.query(
      `SELECT subscription.id, subscription.client_id, subscription.label,
          subscription.currency, subscription.amount_cents,
          subscription.renews_on::text AS renews_on,
          COALESCE(plan.tax_rate_bp, 2200) AS tax_rate_bp
       FROM subscriptions AS subscription
       JOIN client_accounts AS client
         ON client.id = subscription.client_id AND client.archived_at IS NULL
       LEFT JOIN plans AS plan ON plan.id = subscription.plan_id
       WHERE subscription.status = 'active'
         AND subscription.auto_renew = true
         AND subscription.billing_period IN ('monthly', 'yearly')
         AND subscription.renews_on >= $1::date
         AND subscription.renews_on <= $1::date + 7
         AND NOT EXISTS (
           SELECT 1 FROM subscription_renewal_invoices AS renewal
           WHERE renewal.subscription_id = subscription.id
             AND renewal.renewal_due_on = subscription.renews_on
         )
       ORDER BY subscription.renews_on, subscription.id
       FOR UPDATE OF subscription SKIP LOCKED
       LIMIT 100`,
      [businessDate],
    );

    for (const subscription of renewals.rows) {
      const number = await buildNextInvoiceNumber(connection, businessDate);
      const inserted = await connection.query(
        `INSERT INTO invoices
          (number, client_id, status, currency, subtotal_cents, tax_cents,
           total_cents, issued_on, due_on, notes)
         VALUES (
           $1, $2, 'open', $3, $4,
           ROUND($4::numeric * $5::integer / 10000)::bigint,
           $4::bigint + ROUND($4::numeric * $5::integer / 10000)::bigint,
           $6::date, $7::date, $8
         )
         RETURNING ${invoiceColumns}`,
        [
          number,
          subscription.client_id,
          subscription.currency,
          subscription.amount_cents,
          subscription.tax_rate_bp,
          businessDate,
          subscription.renews_on,
          `Renovación de ${subscription.label}`,
        ],
      );
      const invoice = inserted.rows[0];
      await connection.query(
        `INSERT INTO invoice_items
          (id, invoice_id, subscription_id, description, quantity,
           unit_amount_cents, tax_rate_bp)
         VALUES ($1, $2, $3, $4, 1, $5, $6)`,
        [
          randomUUID(),
          invoice.id,
          subscription.id,
          `Renovación de ${subscription.label}`,
          subscription.amount_cents,
          subscription.tax_rate_bp,
        ],
      );
      await connection.query(
        `INSERT INTO subscription_renewal_invoices
          (subscription_id, renewal_due_on, invoice_id)
         VALUES ($1, $2::date, $3)`,
        [subscription.id, subscription.renews_on, invoice.id],
      );
      await writeSystemAudit(
        connection,
        'subscription.renewal_invoice.create',
        'invoice',
        invoice.id,
        {
          subscription_id: subscription.id,
          renewal_due_on: subscription.renews_on,
          after: invoice,
        },
      );
      invoicesCreated += 1;
    }

    const overdue = await connection.query(
      `UPDATE invoices AS invoice
       SET status = 'overdue', updated_at = now()
       WHERE invoice.status = 'open'
         AND invoice.due_on <= $1::date
         AND COALESCE((
           SELECT SUM(payment.amount_cents)
           FROM payments AS payment
           WHERE payment.invoice_id = invoice.id AND payment.status = 'approved'
         ), 0) < invoice.total_cents
       RETURNING invoice.id, invoice.due_on::text AS due_on`,
      [businessDate],
    );
    for (const invoice of overdue.rows) {
      await writeSystemAudit(connection, 'invoice.overdue', 'invoice', invoice.id, {
        before: { status: 'open' },
        after: { status: 'overdue', due_on: invoice.due_on },
      });
    }
    invoicesMarkedOverdue = overdue.rowCount;

    const reminders = await connection.query(
      `INSERT INTO invoice_reminders (invoice_id, reminder_type, scheduled_on)
       SELECT invoice.id, schedule.reminder_type,
              invoice.due_on + schedule.day_offset
       FROM invoices AS invoice
       CROSS JOIN (VALUES
         ('D-7', -7),
         ('D-1', -1),
         ('D+1', 1),
         ('D+7', 7)
       ) AS schedule(reminder_type, day_offset)
       WHERE invoice.status IN ('open', 'overdue')
         AND invoice.due_on + schedule.day_offset <= $1::date
         AND COALESCE((
           SELECT SUM(payment.amount_cents)
           FROM payments AS payment
           WHERE payment.invoice_id = invoice.id AND payment.status = 'approved'
         ), 0) < invoice.total_cents
       ON CONFLICT (invoice_id, reminder_type) DO NOTHING
       RETURNING id`,
      [businessDate],
    );

    const suspensionCandidates = await connection.query(
      `SELECT subscription.id
       FROM subscriptions AS subscription
       WHERE subscription.status = 'active'
         AND EXISTS (
           SELECT 1
           FROM subscription_renewal_invoices AS renewal
           JOIN invoices AS invoice ON invoice.id = renewal.invoice_id
           WHERE renewal.subscription_id = subscription.id
             AND invoice.status = 'overdue'
             AND invoice.due_on <= $1::date - 7
             AND COALESCE((
               SELECT SUM(payment.amount_cents)
               FROM payments AS payment
               WHERE payment.invoice_id = invoice.id AND payment.status = 'approved'
             ), 0) < invoice.total_cents
         )
       ORDER BY subscription.id
       FOR UPDATE OF subscription SKIP LOCKED`,
      [businessDate],
    );
    for (const candidate of suspensionCandidates.rows) {
      const updated = await connection.query(
        `UPDATE subscriptions
         SET status = 'suspended', updated_at = now()
         WHERE id = $1 AND status = 'active'
         RETURNING id, status, renews_on::text AS renews_on`,
        [candidate.id],
      );
      if (!updated.rowCount) continue;
      await writeSystemAudit(
        connection,
        'subscription.suspend_overdue',
        'subscription',
        candidate.id,
        {
          before: { status: 'active' },
          after: updated.rows[0],
        },
      );
      subscriptionsSuspended += 1;
    }

    return {
      businessDate,
      invoicesCreated,
      invoicesMarkedOverdue,
      remindersQueued: reminders.rowCount,
      subscriptionsSuspended,
    };
  });
}

export async function claimDueInvoiceReminders(limit = 100) {
  return transaction(async (connection) => {
    const result = await connection.query(
      `WITH candidates AS (
         SELECT id
         FROM invoice_reminders
         WHERE (status = 'pending' AND available_at <= now())
            OR (status = 'sending' AND locked_until < now())
         ORDER BY scheduled_on, id
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       ), claimed AS (
         UPDATE invoice_reminders AS reminder
         SET status = 'sending',
             attempts = reminder.attempts + 1,
             locked_until = now() + interval '10 minutes'
         FROM candidates
         WHERE reminder.id = candidates.id
         RETURNING reminder.id, reminder.invoice_id, reminder.reminder_type,
                   reminder.scheduled_on
       )
       SELECT claimed.id, claimed.invoice_id, claimed.reminder_type,
              claimed.scheduled_on::text AS scheduled_on,
              client.email, client.name AS client_name,
              invoice.number AS invoice_number, invoice.currency,
              invoice.total_cents, invoice.due_on::text AS due_on
       FROM claimed
       JOIN invoices AS invoice ON invoice.id = claimed.invoice_id
       JOIN client_accounts AS client ON client.id = invoice.client_id`,
      [limit],
    );
    return result.rows;
  });
}

export async function markInvoiceReminderSent(id) {
  return transaction(async (connection) => {
    const result = await connection.query(
      `UPDATE invoice_reminders
       SET status = 'sent', sent_at = now(), locked_until = NULL, last_error = NULL
       WHERE id = $1 AND status = 'sending'
       RETURNING invoice_id, reminder_type, scheduled_on::text AS scheduled_on`,
      [id],
    );
    const reminder = result.rows[0];
    if (!reminder) return false;
    await writeSystemAudit(
      connection,
      'invoice.reminder.sent',
      'invoice',
      reminder.invoice_id,
      {
        reminder_type: reminder.reminder_type,
        scheduled_on: reminder.scheduled_on,
      },
    );
    return true;
  });
}

export async function retryInvoiceReminder(id, errorCode) {
  await query(
    `UPDATE invoice_reminders
     SET status = 'pending',
         available_at = now() + interval '15 minutes',
         locked_until = NULL,
         last_error = $2
     WHERE id = $1 AND status = 'sending'`,
    [id, typeof errorCode === 'string' ? errorCode.slice(0, 100) : 'EMAIL_DELIVERY_FAILED'],
  );
}
