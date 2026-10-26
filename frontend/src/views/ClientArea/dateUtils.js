export function isExpiringWithinDays(expiry, days = 30, now = new Date()) {
  if (typeof expiry !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return false;
  const expiryDate = new Date(`${expiry}T00:00:00.000Z`);
  if (Number.isNaN(expiryDate.getTime()) || expiryDate.toISOString().slice(0, 10) !== expiry) return false;

  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000);
  return daysUntilExpiry >= 0 && daysUntilExpiry <= days;
}
