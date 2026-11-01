import { query } from '../postgres.js';

export class PostgresRateLimitStore {
  constructor({ keyPrefix = 'api', queryFn = query } = {}) {
    this.keyPrefix = keyPrefix;
    this.query = queryFn;
    this.windowMs = 0;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const rateKey = `${this.keyPrefix}:${key}`;
    const result = await this.query(
      `INSERT INTO api_rate_limit_windows (rate_key, hits, reset_at)
       VALUES ($1, 1, now() + ($2 * interval '1 millisecond'))
       ON CONFLICT (rate_key) DO UPDATE
       SET hits = CASE
             WHEN api_rate_limit_windows.reset_at <= now() THEN 1
             ELSE api_rate_limit_windows.hits + 1
           END,
           reset_at = CASE
             WHEN api_rate_limit_windows.reset_at <= now()
               THEN now() + ($2 * interval '1 millisecond')
             ELSE api_rate_limit_windows.reset_at
           END
       RETURNING hits, reset_at`,
      [rateKey, this.windowMs],
    );

    return {
      totalHits: Number(result.rows[0].hits),
      resetTime: result.rows[0].reset_at,
    };
  }

  async decrement(key) {
    await this.query(
      `UPDATE api_rate_limit_windows
       SET hits = GREATEST(0, hits - 1)
       WHERE rate_key = $1 AND reset_at > now()`,
      [`${this.keyPrefix}:${key}`],
    );
  }

  async resetKey(key) {
    await this.query('DELETE FROM api_rate_limit_windows WHERE rate_key = $1', [
      `${this.keyPrefix}:${key}`,
    ]);
  }

  async cleanupExpired() {
    const result = await this.query('DELETE FROM api_rate_limit_windows WHERE reset_at < now()');
    return result.rowCount;
  }
}
