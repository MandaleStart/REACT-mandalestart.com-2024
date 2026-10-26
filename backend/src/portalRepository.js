import { query } from './postgres.js';

const clientColumns = 'id, name, email, phone, services, projects';

export async function getClientByEmail(email) {
  const result = await query(
    `SELECT ${clientColumns} FROM client_accounts WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  return result.rows[0] || null;
}

export async function listClients() {
  const result = await query(
    `SELECT ${clientColumns} FROM client_accounts ORDER BY name, email`,
  );
  return result.rows;
}

export async function createClient(client) {
  const result = await query(
    `INSERT INTO client_accounts (name, email, phone, services, projects)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
     RETURNING ${clientColumns}`,
    [
      client.name,
      client.email,
      client.phone,
      JSON.stringify(client.services),
      JSON.stringify(client.projects),
    ],
  );
  return result.rows[0];
}

export async function updateClient(id, client) {
  const result = await query(
    `UPDATE client_accounts
     SET name = $2, email = $3, phone = $4, services = $5::jsonb,
         projects = $6::jsonb, updated_at = now()
     WHERE id = $1
     RETURNING ${clientColumns}`,
    [
      id,
      client.name,
      client.email,
      client.phone,
      JSON.stringify(client.services),
      JSON.stringify(client.projects),
    ],
  );
  return result.rows[0] || null;
}

export async function updateClientProfile(id, profile) {
  const result = await query(
    `UPDATE client_accounts
     SET name = $2, phone = $3, updated_at = now()
     WHERE id = $1
     RETURNING ${clientColumns}`,
    [id, profile.name, profile.phone],
  );
  return result.rows[0] || null;
}

export async function deleteClient(id) {
  const result = await query(
    'DELETE FROM client_accounts WHERE id = $1 RETURNING id',
    [id],
  );
  return result.rowCount > 0;
}

export async function listCatalogServices() {
  const result = await query('SELECT slug, data FROM catalog_services ORDER BY slug');
  return result.rows;
}

export async function getCatalogService(slug) {
  const result = await query(
    'SELECT slug, data FROM catalog_services WHERE slug = $1',
    [slug],
  );
  return result.rows[0] || null;
}

export async function saveCatalogService(slug, data) {
  const result = await query(
    `INSERT INTO catalog_services (slug, data)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
     RETURNING slug, data`,
    [slug, JSON.stringify(data)],
  );
  return result.rows[0];
}
