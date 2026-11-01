import assert from 'node:assert/strict';
import test from 'node:test';

import { buildClientDataExport } from './clientDataExport.js';

test('exports client profile, projects, subscriptions and invoices without internal/provider data', () => {
  const exported = buildClientDataExport({
    exportedAt: '2026-11-01T10:00:00.000Z',
    account: {
      id: 'client-1',
      name: 'Cliente',
      email: 'client@example.com',
      company: 'Empresa',
      billing_email: 'billing@example.com',
      projects: [{
        id: 'project-1',
        title: 'Sitio web',
        internal_notes: 'staff only',
        milestones: [{
          title: 'Entrega',
          status: 'pending',
          privateNotes: 'staff only',
        }],
      }],
      internal_notes: 'staff only',
    },
    subscriptions: [{
      id: 'subscription-1',
      label: 'Hosting',
      amount_cents: '1500',
      details: [{ label: 'Servidor', value: 'Activo', internal_notes: 'staff only' }],
      internal_notes: 'staff only',
      provider_payload: { token: 'secret' },
    }],
    invoices: [{
      id: 'invoice-1',
      number: 'MS-2026-0001',
      total_cents: '1500',
      items: [{ description: 'Hosting', quantity: '1', internal_notes: 'staff only' }],
      provider_payload: { token: 'secret' },
      internal_notes: 'staff only',
    }],
  });

  assert.equal(exported.profile.name, 'Cliente');
  assert.equal(exported.projects[0].milestones[0].title, 'Entrega');
  assert.equal(exported.subscriptions[0].amount_cents, '1500');
  assert.deepEqual(exported.subscriptions[0].details, [{ label: 'Servidor', value: 'Activo' }]);
  assert.equal(exported.invoices[0].number, 'MS-2026-0001');
  assert.deepEqual(exported.invoices[0].items, [{ description: 'Hosting', quantity: '1' }]);
  assert.doesNotMatch(JSON.stringify(exported), /internal_notes|privateNotes|provider_payload|secret/);
});
