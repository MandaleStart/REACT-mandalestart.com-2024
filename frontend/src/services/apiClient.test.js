import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, apiRequest } from './apiClient.js';

function withMockFetch(mock, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock;
  return Promise.resolve()
    .then(run)
    .finally(() => {
      globalThis.fetch = originalFetch;
    });
}

test('sets JSON content type for request bodies and preserves custom authorization headers', () => withMockFetch(
  async (_url, options) => {
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    return new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json' } });
  },
  async () => {
    const result = await apiRequest('/api/profile', {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify({ name: 'Test' }),
    });

    assert.deepEqual(result, { ok: true });
  },
));

test('returns null for 204 responses and tolerates malformed JSON payloads', async () => {
  await withMockFetch(async () => new Response(null, { status: 204 }), async () => {
    assert.equal(await apiRequest('/api/delete'), null);
  });

  await withMockFetch(async () => new Response('{bad json', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }), async () => {
    assert.equal(await apiRequest('/api/legacy'), '{bad json');
  });
});

test('raises ApiError with status and a clear rate-limit message', async () => withMockFetch(
  async () => new Response('{"message":"rate limit"}', {
    status: 429,
    headers: { 'Content-Type': 'application/json' },
  }),
  async () => {
    await assert.rejects(apiRequest('/api/contact'), (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 429);
      assert.equal(error.message, 'Demasiados intentos, probá en unos minutos.');
      return true;
    });
  },
));

test('aborts requests after the configured timeout', async () => withMockFetch(
  (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }),
  async () => {
    await assert.rejects(apiRequest('/api/slow', { timeoutMs: 5 }), (error) => {
      assert.ok(error instanceof ApiError);
      assert.match(error.message, /tardó demasiado/);
      return true;
    });
  },
));

test('passes external abort signals through to fetch', async () => {
  const controller = new AbortController();
  await withMockFetch((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    controller.abort();
  }), async () => {
    await assert.rejects(apiRequest('/api/cancelled', { signal: controller.signal }), {
      name: 'AbortError',
    });
  });
});
