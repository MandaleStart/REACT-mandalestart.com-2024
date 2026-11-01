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
  createMercadoPagoWebhookProcessor,
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
      webhookProcessorSecret: 'cron-secret',
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

test('webhook rejects invalid signatures before queuing payment events', async () => {
  let queueCalls = 0;
  const controller = createMercadoPagoWebhookController(
    {
      async enqueueMercadoPagoWebhook() {
        queueCalls += 1;
      },
    },
    () => ({
      accessToken: 'access-token',
      webhookSecret: 'webhook-secret',
      webhookProcessorSecret: 'cron-secret',
    }),
  );
  const req = webhookRequest({ signature: 'ts=1,v1=bad' });
  const res = response();

  await controller(req, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(queueCalls, 0);
});

test('webhook does not acknowledge events without a configured processor', async () => {
  let queueCalls = 0;
  const controller = createMercadoPagoWebhookController(
    {
      async enqueueMercadoPagoWebhook() {
        queueCalls += 1;
      },
    },
    () => ({ accessToken: 'access-token', webhookSecret: 'webhook-secret' }),
  );
  const res = response();

  await controller(webhookRequest(), res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 503);
  assert.equal(queueCalls, 0);
});

test('verified payment webhook events are durably queued and acknowledged', async () => {
  let queuedEvent;
  const controller = createMercadoPagoWebhookController(
    {
      async enqueueMercadoPagoWebhook(paymentId, requestId) {
        queuedEvent = { paymentId, requestId };
      },
    },
    () => ({
      accessToken: 'access-token',
      webhookSecret: 'test-secret',
      webhookProcessorSecret: 'cron-secret',
    }),
  );
  const req = webhookRequest();
  const res = response();

  await controller(req, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(queuedEvent, { paymentId: '12345', requestId: 'mp-request-1' });
});

test('processor queries Mercado Pago and applies only verified payment data', async () => {
  let recordedPayment;
  let completedEvent;
  let queriedId;
  const processor = createMercadoPagoWebhookProcessor(
    {
      async claimMercadoPagoWebhookEvents() {
        return [{ id: 8, provider_payment_id: '12345' }];
      },
      async approveMercadoPagoPayment(payment) {
        recordedPayment = payment;
        return { status: 'approved' };
      },
      async completeMercadoPagoWebhookEvent(id) {
        completedEvent = id;
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
    () => ({
      accessToken: 'access-token',
      webhookSecret: 'test-secret',
      webhookProcessorSecret: 'cron-secret',
    }),
  );
  const res = response();

  await processor({
    id: 'api-request-1',
    get: (name) => name === 'authorization' ? 'Bearer cron-secret' : undefined,
  }, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(queriedId, '12345');
  assert.equal(recordedPayment.external_reference, 'invoice-1');
  assert.equal(recordedPayment.amount_cents, 10000);
  assert.equal(recordedPayment.provider_payload.card, undefined);
  assert.equal(completedEvent, 8);
});

test('processor retries provider failures and rejects requests without its secret', async () => {
  let retryEvent;
  const processor = createMercadoPagoWebhookProcessor(
    {
      async claimMercadoPagoWebhookEvents() {
        return [{ id: 9, provider_payment_id: '12345' }];
      },
      async retryMercadoPagoWebhookEvent(...args) {
        retryEvent = args;
      },
    },
    {
      async getPayment() {
        throw Object.assign(new Error('Unavailable'), { code: 'MERCADOPAGO_REQUEST_FAILED' });
      },
    },
    () => ({
      accessToken: 'access-token',
      webhookSecret: 'test-secret',
      webhookProcessorSecret: 'cron-secret',
    }),
    { error() {} },
  );
  const unauthorized = response();
  await processor({ get: () => 'Bearer wrong' }, unauthorized, (error) => {
    throw error;
  });
  assert.equal(unauthorized.statusCode, 401);

  const res = response();
  await processor({ id: 'request-2', get: () => 'Bearer cron-secret' }, res, (error) => {
    throw error;
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(retryEvent, [9, 'MERCADOPAGO_REQUEST_FAILED']);
});

test('processor persists approved payments that cannot be applied before completing the webhook', async () => {
  const operations = [];
  const processor = createMercadoPagoWebhookProcessor(
    {
      async claimMercadoPagoWebhookEvents() {
        return [{ id: 11, provider_payment_id: '12345' }];
      },
      async approveMercadoPagoPayment() {
        return { status: 'amount-mismatch' };
      },
      async recordUnappliedMercadoPagoPayment(payment, reason) {
        operations.push({ type: 'record', payment, reason });
      },
      async completeMercadoPagoWebhookEvent(id) {
        operations.push({ type: 'complete', id });
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
          card: { number: 'sensitive' },
        };
      },
    },
    () => ({
      accessToken: 'access-token',
      webhookSecret: 'test-secret',
      webhookProcessorSecret: 'cron-secret',
    }),
    { warn() {} },
  );
  const res = response();

  await processor({ id: 'api-request-3', get: () => 'Bearer cron-secret' }, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(operations[0].type, 'record');
  assert.equal(operations[0].reason, 'amount-mismatch');
  assert.equal(operations[0].payment.provider_payload.card, undefined);
  assert.deepEqual(operations[1], { type: 'complete', id: 11 });
});

test('processor stores approved payments missing a preference id for manual review', async () => {
  let recorded;
  const processor = createMercadoPagoWebhookProcessor(
    {
      async claimMercadoPagoWebhookEvents() {
        return [{ id: 12, provider_payment_id: '12345' }];
      },
      async recordUnappliedMercadoPagoPayment(payment, reason) {
        recorded = { payment, reason };
      },
      async completeMercadoPagoWebhookEvent() {},
    },
    {
      async getPayment(id) {
        return {
          id,
          status: 'approved',
          external_reference: 'invoice-1',
          currency_id: 'UYU',
          transaction_amount: 100,
        };
      },
    },
    () => ({
      accessToken: 'access-token',
      webhookSecret: 'test-secret',
      webhookProcessorSecret: 'cron-secret',
    }),
    { warn() {} },
  );
  const res = response();

  await processor({ id: 'api-request-4', get: () => 'Bearer cron-secret' }, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(recorded.reason, 'invalid_provider_payment_fields');
  assert.equal(recorded.payment.external_reference, 'invoice-1');
  assert.equal(recorded.payment.preference_id, null);
});

test('processor completes non-approved payments without applying them', async () => {
  const warnings = [];
  let approved = false;
  let completed;
  const processor = createMercadoPagoWebhookProcessor(
    {
      async claimMercadoPagoWebhookEvents() {
        return [{ id: 10, provider_payment_id: '12345' }];
      },
      async approveMercadoPagoPayment() {
        approved = true;
      },
      async completeMercadoPagoWebhookEvent(id) {
        completed = id;
      },
    },
    {
      async getPayment(id) {
        return { id, status: 'pending' };
      },
    },
    () => ({
      accessToken: 'access-token',
      webhookSecret: 'test-secret',
      webhookProcessorSecret: 'cron-secret',
    }),
    { warn: (...args) => warnings.push(args) },
  );
  const res = response();

  await processor({ get: () => 'Bearer cron-secret' }, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(approved, false);
  assert.equal(completed, 10);
  assert.deepEqual(warnings, []);
});
