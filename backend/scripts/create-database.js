import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';

dotenv.config();

const { Client } = pg;
const databaseName = process.env.DATABASE_NAME || 'mandalestart';
const applicationUser = process.env.DATABASE_APP_USER || 'mandalestart_app';
const adminUrl = process.env.DATABASE_ADMIN_URL;
const envFile = path.resolve(process.cwd(), '.env');

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function saveApplicationUrl(connectionString) {
  let contents = '';
  try {
    contents = await fs.readFile(envFile, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const lines = contents
    .split(/\r?\n/)
    .filter((line) => !/^\s*(DATABASE_ADMIN_URL|DATABASE_URL)\s*=/.test(line));
  while (lines.length > 0 && lines.at(-1) === '') lines.pop();
  lines.push(`DATABASE_URL=${connectionString}`);
  await fs.writeFile(envFile, `${lines.join('\n')}\n`, { mode: 0o600 });
}

async function createDatabase() {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/.test(databaseName)) {
    throw new Error('DATABASE_NAME debe ser un identificador PostgreSQL simple de hasta 63 caracteres.');
  }
  if (!adminUrl) {
    throw Object.assign(new Error('DATABASE_ADMIN_URL no está configurada.'), {
      code: 'DATABASE_ADMIN_NOT_CONFIGURED',
    });
  }

  const client = new Client({
    connectionString: adminUrl,
    connectionTimeoutMillis: 5000,
    application_name: 'mandalestart-db-setup',
  });

  try {
    await client.connect();
    let applicationPassword = process.env.DATABASE_APP_PASSWORD;
    const existingRole = await client.query(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [applicationUser],
    );
    if (existingRole.rowCount === 0) {
      applicationPassword ||= randomBytes(32).toString('base64url');
      const createRole = await client.query(
        'SELECT format(\'CREATE ROLE %I LOGIN PASSWORD %L\', $1::text, $2::text) AS sql',
        [applicationUser, applicationPassword],
      );
      await client.query(createRole.rows[0].sql);
    } else if (!applicationPassword) {
      const existingApplicationUrl = process.env.DATABASE_URL;
      if (!existingApplicationUrl) {
        throw new Error('El rol de aplicación ya existe; configure DATABASE_APP_PASSWORD para actualizar su contraseña.');
      }
      const existingUrl = new URL(existingApplicationUrl);
      if (decodeURIComponent(existingUrl.username) !== applicationUser) {
        throw new Error('DATABASE_URL no corresponde al usuario PostgreSQL de la aplicación.');
      }
      applicationPassword = decodeURIComponent(existingUrl.password);
    }

    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (existing.rowCount > 0) {
      const ownership = await client.query(
        `SELECT pg_get_userbyid(datdba) AS owner
         FROM pg_database WHERE datname = $1`,
        [databaseName],
      );
      if (ownership.rows[0].owner !== applicationUser) {
        throw new Error(`La base "${databaseName}" ya existe y no pertenece al usuario de la aplicación; no se modificó.`);
      }
      console.info(`La base de datos "${databaseName}" ya existe y pertenece a la aplicación.`);
    } else {
      await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)} OWNER ${quoteIdentifier(applicationUser)}`);
      console.info(`Base de datos "${databaseName}" creada.`);
    }

    const applicationUrl = new URL(adminUrl);
    applicationUrl.username = applicationUser;
    applicationUrl.password = applicationPassword;
    applicationUrl.pathname = `/${databaseName}`;
    applicationUrl.searchParams.set('application_name', 'mandalestart-backend');
    await saveApplicationUrl(applicationUrl.toString());
    console.info('Conexión local de la aplicación guardada en backend/.env.');
  } finally {
    await client.end();
  }
}

try {
  await createDatabase();
} catch (error) {
  console.error('No se pudo preparar la base de datos:', error.code || error.name);
  process.exitCode = 1;
}
