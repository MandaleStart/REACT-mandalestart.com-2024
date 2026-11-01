const levelColors = {
    info: '\u001b[37m',
    warn: '\u001b[33m',
    error: '\u001b[31m',
    success: '\u001b[32m',
};
const requestColors = {
    success: '\u001b[32m',
    warning: '\u001b[33m',
    error: '\u001b[31m',
};
const colorReset = '\u001b[0m';
export const SLOW_REQUEST_THRESHOLD_MS = 1000;

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

function supportsColor() {
    if (process.env.NO_COLOR !== undefined) return false;
    if (process.env.FORCE_COLOR !== undefined) return process.env.FORCE_COLOR !== '0';
    return Boolean(process.stdout.isTTY);
}

export function formatLogEntry(entry, { colors = supportsColor() } = {}) {
    const color = colors ? levelColors[entry.level] : '';
    const level = color
        ? `${color}${entry.level}${colorReset}`
        : entry.level;
    const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';

    return `[${entry.timestamp}][${level}] ${entry.message}:${meta}`;
}

function colorize(value, color, colors) {
    return colors ? `${color}${value}${colorReset}` : value;
}

export function formatRequestLogEntry(
    entry,
    { colors = supportsColor(), slowThresholdMs = SLOW_REQUEST_THRESHOLD_MS } = {},
) {
    const { method, url, statusCode, durationMs, ...meta } = entry.meta;
    const statusColor = statusCode >= 400
        ? requestColors.error
        : statusCode >= 300
            ? requestColors.warning
            : requestColors.success;
    const durationColor = durationMs >= slowThresholdMs
        ? requestColors.warning
        : requestColors.success;
    const level = colorize(entry.level, levelColors[entry.level], colors);
    const status = colorize(statusCode, statusColor, colors);
    const duration = colorize(`${durationMs}ms`, durationColor, colors);
    const extraMeta = Object.keys(meta).length > 0 ? `: ${JSON.stringify(meta)}` : '';

    return `[${entry.timestamp}][${level}] ${entry.message} [${method}] [${url}] [${status}] [${duration}]${extraMeta}`;
}

function writeLog(level, method, message, meta = {}) {
    const entry = createEntry(level, message, meta);
    console[method](formatLogEntry(entry));
    return entry;
}

export const logger = {
    info(message, meta = {}) {
        return writeLog('info', 'info', message, meta);
    },
    warn(message, meta = {}) {
        return writeLog('warn', 'warn', message, meta);
    },
    error(message, meta = {}) {
        return writeLog('error', 'error', message, meta);
    },
    success(message, meta = {}) {
        return writeLog('success', 'info', message, meta);
    },
    request({ method, url, statusCode, durationMs, route, requestId }) {
        const entry = createEntry('info', 'http_request', {
            requestId,
            method,
            url,
            statusCode,
            durationMs,
            route,
        });
        console.info(formatRequestLogEntry(entry));
        return entry;
    },
};
