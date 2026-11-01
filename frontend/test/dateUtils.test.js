import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDaysFromToday, isExpiringWithinDays } from '../src/views/ClientArea/dateUtils.js';

test('date-only expiries use the America/Montevideo calendar day', () => {
  const now = new Date('2026-02-01T01:00:00.000Z');

  assert.equal(getDaysFromToday('2026-01-31', now), 0);
  assert.equal(getDaysFromToday('2026-01-30', now), -1);
  assert.equal(getDaysFromToday('2026-03-02', now), 30);
  assert.equal(getDaysFromToday('2026-02-30', now), null);
});

test('only today through the next 30 days count as upcoming', () => {
  const now = new Date('2026-02-01T01:00:00.000Z');

  assert.equal(isExpiringWithinDays('2026-01-31', 30, now), true);
  assert.equal(isExpiringWithinDays('2026-03-02', 30, now), true);
  assert.equal(isExpiringWithinDays('2026-01-30', 30, now), false);
  assert.equal(isExpiringWithinDays('2026-03-03', 30, now), false);
});
