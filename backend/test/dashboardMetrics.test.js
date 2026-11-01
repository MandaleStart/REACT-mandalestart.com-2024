import assert from 'node:assert/strict';
import { test } from 'node:test';
import { projectClientRecord } from '../src/services/clientProjection.js';
import {
  buildAdminDashboard,
  buildClientDashboard,
} from '../src/services/dashboardMetrics.js';

const now = new Date('2026-02-01T01:00:00.000Z');

test('client projection excludes internal billing fields at every projected level', () => {
  const projected = projectClientRecord({
    id: 'client-1',
    name: 'Cliente',
    internal_notes: 'internal',
    provider_payload: { token: 'private' },
    services: [{
      type: 'hosting',
      internal_notes: 'internal service note',
      provider_payload: { token: 'private' },
    }],
  });

  assert.equal('internal_notes' in projected, false);
  assert.equal('provider_payload' in projected, false);
  assert.equal('internal_notes' in projected.services[0], false);
  assert.equal('provider_payload' in projected.services[0], false);
});

test('dashboard metrics accept PostgreSQL records without Firestore data wrappers', () => {
  let firestoreDataCalled = false;
  const wrappedRecord = {
    data() {
      firestoreDataCalled = true;
      return { services: [{ status: 'active' }] };
    },
  };

  const dashboard = buildClientDashboard(wrappedRecord, { now });
  assert.equal(firestoreDataCalled, false);
  assert.equal(dashboard.overview.totalServices, 0);
});

test('client dashboard separates overdue items and uses the Montevideo calendar day', () => {
  const dashboard = buildClientDashboard({
    services: [
      { title: 'Vencido', status: 'active', expiry: '2026-01-30' },
      { title: 'Vence hoy', status: 'active', expiry: '2026-01-31' },
      { title: 'En 30 días', status: 'active', expiry: '2026-03-02' },
      { title: 'Fuera del período', status: 'active', expiry: '2026-03-03' },
      { title: 'Fecha inválida', status: 'active', expiry: '2026-02-30' },
    ],
    projects: [{
      title: 'Proyecto',
      milestones: [
        { title: 'Hito vencido', status: 'pending', dueDate: '2026-01-30' },
        { title: 'Próximo hito', status: 'pending', dueDate: '2026-01-31' },
      ],
    }],
  }, { now });

  assert.deepEqual(dashboard.alerts.map(({ serviceTitle, diffDays }) => [serviceTitle, diffDays]), [
    ['Vence hoy', 0],
    ['En 30 días', 30],
  ]);
  assert.deepEqual(dashboard.overdue.map(({ serviceTitle, daysOverdue }) => [serviceTitle, daysOverdue]), [
    ['Vencido', 1],
  ]);
  assert.equal(dashboard.overview.upcomingMilestones, 1);
  assert.equal(dashboard.overview.overdueMilestones, 1);
  assert.equal(dashboard.nextMilestone.title, 'Próximo hito');
});

test('admin dashboard keeps overdue work separate from the next-30-day priorities', () => {
  const dashboard = buildAdminDashboard([{
    id: 'client-1',
    name: 'Cliente',
    services: [
      { title: 'Servicio vencido', status: 'active', expiry: '2026-01-30' },
      { title: 'Servicio próximo', status: 'active', expiry: '2026-01-31' },
      { title: 'Servicio futuro', status: 'active', expiry: '2026-03-03' },
    ],
    projects: [{
      title: 'Proyecto',
      milestones: [
        { title: 'Hito vencido', status: 'pending', dueDate: '2026-01-30' },
        { title: 'Hito próximo', status: 'pending', dueDate: '2026-01-31' },
      ],
    }],
  }], { now });

  assert.equal(dashboard.overview.overdueItems, 2);
  assert.deepEqual(dashboard.overdueItems.map(({ title, daysOverdue }) => [title, daysOverdue]), [
    ['Servicio vencido', 1],
    ['Hito vencido', 1],
  ]);
  assert.ok(dashboard.priorityItems.length > 0);
  assert.ok(dashboard.priorityItems.every(({ diffDays }) => diffDays >= 0 && diffDays <= 30));
});
