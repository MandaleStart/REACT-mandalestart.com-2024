import { useEffect, useState } from 'react';
import {
  cancelBillingSubscription,
  createBillingSubscription,
  listClientSubscriptions,
  listBillingPlans,
} from '../../services/billingApi.js';
import {
  amountCentsToInput,
  formatBillingPeriod,
  formatMoneyCents,
  toBillingApiUnits,
} from '../../services/billingFormat.js';

/* eslint-disable react/prop-types */
const emptySubscription = {
  plan_id: '',
  service_type: 'hosting',
  label: '',
  resource_name: '',
  status: 'active',
  currency: 'UYU',
  amount: '',
  billing_period: 'monthly',
  renews_on: '',
  auto_renew: true,
};

export default function BillingSubscriptions({ clients }) {
  const [clientId, setClientId] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptySubscription);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSubscriptions = async (id) => {
    if (!id) {
      setSubscriptions([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setSubscriptions(await listClientSubscriptions(id));
    } catch (loadError) {
      setError(loadError.message || 'No pude cargar las suscripciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && !clients.some((client) => client.id === clientId)) setClientId('');
  }, [clientId, clients]);

  useEffect(() => {
    let active = true;
    listBillingPlans()
      .then((result) => {
        if (active) setPlans(result.filter((plan) => plan.is_active));
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No pude cargar los planes.');
      });
    return () => {
      active = false;
    };
  }, []);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const createSubscription = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { amount_cents } = toBillingApiUnits(form.amount);
      await createBillingSubscription(clientId, {
        ...form,
        amount_cents,
        amount: undefined,
        renews_on: form.renews_on || null,
        plan_id: form.plan_id || null,
        details: [],
        internal_notes: '',
      });
      setForm(emptySubscription);
      setNotice('Creé la suscripción.');
      await loadSubscriptions(clientId);
    } catch (saveError) {
      setError(saveError.message || 'No pude guardar la suscripción.');
    } finally {
      setBusy(false);
    }
  };

  const cancelSubscription = async (subscription) => {
    if (!window.confirm(`¿Querés cancelar ${subscription.label}?`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await cancelBillingSubscription(subscription.id);
      setNotice('Cancelé la suscripción.');
      await loadSubscriptions(clientId);
    } catch (cancelError) {
      setError(cancelError.message || 'No pude cancelar la suscripción.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="billing-admin-section">
      <header className="admin-panel-heading">
        <div>
          <span className="eyebrow">Servicios facturables</span>
          <h2>Suscripciones</h2>
        </div>
        <label className="billing-filter">
          Cliente
          <select
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              setSubscriptions([]);
              setNotice('');
              loadSubscriptions(event.target.value);
            }}
          >
            <option value="">Elegí un cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} · {client.email}
              </option>
            ))}
          </select>
        </label>
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
      {clientId && (
        <form className="billing-form" onSubmit={createSubscription}>
          <h3>Agregar suscripción</h3>
          <div className="billing-form-grid">
            <label>
              Plan (opcional)
              <select
                name="plan_id"
                value={form.plan_id}
                onChange={(event) => {
                  const plan = plans.find((item) => item.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    plan_id: event.target.value,
                    ...(plan
                      ? {
                          label: plan.name,
                          amount: amountCentsToInput(plan.amount_cents),
                          currency: plan.currency,
                          billing_period: plan.billing_period,
                        }
                      : {}),
                  }));
                }}
              >
                <option value="">Sin plan asociado</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {formatMoneyCents(plan.amount_cents, plan.currency)}
                  </option>
                ))}
              </select>
              {form.plan_id && (
                <small>
                  IVA heredado del plan:{' '}
                  {(plans.find((plan) => plan.id === form.plan_id)?.tax_rate_bp ?? 0) / 100} %
                </small>
              )}
            </label>
            <label>
              Tipo
              <select name="service_type" value={form.service_type} onChange={updateForm}>
                {[
                  'domain',
                  'hosting',
                  'email',
                  'web',
                  'seo',
                  'ddns',
                  'monitoring',
                  '3d-printing',
                  'other',
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Etiqueta
              <input
                name="label"
                value={form.label}
                onChange={updateForm}
                required
                maxLength="200"
              />
            </label>
            <label>
              Recurso
              <input
                name="resource_name"
                value={form.resource_name}
                onChange={updateForm}
                maxLength="255"
              />
            </label>
            <label>
              Estado
              <select name="status" value={form.status} onChange={updateForm}>
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </label>
            <label>
              Moneda
              <select name="currency" value={form.currency} onChange={updateForm}>
                <option value="UYU">UYU</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label>
              Precio
              <input
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={updateForm}
                required
              />
            </label>
            <label>
              Periodicidad
              <select name="billing_period" value={form.billing_period} onChange={updateForm}>
                <option value="one_time">Pago único</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </label>
            <label>
              Próxima renovación
              <input name="renews_on" type="date" value={form.renews_on} onChange={updateForm} />
            </label>
            <label className="billing-checkbox">
              <input
                type="checkbox"
                name="auto_renew"
                checked={form.auto_renew}
                onChange={updateForm}
              />
              Renovación automática
            </label>
          </div>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? 'Guardando…' : 'Agregar suscripción'}
          </button>
        </form>
      )}
      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Recurso</th>
              <th>Precio</th>
              <th>Periodicidad</th>
              <th>Renueva</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td>{subscription.label}</td>
                <td>{subscription.resource_name || '—'}</td>
                <td>{formatMoneyCents(subscription.amount_cents, subscription.currency)}</td>
                <td>{formatBillingPeriod(subscription.billing_period)}</td>
                <td>{subscription.renews_on || '—'}</td>
                <td>{subscription.status}</td>
                <td>
                  {!['cancelled', 'expired'].includes(subscription.status) && (
                    <button
                      type="button"
                      className="admin-table-action"
                      disabled={busy}
                      onClick={() => cancelSubscription(subscription)}
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan="7">Cargando suscripciones…</td>
              </tr>
            )}
            {!loading && clientId && subscriptions.length === 0 && (
              <tr>
                <td colSpan="7">Este cliente todavía no tiene suscripciones.</td>
              </tr>
            )}
            {!clientId && (
              <tr>
                <td colSpan="7">Elegí un cliente para ver sus suscripciones.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
