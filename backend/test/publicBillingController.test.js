import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPublicBillingControllers } from '../src/controllers/publicBillingController.js';

function response() {
  return {
    headers: {},
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('public plans only return active public fields and use shared cache headers', async () => {
  const controllers = createPublicBillingControllers({
    async listPlans() {
      return [
        {
          id: 'public-plan',
          service_slug: 'hosting',
          code: 'basic',
          name: 'Hosting básico',
          description: 'Plan público',
          currency: 'UYU',
          amount_cents: '15000',
          billing_period: 'monthly',
          tax_rate_bp: 2200,
          features: ['SSL'],
          is_public: true,
          is_active: true,
          internal_notes: 'No publicar',
          provider_payload: { secret: true },
        },
        { id: 'private-plan', is_public: false, is_active: true },
        { id: 'inactive-plan', is_public: true, is_active: false },
      ];
    },
  }, () => true);
  const res = response();

  await controllers.listPlans({}, res, (error) => { throw error; });

  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].id, 'public-plan');
  assert.equal('internal_notes' in res.body[0], false);
  assert.equal('provider_payload' in res.body[0], false);
  assert.match(res.headers['Cache-Control'], /public/);
});

test('public plans return an empty list when billing storage is not configured', async () => {
  const controllers = createPublicBillingControllers({
    async listPlans() {
      throw new Error('The database should not be queried.');
    },
  }, () => false);
  const res = response();

  await controllers.listPlans({}, res, (error) => { throw error; });

  assert.deepEqual(res.body, []);
});
