/* eslint-disable react/prop-types */
import { clientServiceTypes, serviceToForm } from '../adminModel';

export default function AdminClientEditor({
  selectedClientId,
  client,
  setClient,
  isDirty,
  busy,
  sessionExpired,
  onSubmit,
  onDelete,
  onUpdateService,
  onUpdateProject,
  onUpdateMilestone,
}) {
  return (
    <form className="admin-form-panel" onSubmit={onSubmit}>
      <div className="admin-panel-heading">
        <h2>{selectedClientId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        {selectedClientId && (
          <button
            type="button"
            className="admin-danger-button"
            onClick={onDelete}
            disabled={busy || sessionExpired}
          >
            Eliminar cliente
          </button>
        )}
        {isDirty && (
          <p className="admin-feedback warning" role="status">
            Hay cambios sin guardar.
          </p>
        )}
      </div>
      <label>
        Nombre
        <input
          value={client.name}
          onChange={(event) => setClient((current) => ({ ...current, name: event.target.value }))}
          maxLength="120"
          required
        />
      </label>
      <label>
        Email asociado a Firebase
        <input
          type="email"
          value={client.email}
          onChange={(event) => setClient((current) => ({ ...current, email: event.target.value }))}
          maxLength="254"
          required
        />
      </label>
      <label>
        Teléfono
        <input
          type="tel"
          value={client.phone || ''}
          onChange={(event) => setClient((current) => ({ ...current, phone: event.target.value }))}
          maxLength="40"
        />
      </label>

      <div className="admin-panel-heading admin-services-heading">
        <h3>Servicios contratados</h3>
        <button
          type="button"
          onClick={() =>
            setClient((current) => ({
              ...current,
              services: [
                ...current.services,
                serviceToForm({
                  id: '',
                  type: 'other',
                  title: '',
                  name: '',
                  cost: '',
                  expiry: '',
                  status: 'Activo',
                  details: [],
                }),
              ],
            }))
          }
        >
          Agregar servicio
        </button>
      </div>

      {client.services.map((service, index) => (
        <fieldset className="admin-client-service" key={service.id || `new-service-${index}`}>
          <legend>Servicio {index + 1}</legend>
          <div className="admin-form-grid">
            <label>
              Tipo
              <select
                value={service.type}
                onChange={(event) => onUpdateService(index, 'type', event.target.value)}
              >
                {clientServiceTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Título
              <input
                value={service.title}
                onChange={(event) => onUpdateService(index, 'title', event.target.value)}
                maxLength="120"
                required
              />
            </label>
            <label className="admin-wide-field">
              Nombre o recurso
              <input
                value={service.name}
                onChange={(event) => onUpdateService(index, 'name', event.target.value)}
                maxLength="200"
                required
              />
            </label>
            <label>
              Costo
              <input
                value={service.cost}
                onChange={(event) => onUpdateService(index, 'cost', event.target.value)}
                maxLength="100"
              />
            </label>
            <label>
              Vencimiento
              <input
                type="date"
                value={service.expiry}
                onChange={(event) => onUpdateService(index, 'expiry', event.target.value)}
              />
            </label>
            <label>
              Estado
              <input
                value={service.status}
                onChange={(event) => onUpdateService(index, 'status', event.target.value)}
                maxLength="40"
              />
            </label>
            <label className="admin-wide-field">
              Detalles (una línea por dato: Etiqueta: valor)
              <textarea
                value={service.detailsText}
                onChange={(event) => onUpdateService(index, 'detailsText', event.target.value)}
                rows="3"
              />
            </label>
          </div>
          <button
            type="button"
            className="admin-danger-button"
            onClick={() =>
              setClient((current) => ({
                ...current,
                services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
              }))
            }
          >
            Quitar servicio
          </button>
        </fieldset>
      ))}

      <div className="admin-panel-heading admin-services-heading">
        <h3>Proyectos y entregas</h3>
        <button
          type="button"
          onClick={() =>
            setClient((current) => ({
              ...current,
              projects: [
                ...current.projects,
                {
                  id: '',
                  title: '',
                  description: '',
                  status: 'planned',
                  startDate: '',
                  targetDate: '',
                  milestones: [],
                },
              ],
            }))
          }
        >
          Agregar proyecto
        </button>
      </div>
      {client.projects.map((project, projectIndex) => (
        <fieldset
          className="admin-client-service admin-client-project"
          key={project.id || `new-project-${projectIndex}`}
        >
          <legend>Proyecto {projectIndex + 1}</legend>
          <div className="admin-form-grid">
            <label className="admin-wide-field">
              Título
              <input
                value={project.title}
                onChange={(event) => onUpdateProject(projectIndex, 'title', event.target.value)}
                maxLength="140"
                required
              />
            </label>
            <label>
              Estado
              <select
                value={project.status}
                onChange={(event) => onUpdateProject(projectIndex, 'status', event.target.value)}
              >
                <option value="planned">Planificado</option>
                <option value="in-progress">En curso</option>
                <option value="paused">Pausado</option>
                <option value="completed">Completado</option>
              </select>
            </label>
            <label>
              Fecha de inicio
              <input
                type="date"
                value={project.startDate || ''}
                onChange={(event) => onUpdateProject(projectIndex, 'startDate', event.target.value)}
              />
            </label>
            <label>
              Fecha objetivo
              <input
                type="date"
                value={project.targetDate || ''}
                onChange={(event) =>
                  onUpdateProject(projectIndex, 'targetDate', event.target.value)
                }
              />
            </label>
            <label className="admin-wide-field">
              Descripción
              <textarea
                value={project.description}
                onChange={(event) =>
                  onUpdateProject(projectIndex, 'description', event.target.value)
                }
                maxLength="1000"
                rows="3"
              />
            </label>
          </div>

          <div className="admin-panel-heading admin-services-heading">
            <h4>Hitos y entregas</h4>
            <button
              type="button"
              onClick={() =>
                setClient((current) => ({
                  ...current,
                  projects: current.projects.map((item, index) =>
                    index === projectIndex
                      ? {
                          ...item,
                          milestones: [
                            ...item.milestones,
                            { id: '', title: '', description: '', status: 'pending', dueDate: '' },
                          ],
                        }
                      : item,
                  ),
                }))
              }
            >
              Agregar hito
            </button>
          </div>
          {project.milestones.map((milestone, milestoneIndex) => (
            <fieldset
              className="admin-client-service admin-client-milestone"
              key={milestone.id || `new-milestone-${milestoneIndex}`}
            >
              <legend>Hito {milestoneIndex + 1}</legend>
              <div className="admin-form-grid">
                <label className="admin-wide-field">
                  Título
                  <input
                    value={milestone.title}
                    onChange={(event) =>
                      onUpdateMilestone(projectIndex, milestoneIndex, 'title', event.target.value)
                    }
                    maxLength="140"
                    required
                  />
                </label>
                <label>
                  Estado
                  <select
                    value={milestone.status}
                    onChange={(event) =>
                      onUpdateMilestone(projectIndex, milestoneIndex, 'status', event.target.value)
                    }
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in-progress">En curso</option>
                    <option value="completed">Completado</option>
                  </select>
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={milestone.dueDate || ''}
                    onChange={(event) =>
                      onUpdateMilestone(projectIndex, milestoneIndex, 'dueDate', event.target.value)
                    }
                  />
                </label>
                <label className="admin-wide-field">
                  Descripción
                  <textarea
                    value={milestone.description || ''}
                    onChange={(event) =>
                      onUpdateMilestone(
                        projectIndex,
                        milestoneIndex,
                        'description',
                        event.target.value,
                      )
                    }
                    maxLength="500"
                    rows="2"
                  />
                </label>
              </div>
              <button
                type="button"
                className="admin-danger-button"
                onClick={() =>
                  setClient((current) => ({
                    ...current,
                    projects: current.projects.map((item, index) =>
                      index === projectIndex
                        ? {
                            ...item,
                            milestones: item.milestones.filter(
                              (_, itemIndex) => itemIndex !== milestoneIndex,
                            ),
                          }
                        : item,
                    ),
                  }))
                }
              >
                Quitar hito
              </button>
            </fieldset>
          ))}

          <button
            type="button"
            className="admin-danger-button"
            onClick={() =>
              setClient((current) => ({
                ...current,
                projects: current.projects.filter((_, index) => index !== projectIndex),
              }))
            }
          >
            Quitar proyecto
          </button>
        </fieldset>
      ))}

      <div className="admin-form-actions">
        <button type="submit" className="primary-button" disabled={busy || sessionExpired}>
          {busy ? 'Guardando…' : 'Guardar cliente'}
        </button>
      </div>
    </form>
  );
}
