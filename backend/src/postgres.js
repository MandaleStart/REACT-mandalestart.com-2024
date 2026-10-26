import pg from 'pg';

const { Pool } = pg;
let pool;

export const isPostgresConfigured = () => Boolean(process.env.DATABASE_URL);

export function getPostgresPool() {
  if (!isPostgresConfigured()) {
    throw Object.assign(new Error('DATABASE_URL no está configurada.'), {
      code: 'DATABASE_NOT_CONFIGURED',
    });
  }

  if (!pool) {
    const max = Number(process.env.PG_POOL_MAX || (process.env.VERCEL ? 1 : 5));
    if (!Number.isInteger(max) || max < 1 || max > 20) {
      throw new Error('PG_POOL_MAX debe ser un entero entre 1 y 20.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }

  return pool;
}

export const query = (text, values) => getPostgresPool().query(text, values);

export async function closePostgresPool() {
  if (!pool) return;
  const currentPool = pool;
  pool = undefined;
  await currentPool.end();
}
