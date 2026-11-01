const DAY_MS = 86400000;
const MONTEVIDEO_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Montevideo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return timestamp;
}

function getMontevideoToday(now) {
  const parts = MONTEVIDEO_DATE_FORMATTER.formatToParts(now);
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return Date.UTC(Number(date.year), Number(date.month) - 1, Number(date.day));
}

export function getDaysFromToday(value, now = new Date()) {
  const date = parseDate(value);
  return date === null ? null : Math.round((date - getMontevideoToday(now)) / DAY_MS);
}

export function isExpiringWithinDays(expiry, days = 30, now = new Date()) {
  const daysUntilExpiry = getDaysFromToday(expiry, now);
  return daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= days;
}
