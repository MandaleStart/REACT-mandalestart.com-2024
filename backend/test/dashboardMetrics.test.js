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
  assert.equal('services' in projected, false);
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

test('client dashboard uses subscriptions and separates overdue items by Montevideo calendar day', () => {
  const dashboard = buildClientDashboard({
    projects: [{
      title: 'Proyecto',
      milestones: [
        { title: 'Hito vencido', status: 'pending', dueDate: '2026-01-30' },
        { title: 'Próximo hito', status: 'pending', dueDate: '2026-01-31' },
      ],
    }],
  }, {
    now,
    subscriptions: [
      { label: 'Vencido', status: 'active', renews_on: '2026-01-30' },
      { label: 'Vence hoy', status: 'active', renews_on: '2026-01-31' },
      { label: 'En 30 días', status: 'active', renews_on: '2026-03-02' },
      { label: 'Fuera del período', status: 'active', renews_on: '2026-03-03' },
      { label: 'Fecha inválida', status: 'active', renews_on: '2026-02-30' },
    ],
  });

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

test('admin dashboard uses subscriptions and keeps overdue work separate from upcoming priorities', () => {
  const dashboard = buildAdminDashboard([{
    id: 'client-1',
    name: 'Cliente',
    projects: [{
      title: 'Proyecto',
      milestones: [
        { title: 'Hito vencido', status: 'pending', dueDate: '2026-01-30' },
        { title: 'Hito próximo', status: 'pending', dueDate: '2026-01-31' },
      ],
    }],
  }], {
    now,
    subscriptions: [
      { client_id: 'client-1', label: 'Servicio vencido', status: 'active', renews_on: '2026-01-30' },
      { client_id: 'client-1', label: 'Servicio próximo', status: 'active', renews_on: '2026-01-31' },
      { client_id: 'client-1', label: 'Servicio futuro', status: 'active', renews_on: '2026-03-03' },
    ],
  });

  assert.equal(dashboard.overview.overdueItems, 2);
  assert.deepEqual(
    dashboard.overdueItems
      .map(({ title, daysOverdue }) => [title, daysOverdue])
      .sort(([first], [second]) => first.localeCompare(second)),
    [
      ['Hito vencido', 1],
      ['Servicio vencido', 1],
    ],
  );
  assert.ok(dashboard.priorityItems.length > 0);
  assert.ok(dashboard.priorityItems.every(({ diffDays }) => diffDays >= 0 && diffDays <= 30));
});
