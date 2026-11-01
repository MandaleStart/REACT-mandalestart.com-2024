import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countUpcomingServiceExpiries,
  countUsersWithoutClientProfile,
} from './billingDashboardMetrics.js';

test('counts only service expiry priorities in the next 30 days', () => {
  assert.equal(
    countUpcomingServiceExpiries([
      { kind: 'service-expiry', diffDays: 0 },
      { kind: 'service-expiry', diffDays: 30 },
      { kind: 'service-expiry', diffDays: 31 },
      { kind: 'milestone', diffDays: 5 },
      { kind: 'service', diffDays: 3 },
    ]),
    2,
  );
});

test('counts registered non-admin users without a client profile', () => {
  assert.equal(
    countUsersWithoutClientProfile([
      { uid: 'user-1', clientId: '' },
      { uid: 'user-2', clientId: 'client-2' },
      { uid: 'admin-1', isAdmin: true, clientId: '' },
      { uid: 'user-3', clientId: null },
    ]),
    2,
  );
  assert.equal(countUsersWithoutClientProfile(null), 0);
});
