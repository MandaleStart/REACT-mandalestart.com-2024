import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createBillingInvoice,
  getBillingInvoice,
  listBillingAudit,
  listBillingPlans,
  listBillingInvoices,
  listClientSubscriptions,
  recordBillingPayment,
  voidBillingInvoice,
} from '../../services/billingApi.js';
import {
  amountCentsToInput,
  calculateInvoiceTotals,
  formatMoneyCents,
  getMontevideoDateInputValue,
  toBillingApiUnits,
} from '../../services/billingFormat.js';

/* eslint-disable react/prop-types */
let nextInvoiceLineId = 0;

function createInvoiceLine(overrides = {}) {
  return {
    id: nextInvoiceLineId++,
    subscription_id: '',
    description: '',
    quantity: '1',
    amount: '',
    vat_rate: '22',
    ...overrides,
  };
}

function createInitialInvoice(client_id = '') {
  return {
    client_id,
    currency: 'UYU',
    items: [createInvoiceLine()],
    issued_on: getMontevideoDateInputValue(),
    due_on: '',
    notes: '',
  };
}

const invoiceStatusLabels = {
  draft: 'Borrador',
  open: 'Abierta',
  overdue: 'Vencida',
  paid: 'Pagada',
  void: 'Anulada',
};

function formatPaymentMethod(method) {
  return {
    transfer: 'Transferencia',
    cash: 'Efectivo',
    mercadopago: 'Mercado Pago',
    paypal: 'PayPal',
    other: 'Otro',
  }[method] || method;
}

export default function BillingInvoices({ clients }) {
  const pageSize = 20;
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(createInitialInvoice);
  const [filterInputs, setFilterInputs] = useState({
    status: '',
    client_id: '',
    from: '',
    to: '',
    search: '',
  });
  const [activeFilters, setActiveFilters] = useState({});
  const [page, setPage] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [paymentForms, setPaymentForms] = useState({});
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptionToAdd, setSubscriptionToAdd] = useState('');
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [detailTab, setDetailTab] = useState('summary');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRefresh, setDetailRefresh] = useState(0);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listBillingInvoices({
        ...activeFilters,
        limit: pageSize,
        offset: page * pageSize,
      });
      setInvoices(result.items);
      setTotalInvoices(result.total);
      if (page > 0 && result.items.length === 0 && result.total > 0) {
        setPage(Math.max(0, Math.ceil(result.total / pageSize) - 1));
      }
    } catch (loadError) {
      setError(loadError.message || 'No pude cargar las facturas.');
    } finally {
      setLoading(false);
    }
  }, [activeFilters, page]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    let active = true;
    if (!selectedInvoiceId) {
      setInvoiceDetail(null);
      setInvoiceHistory([]);
      return () => {
        active = false;
      };
    }
    setDetailLoading(true);
    setDetailError('');
    Promise.all([
      getBillingInvoice(selectedInvoiceId),
      listBillingAudit({ entity_type: 'invoice', entity_id: selectedInvoiceId, limit: 100 }),
    ])
      .then(([invoice, history]) => {
        if (!active) return;
        setInvoiceDetail(invoice);
        setInvoiceHistory(history);
      })
      .catch((loadError) => {
        if (active) setDetailError(loadError.message || 'No pude cargar el detalle de la factura.');
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [detailRefresh, selectedInvoiceId]);

  useEffect(() => {
    let active = true;
    listBillingPlans()
      .then((result) => {
        if (active) setPlans(result);
      })
      .catch(() => {
        if (active) setPlans([]);
      })
      .finally(() => {
        if (active) setLoadingPlans(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setSubscriptions([]);
    setSubscriptionToAdd('');
    if (!form.client_id) {
      setLoadingSubscriptions(false);
      return () => {
        active = false;
      };
    }
    setLoadingSubscriptions(true);
    listClientSubscriptions(form.client_id)
      .then((result) => {
        if (active) setSubscriptions(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No pude cargar las suscripciones.');
      })
      .finally(() => {
        if (active) setLoadingSubscriptions(false);
      });
    return () => {
      active = false;
    };
  }, [form.client_id]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    if (name === 'client_id') {
      setForm((current) => ({
        ...current,
        client_id: value,
        items: [createInvoiceLine()],
      }));
      setError('');
      return;
    }
    if (
      name === 'currency' &&
      form.items.some((item) => item.subscription_id) &&
      value !== form.currency
    ) {
      setError('La moneda debe coincidir con la de las suscripciones agregadas.');
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateInvoiceLine = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addManualLine = () => {
    setForm((current) => ({ ...current, items: [...current.items, createInvoiceLine()] }));
  };

  const removeInvoiceLine = (index) => {
    setForm((current) => {
      const items = current.items.filter((_, itemIndex) => itemIndex !== index);
      return { ...current, items: items.length ? items : [createInvoiceLine()] };
    });
  };

  const addSubscriptionLine = () => {
    const subscription = subscriptions.find((item) => item.id === subscriptionToAdd);
    if (!subscription) {
      setError('Elegí una suscripción para agregarla a la factura.');
      return;
    }
    if (form.items.some((item) => item.subscription_id === subscription.id)) {
      setError('Esta suscripción ya está incluida en la factura.');
      return;
    }
    const existingLines = form.items.filter(
      (item) => item.description.trim() || item.amount.trim() || item.subscription_id,
    );
    if (existingLines.length && form.currency !== subscription.currency) {
      setError(
        `La factura está en ${form.currency}. No se pueden mezclar suscripciones en ${subscription.currency}.`,
      );
      return;
    }
    const plan = plans.find((item) => item.id === subscription.plan_id);
    const line = createInvoiceLine({
      subscription_id: subscription.id,
      description: [subscription.label, subscription.resource_name].filter(Boolean).join(' · '),
      amount: amountCentsToInput(subscription.amount_cents),
      vat_rate: String((subscription.tax_rate_bp ?? plan?.tax_rate_bp ?? 2200) / 100),
    });
    setForm((current) => ({
      ...current,
      currency: existingLines.length ? current.currency : subscription.currency,
      items: [...existingLines, line],
    }));
    setError('');
  };

  const createInvoice = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const items = form.items.map((item) => {
        const description = item.description.trim();
        const quantity = Number(item.quantity);
        const { amount_cents, tax_rate_bp } = toBillingApiUnits(item.amount, item.vat_rate);
        if (!description) throw new Error('Completá la descripción de cada concepto.');
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) {
          throw new Error('La cantidad debe ser un entero entre 1 y 100000.');
        }
        return {
          ...(item.subscription_id ? { subscription_id: item.subscription_id } : {}),
          description,
          quantity,
          unit_amount_cents: amount_cents,
          tax_rate_bp,
        };
      });
      await createBillingInvoice({
        client_id: form.client_id,
        currency: form.currency,
        status: 'open',
        issued_on: form.issued_on || null,
        due_on: form.due_on || null,
        notes: form.notes,
        items,
      });
      setForm(createInitialInvoice(form.client_id));
      setNotice('Creé la factura.');
      await loadInvoices();
    } catch (saveError) {
      setError(saveError.message || 'No pude crear la factura.');
    } finally {
      setBusy(false);
    }
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(0);
    setActiveFilters(
      Object.fromEntries(
        Object.entries(filterInputs).filter(([, value]) => value !== ''),
      ),
    );
  };

  const clearFilters = () => {
    setFilterInputs({ status: '', client_id: '', from: '', to: '', search: '' });
    setActiveFilters({});
    setPage(0);
  };

  const invoiceTotals = useMemo(() => {
    try {
      return calculateInvoiceTotals(form.items);
    } catch {
      return null;
    }
  }, [form.items]);

  const updatePayment = (invoiceId, field, value, currency) => {
    setPaymentForms((current) => ({
      ...current,
      [invoiceId]: {
        method: 'transfer',
        currency,
        amount: '',
        ...current[invoiceId],
        [field]: value,
      },
    }));
  };

  const addPayment = async (invoice) => {
    const payment = paymentForms[invoice.id] || {};
    let amount;
    try {
      amount = toBillingApiUnits(payment.amount).amount_cents;
    } catch (paymentError) {
      setError(paymentError.message);
      return;
    }
    if (amount <= 0) {
      setError('El importe del pago debe ser mayor que cero.');
      return;
    }
    const methods = {
      transfer: 'transferencia',
      cash: 'efectivo',
      paypal: 'PayPal',
      other: 'otro medio',
    };
    if (
      !window.confirm(
        `¿Registrar un pago de ${formatMoneyCents(amount, payment.currency || invoice.currency)} por ${
          methods[payment.method || 'transfer'] || 'otro medio'
        }? El movimiento quedará en el historial.`,
      )
    )
      return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await recordBillingPayment(invoice.id, {
        method: payment.method || 'transfer',
        currency: payment.currency || invoice.currency,
        amount_cents: amount,
      });
      if (selectedInvoiceId === invoice.id) setDetailRefresh((current) => current + 1);
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
      if (selectedInvoiceId === invoice.id) setDetailRefresh((current) => current + 1);
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
        <div>
          <span className="eyebrow">Cobros</span>
          <h2>Facturas</h2>
        </div>
      </header>
      {error && (
        <p className="admin-feedback error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-feedback success" role="status">
          {notice}
        </p>
      )}

      <form className="billing-invoice-filters" onSubmit={applyFilters}>
        <label>
          Buscar número, cliente o monto
          <input
            type="search"
            maxLength="100"
            value={filterInputs.search}
            onChange={(event) =>
              setFilterInputs((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="Ej.: MS-2026-001 o 1500,00"
          />
        </label>
        <label>
          Estado
          <select
            value={filterInputs.status}
            onChange={(event) =>
              setFilterInputs((current) => ({ ...current, status: event.target.value }))
            }
          >
            <option value="">Todos</option>
            <option value="draft">Borrador</option>
            <option value="open">Abierta</option>
            <option value="overdue">Vencida</option>
            <option value="paid">Pagada</option>
            <option value="void">Anulada</option>
          </select>
        </label>
        <label>
          Cliente
          <select
            value={filterInputs.client_id}
            onChange={(event) =>
              setFilterInputs((current) => ({ ...current, client_id: event.target.value }))
            }
          >
            <option value="">Todos</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Emitida desde
          <input
            type="date"
            value={filterInputs.from}
            onChange={(event) =>
              setFilterInputs((current) => ({ ...current, from: event.target.value }))
            }
          />
        </label>
        <label>
          Emitida hasta
          <input
            type="date"
            value={filterInputs.to}
            onChange={(event) =>
              setFilterInputs((current) => ({ ...current, to: event.target.value }))
            }
          />
        </label>
        <div className="billing-invoice-filter-actions">
          <button type="submit" className="primary-button">Buscar</button>
          <button type="button" className="admin-secondary-button" onClick={clearFilters}>
            Limpiar
          </button>
        </div>
      </form>

      {selectedInvoiceId && (
        <section className="billing-invoice-detail" aria-labelledby="invoice-detail-heading">
          <header className="admin-panel-heading">
            <div>
              <span className="eyebrow">Detalle de factura</span>
              <h3 id="invoice-detail-heading">
                {invoiceDetail?.number || 'Cargando factura…'}
              </h3>
            </div>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setSelectedInvoiceId('')}
            >
              Cerrar detalle
            </button>
          </header>
          {detailError && (
            <p className="admin-feedback error" role="alert">
              {detailError}
            </p>
          )}
          {detailLoading ? (
            <p role="status">Cargando detalle…</p>
          ) : invoiceDetail ? (
            <>
              <div className="billing-detail-tabs" role="tablist" aria-label="Detalle de factura">
                {[
                  ['summary', 'Resumen'],
                  ['items', 'Líneas'],
                  ['payments', 'Pagos'],
                  ['history', 'Historial'],
                ].map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={detailTab === tab}
                    className={detailTab === tab ? 'is-active' : ''}
                    onClick={() => setDetailTab(tab)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {detailTab === 'summary' && (
                <dl className="billing-invoice-summary">
                  <div><dt>Cliente</dt><dd>{clients.find((client) => client.id === invoiceDetail.client_id)?.name || 'Cliente'}</dd></div>
                  <div><dt>Estado</dt><dd>{invoiceStatusLabels[invoiceDetail.status] || invoiceDetail.status}</dd></div>
                  <div><dt>Emitida</dt><dd>{invoiceDetail.issued_on || '—'}</dd></div>
                  <div><dt>Vence</dt><dd>{invoiceDetail.due_on || '—'}</dd></div>
                  <div><dt>Subtotal</dt><dd>{formatMoneyCents(invoiceDetail.subtotal_cents, invoiceDetail.currency)}</dd></div>
                  <div><dt>IVA</dt><dd>{formatMoneyCents(invoiceDetail.tax_cents, invoiceDetail.currency)}</dd></div>
                  <div><dt>Total</dt><dd>{formatMoneyCents(invoiceDetail.total_cents, invoiceDetail.currency)}</dd></div>
                  {invoiceDetail.notes && <div><dt>Notas</dt><dd>{invoiceDetail.notes}</dd></div>}
                </dl>
              )}
              {detailTab === 'items' && (
                <div className="admin-table-wrap">
                  <table className="admin-data-table">
                    <thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio unitario</th><th>IVA</th><th>Total línea</th></tr></thead>
                    <tbody>
                      {(invoiceDetail.items || []).map((item) => {
                        const lineSubtotal = Number(item.unit_amount_cents) * Number(item.quantity);
                        const lineTax = Number((BigInt(lineSubtotal) * BigInt(item.tax_rate_bp) + 5000n) / 10000n);
                        return (
                          <tr key={item.id}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{formatMoneyCents(item.unit_amount_cents, invoiceDetail.currency)}</td>
                            <td>{Number(item.tax_rate_bp) / 100} %</td>
                            <td>{formatMoneyCents(lineSubtotal + lineTax, invoiceDetail.currency)}</td>
                          </tr>
                        );
                      })}
                      {invoiceDetail.items?.length === 0 && <tr><td colSpan="5">No hay líneas cargadas.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
              {detailTab === 'payments' && (
                <div className="admin-table-wrap">
                  <table className="admin-data-table">
                    <thead><tr><th>Fecha</th><th>Medio</th><th>Estado</th><th>Importe</th><th>Registrado por</th><th>Referencia</th></tr></thead>
                    <tbody>
                      {(invoiceDetail.payments || []).map((payment) => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.created_at).toLocaleString('es-UY')}</td>
                          <td>{formatPaymentMethod(payment.method)}</td>
                          <td>{payment.status === 'approved' ? 'Aprobado' : payment.status === 'pending' ? 'Pendiente' : payment.status}</td>
                          <td>{formatMoneyCents(payment.amount_cents, payment.currency)}</td>
                          <td>{payment.recorded_by || 'Proveedor / sistema'}</td>
                          <td>{payment.provider_payment_id || payment.provider_payload?.preference_id || '—'}</td>
                        </tr>
                      ))}
                      {invoiceDetail.payments?.length === 0 && <tr><td colSpan="6">Todavía no hay pagos registrados.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
              {detailTab === 'history' && (
                <div className="admin-table-wrap">
                  <table className="admin-data-table">
                    <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Cambios</th></tr></thead>
                    <tbody>
                      {invoiceHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td>{new Date(entry.created_at).toLocaleString('es-UY')}</td>
                          <td>{entry.actor_email}</td>
                          <td>{entry.action}</td>
                          <td><pre className="billing-audit-changes">{JSON.stringify(entry.changes, null, 2)}</pre></td>
                        </tr>
                      ))}
                      {invoiceHistory.length === 0 && <tr><td colSpan="4">No hay historial para esta factura.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </section>
      )}

      <form className="billing-form" onSubmit={createInvoice}>
        <h3>Crear factura manual</h3>
        <div className="billing-form-grid">
          <label>
            Cliente
            <select name="client_id" value={form.client_id} onChange={updateForm} required>
              <option value="">Elegí un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} · {client.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Moneda
            <select name="currency" value={form.currency} onChange={updateForm}>
              <option value="UYU">UYU</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="billing-form-wide">
            Agregar concepto desde suscripción
            <div className="billing-invoice-subscription">
              <select
                aria-label="Suscripción para agregar a la factura"
                value={subscriptionToAdd}
                onChange={(event) => setSubscriptionToAdd(event.target.value)}
                disabled={!form.client_id || loadingSubscriptions || subscriptions.length === 0}
              >
                <option value="">
                  {loadingSubscriptions
                    ? 'Cargando suscripciones…'
                    : subscriptions.length
                      ? 'Elegí una suscripción'
                      : 'El cliente no tiene suscripciones'}
                </option>
                {subscriptions.map((subscription) => (
                  <option
                    key={subscription.id}
                    value={subscription.id}
                    disabled={form.items.some((item) => item.subscription_id === subscription.id)}
                  >
                    {subscription.label} ·{' '}
                    {formatMoneyCents(subscription.amount_cents, subscription.currency)} ·{' '}
                    {subscription.currency}
                    {form.items.some((item) => item.subscription_id === subscription.id)
                      ? ' · ya agregada'
                      : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="secondary-button"
                onClick={addSubscriptionLine}
                disabled={!subscriptionToAdd || loadingSubscriptions || loadingPlans}
              >
                Agregar suscripción
              </button>
            </div>
          </label>
          <div className="billing-form-wide billing-invoice-lines">
            <div className="billing-invoice-lines-heading">
              <h4>Conceptos</h4>
              <button type="button" className="secondary-button" onClick={addManualLine}>
                Agregar concepto manual
              </button>
            </div>
            {form.items.map((item, index) => (
              <fieldset className="billing-invoice-line" key={item.id}>
                <legend>
                  Concepto {index + 1}
                  {item.subscription_id ? ' · desde suscripción' : ''}
                </legend>
                <label>
                  Descripción
                  <input
                    value={item.description}
                    onChange={(event) =>
                      updateInvoiceLine(index, 'description', event.target.value)
                    }
                    required
                    maxLength="500"
                  />
                </label>
                <label>
                  Precio unitario
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={item.amount}
                    onChange={(event) => updateInvoiceLine(index, 'amount', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => updateInvoiceLine(index, 'quantity', event.target.value)}
                    required
                  />
                </label>
                <label>
                  IVA
                  <select
                    value={item.vat_rate}
                    onChange={(event) => updateInvoiceLine(index, 'vat_rate', event.target.value)}
                  >
                    <option value="22">22 %</option>
                    <option value="10">10 %</option>
                    <option value="0">0 % · Exento</option>
                  </select>
                </label>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    className="admin-table-action"
                    onClick={() => removeInvoiceLine(index)}
                  >
                    Quitar concepto
                  </button>
                )}
              </fieldset>
            ))}
          </div>
          <label>
            Emitida el
            <input name="issued_on" type="date" value={form.issued_on} onChange={updateForm} />
          </label>
          <label>
            Vence el
            <input name="due_on" type="date" value={form.due_on} onChange={updateForm} />
          </label>
          <label className="billing-form-wide">
            Notas
            <textarea
              name="notes"
              value={form.notes}
              onChange={updateForm}
              maxLength="5000"
              rows="2"
            />
          </label>
        </div>
        <div className="billing-invoice-preview" aria-live="polite">
          <strong>Resumen de factura</strong>
          <span>
            Subtotal:{' '}
            {invoiceTotals
              ? formatMoneyCents(invoiceTotals.subtotal_cents, form.currency)
              : 'Completá conceptos válidos'}
          </span>
          <span>
            IVA: {invoiceTotals ? formatMoneyCents(invoiceTotals.tax_cents, form.currency) : '—'}
          </span>
          <span>
            Total:{' '}
            {invoiceTotals ? formatMoneyCents(invoiceTotals.total_cents, form.currency) : '—'}
          </span>
        </div>
        <button type="submit" className="primary-button" disabled={busy || clients.length === 0}>
          {busy ? 'Guardando…' : 'Crear factura'}
        </button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Registrar pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const client = clients.find((item) => item.id === invoice.client_id);
              const payment = paymentForms[invoice.id] || {};
              const payable = ['open', 'overdue'].includes(invoice.status);
              return (
                <tr key={invoice.id}>
                  <td>
                    <button
                      type="button"
                      className="admin-table-action"
                      onClick={() => {
                        setDetailTab('summary');
                        setSelectedInvoiceId(invoice.id);
                      }}
                    >
                      {invoice.number}
                    </button>
                  </td>
                  <td>{client?.name || 'Cliente'}</td>
                  <td>{invoice.issued_on || '—'}</td>
                  <td>{formatMoneyCents(invoice.total_cents, invoice.currency)}</td>
                  <td>{invoiceStatusLabels[invoice.status] || invoice.status}</td>
                  <td>
                    {payable ? (
                      <div className="billing-inline-payment">
                        <select
                          aria-label={`Medio de pago de ${invoice.number}`}
                          value={payment.method || 'transfer'}
                          onChange={(event) =>
                            updatePayment(
                              invoice.id,
                              'method',
                              event.target.value,
                              invoice.currency,
                            )
                          }
                        >
                          <option value="transfer">Transferencia</option>
                          <option value="cash">Efectivo</option>
                          <option value="paypal">PayPal</option>
                          <option value="other">Otro</option>
                        </select>
                        <input
                          aria-label={`Importe del pago de ${invoice.number}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={payment.amount || ''}
                          onChange={(event) =>
                            updatePayment(
                              invoice.id,
                              'amount',
                              event.target.value,
                              invoice.currency,
                            )
                          }
                        />
                        <button
                          type="button"
                          className="admin-table-action"
                          onClick={() => addPayment(invoice)}
                          disabled={busy}
                        >
                          Registrar
                        </button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {payable && (
                      <button
                        type="button"
                        className="admin-table-action"
                        onClick={() => voidInvoice(invoice)}
                        disabled={busy}
                      >
                        Anular
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan="7">No hay resultados con estos filtros.</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="7">Cargando facturas…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav className="billing-invoice-pagination" aria-label="Paginación de facturas">
        <span>
          {totalInvoices === 0
            ? 'Sin resultados'
            : `Mostrando ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalInvoices)} de ${totalInvoices}`}
        </span>
        <div>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={loading || page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Anterior
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={loading || (page + 1) * pageSize >= totalInvoices}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </button>
        </div>
      </nav>
    </section>
  );
}
