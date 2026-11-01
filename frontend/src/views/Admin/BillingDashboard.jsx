import { useEffect, useState } from 'react';
import { getBillingRevenue } from '../../services/billingApi.js';
import { formatMoneyCents, getMontevideoDateInputValue } from '../../services/billingFormat.js';

/* eslint-disable react/prop-types */
export default function BillingDashboard({ dashboard, clients }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const today = getMontevideoDateInputValue();
    getBillingRevenue(`${today.slice(0, 7)}-01`, today)
      .then((result) => {
        if (active) setReport(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No pude cargar los indicadores de facturación.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const month = getMontevideoDateInputValue().slice(0, 7);
  const revenueByCurrency = (report?.monthly_revenue || [])
    .filter((entry) => String(entry.month).startsWith(month))
    .reduce(
      (totals, entry) => ({
        ...totals,
        [entry.currency]: (totals[entry.currency] || 0) + Number(entry.amount_cents),
      }),
      {},
    );
  const upcomingServices = (dashboard?.priorityItems || []).filter(
    (item) => item.kind === 'service' && item.diffDays >= 0 && item.diffDays <= 30,
  ).length;
  const newClients = clients.filter(
    (client) =>
      client.created_at &&
      getMontevideoDateInputValue(new Date(client.created_at)).startsWith(month),
  ).length;

  return (
    <section className="billing-dashboard-metrics" aria-labelledby="billing-dashboard-heading">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Facturación</span>
          <h2 id="billing-dashboard-heading">Indicadores del mes</h2>
        </div>
      </div>
      {error && (
        <p className="admin-feedback error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <span>Ingresos cobrados este mes</span>
          {loading ? (
            <strong>…</strong>
          ) : Object.entries(revenueByCurrency).length ? (
            Object.entries(revenueByCurrency).map(([currency, amount]) => (
              <strong key={currency}>{formatMoneyCents(amount, currency)}</strong>
            ))
          ) : (
            <strong>{formatMoneyCents(0, 'UYU')}</strong>
          )}
        </div>
        <div className="admin-summary-card">
          <span>Ingresos recurrentes mensuales</span>
          {loading ? (
            <strong>…</strong>
          ) : (report?.mrr || []).length ? (
            report.mrr.map((entry) => (
              <strong key={entry.currency}>
                {formatMoneyCents(Number(entry.amount_cents), entry.currency)}
              </strong>
            ))
          ) : (
            <strong>{formatMoneyCents(0, 'UYU')}</strong>
          )}
        </div>
        <div className="admin-summary-card">
          <span>Facturas vencidas</span>
          <strong>{loading ? '…' : (report?.overdue_invoices ?? 0)}</strong>
        </div>
        <div className="admin-summary-card">
          <span>Servicios que vencen en 30 días</span>
          <strong>{upcomingServices}</strong>
        </div>
        <div className="admin-summary-card">
          <span>Clientes nuevos este mes</span>
          <strong>{newClients}</strong>
        </div>
      </div>
    </section>
  );
}
