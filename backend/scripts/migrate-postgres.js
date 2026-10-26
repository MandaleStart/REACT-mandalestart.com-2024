import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPostgresPool, closePostgresPool } from '../src/postgres.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(__dirname, '..', 'migrations');

async function migrate() {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [731904261]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const filenames = (await fs.readdir(migrationsDirectory))
      .filter((filename) => filename.endsWith('.sql'))
      .sort();

    for (const filename of filenames) {
      const existing = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [filename],
      );
      if (existing.rowCount > 0) {
        console.info(`Migración ya aplicada: ${filename}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDirectory, filename), 'utf8');
      let transactionStarted = false;
      try {
        await client.query('BEGIN');
        transactionStarted = true;
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename],
        );
        await client.query('COMMIT');
        transactionStarted = false;
        console.info(`Migración aplicada: ${filename}`);
      } catch (error) {
        if (transactionStarted) await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

try {
  await migrate();
} catch (error) {
  console.error('No se pudieron ejecutar las migraciones de PostgreSQL:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await closePostgresPool();
}
