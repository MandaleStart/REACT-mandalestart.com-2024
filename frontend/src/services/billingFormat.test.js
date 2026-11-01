import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatBillingPeriod,
  formatMoneyCents,
  getMontevideoDateInputValue,
} from './billingFormat.js';

test('formats integer cents with the requested currency and rejects unsafe values', () => {
  assert.match(formatMoneyCents(12345, 'UYU'), /123,45/);
  assert.match(formatMoneyCents(2500, 'USD'), /25,00/);
  assert.equal(formatMoneyCents(Number.MAX_SAFE_INTEGER + 1, 'UYU'), 'Importe no disponible');
  assert.equal(formatMoneyCents(100, 'EUR'), 'Importe no disponible');
});

test('labels the supported billing periods', () => {
  assert.equal(formatBillingPeriod('one_time'), 'Pago único');
  assert.equal(formatBillingPeriod('monthly'), 'Mensual');
  assert.equal(formatBillingPeriod('yearly'), 'Anual');
});

test('formats invoice date inputs in the Montevideo timezone', () => {
  assert.equal(getMontevideoDateInputValue(new Date('2024-01-01T01:00:00.000Z')), '2023-12-31');
  assert.equal(getMontevideoDateInputValue(new Date('2024-01-01T15:00:00.000Z')), '2024-01-01');
});
