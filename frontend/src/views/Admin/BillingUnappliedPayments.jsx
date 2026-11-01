import { useCallback, useEffect, useState } from 'react';
import {
  applyUnappliedMercadoPagoPayment,
  dismissUnappliedMercadoPagoPayment,
  listBillingInvoices,
  listUnappliedMercadoPagoPayments,
} from '../../services/billingApi.js';
import { formatMoneyCents } from '../../services/billingFormat.js';

export default function BillingUnappliedPayments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceByPayment, setInvoiceByPayment] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [paymentRows, invoiceRows] = await Promise.all([
        listUnappliedMercadoPagoPayments(),
        listBillingInvoices({ limit: 500 }),
      ]);
      setPayments(paymentRows);
      setInvoices(
        invoiceRows.items.filter((invoice) => ['open', 'overdue'].includes(invoice.status)),
      );
    } catch (loadError) {
      setError(loadError.message || 'No pude cargar los pagos para revisar.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function applyPayment(payment) {
    const invoiceId = invoiceByPayment[payment.id];
    if (!invoiceId) {
      setError('Elegí una factura de destino antes de aplicar el pago.');
      return;
    }
    setBusy(payment.id);
    setError('');
    try {
      await applyUnappliedMercadoPagoPayment(payment.id, invoiceId);
      await load();
    } catch (actionError) {
      setError(actionError.message || 'No pude aplicar el pago.');
    } finally {
      setBusy('');
    }
  }

  async function dismissPayment(payment) {
    if (
      !window.confirm(
        '¿Marcar este pago como revisado? Esta acción no solicita un reembolso a Mercado Pago.',
      )
    )
      return;
    setBusy(payment.id);
    setError('');
    try {
      await dismissUnappliedMercadoPagoPayment(payment.id);
      await load();
    } catch (actionError) {
      setError(actionError.message || 'No pude descartar el pago.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="billing-admin-section">
      <header className="admin-panel-heading">
        <div>
          <span className="eyebrow">Mercado Pago</span>
          <h2>Pagos para revisar</h2>
          <p>Estos pagos aprobados no pudieron asociarse automáticamente a una factura.</p>
        </div>
        <button className="admin-secondary-button" type="button" onClick={load} disabled={Boolean(busy)}>
          Actualizar
        </button>
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
              <th>Pago</th>
              <th>Factura original</th>
              <th>Motivo</th>
              <th>Aplicar a factura</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.created_at).toLocaleString('es-UY')}</td>
                <td>
                  {payment.amount_cents && payment.currency
                    ? formatMoneyCents(payment.amount_cents, payment.currency)
                    : 'Importe no disponible'}
                  <small>{payment.provider_payment_id}</small>
                </td>
                <td>{payment.invoice_number || payment.external_reference || 'Sin referencia'}</td>
                <td>{payment.reason}</td>
                <td>
                  <select
                    aria-label={`Factura de destino para pago ${payment.provider_payment_id}`}
                    value={invoiceByPayment[payment.id] || ''}
                    onChange={(event) =>
                      setInvoiceByPayment((current) => ({
                        ...current,
                        [payment.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Elegir factura</option>
                    {invoices
                      .filter((invoice) => invoice.currency === payment.currency)
                      .map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.number} · {invoice.client_id} · {formatMoneyCents(invoice.total_cents, invoice.currency)}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <div className="billing-inline-actions">
                    <button
                      className="admin-primary-button"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => applyPayment(payment)}
                    >
                      {busy === payment.id ? 'Procesando…' : 'Aplicar'}
                    </button>
                    <button
                      className="admin-secondary-button"
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => dismissPayment(payment)}
                    >
                      Marcar como revisado
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan="6">No hay pagos pendientes de revisión.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
