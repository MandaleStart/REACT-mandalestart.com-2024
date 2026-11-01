import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const migrationUrl = new URL('../migrations/002_billing.sql', import.meta.url);
const migration = (await readFile(migrationUrl, 'utf8')).toLowerCase();

test('billing migration defines integer money, currency checks and required billing tables', () => {
  for (const table of ['plans', 'subscriptions', 'invoices', 'invoice_items', 'payments', 'audit_log']) {
    assert.match(migration, new RegExp(`create table if not exists ${table}\\b`));
  }

  assert.match(migration, /amount_cents bigint not null check \(amount_cents >= 0\)/);
  assert.match(migration, /currency text not null check \(currency in \('uyu', 'usd'\)\)/);
  assert.match(migration, /provider_payload jsonb/);
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
