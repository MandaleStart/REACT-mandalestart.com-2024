import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  amountCentsToInput,
  calculateInvoiceTotals,
  formatBillingPeriod,
  formatMoneyCents,
  getMontevideoDateInputValue,
  toBillingApiUnits,
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

test('converts decimal currency inputs and VAT choices to API units', () => {
  assert.deepEqual(toBillingApiUnits('1500,00', '22'), {
    amount_cents: 150000,
    tax_rate_bp: 2200,
  });
  assert.deepEqual(toBillingApiUnits('12.3', '10'), {
    amount_cents: 1230,
    tax_rate_bp: 1000,
  });
  assert.deepEqual(toBillingApiUnits('0', '0'), {
    amount_cents: 0,
    tax_rate_bp: 0,
  });
  assert.deepEqual(toBillingApiUnits('10.25'), { amount_cents: 1025 });
  assert.equal(amountCentsToInput(12345), '123.45');
  assert.throws(() => toBillingApiUnits('1.234', '22'), /dos decimales/);
  assert.throws(() => toBillingApiUnits('1,2.3', '22'), /dos decimales/);
  assert.throws(() => toBillingApiUnits('1.00', '21'), /tasa de IVA/);
  assert.throws(() => toBillingApiUnits('1.00', ''), /tasa de IVA/);
});

test('calculates invoice preview totals with line-level tax rounding', () => {
  assert.deepEqual(
    calculateInvoiceTotals([
      { amount: '100.00', vat_rate: '22', quantity: '2' },
      { amount: '10.00', vat_rate: '10', quantity: '1' },
      { amount: '5.00', vat_rate: '0', quantity: '1' },
    ]),
    { subtotal_cents: 21500, tax_cents: 4500, total_cents: 26000 },
  );
});
