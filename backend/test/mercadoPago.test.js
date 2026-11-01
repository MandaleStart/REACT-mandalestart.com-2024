import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import {
  centsFromProviderAmount,
  createMercadoPagoClient,
  verifyMercadoPagoSignature,
} from '../src/services/mercadoPago.js';
import {
  createClientBillingControllers,
  createMercadoPagoWebhookController,
} from '../src/controllers/clientBillingController.js';

function signatureFor(dataId, requestId, timestamp, secret) {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const hash = createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${timestamp},v1=${hash}`;
}

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

function webhookRequest({
  dataId = '12345',
  secret = 'test-secret',
  signature,
  type = 'payment',
} = {}) {
  const requestId = 'mp-request-1';
  return {
    id: 'api-request-1',
    query: { 'data.id': dataId, type },
    body: {},
    get(name) {
      if (name === 'x-signature')
        return signature || signatureFor(dataId, requestId, '1704908010', secret);
      if (name === 'x-request-id') return requestId;
      return undefined;
    },
  };
}

test('verifies Mercado Pago webhook signatures with constant-shape HMAC inputs', () => {
  const signature = signatureFor('AbC-123', 'request-1', '1704908010', 'secret');
  assert.equal(
    verifyMercadoPagoSignature({
      signature,
      requestId: 'request-1',
      dataId: 'AbC-123',
      secret: 'secret',
    }),
    true,
  );
  assert.equal(
    verifyMercadoPagoSignature({
      signature,
      requestId: 'request-2',
      dataId: 'AbC-123',
      secret: 'secret',
    }),
    false,
  );
  assert.equal(
    verifyMercadoPagoSignature({
      signature: 'ts=1,v1=invalid',
      requestId: 'request-1',
      dataId: '123',
      secret: 'secret',
    }),
    false,
  );
});

test('converts only finite provider amounts to integer cents', () => {
  assert.equal(centsFromProviderAmount(125.5), 12550);
  assert.equal(centsFromProviderAmount(0), null);
  assert.equal(centsFromProviderAmount(Number.NaN), null);
  assert.equal(centsFromProviderAmount(0.001), null);
});

test('creates a Mercado Pago preference using only server-supplied invoice balance', async () => {
  let request;
  const provider = createMercadoPagoClient({
    accessToken: 'server-token',
    fetchImpl: async (url, options) => {
      request = { url, options, body: JSON.parse(options.body) };
      return {
        ok: true,
        async json() {
          return {
            id: 'preference-1',
            init_point: 'https://www.mercadopago.com.uy/checkout/123',
          };
        },
      };
    },
  });

  const checkout = await provider.createPreference({
    invoice: { id: 'invoice-1', number: 'MS-2026-001', currency: 'UYU' },
    amountCents: 12345,
    publicAppUrl: 'https://mandalestart.com',
    webhookUrl: 'https://api.mandalestart.com/api/webhooks/mercadopago',
  });

  assert.equal(request.url, 'https://api.mercadopago.com/checkout/preferences');
  assert.equal(request.options.headers.Authorization, 'Bearer server-token');
  assert.equal(request.body.external_reference, 'invoice-1');
  assert.equal(request.body.items[0].unit_price, 123.45);
  assert.equal(request.body.items[0].currency_id, 'UYU');
  assert.equal(
    request.body.notification_url,
    'https://api.mandalestart.com/api/webhooks/mercadopago',
  );
  assert.equal(checkout.preference_id, 'preference-1');
  assert.equal(checkout.init_point, 'https://www.mercadopago.com.uy/checkout/123');
  assert.ok(Date.parse(checkout.expires_at) > Date.now());
});

test('client checkout resolves ownership from the verified token and never accepts a client amount', async () => {
  const calls = [];
  const controller = createClientBillingControllers(
    {
      async createMercadoPagoCheckout(clientId, invoiceId, createPreference) {
        calls.push({ clientId, invoiceId });
        const preference = await createPreference({
          invoice: { id: invoiceId, number: 'MS-2026-001', currency: 'UYU' },
          amountCents: 5000,
        });
        assert.deepEqual(preference, {
          preference_id: 'preference-1',
          init_point: 'https://www.mercadopago.com.uy/checkout/123',
          expires_at: '2026-11-01T04:30:00.000Z',
        });
        return {
          status: 'ready',
          checkout_url: preference.init_point,
          expires_at: preference.expires_at,
        };
      },
    },
    async (email) => {
      assert.equal(email, 'verified@example.com');
      return { id: 'client-from-token' };
    },
    {
      async createPreference(input) {
        assert.equal(input.amountCents, 5000);
        assert.equal(input.invoice.id, 'invoice-1');
        return {
          preference_id: 'preference-1',
          init_point: 'https://www.mercadopago.com.uy/checkout/123',
          expires_at: '2026-11-01T04:30:00.000Z',
        };
      },
    },
    () => ({
      accessToken: 'access-token',
      webhookSecret: 'webhook-secret',
      webhookUrl: 'https://api.mandalestart.com/api/webhooks/mercadopago',
      publicAppUrl: 'https://mandalestart.com',
    }),
  );
  const req = {
    auth: { email: 'verified@example.com' },
    params: { id: 'invoice-1' },
    body: { client_id: 'attacker-client', amount_cents: 1 },
  };
  const res = response();

  await controller.createCheckout(req, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls, [{ clientId: 'client-from-token', invoiceId: 'invoice-1' }]);
  assert.deepEqual(res.body, {
    checkout_url: 'https://www.mercadopago.com.uy/checkout/123',
    expires_at: '2026-11-01T04:30:00.000Z',
  });
});

test('webhook rejects invalid signatures before querying Mercado Pago', async () => {
  let providerCalls = 0;
  const controller = createMercadoPagoWebhookController(
    {},
    {
      async getPayment() {
        providerCalls += 1;
      },
    },
    () => ({ accessToken: 'access-token', webhookSecret: 'webhook-secret' }),
  );
  const req = webhookRequest({ signature: 'ts=1,v1=bad' });
  const res = response();

  await controller(req, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(providerCalls, 0);
});

test('approved webhook payments are queried and handed to the idempotent repository', async () => {
  let recordedPayment;
  let queriedId;
  const controller = createMercadoPagoWebhookController(
    {
      async approveMercadoPagoPayment(payment) {
        recordedPayment = payment;
        return { status: 'approved' };
      },
    },
    {
      async getPayment(id) {
        queriedId = id;
        return {
          id,
          status: 'approved',
          external_reference: 'invoice-1',
          preference_id: 'preference-1',
          currency_id: 'UYU',
          transaction_amount: 100,
          date_approved: '2026-11-01T04:00:00Z',
          payment_method_id: 'visa',
          card: { number: 'sensitive' },
        };
      },
    },
    () => ({ accessToken: 'access-token', webhookSecret: 'test-secret' }),
  );
  const req = webhookRequest();
  const res = response();

  await controller(req, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(queriedId, '12345');
  assert.equal(recordedPayment.external_reference, 'invoice-1');
  assert.equal(recordedPayment.amount_cents, 10000);
  assert.equal(recordedPayment.provider_payload.card, undefined);
});

test('webhook reports idempotent duplicates and logs inconsistent verified payments', async () => {
  const warnings = [];
  const controller = createMercadoPagoWebhookController(
    {
      async approveMercadoPagoPayment() {
        return { status: 'amount-mismatch' };
      },
    },
    {
      async getPayment(id) {
        return {
          id,
          status: 'approved',
          external_reference: 'invoice-1',
          preference_id: 'preference-1',
          currency_id: 'UYU',
          transaction_amount: 100,
        };
      },
    },
    () => ({ accessToken: 'access-token', webhookSecret: 'test-secret' }),
    { warn: (...args) => warnings.push(args) },
  );
  const res = response();

  await controller(webhookRequest(), res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(warnings[0][0], 'mercadopago_payment_not_applied');
  assert.equal(warnings[0][1].reason, 'amount-mismatch');
});

test('duplicate approved webhook deliveries are acknowledged without a warning', async () => {
  const warnings = [];
  const controller = createMercadoPagoWebhookController(
    {
      async approveMercadoPagoPayment() {
        return { status: 'duplicate' };
      },
    },
    {
      async getPayment(id) {
        return {
          id,
          status: 'approved',
          external_reference: 'invoice-1',
          preference_id: 'preference-1',
          currency_id: 'UYU',
          transaction_amount: 100,
        };
      },
    },
    () => ({ accessToken: 'access-token', webhookSecret: 'test-secret' }),
    { warn: (...args) => warnings.push(args) },
  );
  const res = response();

  await controller(webhookRequest(), res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(warnings, []);
});
