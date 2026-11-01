import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getValidatedEnv } from '../src/config.js';

test('HTTP_MODE defaults to HTTP and only accepts explicit boolean values', () => {
  assert.equal(getValidatedEnv({}).HTTP_MODE, 'true');
  assert.equal(getValidatedEnv({ HTTP_MODE: 'false' }).HTTP_MODE, 'false');
  assert.throws(() => getValidatedEnv({ HTTP_MODE: 'yes' }), /HTTP_MODE debe ser true o false/);
});
