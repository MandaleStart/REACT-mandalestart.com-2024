import { useEffect, useState } from 'react';
import { listBillingInvoices } from '../../../services/billingApi.js';
import { formatMoneyCents } from '../../../services/billingFormat.js';

/* eslint-disable react/prop-types */
export default function AdminClientInvoices({ clientId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setInvoices([]);
    listBillingInvoices({ client_id: clientId, limit: 500 })
      .then((result) => {
        if (active) setInvoices(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No pude cargar las facturas de este cliente.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  return (
    <section className="admin-panel admin-client-invoices" aria-labelledby="client-invoices-title">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Cuenta</span>
          <h2 id="client-invoices-title">Facturas del cliente</h2>
        </div>
      </div>
      {error && (
        <p className="admin-feedback error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Emisión</th>
              <th>Vencimiento</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.number}</td>
                <td>{invoice.issued_on || '—'}</td>
                <td>{invoice.due_on || '—'}</td>
                <td>{formatMoneyCents(invoice.total_cents, invoice.currency)}</td>
                <td>{invoice.status}</td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan="5">Cargando facturas…</td>
              </tr>
            )}
            {!loading && !error && invoices.length === 0 && (
              <tr>
                <td colSpan="5">Este cliente todavía no tiene facturas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
