import { getPostgresPool, query } from './postgres.js';

const clientColumns = `id, name, email, phone, services, projects, created_at,
  to_char(updated_at AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`;

async function writeClientAudit(connection, actor, action, entityId, changes) {
  if (!actor || typeof actor.uid !== 'string' || typeof actor.email !== 'string') {
    throw Object.assign(new Error('No se pudo identificar al administrador para auditar el cambio.'), {
      code: 'INVALID_AUDIT_ACTOR',
    });
  }
  await connection.query(
    `INSERT INTO audit_log
      (actor_uid, actor_email, action, entity_type, entity_id, changes)
     VALUES ($1, $2, $3, 'client', $4, $5::jsonb)`,
    [actor.uid, actor.email, action, entityId, JSON.stringify(changes)],
  );
}

export async function getClientByEmail(email) {
  const result = await query(
    `SELECT ${clientColumns} FROM client_accounts
     WHERE lower(email) = lower($1) AND archived_at IS NULL LIMIT 1`,
    [email],
  );
  return result.rows[0] || null;
}

export async function listClients() {
  const result = await query(
    `SELECT ${clientColumns} FROM client_accounts
     WHERE archived_at IS NULL ORDER BY name, email`,
  );
  return result.rows;
}

export async function createClient(client, actor) {
  const connection = await getPostgresPool().connect();
  try {
    await connection.query('BEGIN');
    const result = await connection.query(
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
    const created = result.rows[0];
    await writeClientAudit(connection, actor, 'client.create', created.id, { after: created });
    await connection.query('COMMIT');
    return created;
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateClient(id, client, updatedAt, actor) {
  const connection = await getPostgresPool().connect();
  try {
    await connection.query('BEGIN');
    const current = await connection.query(
      `SELECT ${clientColumns} FROM client_accounts
       WHERE id = $1 AND archived_at IS NULL FOR UPDATE`,
      [id],
    );
    if (!current.rowCount) {
      await connection.query('COMMIT');
      return { status: 'not-found' };
    }
    if (current.rows[0].updated_at !== updatedAt) {
      await connection.query('COMMIT');
      return { status: 'conflict' };
    }
    const result = await connection.query(
      `UPDATE client_accounts
       SET name = $2, email = $3, phone = $4, services = $5::jsonb,
           projects = $6::jsonb, updated_at = now()
       WHERE id = $1 AND archived_at IS NULL
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
    const updated = result.rows[0];
    await writeClientAudit(connection, actor, 'client.update', id, {
      before: current.rows[0],
      after: updated,
    });
    await connection.query('COMMIT');
    return { status: 'updated', record: updated };
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateClientProfile(id, profile) {
  const result = await query(
    `UPDATE client_accounts
     SET name = $2, phone = $3, updated_at = now()
     WHERE id = $1 AND archived_at IS NULL
     RETURNING ${clientColumns}`,
    [id, profile.name, profile.phone],
  );
  return result.rows[0] || null;
}

export async function archiveClient(id, actor) {
  const connection = await getPostgresPool().connect();
  try {
    await connection.query('BEGIN');
    const client = await connection.query(
      `SELECT ${clientColumns} FROM client_accounts
       WHERE id = $1 AND archived_at IS NULL FOR UPDATE`,
      [id],
    );
    if (!client.rowCount) {
      await connection.query('COMMIT');
      return { status: 'not-found' };
    }

    const invoices = await connection.query(
      'SELECT EXISTS (SELECT 1 FROM invoices WHERE client_id = $1) AS has_invoices',
      [id],
    );
    if (invoices.rows[0].has_invoices) {
      await connection.query('COMMIT');
      return { status: 'has-invoices' };
    }

    const archived = await connection.query(
      'UPDATE client_accounts SET archived_at = now(), updated_at = now() WHERE id = $1',
      [id],
    );
    await writeClientAudit(connection, actor, 'client.archive', id, {
      before: client.rows[0],
      archived: archived.rowCount > 0,
    });
    await connection.query('COMMIT');
    return { status: 'archived' };
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
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

export async function saveCatalogService(slug, data, actor, action = 'catalog_service.update') {
  const connection = await getPostgresPool().connect();
  try {
    await connection.query('BEGIN');
    const previous = await connection.query(
      'SELECT slug, data FROM catalog_services WHERE slug = $1 FOR UPDATE',
      [slug],
    );
    const result = await connection.query(
      `INSERT INTO catalog_services (slug, data)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
       RETURNING slug, data`,
      [slug, JSON.stringify(data)],
    );
    const saved = result.rows[0];
    if (!actor || typeof actor.uid !== 'string' || typeof actor.email !== 'string') {
      throw Object.assign(new Error('No se pudo identificar al administrador para auditar el cambio.'), {
        code: 'INVALID_AUDIT_ACTOR',
      });
    }
    await connection.query(
      `INSERT INTO audit_log
        (actor_uid, actor_email, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, 'catalog_service', $4, $5::jsonb)`,
      [
        actor.uid,
        actor.email,
        action,
        slug,
        JSON.stringify({ before: previous.rows[0] || null, after: saved }),
      ],
    );
    await connection.query('COMMIT');
    return saved;
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}
