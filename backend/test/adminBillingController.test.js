import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAdminBillingControllers } from '../src/controllers/adminBillingController.js';

const actor = { uid: 'admin-1', email: 'admin@example.com' };
const timestamp = '2026-10-01T00:00:00.000000Z';

function response() {
  return {
    statusCode: 200,
    headers: {},
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

function request({ params = {}, query = {}, body = {}, headers = {} } = {}) {
  return {
    params,
    query,
    body,
    auth: actor,
    get(name) {
      return headers[name.toLowerCase()];
    },
  };
}

const row = { id: 'record-1', updated_at: timestamp };

function repository() {
  return {
    listPlans: async () => [row],
    createPlan: async (_plan, currentActor) => {
      assert.deepEqual(currentActor, actor);
      return row;
    },
    updatePlan: async (_id, _plan, version, currentActor) => {
      assert.equal(version, timestamp);
      assert.deepEqual(currentActor, actor);
      return { status: 'updated', record: row };
    },
    deactivatePlan: async () => ({ status: 'deactivated', record: row }),
    listSubscriptionsByClient: async () => [row],
    createSubscription: async (_subscription, currentActor) => {
      assert.deepEqual(currentActor, actor);
      return row;
    },
    updateSubscription: async (_id, _subscription, version, currentActor) => {
      assert.equal(version, timestamp);
      assert.deepEqual(currentActor, actor);
      return { status: 'updated', record: row };
    },
    cancelSubscription: async () => ({ status: 'cancelled', record: row }),
    listInvoices: async () => [row],
    createInvoice: async (_invoice, currentActor) => {
      assert.deepEqual(currentActor, actor);
      return row;
    },
    getInvoice: async () => row,
    updateInvoice: async (_id, _changes, version, currentActor) => {
      assert.equal(version, timestamp);
      assert.deepEqual(currentActor, actor);
      return { status: 'updated', record: row };
    },
    recordManualPayment: async (_id, _payment, currentActor) => {
      assert.deepEqual(currentActor, actor);
      return { status: 'recorded', payment: row, invoice_paid: true };
    },
    voidInvoice: async () => ({ status: 'voided', record: row }),
    listAudit: async () => [row],
    getRevenueReport: async () => ({ monthly_revenue: [], mrr: [], overdue_invoices: 0 }),
  };
}

const validPlan = {
  service_slug: 'hosting',
  code: 'hosting-basico',
  name: 'Hosting',
  currency: 'UYU',
  amount_cents: 1000,
  billing_period: 'monthly',
};
const validSubscription = {
  client_id: 'client-1',
  service_type: 'hosting',
  label: 'Hosting',
  status: 'active',
  currency: 'UYU',
  amount_cents: 1000,
  billing_period: 'monthly',
};
const validInvoice = {
  client_id: 'client-1',
  currency: 'UYU',
  items: [{ description: 'Hosting', unit_amount_cents: 1000, tax_rate_bp: 0 }],
};

test('every admin billing controller responds using the repository contract', async () => {
  const controllers = createAdminBillingControllers(repository(), () => true);
  const cases = [
    ['listPlans', request(), 200],
    ['createPlan', request({ body: validPlan }), 201],
    ['updatePlan', request({ params: { id: 'plan-1' }, body: validPlan, headers: { 'if-match': timestamp } }), 200],
    ['deactivatePlan', request({ params: { id: 'plan-1' } }), 204],
    ['listSubscriptions', request({ params: { id: 'client-1' } }), 200],
    ['createSubscription', request({ params: { id: 'client-1' }, body: validSubscription }), 201],
    ['updateSubscription', request({ params: { id: 'subscription-1' }, body: validSubscription, headers: { 'if-match': timestamp } }), 200],
    ['cancelSubscription', request({ params: { id: 'subscription-1' } }), 204],
    ['listInvoices', request({ query: { status: 'open', limit: '10', offset: '0' } }), 200],
    ['createInvoice', request({ body: validInvoice }), 201],
    ['getInvoice', request({ params: { id: 'invoice-1' } }), 200],
    ['updateInvoice', request({ params: { id: 'invoice-1' }, body: { notes: 'Actualizada' }, headers: { 'if-match': timestamp } }), 200],
    ['recordManualPayment', request({ params: { id: 'invoice-1' }, body: { method: 'transfer', currency: 'UYU', amount_cents: 1000 } }), 201],
    ['voidInvoice', request({ params: { id: 'invoice-1' } }), 200],
    ['listAudit', request({ query: { entity_type: 'invoice', entity_id: 'invoice-1', limit: '5' } }), 200],
    ['revenueReport', request({ query: { from: '2026-01-01', to: '2026-12-31' } }), 200],
  ];

  for (const [name, req, expectedStatus] of cases) {
    const res = response();
    let forwardedError;
    await controllers[name](req, res, (error) => { forwardedError = error; });
    assert.equal(forwardedError, undefined, name);
    assert.equal(res.statusCode, expectedStatus, name);
    assert.match(res.headers['Cache-Control'], /no-store/);
  }
});

test('admin billing controllers reject writes without version preconditions and reject stale edits', async () => {
  const staleRepository = repository();
  staleRepository.updatePlan = async () => ({ status: 'conflict' });
  const controllers = createAdminBillingControllers(staleRepository, () => true);

  const missingVersion = response();
  await controllers.updatePlan(
    request({ params: { id: 'plan-1' }, body: validPlan }),
    missingVersion,
    (error) => { throw error; },
  );
  assert.equal(missingVersion.statusCode, 428);

  const staleVersion = response();
  await controllers.updatePlan(
    request({ params: { id: 'plan-1' }, body: validPlan, headers: { 'if-match': timestamp } }),
    staleVersion,
    (error) => { throw error; },
  );
  assert.equal(staleVersion.statusCode, 409);
});

test('admin billing controllers reject invalid filters and malformed payloads before repository writes', async () => {
  const controllers = createAdminBillingControllers(repository(), () => true);

  const invalidInvoice = response();
  await controllers.createInvoice(request({ body: { ...validInvoice, currency: 'ARS' } }), invalidInvoice, (error) => { throw error; });
  assert.equal(invalidInvoice.statusCode, 400);

  const invalidFilter = response();
  await controllers.listInvoices(request({ query: { status: 'unknown' } }), invalidFilter, (error) => { throw error; });
  assert.equal(invalidFilter.statusCode, 400);

  const invalidDateRange = response();
  await controllers.revenueReport(request({ query: { from: '2026-12-31', to: '2026-01-01' } }), invalidDateRange, (error) => { throw error; });
  assert.equal(invalidDateRange.statusCode, 400);
});

test('admin billing controllers surface database configuration failures', async () => {
  const controllers = createAdminBillingControllers(repository(), () => false);
  const res = response();
  await controllers.listPlans(request(), res, (error) => { throw error; });
  assert.equal(res.statusCode, 503);
});
