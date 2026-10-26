/* eslint-disable react/prop-types */
function getProjectStatusLabel(status) {
  return ({
    planned: 'Planificado',
    'in-progress': 'En curso',
    paused: 'Pausado',
    completed: 'Completado',
  })[status] || 'Estado por confirmar';
}

function getMilestoneStatusLabel(status) {
  return ({
    pending: 'Pendiente',
    'in-progress': 'En curso',
    completed: 'Completado',
  })[status] || 'Pendiente';
}

export default function ClientProjectsPanel({ projects = [] }) {
  return (
    <section className="client-panel">
      <div className="client-panel-heading">
        <div>
          <span className="panel-tag">Seguimiento</span>
          <h2>Proyectos y entregas</h2>
        </div>
      </div>
      {projects.length ? (
        <div className="client-project-list">
          {projects.map((project) => {
            const milestones = Array.isArray(project.milestones) ? project.milestones : [];
            const completed = milestones.filter((milestone) => milestone.status === 'completed').length;
            const progress = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;
            return (
              <article className="client-project-card" key={project.id}>
                <div className="client-project-header">
                  <div>
                    <span className={`client-project-status ${project.status}`}>{getProjectStatusLabel(project.status)}</span>
                    <h3>{project.title}</h3>
                  </div>
                  {project.targetDate && <span>Fecha objetivo: {project.targetDate}</span>}
                </div>
                {project.description && <p>{project.description}</p>}
                {milestones.length > 0 && (
                  <>
                    <div
                      className="client-project-progress"
                      role="progressbar"
                      aria-label={`Avance de ${project.title}`}
                      aria-valuenow={progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <p className="client-project-progress-label">{progress}% de hitos completados</p>
                    <ol className="client-milestone-list">
                      {milestones.map((milestone) => (
                        <li key={milestone.id}>
                          <div>
                            <strong>{milestone.title}</strong>
                            {milestone.description && <p>{milestone.description}</p>}
                          </div>
                          <span className={`client-milestone-status ${milestone.status}`}>{getMilestoneStatusLabel(milestone.status)}</span>
                          {milestone.dueDate && <time dateTime={milestone.dueDate}>{milestone.dueDate}</time>}
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="client-empty-state">Todavía no hay proyectos o entregas publicados en tu cuenta.</p>
      )}
    </section>
  );
}
