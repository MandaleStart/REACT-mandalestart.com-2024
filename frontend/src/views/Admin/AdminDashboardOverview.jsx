/* eslint-disable react/prop-types */
export default function AdminDashboardOverview({ dashboard, stats }) {
  return (
    <>
      <section className="admin-summary-grid">
        <div className="admin-summary-card">
          <span>Clientes</span>
          <strong>{stats.clients}</strong>
        </div>
        <div className="admin-summary-card">
          <span>Servicios activos</span>
          <strong>{stats.activeServices}</strong>
        </div>
        <div className="admin-summary-card">
          <span>Proyectos</span>
          <strong>{stats.projects}</strong>
        </div>
        <div className="admin-summary-card">
          <span>Prioridades</span>
          <strong>{stats.priorityItems}</strong>
        </div>
        <div className="admin-summary-card">
          <span>Vencidos</span>
          <strong>{stats.overdueItems}</strong>
        </div>
      </section>

      {dashboard?.priorityItems?.length ? (
        <section className="admin-priority-panel">
          <div className="admin-panel-heading">
            <h2>Prioridades del negocio</h2>
          </div>
          <ul className="admin-priority-list">
            {dashboard.priorityItems.slice(0, 5).map((item, index) => (
              <li key={`${item.client}-${item.title}-${index}`}>
                <span className="admin-priority-badge">
                  {item.kind === 'milestone' ? 'Hito' : 'Servicio'}
                </span>
                <div>
                  <strong>{item.client}</strong>
                  <small>{item.title}</small>
                </div>
                <em>{item.diffDays <= 0 ? 'Hoy' : `En ${item.diffDays} días`}</em>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {dashboard?.overdueItems?.length ? (
        <section className="admin-priority-panel" role="alert">
          <div className="admin-panel-heading">
            <h2>Vencimientos atrasados</h2>
          </div>
          <ul className="admin-priority-list">
            {dashboard.overdueItems.map((item, index) => (
              <li key={`${item.client}-${item.title}-${index}`}>
                <span className="admin-priority-badge">Vencido</span>
                <div>
                  <strong>{item.client}</strong>
                  <small>{item.title}</small>
                </div>
                <em>Hace {item.daysOverdue} días</em>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
