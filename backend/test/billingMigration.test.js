import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationUrl = new URL('../migrations/002_billing.sql', import.meta.url);
const migration = (await readFile(migrationUrl, 'utf8')).toLowerCase();
const webhookQueueMigrationUrl = new URL('../migrations/003_mercadopago_webhook_queue.sql', import.meta.url);
const webhookQueueMigration = (await readFile(webhookQueueMigrationUrl, 'utf8')).toLowerCase();
const unappliedPaymentsMigrationUrl = new URL('../migrations/004_unapplied_mercadopago_payments.sql', import.meta.url);
const unappliedPaymentsMigration = (await readFile(unappliedPaymentsMigrationUrl, 'utf8')).toLowerCase();
const reversalsMigrationUrl = new URL('../migrations/006_mercadopago_reversals.sql', import.meta.url);
const reversalsMigration = (await readFile(reversalsMigrationUrl, 'utf8')).toLowerCase();
const clientBillingProfileMigrationUrl = new URL('../migrations/007_client_billing_profile.sql', import.meta.url);
const clientBillingProfileMigration = (await readFile(clientBillingProfileMigrationUrl, 'utf8')).toLowerCase();

test('billing migration defines integer money, currency checks and required billing tables', () => {
  for (const table of [
    'plans',
    'subscriptions',
    'invoices',
    'invoice_items',
    'payments',
    'audit_log',
  ]) {
    assert.match(migration, new RegExp(`create table if not exists ${table}\\b`));
  }

  assert.match(migration, /amount_cents bigint not null check \(amount_cents >= 0\)/);
  assert.match(migration, /currency text not null check \(currency in \('uyu', 'usd'\)\)/);
  assert.match(migration, /provider_payload jsonb/);
  assert.match(migration, /create unique index if not exists payments_provider_unique/);
  assert.match(migration, /internal_notes text not null/);
  assert.match(migration, /add column if not exists archived_at/);
  assert.match(migration, /add column if not exists company/);
  assert.match(migration, /add column if not exists tax_id/);
});

test('legacy import is non-billable until reviewed and safe to retry', () => {
  assert.match(migration, /'legacy-' \|\| md5\(client_id \|\| ':' \|\| ordinality::text\)/);
  assert.match(migration, /'uyu',\s+0,\s+'one_time'/);
  assert.match(migration, /false,\s+details,\s+format\(/);
  assert.match(migration, /revisar importe, moneda y periodicidad antes de facturar/);
  assert.match(migration, /on conflict \(id\) do nothing/);
  assert.doesNotMatch(migration, /drop column.*services/);
});

test('webhook queue and shared rate-limit migration persist events and counters', () => {
  assert.match(webhookQueueMigration, /create table if not exists mercadopago_webhook_events/);
  assert.match(webhookQueueMigration, /unique \(provider_payment_id, request_id\)/);
  assert.match(webhookQueueMigration, /locked_until timestamptz/);
  assert.match(webhookQueueMigration, /available_at timestamptz/);
  assert.match(webhookQueueMigration, /create table if not exists api_rate_limit_windows/);
  assert.match(webhookQueueMigration, /create index if not exists api_rate_limit_windows_reset_idx/);
});

test('unapplied payment migration stores approved provider payments for review idempotently', () => {
  assert.match(unappliedPaymentsMigration, /create table if not exists unapplied_payments/);
  assert.match(unappliedPaymentsMigration, /provider_payment_id text not null unique/);
  assert.match(unappliedPaymentsMigration, /status text not null default 'pending_review'/);
  assert.match(unappliedPaymentsMigration, /'applied', 'refunded', 'dismissed'/);
  assert.match(unappliedPaymentsMigration, /create index if not exists unapplied_payments_pending_idx/);
});

test('Mercado Pago reversal migration supports charged-back payment status', () => {
  assert.match(reversalsMigration, /drop constraint if exists payments_status_check/);
  assert.match(reversalsMigration, /'refunded', 'charged_back'/);
});

test('client billing profile migration adds optional billing address and email fields', () => {
  assert.match(clientBillingProfileMigration, /add column if not exists billing_email text not null default ''/);
  assert.match(clientBillingProfileMigration, /add column if not exists billing_address text not null default ''/);
});
