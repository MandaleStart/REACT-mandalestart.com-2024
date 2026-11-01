import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClientBillingControllers } from '../src/controllers/clientBillingController.js';

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
  };
}

function request(id) {
  return {
    auth: { email: 'verified@example.com', uid: 'user-1' },
    params: { id },
  };
}

test('client billing controllers bind every query to the verified email mapping', async () => {
  const queriedClientIds = [];
  const resolvedEmails = [];
  const repository = {
    async listClientSubscriptions(clientId) {
      queriedClientIds.push(clientId);
      return [{
        id: 'subscription-1',
        service_type: 'hosting',
        label: 'Hosting',
        status: 'active',
        currency: 'UYU',
        amount_cents: '10000',
        billing_period: 'monthly',
        internal_notes: 'staff only',
        provider_payload: { token: 'private' },
      }];
    },
    async listClientInvoices(clientId) {
      queriedClientIds.push(clientId);
      return [{
        id: 'invoice-1',
        number: 'MS-2026-0001',
        status: 'open',
        currency: 'UYU',
        total_cents: '10000',
        internal_notes: 'staff only',
        provider_payload: { token: 'private' },
      }];
    },
    async getClientInvoice(clientId, invoiceId) {
      queriedClientIds.push(clientId);
      assert.equal(invoiceId, 'invoice-owned-by-another-client');
      return {
        id: invoiceId,
        number: 'MS-2026-0002',
        status: 'open',
        currency: 'UYU',
        total_cents: '10000',
        notes: 'Nota para el cliente',
        provider_payload: { token: 'private' },
        payments: [{ provider_payload: { token: 'private' } }],
        items: [{
          description: 'Servicio',
          quantity: 1,
          unit_amount_cents: '10000',
          tax_rate_bp: 0,
          internal_notes: 'staff only',
        }],
      };
    },
  };
  const controllers = createClientBillingControllers(repository, async (email) => {
    resolvedEmails.push(email);
    return { id: 'token-owned-client' };
  });

  const subscriptionsResponse = response();
  await controllers.listSubscriptions(request('attacker-client'), subscriptionsResponse, (error) => { throw error; });
  assert.equal(subscriptionsResponse.statusCode, 200);
  assert.equal(subscriptionsResponse.body[0].id, 'subscription-1');
  assert.equal('internal_notes' in subscriptionsResponse.body[0], false);
  assert.equal('provider_payload' in subscriptionsResponse.body[0], false);

  const invoicesResponse = response();
  await controllers.listInvoices(request('attacker-client'), invoicesResponse, (error) => { throw error; });
  assert.equal(invoicesResponse.statusCode, 200);
  assert.equal('internal_notes' in invoicesResponse.body[0], false);
  assert.equal('provider_payload' in invoicesResponse.body[0], false);

  const invoiceResponse = response();
  await controllers.getInvoice(
    request('invoice-owned-by-another-client'),
    invoiceResponse,
    (error) => { throw error; },
  );
  assert.equal(invoiceResponse.statusCode, 200);
  assert.equal('provider_payload' in invoiceResponse.body, false);
  assert.equal('payments' in invoiceResponse.body, false);
  assert.equal('internal_notes' in invoiceResponse.body.items[0], false);
  assert.deepEqual(queriedClientIds, [
    'token-owned-client',
    'token-owned-client',
    'token-owned-client',
  ]);
  assert.deepEqual(resolvedEmails, [
    'verified@example.com',
    'verified@example.com',
    'verified@example.com',
  ]);
  assert.match(subscriptionsResponse.headers['Cache-Control'], /no-store/);
});

test('client billing controllers reject missing client associations and invalid invoice IDs', async () => {
  const controllers = createClientBillingControllers({
    async listClientSubscriptions() {
      throw new Error('Must not query without a client record');
    },
    async listClientInvoices() {
      throw new Error('Must not query without a client record');
    },
    async getClientInvoice() {
      throw new Error('Must not query without a client record');
    },
  }, async () => null);

  const missing = response();
  await controllers.listInvoices(request(), missing, (error) => { throw error; });
  assert.equal(missing.statusCode, 404);

  const invalid = response();
  const invalidIdControllers = createClientBillingControllers({
    async getClientInvoice() {
      throw new Error('Invalid invoice IDs must not reach the repository');
    },
  }, async () => ({ id: 'token-owned-client' }));
  await invalidIdControllers.getInvoice(request('../other'), invalid, (error) => { throw error; });
  assert.equal(invalid.statusCode, 400);
});

test('client billing controllers require a verified email on the request auth context', async () => {
  const controllers = createClientBillingControllers({}, async () => null);
  const res = response();
  await controllers.listSubscriptions({ auth: {}, params: {} }, res, (error) => { throw error; });
  assert.equal(res.statusCode, 401);
});
