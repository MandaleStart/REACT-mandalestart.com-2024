import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClientInvoice, getClientInvoices } from '../../services/billingApi.js';
import { formatMoneyCents } from '../../services/billingFormat.js';

/* eslint-disable react/prop-types */
export default function ClientBilling({ firebaseUser, invoiceId }) {
  const [invoices, setInvoices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      setInvoice(null);
      try {
        const token = await firebaseUser.getIdToken();
        if (invoiceId) {
          const result = await getClientInvoice(token, invoiceId);
          if (active) setInvoice(result);
        } else {
          const result = await getClientInvoices(token);
          if (active) setInvoices(result);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'No pude cargar tus facturas.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [firebaseUser, invoiceId]);

  if (loading) return <p role="status">Cargando facturas…</p>;
  if (error) return <p className="error-box" role="alert">{error}</p>;

  if (invoiceId) {
    if (!invoice) return <p role="status">No encontramos esa factura.</p>;
    return (
      <section className="client-panel client-invoice-detail">
        <Link to="/area-cliente/invoices">Volver a mis facturas</Link>
        <span className="panel-tag">Factura {invoice.number}</span>
        <h2>{formatMoneyCents(invoice.total_cents, invoice.currency)}</h2>
        <dl>
          <div><dt>Estado</dt><dd>{invoice.status}</dd></div>
          <div><dt>Emitida</dt><dd>{invoice.issued_on || '—'}</dd></div>
          <div><dt>Vence</dt><dd>{invoice.due_on || '—'}</dd></div>
          <div><dt>Subtotal</dt><dd>{formatMoneyCents(invoice.subtotal_cents, invoice.currency)}</dd></div>
          <div><dt>IVA</dt><dd>{formatMoneyCents(invoice.tax_cents, invoice.currency)}</dd></div>
        </dl>
        {invoice.notes && <p>{invoice.notes}</p>}
        <h3>Conceptos</h3>
        <ul className="client-invoice-items">
          {(invoice.items || []).map((item, index) => (
            <li key={`${item.description}-${index}`}>
              <span>{item.description} · {item.quantity} × {formatMoneyCents(item.unit_amount_cents, invoice.currency)}</span>
            </li>
          ))}
        </ul>
        {['open', 'overdue'].includes(invoice.status) && (
          <p>El pago online estará disponible cuando termine la configuración de cobros.</p>
        )}
      </section>
    );
  }

  return (
    <section className="client-panel client-invoice-list">
      <h2>Mis facturas</h2>
      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead><tr><th>Número</th><th>Fecha</th><th>Vencimiento</th><th>Total</th><th>Estado</th><th>Detalle</th></tr></thead>
          <tbody>
            {invoices.map((item) => (
              <tr key={item.id}>
                <td>{item.number}</td><td>{item.issued_on || '—'}</td>
                <td>{item.due_on || '—'}</td>
                <td>{formatMoneyCents(item.total_cents, item.currency)}</td>
                <td>{item.status}</td>
                <td><Link to={`/area-cliente/invoices/${encodeURIComponent(item.id)}`}>Ver detalle</Link></td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan="6">Todavía no tenés facturas.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
