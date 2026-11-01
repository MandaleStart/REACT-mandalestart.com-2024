import { useCallback, useEffect, useState } from 'react';
import {
  createBillingPlan,
  deactivateBillingPlan,
  listBillingPlans,
  updateBillingPlan,
} from '../../services/billingApi.js';
import { formatBillingPeriod, formatMoneyCents } from '../../services/billingFormat.js';

const emptyPlan = {
  service_slug: '',
  code: '',
  name: '',
  description: '',
  currency: 'UYU',
  amount_cents: '',
  billing_period: 'monthly',
  tax_rate_bp: '2200',
  features: '',
  is_public: false,
  is_active: true,
};

function toForm(plan) {
  return {
    ...plan,
    amount_cents: String(plan.amount_cents),
    tax_rate_bp: String(plan.tax_rate_bp),
    features: (plan.features || []).join('\n'),
  };
}

function toPayload(form) {
  if (form.is_public && !form.amount_cents.trim()) {
    throw new Error('Completá el precio y la moneda antes de publicar el plan.');
  }
  const amount = Number(form.amount_cents);
  const taxRate = Number(form.tax_rate_bp);
  if (!Number.isSafeInteger(amount) || !Number.isInteger(taxRate)) {
    throw new Error('Ingresá el precio y el IVA como enteros.');
  }
  return {
    service_slug: form.service_slug,
    code: form.code,
    name: form.name,
    description: form.description,
    currency: form.currency,
    amount_cents: amount,
    billing_period: form.billing_period,
    tax_rate_bp: taxRate,
    features: form.features
      .split('\n')
      .map((feature) => feature.trim())
      .filter(Boolean),
    is_public: form.is_public,
    is_active: form.is_active,
  };
}

export default function BillingPlans() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyPlan);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPlans(await listBillingPlans());
    } catch (loadError) {
      setError(loadError.message || 'No pude cargar los planes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyPlan);
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = toPayload(form);
      if (editing) await updateBillingPlan(editing.id, payload, editing.updated_at);
      else await createBillingPlan(payload);
      reset();
      setNotice(editing ? 'Actualicé el plan.' : 'Creé el plan.');
      await loadPlans();
    } catch (saveError) {
      setError(saveError.message || 'No pude guardar el plan.');
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (plan) => {
    if (!window.confirm(`¿Querés desactivar el plan ${plan.name}? No se borrará su historial.`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await deactivateBillingPlan(plan.id);
      setNotice('Desactivé el plan.');
      await loadPlans();
    } catch (saveError) {
      setError(saveError.message || 'No pude desactivar el plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="billing-admin-section">
      <header className="admin-panel-heading">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h2>Planes y precios</h2>
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

      <form className="billing-form" onSubmit={submit}>
        <h3>{editing ? 'Editar plan' : 'Crear plan'}</h3>
        <div className="billing-form-grid">
          <label>
            Slug del servicio
            <input
              name="service_slug"
              value={form.service_slug}
              onChange={updateForm}
              required
              maxLength="100"
            />
          </label>
          <label>
            Código
            <input name="code" value={form.code} onChange={updateForm} required maxLength="100" />
          </label>
          <label>
            Nombre
            <input name="name" value={form.name} onChange={updateForm} required maxLength="160" />
          </label>
          <label>
            Moneda
            <select name="currency" value={form.currency} onChange={updateForm}>
              <option value="UYU">UYU</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label>
            Precio (centavos)
            <input
              name="amount_cents"
              type="number"
              min="0"
              step="1"
              value={form.amount_cents}
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
            IVA (puntos básicos)
            <input
              name="tax_rate_bp"
              type="number"
              min="0"
              max="10000"
              step="1"
              value={form.tax_rate_bp}
              onChange={updateForm}
              required
            />
          </label>
          <label className="billing-form-wide">
            Descripción
            <textarea
              name="description"
              value={form.description}
              onChange={updateForm}
              maxLength="2000"
              rows="2"
            />
          </label>
          <label className="billing-form-wide">
            Características (una por línea)
            <textarea name="features" value={form.features} onChange={updateForm} rows="3" />
          </label>
          <label className="billing-checkbox">
            <input
              type="checkbox"
              name="is_public"
              checked={form.is_public}
              onChange={updateForm}
            />
            Visible en el sitio
          </label>
          <label className="billing-checkbox">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={updateForm}
            />
            Activo
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear plan'}
          </button>
          {editing && (
            <button type="button" className="secondary-button" onClick={reset} disabled={busy}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Precio</th>
              <th>Periodicidad</th>
              <th>IVA</th>
              <th>Visibilidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <strong>{plan.name}</strong>
                  <small>
                    {plan.code} · {plan.service_slug}
                  </small>
                </td>
                <td>{formatMoneyCents(plan.amount_cents, plan.currency)}</td>
                <td>{formatBillingPeriod(plan.billing_period)}</td>
                <td>{(plan.tax_rate_bp / 100).toFixed(2)}%</td>
                <td>{plan.is_public ? 'Público' : 'Privado'}</td>
                <td>{plan.is_active ? 'Activo' : 'Inactivo'}</td>
                <td className="billing-row-actions">
                  <button
                    type="button"
                    className="admin-table-action"
                    onClick={() => {
                      setEditing(plan);
                      setForm(toForm(plan));
                    }}
                  >
                    Editar
                  </button>
                  {plan.is_active && (
                    <button
                      type="button"
                      className="admin-table-action"
                      onClick={() => deactivate(plan)}
                      disabled={busy}
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && plans.length === 0 && (
              <tr>
                <td colSpan="7">Todavía no hay planes. Creá el primero desde este formulario.</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="7">Cargando planes…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
