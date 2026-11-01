import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createHealthController } from '../src/controllers/healthController.js';
import { createRecurringBillingProcessor } from '../src/controllers/recurringBillingController.js';
import {
  sendAdminMercadoPagoReversalAlert,
  sendAdminUnappliedPaymentAlert,
  sendBillingReminder,
} from '../src/services/contactMail.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('daily recurring billing rejects unauthorized requests before cleanup or work', async () => {
  let calls = 0;
  const process = createRecurringBillingProcessor({
    getCronSecret: () => 'cron-secret',
    cleanupExpiredRateLimits: async () => { calls += 1; },
    repository: {
      runRecurringBillingJob: async () => { calls += 1; },
      claimDueInvoiceReminders: async () => { calls += 1; },
    },
    log: { warn() {}, error() {} },
  });
  const response = createResponse();

  await process({ headers: { authorization: 'Bearer wrong-secret' } }, response);

  assert.equal(response.statusCode, 401);
  assert.equal(calls, 0);
});

test('daily recurring billing cleans expired rate limits and sends claimed reminders', async () => {
  const calls = [];
  const process = createRecurringBillingProcessor({
    getCronSecret: () => 'cron-secret',
    cleanupExpiredRateLimits: async () => {
      calls.push('cleanup');
      return 4;
    },
    repository: {
      runRecurringBillingJob: async () => {
        calls.push('billing');
        return {
          businessDate: '2026-11-01',
          invoicesCreated: 1,
          invoicesMarkedOverdue: 2,
          remindersQueued: 3,
          subscriptionsSuspended: 1,
        };
      },
      claimDueInvoiceReminders: async () => {
        calls.push('claim');
        return [{ id: 8 }];
      },
      markInvoiceReminderSent: async (id) => calls.push(`sent:${id}`),
      retryInvoiceReminder: async () => assert.fail('unexpected retry'),
    },
    sendReminder: async ({ id }) => calls.push(`email:${id}`),
    log: { warn() {}, error() {} },
  });
  const response = createResponse();

  await process({ headers: { authorization: 'Bearer cron-secret' } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, ['cleanup', 'billing', 'claim', 'email:8', 'sent:8']);
  assert.deepEqual(response.body, {
    ok: true,
    businessDate: '2026-11-01',
    invoicesCreated: 1,
    invoicesMarkedOverdue: 2,
    remindersQueued: 3,
    subscriptionsSuspended: 1,
    expiredRateLimitWindows: 4,
    reminderEmailsSent: 1,
    reminderEmailsFailed: 0,
  });
});

test('failed reminder email is re-queued and reported to the cron caller', async () => {
  let retried;
  const process = createRecurringBillingProcessor({
    getCronSecret: () => 'cron-secret',
    cleanupExpiredRateLimits: async () => 0,
    repository: {
      runRecurringBillingJob: async () => ({ businessDate: '2026-11-01' }),
      claimDueInvoiceReminders: async () => [{ id: 12 }],
      markInvoiceReminderSent: async () => assert.fail('failed email cannot be marked sent'),
      retryInvoiceReminder: async (id, code) => { retried = [id, code]; },
    },
    sendReminder: async () => {
      throw Object.assign(new Error('SMTP unavailable'), { code: 'SMTP_UNAVAILABLE' });
    },
    log: { warn() {}, error() {} },
  });
  const response = createResponse();

  await process({ headers: { authorization: 'Bearer cron-secret' } }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(retried, [12, 'SMTP_UNAVAILABLE']);
  assert.equal(response.body.reminderEmailsFailed, 1);
});

test('health exposes webhook backlog and alerts after ten minutes', async () => {
  const health = createHealthController({
    postgresConfigured: () => true,
    firebaseReady: () => true,
    queryFn: async (sql) => {
      if (sql.includes('to_regclass')) {
        return {
          rows: [{
            clients_ready: true,
            services_ready: true,
            webhook_queue_ready: true,
          }],
        };
      }
      return { rows: [{ pending_count: 2, oldest_pending_age_seconds: '601' }] };
    },
    log: { error() {} },
  });
  const response = createResponse();

  await health({}, response);

  assert.equal(response.body.databaseReady, true);
  assert.equal(response.body.pendingWebhookCount, 2);
  assert.equal(response.body.oldestPendingWebhookAgeSeconds, 601);
  assert.equal(response.body.pendingWebhookAlert, true);
  assert.deepEqual(response.body.alerts, ['pending_webhook_over_10_minutes']);
});

test('health reports webhook backlog as unknown until its queue migration is available', async () => {
  const health = createHealthController({
    postgresConfigured: () => true,
    firebaseReady: () => false,
    queryFn: async () => ({
      rows: [{
        clients_ready: true,
        services_ready: true,
        webhook_queue_ready: false,
      }],
    }),
    log: { error() {} },
  });
  const response = createResponse();

  await health({}, response);

  assert.equal(response.body.webhookQueueReady, false);
  assert.equal(response.body.pendingWebhookCount, null);
  assert.equal(response.body.oldestPendingWebhookAgeSeconds, null);
  assert.equal(response.body.pendingWebhookAlert, false);
});

test('billing reminder email uses the configured recipient and stable message id', async () => {
  const messages = [];
  await sendBillingReminder({
    id: 9,
    invoice_id: 'invoice-1',
    invoice_number: 'MS-2026-0001',
    client_name: 'Cliente',
    email: 'cliente@example.com',
    currency: 'UYU',
    total_cents: '150000',
    due_on: '2026-11-08',
    reminder_type: 'D-7',
  }, () => ({
    sendMail: async (message) => messages.push(message),
  }));

  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, 'cliente@example.com');
  assert.equal(messages[0].messageId, '<billing-reminder-9@mandalestart.com>');
  assert.match(messages[0].subject, /MS-2026-0001/);
  assert.match(messages[0].text, /UYU 1\.500,00/);
  assert.match(messages[0].text, /\/area-cliente\/invoices\/invoice-1/);
});

test('unapplied payment alert emails the admin with a stable, non-sensitive message id', async () => {
  const messages = [];
  await sendAdminUnappliedPaymentAlert(
    {
      provider_payment_id: '12345',
      amount_cents: 150000,
      currency: 'UYU',
      reason: 'amount-mismatch',
    },
    () => ({
      sendMail: async (message) => messages.push(message),
    }),
  );

  assert.equal(messages.length, 1);
  assert.equal(messages[0].to, process.env.CONTACT_TO || 'info@mandalestart.com');
  assert.equal(messages[0].messageId, '<unapplied-payment-5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5@mandalestart.com>');
  assert.match(messages[0].text, /UYU 1\.500,00/);
  assert.match(messages[0].text, /amount-mismatch/);
});

test('Mercado Pago reversal alert emails the admin with the reversal status', async () => {
  const messages = [];
  await sendAdminMercadoPagoReversalAlert(
    {
      provider_payment_id: '12345',
      provider_status: 'charged_back',
      amount_cents: 150000,
      currency: 'UYU',
    },
    () => ({
      sendMail: async (message) => messages.push(message),
    }),
  );

  assert.equal(messages.length, 1);
  assert.match(messages[0].subject, /contracargo/);
  assert.match(messages[0].text, /charged_back/);
  assert.match(messages[0].text, /UYU 1\.500,00/);
});

test('recurring billing migration and Vercel cron are idempotent and daily', async () => {
  const migration = (
    await readFile(new URL('../migrations/005_recurring_billing.sql', import.meta.url), 'utf8')
  ).toLowerCase();
  const vercel = JSON.parse(
    await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
  );
  const recurringCron = vercel.crons.find((cron) => cron.path === '/api/jobs/recurring-billing');

  assert.match(migration, /primary key \(subscription_id, renewal_due_on\)/);
  assert.match(migration, /unique \(invoice_id, reminder_type\)/);
  assert.match(migration, /locked_until timestamptz/);
  assert.equal(recurringCron.schedule, '0 6 * * *');
});
