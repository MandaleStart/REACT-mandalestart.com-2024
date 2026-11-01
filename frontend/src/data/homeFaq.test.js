import assert from 'node:assert/strict';
import { test } from 'node:test';
import homeFaq from './homeFaq.js';

test('publishes the nine client questions without a fictional cancellation policy', () => {
  assert.equal(homeFaq.length, 9);
  assert.match(homeFaq.find(({ question }) => question === '¿Cómo pago?').answer, /transferencia/);
  assert.match(
    homeFaq.find(({ question }) => question === '¿Qué pasa si quiero cancelar un servicio?').answer,
    /te confirmo los pasos antes de hacer cualquier cambio/,
  );
  assert.doesNotMatch(homeFaq.map(({ answer }) => answer).join(' '), /\[[^\]]+\]/);
});
