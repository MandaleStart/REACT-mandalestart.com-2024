import assert from 'node:assert/strict';
import test from 'node:test';
import { getClientAreaGuidance } from './clientAreaHelpers.js';

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
