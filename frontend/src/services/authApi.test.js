import assert from 'node:assert/strict';
import { test } from 'node:test';
import { updateClientProfile } from './authApi.js';

test('sends JSON content type and authorization when updating a client profile', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl;
  let requestOptions;

  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const profile = { name: 'Nicolás', phone: '+59812345678' };
    const result = await updateClientProfile('test-token', profile);

    assert.equal(requestUrl, '/api/clients/me/profile');
    assert.equal(requestOptions.method, 'PUT');
    assert.equal(requestOptions.headers.get('Content-Type'), 'application/json');
    assert.equal(requestOptions.headers.get('Authorization'), 'Bearer test-token');
    assert.equal(requestOptions.body, JSON.stringify(profile));
    assert.deepEqual(result, { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
