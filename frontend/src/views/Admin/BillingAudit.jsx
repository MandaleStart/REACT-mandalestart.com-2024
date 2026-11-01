import { useEffect, useState } from 'react';
import { listBillingAudit } from '../../services/billingApi.js';

export default function BillingAudit() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listBillingAudit()
      .then((result) => {
        if (active) setEntries(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No pude cargar la bitácora.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="billing-admin-section">
      <header className="admin-panel-heading">
        <div>
          <span className="eyebrow">Registro</span>
          <h2>Auditoría</h2>
        </div>
      </header>
      {error && (
        <p className="admin-feedback error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Administrador</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Cambios</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.created_at).toLocaleString('es-UY')}</td>
                <td>{entry.actor_email}</td>
                <td>{entry.action}</td>
                <td>
                  {entry.entity_type} · {entry.entity_id}
                </td>
                <td>
                  <pre className="billing-audit-changes">
                    {JSON.stringify(entry.changes, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan="5">Cargando auditoría…</td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan="5">Todavía no hay movimientos en la bitácora.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
