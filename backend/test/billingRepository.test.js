import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countPendingUnappliedMercadoPagoPayments } from '../src/billingRepository.js';

test('reports unapplied payment count as unavailable before its migration is applied', async () => {
  const statements = [];
  const result = await countPendingUnappliedMercadoPagoPayments(async (sql) => {
    statements.push(sql);
    return { rows: [{ table_name: null }] };
  });

  assert.deepEqual(result, { available: false, count: null });
  assert.equal(statements.length, 1);
  assert.match(statements[0], /to_regclass\('unapplied_payments'\)/);
});

test('counts unapplied payments only after confirming the table exists', async () => {
  const statements = [];
  const result = await countPendingUnappliedMercadoPagoPayments(async (sql) => {
    statements.push(sql);
    return statements.length === 1
      ? { rows: [{ table_name: 'unapplied_payments' }] }
      : { rows: [{ count: 3 }] };
  });

  assert.deepEqual(result, { available: true, count: 3 });
  assert.equal(statements.length, 2);
  assert.match(statements[1], /status = 'pending_review'/);
});
