import { useCallback, useEffect, useState } from 'react';
import {
  createBillingInvoice,
  listBillingInvoices,
  recordBillingPayment,
  voidBillingInvoice,
} from '../../services/billingApi.js';
import { formatMoneyCents } from '../../services/billingFormat.js';

/* eslint-disable react/prop-types */
const initialInvoice = {
  client_id: '',
  currency: 'UYU',
  description: '',
  quantity: '1',
  unit_amount_cents: '',
  tax_rate_bp: '2200',
  issued_on: new Date().toISOString().slice(0, 10),
  due_on: '',
  notes: '',
};

export default function BillingInvoices({ clients }) {
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(initialInvoice);
  const [filter, setFilter] = useState('all');
  const [paymentForms, setPaymentForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = filter === 'all' ? {} : { status: filter };
      setInvoices(await listBillingInvoices(filters));
    } catch (loadError) {
      setError(loadError.message || 'No pude cargar las facturas.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const createInvoice = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const amount = Number(form.unit_amount_cents);
      const quantity = Number(form.quantity);
      const taxRate = Number(form.tax_rate_bp);
      if (!Number.isSafeInteger(amount) || !Number.isInteger(quantity) || !Number.isInteger(taxRate)) {
        throw new Error('Ingresá importe, cantidad e IVA como enteros.');
      }
      await createBillingInvoice({
        client_id: form.client_id,
        currency: form.currency,
        status: 'open',
        issued_on: form.issued_on || null,
        due_on: form.due_on || null,
        notes: form.notes,
        items: [{
          description: form.description,
          quantity,
          unit_amount_cents: amount,
          tax_rate_bp: taxRate,
        }],
      });
      setForm({ ...initialInvoice, client_id: form.client_id });
      setNotice('Creé la factura.');
      await loadInvoices();
    } catch (saveError) {
      setError(saveError.message || 'No pude crear la factura.');
    } finally {
      setBusy(false);
    }
  };

  const updatePayment = (invoiceId, field, value) => {
    setPaymentForms((current) => ({
      ...current,
      [invoiceId]: { method: 'transfer', currency: 'UYU', amount_cents: '', ...current[invoiceId], [field]: value },
    }));
  };

  const addPayment = async (invoice) => {
    const payment = paymentForms[invoice.id] || {};
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const amount = Number(payment.amount_cents);
      if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Ingresá el importe en centavos enteros.');
      await recordBillingPayment(invoice.id, {
        method: payment.method || 'transfer',
        currency: payment.currency || invoice.currency,
        amount_cents: amount,
      });
      setNotice('Registré el pago.');
      await loadInvoices();
    } catch (paymentError) {
      setError(paymentError.message || 'No pude registrar el pago.');
    } finally {
      setBusy(false);
    }
  };

  const voidInvoice = async (invoice) => {
    if (!window.confirm(`¿Querés anular la factura ${invoice.number}?`)) return;
    setBusy(true);
    setError('');
    try {
      await voidBillingInvoice(invoice.id);
      setNotice('Anulé la factura.');
      await loadInvoices();
    } catch (voidError) {
      setError(voidError.message || 'No pude anular la factura.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="billing-admin-section">
      <header className="admin-panel-heading">
        <div><span className="eyebrow">Cobros</span><h2>Facturas</h2></div>
        <label className="billing-filter">Estado
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">Todas</option><option value="draft">Borrador</option>
            <option value="open">Abiertas</option><option value="overdue">Vencidas</option>
            <option value="paid">Pagadas</option><option value="void">Anuladas</option>
          </select>
        </label>
      </header>
      {error && <p className="admin-feedback error" role="alert">{error}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}

      <form className="billing-form" onSubmit={createInvoice}>
        <h3>Crear factura manual</h3>
        <div className="billing-form-grid">
          <label>Cliente<select name="client_id" value={form.client_id} onChange={updateForm} required>
            <option value="">Elegí un cliente</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.email}</option>)}
          </select></label>
          <label>Moneda<select name="currency" value={form.currency} onChange={updateForm}><option value="UYU">UYU</option><option value="USD">USD</option></select></label>
          <label>Concepto<input name="description" value={form.description} onChange={updateForm} required maxLength="500" /></label>
          <label>Precio unitario (centavos)<input name="unit_amount_cents" type="number" min="0" step="1" value={form.unit_amount_cents} onChange={updateForm} required /></label>
          <label>Cantidad<input name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={updateForm} required /></label>
          <label>IVA (puntos básicos)<input name="tax_rate_bp" type="number" min="0" max="10000" step="1" value={form.tax_rate_bp} onChange={updateForm} required /></label>
          <label>Emitida el<input name="issued_on" type="date" value={form.issued_on} onChange={updateForm} /></label>
          <label>Vence el<input name="due_on" type="date" value={form.due_on} onChange={updateForm} /></label>
          <label className="billing-form-wide">Notas<textarea name="notes" value={form.notes} onChange={updateForm} maxLength="5000" rows="2" /></label>
        </div>
        <button type="submit" className="primary-button" disabled={busy || clients.length === 0}>{busy ? 'Guardando…' : 'Crear factura'}</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Registrar pago</th><th>Acciones</th></tr></thead>
          <tbody>
            {invoices.map((invoice) => {
              const client = clients.find((item) => item.id === invoice.client_id);
              const payment = paymentForms[invoice.id] || {};
              const payable = ['open', 'overdue'].includes(invoice.status);
              return (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td><td>{client?.name || 'Cliente'}</td>
                  <td>{invoice.issued_on || '—'}</td>
                  <td>{formatMoneyCents(invoice.total_cents, invoice.currency)}</td>
                  <td>{invoice.status}</td>
                  <td>{payable ? <div className="billing-inline-payment">
                    <select aria-label={`Medio de pago de ${invoice.number}`} value={payment.method || 'transfer'} onChange={(event) => updatePayment(invoice.id, 'method', event.target.value)}>
                      <option value="transfer">Transferencia</option><option value="cash">Efectivo</option><option value="paypal">PayPal</option><option value="other">Otro</option>
                    </select>
                    <input aria-label={`Importe en centavos de ${invoice.number}`} type="number" min="1" step="1" value={payment.amount_cents || ''} onChange={(event) => updatePayment(invoice.id, 'amount_cents', event.target.value)} />
                    <button type="button" className="admin-table-action" onClick={() => addPayment(invoice)} disabled={busy}>Registrar</button>
                  </div> : '—'}</td>
                  <td>{payable && <button type="button" className="admin-table-action" onClick={() => voidInvoice(invoice)} disabled={busy}>Anular</button>}</td>
                </tr>
              );
            })}
            {!loading && invoices.length === 0 && <tr><td colSpan="7">No hay facturas con este filtro.</td></tr>}
            {loading && <tr><td colSpan="7">Cargando facturas…</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
