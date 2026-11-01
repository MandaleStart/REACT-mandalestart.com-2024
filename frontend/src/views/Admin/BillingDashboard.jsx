import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBillingReceivables, getBillingRevenue } from '../../services/billingApi.js';
import { formatMoneyCents, getMontevideoDateInputValue } from '../../services/billingFormat.js';
import {
  countUpcomingServiceExpiries,
  countUsersWithoutClientProfile,
} from './billingDashboardMetrics.js';

/* eslint-disable react/prop-types */
export default function BillingDashboard({ dashboard, clients, users, usersError }) {
  const [report, setReport] = useState(null);
  const [receivables, setReceivables] = useState(null);
  const [error, setError] = useState('');
  const [receivablesError, setReceivablesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [receivablesLoading, setReceivablesLoading] = useState(true);

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

  useEffect(() => {
    let active = true;
    getBillingReceivables()
      .then((result) => {
        if (active) setReceivables(result);
      })
      .catch((loadError) => {
        if (active) {
          setReceivablesError(
            loadError.message || 'No pude cargar el saldo pendiente de cobro.',
          );
        }
      })
      .finally(() => {
        if (active) setReceivablesLoading(false);
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
  const upcomingServices = countUpcomingServiceExpiries(dashboard?.priorityItems);
  const newClients = clients.filter(
    (client) =>
      client.created_at &&
      getMontevideoDateInputValue(new Date(client.created_at)).startsWith(month),
  ).length;
  const pendingUnappliedPayments = dashboard?.pending_unapplied_payments;
  const usersWithoutProfile = countUsersWithoutClientProfile(users);

  return (
    <section className="billing-dashboard-metrics" aria-labelledby="billing-dashboard-heading">
      {pendingUnappliedPayments > 0 && (
        <div className="admin-feedback error" role="alert">
          Hay {pendingUnappliedPayments} pago{pendingUnappliedPayments === 1 ? '' : 's'} de Mercado
          Pago sin aplicar. <Link to="/administracion/unapplied-payments">Revisalos</Link>.
        </div>
      )}
      {dashboard?.unapplied_payments_ready === false && (
        <div className="admin-feedback warning" role="status">
          Falta aplicar la migración de pagos pendientes de revisión. Ejecutá
          {' '}<code>npm run db:migrate</code> en el backend para habilitar este indicador.
        </div>
      )}
      {dashboard?.webhook_backlog?.alert && (
        <div className="admin-feedback error" role="alert">
          Hay {dashboard.webhook_backlog.pending_count} notificación
          {dashboard.webhook_backlog.pending_count === 1 ? '' : 'es'} de pago pendientes. La más
          antigua lleva {Math.floor(dashboard.webhook_backlog.oldest_pending_age_seconds / 60)}{' '}
          minutos sin procesar.
        </div>
      )}
      {dashboard?.webhook_backlog?.available === false && (
        <div className="admin-feedback warning" role="status">
          No está disponible el estado de la cola de pagos. Verificá que la migración 003 esté
          aplicada.
        </div>
      )}
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
        <div className="admin-summary-card">
          <span>Usuarios sin ficha de cliente</span>
          <strong>{usersError ? 'No disponible' : usersWithoutProfile}</strong>
          {!usersError && usersWithoutProfile > 0 && (
            <Link to="/administracion/users">Revisar usuarios</Link>
          )}
          {usersError && <small>No se pudo consultar el directorio de cuentas.</small>}
        </div>
      </div>
      <section className="admin-priority-panel" aria-labelledby="receivables-heading">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">Cobranza</span>
            <h2 id="receivables-heading">Por cobrar</h2>
          </div>
          <Link to="/administracion/invoices">Ver facturas</Link>
        </div>
        {receivablesError && (
          <p className="admin-feedback error" role="alert">
            {receivablesError}
          </p>
        )}
        {receivablesLoading ? (
          <p role="status">Cargando saldos…</p>
        ) : receivables ? (
          <>
            <div className="admin-summary-grid">
              {(receivables.totals || []).map((total) => (
                <div className="admin-summary-card" key={total.currency}>
                  <span>Saldo pendiente · {total.invoice_count} facturas</span>
                  <strong>{formatMoneyCents(total.amount_cents, total.currency)}</strong>
                </div>
              ))}
              {(receivables.due_7_days || []).map((total) => (
                <div className="admin-summary-card" key={`7-${total.currency}`}>
                  <span>Vence en 7 días · {total.invoice_count} facturas</span>
                  <strong>{formatMoneyCents(total.amount_cents, total.currency)}</strong>
                </div>
              ))}
              {(receivables.due_30_days || []).map((total) => (
                <div className="admin-summary-card" key={`30-${total.currency}`}>
                  <span>Vence en 30 días · {total.invoice_count} facturas</span>
                  <strong>{formatMoneyCents(total.amount_cents, total.currency)}</strong>
                </div>
              ))}
              {receivables.totals?.length === 0 && (
                <div className="admin-summary-card">
                  <span>Saldo pendiente</span>
                  <strong>Sin facturas por cobrar</strong>
                </div>
              )}
            </div>
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th>Vencimiento</th>
                    <th>Antigüedad</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {(receivables.invoices || []).map((invoice) => (
                    <tr key={invoice.id}>
                      <td><Link to="/administracion/invoices">{invoice.number}</Link></td>
                      <td>{invoice.client_name}</td>
                      <td>{invoice.due_on || 'Sin fecha'}</td>
                      <td>
                        {invoice.days_overdue > 0
                          ? `Vencida hace ${invoice.days_overdue} días`
                          : 'A vencer'}
                      </td>
                      <td>{formatMoneyCents(invoice.balance_cents, invoice.currency)}</td>
                    </tr>
                  ))}
                  {receivables.invoices?.length === 0 && (
                    <tr><td colSpan="5">No hay saldos pendientes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-summary-grid">
              {(receivables.totals || []).map((total) => (
                <div className="admin-summary-card" key={`aging-${total.currency}`}>
                  <span>Antigüedad · {total.currency}</span>
                  {['0-30', '31-60', '61+'].map((bucket) => {
                    const row = receivables.aging?.find(
                      (item) => item.currency === total.currency && item.bucket === bucket,
                    );
                    return (
                      <small key={bucket}>
                        {bucket} días: {formatMoneyCents(row?.amount_cents || 0, total.currency)}
                        {' · '}{row?.invoice_count || 0} facturas
                      </small>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </section>
  );
}
