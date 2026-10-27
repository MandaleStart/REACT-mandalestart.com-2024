function createEntry(level, message, meta) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
    };

    if (meta && Object.keys(meta).length > 0) {
        entry.meta = meta;
    }

    return entry;
}

export const logger = {
    info(message, meta = {}) {
        const entry = createEntry('info', message, meta);
        console.info(JSON.stringify(entry));
        return entry;
    },
    warn(message, meta = {}) {
        const entry = createEntry('warn', message, meta);
        console.warn(JSON.stringify(entry));
        return entry;
    },
    error(message, meta = {}) {
        const entry = createEntry('error', message, meta);
        console.error(JSON.stringify(entry));
        return entry;
    },
    request({ method, url, statusCode, durationMs, route, requestId }) {
        return this.info('http_request', {
            requestId,
            method,
            url,
            statusCode,
            durationMs,
            route,
        });
    },
};
