import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateInvoice,
  validateInvoiceUpdate,
  validateManualPayment,
  validatePlan,
  validateSubscription,
} from '../src/services/billingValidation.js';

const validPlan = {
  service_slug: 'hosting',
  code: 'hosting-basico',
  name: 'Hosting Básico',
  currency: 'UYU',
  amount_cents: 159900,
  billing_period: 'monthly',
};

const validSubscription = {
  service_type: 'hosting',
  label: 'Hosting de ejemplo',
  status: 'active',
  currency: 'UYU',
  amount_cents: 159900,
  billing_period: 'monthly',
};

const validInvoice = {
  client_id: 'client-1',
  currency: 'UYU',
  issued_on: '2026-10-01',
  due_on: '2026-10-31',
  items: [{
    description: 'Hosting mensual',
    quantity: 1,
    unit_amount_cents: 10000,
    tax_rate_bp: 2200,
  }],
};

test('plan validation accepts cents and defaults IVA and flags without trusting extra fields', () => {
  const result = validatePlan({ ...validPlan, admin_secret: 'ignored' });
  assert.equal(result.ok, true);
  assert.equal(result.value.tax_rate_bp, 2200);
  assert.equal(result.value.is_public, false);
  assert.equal(result.value.is_active, true);
  assert.equal('admin_secret' in result.value, false);
  assert.equal(validatePlan({ ...validPlan, amount_cents: 10.5 }).ok, false);
  assert.equal(validatePlan({ ...validPlan, currency: 'ARS' }).ok, false);
  assert.equal(validatePlan({ ...validPlan, tax_rate_bp: 10001 }).ok, false);
});

test('subscription validation binds client ID from route and rejects malformed dates and notes', () => {
  const result = validateSubscription({
    ...validSubscription,
    internal_notes: 'Solo administración',
    renews_on: '2026-12-01',
  }, 'client-route');
  assert.equal(result.ok, true);
  assert.equal(result.value.client_id, 'client-route');
  assert.equal(result.value.auto_renew, true);
  assert.equal(validateSubscription({
    ...validSubscription,
    renews_on: '2026-02-30',
  }, 'client-route').ok, false);
  assert.equal(validateSubscription({
    ...validSubscription,
    internal_notes: 5,
  }, 'client-route').ok, false);
});

test('invoice validation calculates totals with integer half-up tax rounding', () => {
  const result = validateInvoice(validInvoice);
  assert.equal(result.ok, true);
  assert.equal(result.value.subtotal_cents, 10000);
  assert.equal(result.value.tax_cents, 2200);
  assert.equal(result.value.total_cents, 12200);
  const rounding = validateInvoice({
    ...validInvoice,
    items: [{ description: 'Uno', unit_amount_cents: 1, tax_rate_bp: 5000 }],
  });
  assert.equal(rounding.value.tax_cents, 1);
  assert.equal(validateInvoice({
    ...validInvoice,
    due_on: '2026-09-01',
  }).ok, false);
  assert.equal(validateInvoice({
    ...validInvoice,
    items: [{ description: 'Inválido', unit_amount_cents: 1.5 }],
  }).ok, false);
});

test('invoice update only allows editable fields and requires a real change', () => {
  assert.deepEqual(validateInvoiceUpdate({ notes: 'Revisada' }), {
    ok: true,
    value: { notes: 'Revisada' },
  });
  assert.equal(validateInvoiceUpdate({ status: 'paid' }).ok, false);
  assert.equal(validateInvoiceUpdate({}).ok, false);
  assert.equal(validateInvoiceUpdate({ due_on: '2026-02-30' }).ok, false);
});

test('manual payment validation only permits manual payment methods and positive integer cents', () => {
  assert.equal(validateManualPayment({
    method: 'transfer',
    currency: 'USD',
    amount_cents: 1000,
  }).ok, true);
  assert.equal(validateManualPayment({
    method: 'mercadopago',
    currency: 'UYU',
    amount_cents: 1000,
  }).ok, false);
  assert.equal(validateManualPayment({
    method: 'cash',
    currency: 'UYU',
    amount_cents: 0,
  }).ok, false);
});
