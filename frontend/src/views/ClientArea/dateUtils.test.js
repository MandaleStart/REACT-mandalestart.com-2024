import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isExpiringWithinDays } from './dateUtils.js';

const today = new Date('2026-10-24T12:00:00.000Z');

test('counts dates due today and within 30 days', () => {
  assert.equal(isExpiringWithinDays('2026-10-24', 30, today), true);
  assert.equal(isExpiringWithinDays('2026-11-23', 30, today), true);
});

test('does not count expired dates or dates beyond the due window', () => {
  assert.equal(isExpiringWithinDays('2026-10-23', 30, today), false);
  assert.equal(isExpiringWithinDays('2026-11-24', 30, today), false);
});

test('ignores malformed and impossible dates', () => {
  assert.equal(isExpiringWithinDays('', 30, today), false);
  assert.equal(isExpiringWithinDays('2026-2-03', 30, today), false);
  assert.equal(isExpiringWithinDays('2026-02-30', 30, today), false);
});
