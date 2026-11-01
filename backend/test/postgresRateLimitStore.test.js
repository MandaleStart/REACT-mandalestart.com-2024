import assert from 'node:assert/strict';
import test from 'node:test';

import { PostgresRateLimitStore } from '../src/middleware/postgresRateLimitStore.js';

test('prefixes rate-limit keys and returns the PostgreSQL counter result', async () => {
  const calls = [];
  const store = new PostgresRateLimitStore({
    keyPrefix: 'contact',
    queryFn: async (text, values) => {
      calls.push({ text, values });
      if (text.startsWith('INSERT')) {
        return { rows: [{ hits: '3', reset_at: '2026-11-01T04:15:00.000Z' }] };
      }
      return { rows: [] };
    },
  });
  store.init({ windowMs: 15 * 60 * 1000 });

  const result = await store.increment('127.0.0.1');

  assert.deepEqual(result, {
    totalHits: 3,
    resetTime: '2026-11-01T04:15:00.000Z',
  });
  assert.deepEqual(calls[0].values, ['contact:127.0.0.1', 15 * 60 * 1000]);
  assert.match(calls[0].text, /ON CONFLICT \(rate_key\) DO UPDATE/);
  assert.equal(calls.length, 1);
});

test('decrement and reset use the same isolated rate-limit key', async () => {
  const calls = [];
  const store = new PostgresRateLimitStore({
    keyPrefix: 'api',
    queryFn: async (text, values) => {
      calls.push({ text, values });
      return { rows: [] };
    },
  });

  await store.decrement('127.0.0.1');
  await store.resetKey('127.0.0.1');

  assert.deepEqual(calls.map(({ values }) => values), [
    ['api:127.0.0.1'],
    ['api:127.0.0.1'],
  ]);
});

test('expired rate-limit windows can be cleaned outside request handling', async () => {
  let cleanupQuery;
  const store = new PostgresRateLimitStore({
    queryFn: async (text) => {
      cleanupQuery = text;
      return { rows: [], rowCount: 4 };
    },
  });

  assert.equal(await store.cleanupExpired(), 4);
  assert.match(cleanupQuery, /DELETE FROM api_rate_limit_windows WHERE reset_at < now\(\)/);
});
