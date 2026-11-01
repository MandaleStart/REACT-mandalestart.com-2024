import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatLogEntry,
    formatRequestLogEntry,
    logger,
    SLOW_REQUEST_THRESHOLD_MS,
} from '../src/logger.js';

test('formats log entries with timestamp, level, message, and metadata', () => {
    const line = formatLogEntry({
        timestamp: '2026-11-01T05:30:04.772Z',
        level: 'info',
        message: 'backend_started',
        meta: { port: 4000, protocol: 'http' },
    }, { colors: false });

    assert.equal(
        line,
        '[2026-11-01T05:30:04.772Z][info] backend_started: {"port":4000,"protocol":"http"}',
    );
});

test('uses the requested colors for each log level', () => {
    const levels = [
        ['info', '\u001b[37m'],
        ['warn', '\u001b[33m'],
        ['error', '\u001b[31m'],
        ['success', '\u001b[32m'],
    ];

    for (const [level, color] of levels) {
        const line = formatLogEntry({
            timestamp: '2026-11-01T05:30:04.772Z',
            level,
            message: 'status',
        }, { colors: true });

        assert.ok(line.includes(`[${color}${level}\u001b[0m]`));
    }
});

test('success logs use the green success level and retain the returned entry', () => {
    const originalConsoleInfo = console.info;
    const output = [];
    console.info = (line) => output.push(line);

    try {
        const entry = logger.success('server_ready', { port: 4000 });

        assert.equal(entry.level, 'success');
        assert.equal(entry.message, 'server_ready');
        assert.deepEqual(entry.meta, { port: 4000 });
        assert.ok(output[0].includes(' server_ready: {"port":4000}'));
    } finally {
        console.info = originalConsoleInfo;
    }
});

test('formats request status and duration in brackets and retains other metadata', () => {
    const entry = {
        timestamp: '2026-11-01T05:30:04.772Z',
        level: 'info',
        message: 'http_request',
        meta: {
            requestId: 'req-123',
            method: 'GET',
            url: '/api/health',
            statusCode: 200,
            durationMs: 2,
            route: '/health',
        },
    };

    assert.equal(
        formatRequestLogEntry(entry, { colors: false }),
        '[2026-11-01T05:30:04.772Z][info] http_request [GET] [/api/health] [200] [2ms]: {"requestId":"req-123","route":"/health"}',
    );
});

test('colors error status red and slow duration yellow', () => {
    const line = formatRequestLogEntry({
        timestamp: '2026-11-01T05:30:04.772Z',
        level: 'info',
        message: 'http_request',
        meta: {
            method: 'GET',
            url: '/api/admin/audit',
            statusCode: 500,
            durationMs: SLOW_REQUEST_THRESHOLD_MS,
        },
    }, { colors: true });

    assert.ok(line.includes('[\u001b[31m500\u001b[0m]'));
    assert.ok(line.includes('[\u001b[33m1000ms\u001b[0m]'));
});

test('colors client errors red and non-slow successful durations green', () => {
    const line = formatRequestLogEntry({
        timestamp: '2026-11-01T05:30:04.772Z',
        level: 'info',
        message: 'http_request',
        meta: {
            method: 'POST',
            url: '/api/admin/invoices',
            statusCode: 400,
            durationMs: 12,
        },
    }, { colors: true });

    assert.ok(line.includes('[\u001b[31m400\u001b[0m]'));
    assert.ok(line.includes('[\u001b[32m12ms\u001b[0m]'));
});

test('request logger writes the specialized format and returns complete metadata', () => {
    const originalConsoleInfo = console.info;
    const output = [];
    console.info = (line) => output.push(line);

    try {
        const entry = logger.request({
            requestId: 'req-123',
            method: 'GET',
            url: '/api/health',
            statusCode: 200,
            durationMs: 2,
            route: '/health',
        });

        assert.equal(entry.meta.statusCode, 200);
        assert.equal(entry.meta.durationMs, 2);
        assert.match(output[0], /http_request \[GET\] \[\/api\/health\] \[200\] \[2ms\]/);
    } finally {
        console.info = originalConsoleInfo;
    }
});
