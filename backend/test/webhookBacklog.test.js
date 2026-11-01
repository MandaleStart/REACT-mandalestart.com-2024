import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMercadoPagoWebhookBacklogSummary } from '../src/billingRepository.js';

test('returns unavailable without querying the webhook table before migration', async () => {
  const statements = [];
  const result = await getMercadoPagoWebhookBacklogSummary(async (sql) => {
    statements.push(sql);
    return { rows: [{ table_name: null }] };
  });

  assert.deepEqual(result, {
    available: false,
    pending_count: null,
    oldest_pending_age_seconds: null,
    alert: false,
  });
  assert.equal(statements.length, 1);
});

test('summarizes pending webhooks and alerts only when oldest event is over ten minutes', async () => {
  const statements = [];
  const result = await getMercadoPagoWebhookBacklogSummary(async (sql) => {
    statements.push(sql);
    return statements.length === 1
      ? { rows: [{ table_name: 'mercadopago_webhook_events' }] }
      : { rows: [{ pending_count: 2, oldest_pending_age_seconds: '601' }] };
  });

  assert.deepEqual(result, {
    available: true,
    pending_count: 2,
    oldest_pending_age_seconds: 601,
    alert: true,
  });
  assert.equal(statements.length, 2);
  assert.match(statements[1], /processed_at IS NULL/);
});

test('does not alert for a healthy or empty webhook queue', async () => {
  const rows = [
    { pending_count: 4, oldest_pending_age_seconds: '600' },
    { pending_count: 0, oldest_pending_age_seconds: '0' },
  ];
  for (const row of rows) {
    let call = 0;
    const result = await getMercadoPagoWebhookBacklogSummary(async () => {
      call += 1;
      return call === 1
        ? { rows: [{ table_name: 'mercadopago_webhook_events' }] }
        : { rows: [row] };
    });
    assert.equal(result.alert, false);
  }
});
