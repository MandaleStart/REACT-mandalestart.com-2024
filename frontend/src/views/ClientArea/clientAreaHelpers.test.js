import assert from 'node:assert/strict';
import test from 'node:test';
import { getClientAreaGuidance, getClientServiceStatus } from './clientAreaHelpers.js';

test('returns an attention prompt when services are close to expiring', () => {
    const guidance = getClientAreaGuidance({
        servicesCount: 2,
        alertsCount: 1,
        pendingMilestones: 1,
        nextMilestone: { title: 'Entrega final', dueDate: '2026-11-12' },
    });

    assert.equal(guidance.title, 'Hay 1 servicio por revisar');
    assert.match(guidance.description, /Entrega final/i);
    assert.equal(guidance.priority, 'attention');
});

test('returns a success state when everything is fine', () => {
    const guidance = getClientAreaGuidance({
        servicesCount: 3,
        alertsCount: 0,
        pendingMilestones: 0,
        nextMilestone: null,
    });

    assert.equal(guidance.title, 'Todo está bajo control');
    assert.equal(guidance.priority, 'success');
});

test('describes active subscriptions by renewal date', () => {
    const now = new Date('2026-10-24T12:00:00.000Z');
    assert.deepEqual(getClientServiceStatus({
        status: 'active',
        renews_on: '2026-11-02',
    }, now), {
        label: 'Vence pronto',
        description: 'Vence en 9 días. Escribime si querés renovarlo.',
    });
    assert.deepEqual(getClientServiceStatus({
        status: 'active',
        renews_on: '2026-12-01',
    }, now), {
        label: 'Activo',
        description: 'Próxima renovación: 1 de diciembre de 2026.',
    });
});

test('describes expired subscriptions and tolerates invalid renewal dates', () => {
    assert.match(getClientServiceStatus({
        status: 'expired',
        renews_on: '2026-10-20',
    }).description, /Escribime para reactivarlo/);
    assert.deepEqual(getClientServiceStatus({
        status: 'active',
        renews_on: 'fecha-inválida',
    }), {
        label: 'Activo',
        description: '',
    });
});

test('uses client-facing copy for the empty service summary', () => {
    const guidance = getClientAreaGuidance({});
    assert.equal(guidance.title, 'Todavía no tenés servicios contratados');
    assert.match(guidance.description, /costos, vencimientos y estado/i);
});
