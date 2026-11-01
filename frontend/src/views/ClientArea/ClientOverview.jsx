/* eslint-disable react/prop-types */
const ClientOverview = ({
  dashboardData,
  totals,
  guidance,
  supportEmail,
  supportWhatsApp,
}) => (
  <>
    <section className="stats-grid">
      <div className="stat-card">
        <strong>{totals.services}</strong>
        <span>Servicios asociados</span>
      </div>
      <div className="stat-card">
        <strong>{totals.expiresSoon}</strong>
        <span>Vencen en los próximos 30 días</span>
      </div>
      <div className="stat-card">
        <strong>{totals.overdue}</strong>
        <span>Servicios vencidos</span>
      </div>
      <div className="stat-card">
        <strong>{totals.projects}</strong>
        <span>Proyectos en curso</span>
      </div>
      <div className="stat-card">
        <strong>{totals.pendingMilestones}</strong>
        <span>Hitos pendientes</span>
      </div>
    </section>

    <section className={`client-guidance-panel ${guidance.priority}`}>
      <div>
        <span className="eyebrow">Qué sigue</span>
        <h2>{guidance.title}</h2>
        <p>{guidance.description}</p>
      </div>
      <div className="client-guidance-actions">
        <a className="primary-button" href={supportEmail}>
          Pedir ayuda
        </a>
        <a
          className="secondary-button"
          href={supportWhatsApp}
          target="_blank"
          rel="noreferrer"
        >
          Contactar por WhatsApp
        </a>
      </div>
    </section>

    {dashboardData?.nextMilestone ||
    dashboardData?.alerts?.length ||
    dashboardData?.overdue?.length ||
    dashboardData?.overdueMilestones?.length ? (
      <section className="client-dashboard-panel">
        <div className="client-dashboard-summary">
          <div>
            <span className="eyebrow">Resumen operativo</span>
            <h2>Próximo hito</h2>
          </div>
          {dashboardData.nextMilestone ? (
            <div className="client-dashboard-highlight">
              <strong>{dashboardData.nextMilestone.title}</strong>
              <span>{dashboardData.nextMilestone.projectTitle}</span>
              <small>{dashboardData.nextMilestone.dueDate}</small>
            </div>
          ) : (
            <p className="client-dashboard-empty">No tenés hitos pendientes próximos.</p>
          )}
        </div>

        {dashboardData.alerts?.length ? (
          <ul className="client-dashboard-alerts">
            {dashboardData.alerts.slice(0, 4).map((alert, index) => (
              <li key={`${alert.serviceTitle}-${index}`}>
                <span className="alert-tag">{alert.diffDays} días</span>
                <div>
                  <strong>{alert.serviceTitle}</strong>
                  <small>vence el {alert.dueDate}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {dashboardData.overdue?.length || dashboardData.overdueMilestones?.length ? (
          <div className="client-dashboard-overdue" role="alert">
            <h3>Vencimientos pendientes</h3>
            <ul className="client-dashboard-alerts">
              {(dashboardData.overdue || []).map((alert, index) => (
                <li key={`service-${alert.serviceTitle}-${index}`}>
                  <span className="alert-tag">{alert.daysOverdue} días</span>
                  <div>
                    <strong>{alert.serviceTitle}</strong>
                    <small>Vencido hace {alert.daysOverdue} días</small>
                  </div>
                </li>
              ))}
              {(dashboardData.overdueMilestones || []).map((item, index) => (
                <li key={`milestone-${item.projectTitle}-${item.title}-${index}`}>
                  <span className="alert-tag">{item.daysOverdue} días</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.projectTitle}: vencido hace {item.daysOverdue} días</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    ) : null}
  </>
);

export default ClientOverview;
