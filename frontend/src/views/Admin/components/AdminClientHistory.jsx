import { useEffect, useState } from 'react';
import { listBillingAudit } from '../../../services/billingApi.js';

/* eslint-disable react/prop-types */
export default function AdminClientHistory({ clientId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setEntries([]);
    listBillingAudit({ entity_type: 'client', entity_id: clientId, limit: 100 })
      .then((result) => {
        if (active) setEntries(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No pude cargar el historial del cliente.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  return (
    <section className="admin-panel admin-client-history" aria-labelledby="client-history-title">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Registro</span>
          <h2 id="client-history-title">Historial del cliente</h2>
        </div>
      </div>
      {error && (
        <p className="admin-feedback error" role="alert">
          {error}
        </p>
      )}
      {loading && <p role="status">Cargando historial…</p>}
      {!loading && !error && entries.length === 0 && (
        <p>Todavía no hay cambios registrados para este cliente.</p>
      )}
      <ol className="admin-client-history-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <div className="admin-client-history-heading">
              <strong>{entry.action}</strong>
              <time dateTime={entry.created_at}>
                {new Intl.DateTimeFormat('es-UY', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'America/Montevideo',
                }).format(new Date(entry.created_at))}
              </time>
            </div>
            <p>
              {entry.actor_email} · {entry.entity_type}
            </p>
            <details>
              <summary>Ver cambios</summary>
              <pre>{JSON.stringify(entry.changes, null, 2)}</pre>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
