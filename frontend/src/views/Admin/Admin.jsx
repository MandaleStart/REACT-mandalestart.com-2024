import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, firebaseReady } from '../../firebase';
import {
  archiveAdminService,
  createAdminClient,
  deleteAdminClient,
  getAdminClients,
  getAdminServices,
  saveAdminService,
  updateAdminClient,
} from '../../services/adminApi';
import './admin.css';

const emptyClient = { id: '', name: '', email: '', phone: '', services: [], projects: [] };
const emptyPublicService = {
  slug: '',
  icon: '',
  title: '',
  category: '',
  description: '',
  summary: '',
  outcome: '',
  price: 'Presupuesto a medida',
  accent: 'cyan',
  status: 'active',
  points: [],
  includes: [],
};
const clientServiceTypes = [
  ['domain', 'Dominio'],
  ['hosting', 'Hosting'],
  ['email', 'Correo'],
  ['web', 'Desarrollo web'],
  ['seo', 'SEO'],
  ['ddns', 'DDNS'],
  ['monitoring', 'Monitoreo'],
  ['3d-printing', 'Diseño e impresión 3D'],
  ['other', 'Otro'],
];
const expiredSessionMessage = 'Tu sesión venció, volvé a ingresar.';

function isSessionError(error) {
  return error.status === 401 || error.status === 403;
}

function parseDetails(value) {
  if (!value.trim()) return [];
  return value.split('\n').map((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error('Escribí cada detalle como Etiqueta: valor.');
    return {
      label: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    };
  });
}

function formatDetails(details = []) {
  return details.map(({ label, value }) => `${label}: ${value}`).join('\n');
}

function serviceToForm(service) {
  return { ...service, detailsText: formatDetails(service.details) };
}

function projectToForm(project) {
  return {
    ...project,
    milestones: Array.isArray(project.milestones) ? project.milestones : [],
  };
}

const Admin = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [access, setAccess] = useState('checking');
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [section, setSection] = useState('clients');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientForm, setClientForm] = useState(emptyClient);
  const [selectedServiceSlug, setSelectedServiceSlug] = useState('');
  const [serviceForm, setServiceForm] = useState(emptyPublicService);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setAccess('misconfigured');
      return undefined;
    }

    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
  }, []);

  const refreshData = useCallback(async () => {
    const [clientList, serviceList] = await Promise.all([
      getAdminClients(),
      getAdminServices(),
    ]);
    setClients(clientList);
    setServices(serviceList);
  }, []);

  useEffect(() => {
    if (!authReady) return undefined;
    if (!firebaseReady) {
      setAccess('misconfigured');
      return undefined;
    }
    if (!firebaseUser) {
      setAccess('signed-out');
      return undefined;
    }

    let active = true;
    setAccess('checking');
    setError('');
    setSessionExpired(false);

    firebaseUser.getIdTokenResult(true)
      .then(async (tokenResult) => {
        if (!active) return;
        // This claim only controls frontend visibility; every admin endpoint must enforce authorization server-side and verify revocation.
        if (tokenResult.claims.admin !== true) {
          setAccess('forbidden');
          return;
        }
        await refreshData();
        if (active) {
          setAccess('allowed');
        }
      })
      .catch((requestError) => {
        if (active) {
          const sessionError = isSessionError(requestError);
          setSessionExpired(sessionError);
          setError(sessionError
            ? expiredSessionMessage
            : requestError.message || 'No se pudo cargar el panel administrativo.');
          setAccess('error');
        }
      });

    return () => {
      active = false;
    };
  }, [authReady, firebaseUser, refreshData]);

  const visibleServices = useMemo(
    () => services.filter((service) => service.status !== 'archived'),
    [services],
  );

  const chooseClient = (id) => {
    setSelectedClientId(id);
    const client = clients.find((item) => item.id === id);
    setClientForm(client
      ? {
        ...client,
        services: client.services.map(serviceToForm),
        projects: (client.projects || []).map(projectToForm),
      }
      : emptyClient);
    setError('');
    setNotice('');
  };

  const chooseService = (slug) => {
    setSelectedServiceSlug(slug);
    const service = services.find((item) => item.slug === slug);
    setServiceForm(service
      ? { ...emptyPublicService, ...service, points: service.points || [], includes: service.includes || [] }
      : emptyPublicService);
    setError('');
    setNotice('');
  };

  const handleClientSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const client = {
        name: clientForm.name,
        email: clientForm.email,
        phone: clientForm.phone,
        services: clientForm.services.map(({ detailsText, ...service }) => ({
          ...service,
          details: parseDetails(detailsText),
        })),
        projects: clientForm.projects,
      };
      const saved = selectedClientId
        ? await updateAdminClient(selectedClientId, client)
        : await createAdminClient(client);
      await refreshData();
      setSelectedClientId(saved.id);
      setClientForm({
        ...saved,
        services: saved.services.map(serviceToForm),
        projects: (saved.projects || []).map(projectToForm),
      });
      setNotice('Los datos del cliente se guardaron correctamente.');
    } catch (saveError) {
      const sessionError = isSessionError(saveError);
      setSessionExpired(sessionError);
      setError(sessionError ? expiredSessionMessage : saveError.message || 'No se pudo guardar el cliente.');
    } finally {
      setBusy(false);
    }
  };

  const handleClientDelete = async () => {
    if (!selectedClientId || !window.confirm('¿Eliminar esta ficha de cliente y sus servicios asociados? La cuenta de acceso no se elimina.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await deleteAdminClient(selectedClientId);
      await refreshData();
      setSelectedClientId('');
      setClientForm(emptyClient);
      setNotice('El cliente se eliminó.');
    } catch (deleteError) {
      const sessionError = isSessionError(deleteError);
      setSessionExpired(sessionError);
      setError(sessionError ? expiredSessionMessage : deleteError.message || 'No se pudo eliminar el cliente.');
    } finally {
      setBusy(false);
    }
  };

  const updateClientService = (index, field, value) => {
    setClientForm((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) => (
        serviceIndex === index ? { ...service, [field]: value } : service
      )),
    }));
  };

  const updateClientProject = (index, field, value) => {
    setClientForm((current) => ({
      ...current,
      projects: current.projects.map((project, projectIndex) => (
        projectIndex === index ? { ...project, [field]: value } : project
      )),
    }));
  };

  const updateProjectMilestone = (projectIndex, milestoneIndex, field, value) => {
    setClientForm((current) => ({
      ...current,
      projects: current.projects.map((project, currentProjectIndex) => (
        currentProjectIndex === projectIndex
          ? {
            ...project,
            milestones: project.milestones.map((milestone, currentMilestoneIndex) => (
              currentMilestoneIndex === milestoneIndex ? { ...milestone, [field]: value } : milestone
            )),
          }
          : project
      )),
    }));
  };

  const handlePublicServiceSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const saved = await saveAdminService(serviceForm.slug, {
        ...serviceForm,
        points: serviceForm.pointsText === undefined
          ? serviceForm.points
          : serviceForm.pointsText.split('\n').map((line) => line.trim()).filter(Boolean),
        includes: serviceForm.includesText === undefined
          ? serviceForm.includes
          : serviceForm.includesText.split('\n').map((line) => line.trim()).filter(Boolean),
      });
      await refreshData();
      chooseService(saved.slug);
      setNotice('El catálogo público se actualizó correctamente.');
    } catch (saveError) {
      const sessionError = isSessionError(saveError);
      setSessionExpired(sessionError);
      setError(sessionError ? expiredSessionMessage : saveError.message || 'No se pudo guardar el servicio.');
    } finally {
      setBusy(false);
    }
  };

  const handleServiceArchive = async () => {
    if (!selectedServiceSlug || !window.confirm('¿Archivar este servicio? Dejará de aparecer en el sitio público, pero se podrá restaurar.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await archiveAdminService(selectedServiceSlug);
      await refreshData();
      setServiceForm((current) => ({ ...current, status: 'archived' }));
      setNotice('El servicio se archivó y dejó de mostrarse en el sitio público.');
    } catch (archiveError) {
      const sessionError = isSessionError(archiveError);
      setSessionExpired(sessionError);
      setError(sessionError ? expiredSessionMessage : archiveError.message || 'No se pudo archivar el servicio.');
    } finally {
      setBusy(false);
    }
  };

  if (access === 'checking' || !authReady) {
    return <main className="admin-page"><section className="admin-card" aria-live="polite">Verificando permisos administrativos…</section></main>;
  }

  if (access === 'misconfigured') {
    return (
      <main className="admin-page">
        <section className="admin-card">
          <h1>Panel administrativo no configurado</h1>
          <p>Configurá Firebase Authentication para usar este panel.</p>
        </section>
      </main>
    );
  }

  if (access === 'signed-out') {
    return (
      <main className="admin-page">
        <section className="admin-card">
          <h1>Ingresá con tu cuenta administrativa</h1>
          <p>Iniciá sesión en el área de clientes y luego volvé a esta dirección.</p>
          <Link className="primary-button" to="/client-area">Ir al inicio de sesión</Link>
        </section>
      </main>
    );
  }

  if (access === 'forbidden') {
    return (
      <main className="admin-page">
        <section className="admin-card" role="alert">
          <h1>Acceso restringido</h1>
          <p>Esta cuenta no tiene permisos administrativos. Si creés que es un error, contactá al administrador.</p>
        </section>
      </main>
    );
  }

  if (access === 'error') {
    return (
      <main className="admin-page">
        <section className="admin-card" role="alert">
          <h1>{sessionExpired ? expiredSessionMessage : 'No se pudo abrir el panel'}</h1>
          <p>{error}</p>
          {sessionExpired
            ? <Link className="primary-button" to="/client-area">Volver a ingresar</Link>
            : <button type="button" className="secondary-button" onClick={() => window.location.reload()}>Reintentar</button>}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Administración</span>
          <h1>Gestioná clientes y servicios</h1>
          <p>Sesión administrativa: {firebaseUser.email}</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => signOut(auth)}>Cerrar sesión</button>
      </header>

      <nav className="admin-tabs" aria-label="Secciones administrativas">
        <button type="button" className={section === 'clients' ? 'is-active' : ''} onClick={() => setSection('clients')}>
          Clientes ({clients.length})
        </button>
        <button type="button" className={section === 'services' ? 'is-active' : ''} onClick={() => setSection('services')}>
          Catálogo ({visibleServices.length})
        </button>
      </nav>

      {sessionExpired ? (
        <div className="admin-feedback error admin-session-expired" role="alert">
          <p>{expiredSessionMessage}</p>
          <Link className="primary-button" to="/client-area">Volver a ingresar</Link>
        </div>
      ) : error && <p className="admin-feedback error" role="alert">{error}</p>}
      {notice && <p className="admin-feedback success" role="status">{notice}</p>}

      {section === 'clients' ? (
        <section className="admin-workspace">
          <aside className="admin-list-panel">
            <div className="admin-panel-heading">
              <h2>Clientes</h2>
              <button type="button" onClick={() => chooseClient('')}>Nuevo</button>
            </div>
            <div className="admin-record-list">
              {clients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className={selectedClientId === client.id ? 'is-selected' : ''}
                  onClick={() => chooseClient(client.id)}
                >
                  <strong>{client.name}</strong>
                  <span>{client.email}</span>
                </button>
              ))}
              {clients.length === 0 && <p>No hay clientes cargados.</p>}
            </div>
          </aside>

          <form className="admin-form-panel" onSubmit={handleClientSubmit}>
            <div className="admin-panel-heading">
              <h2>{selectedClientId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              {selectedClientId && (
                <button type="button" className="admin-danger-button" onClick={handleClientDelete} disabled={busy || sessionExpired}>
                  Eliminar cliente
                </button>
              )}
            </div>
            <label>
              Nombre
              <input value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} maxLength="120" required />
            </label>
            <label>
              Email asociado a Firebase
              <input type="email" value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} maxLength="254" required />
            </label>
            <label>
              Teléfono
              <input type="tel" value={clientForm.phone || ''} onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })} maxLength="40" />
            </label>

            <div className="admin-panel-heading admin-services-heading">
              <h3>Servicios contratados</h3>
              <button
                type="button"
                onClick={() => setClientForm((current) => ({
                  ...current,
                  services: [...current.services, serviceToForm({
                    id: '',
                    type: 'other',
                    title: '',
                    name: '',
                    cost: '',
                    expiry: '',
                    status: 'Activo',
                    details: [],
                  })],
                }))}
              >
                Agregar servicio
              </button>
            </div>

            {clientForm.services.map((service, index) => (
              <fieldset className="admin-client-service" key={service.id || `new-service-${index}`}>
                <legend>Servicio {index + 1}</legend>
                <div className="admin-form-grid">
                  <label>
                    Tipo
                    <select value={service.type} onChange={(event) => updateClientService(index, 'type', event.target.value)}>
                      {clientServiceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>
                    Título
                    <input value={service.title} onChange={(event) => updateClientService(index, 'title', event.target.value)} maxLength="120" required />
                  </label>
                  <label className="admin-wide-field">
                    Nombre o recurso
                    <input value={service.name} onChange={(event) => updateClientService(index, 'name', event.target.value)} maxLength="200" required />
                  </label>
                  <label>
                    Costo
                    <input value={service.cost} onChange={(event) => updateClientService(index, 'cost', event.target.value)} maxLength="100" />
                  </label>
                  <label>
                    Vencimiento
                    <input type="date" value={service.expiry} onChange={(event) => updateClientService(index, 'expiry', event.target.value)} />
                  </label>
                  <label>
                    Estado
                    <input value={service.status} onChange={(event) => updateClientService(index, 'status', event.target.value)} maxLength="40" />
                  </label>
                  <label className="admin-wide-field">
                    Detalles (una línea por dato: Etiqueta: valor)
                    <textarea value={service.detailsText} onChange={(event) => updateClientService(index, 'detailsText', event.target.value)} rows="3" />
                  </label>
                </div>
                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={() => setClientForm((current) => ({
                    ...current,
                    services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
                  }))}
                >
                  Quitar servicio
                </button>
              </fieldset>
            ))}

            <div className="admin-panel-heading admin-services-heading">
              <h3>Proyectos y entregas</h3>
              <button
                type="button"
                onClick={() => setClientForm((current) => ({
                  ...current,
                  projects: [...current.projects, {
                    id: '',
                    title: '',
                    description: '',
                    status: 'planned',
                    startDate: '',
                    targetDate: '',
                    milestones: [],
                  }],
                }))}
              >
                Agregar proyecto
              </button>
            </div>
            {clientForm.projects.map((project, projectIndex) => (
              <fieldset className="admin-client-service admin-client-project" key={project.id || `new-project-${projectIndex}`}>
                <legend>Proyecto {projectIndex + 1}</legend>
                <div className="admin-form-grid">
                  <label className="admin-wide-field">
                    Título
                    <input value={project.title} onChange={(event) => updateClientProject(projectIndex, 'title', event.target.value)} maxLength="140" required />
                  </label>
                  <label>
                    Estado
                    <select value={project.status} onChange={(event) => updateClientProject(projectIndex, 'status', event.target.value)}>
                      <option value="planned">Planificado</option>
                      <option value="in-progress">En curso</option>
                      <option value="paused">Pausado</option>
                      <option value="completed">Completado</option>
                    </select>
                  </label>
                  <label>
                    Fecha de inicio
                    <input type="date" value={project.startDate || ''} onChange={(event) => updateClientProject(projectIndex, 'startDate', event.target.value)} />
                  </label>
                  <label>
                    Fecha objetivo
                    <input type="date" value={project.targetDate || ''} onChange={(event) => updateClientProject(projectIndex, 'targetDate', event.target.value)} />
                  </label>
                  <label className="admin-wide-field">
                    Descripción
                    <textarea value={project.description} onChange={(event) => updateClientProject(projectIndex, 'description', event.target.value)} maxLength="1000" rows="3" />
                  </label>
                </div>

                <div className="admin-panel-heading admin-services-heading">
                  <h4>Hitos y entregas</h4>
                  <button
                    type="button"
                    onClick={() => setClientForm((current) => ({
                      ...current,
                      projects: current.projects.map((item, index) => (
                        index === projectIndex
                          ? { ...item, milestones: [...item.milestones, { id: '', title: '', description: '', status: 'pending', dueDate: '' }] }
                          : item
                      )),
                    }))}
                  >
                    Agregar hito
                  </button>
                </div>
                {project.milestones.map((milestone, milestoneIndex) => (
                  <fieldset className="admin-client-service admin-client-milestone" key={milestone.id || `new-milestone-${milestoneIndex}`}>
                    <legend>Hito {milestoneIndex + 1}</legend>
                    <div className="admin-form-grid">
                      <label className="admin-wide-field">
                        Título
                        <input value={milestone.title} onChange={(event) => updateProjectMilestone(projectIndex, milestoneIndex, 'title', event.target.value)} maxLength="140" required />
                      </label>
                      <label>
                        Estado
                        <select value={milestone.status} onChange={(event) => updateProjectMilestone(projectIndex, milestoneIndex, 'status', event.target.value)}>
                          <option value="pending">Pendiente</option>
                          <option value="in-progress">En curso</option>
                          <option value="completed">Completado</option>
                        </select>
                      </label>
                      <label>
                        Fecha
                        <input type="date" value={milestone.dueDate || ''} onChange={(event) => updateProjectMilestone(projectIndex, milestoneIndex, 'dueDate', event.target.value)} />
                      </label>
                      <label className="admin-wide-field">
                        Descripción
                        <textarea value={milestone.description || ''} onChange={(event) => updateProjectMilestone(projectIndex, milestoneIndex, 'description', event.target.value)} maxLength="500" rows="2" />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={() => setClientForm((current) => ({
                        ...current,
                        projects: current.projects.map((item, index) => (
                          index === projectIndex
                            ? { ...item, milestones: item.milestones.filter((_, itemIndex) => itemIndex !== milestoneIndex) }
                            : item
                        )),
                      }))}
                    >
                      Quitar hito
                    </button>
                  </fieldset>
                ))}

                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={() => setClientForm((current) => ({
                    ...current,
                    projects: current.projects.filter((_, index) => index !== projectIndex),
                  }))}
                >
                  Quitar proyecto
                </button>
              </fieldset>
            ))}

            <div className="admin-form-actions">
              <button type="submit" className="primary-button" disabled={busy || sessionExpired}>{busy ? 'Guardando…' : 'Guardar cliente'}</button>
            </div>
          </form>
        </section>
      ) : (
        <section className="admin-workspace">
          <aside className="admin-list-panel">
            <div className="admin-panel-heading">
              <h2>Catálogo público</h2>
            </div>
            <div className="admin-record-list">
              {services.map((service) => (
                <button
                  key={service.slug}
                  type="button"
                  className={selectedServiceSlug === service.slug ? 'is-selected' : ''}
                  onClick={() => chooseService(service.slug)}
                >
                  <strong>{service.title || service.slug}</strong>
                  <span>{service.slug} · {service.status === 'archived' ? 'Archivado' : 'Visible'}</span>
                </button>
              ))}
            </div>
          </aside>

          <form className="admin-form-panel" onSubmit={handlePublicServiceSubmit}>
            <div className="admin-panel-heading">
              <h2>{selectedServiceSlug ? 'Editar servicio público' : 'Seleccioná un servicio'}</h2>
              {selectedServiceSlug && serviceForm.status !== 'archived' && (
                <button type="button" className="admin-danger-button" onClick={handleServiceArchive} disabled={busy || sessionExpired}>
                  Archivar
                </button>
              )}
            </div>
            {!selectedServiceSlug && (
              <p className="admin-panel-help">
                Elegí un slug estático de la lista. Para agregar un nuevo slug es necesario actualizar las rutas y
                desplegar nuevamente el frontend.
              </p>
            )}
            <div className="admin-form-grid">
              <label>
                URL (slug)
                <input
                  value={serviceForm.slug}
                  onChange={(event) => setServiceForm({ ...serviceForm, slug: event.target.value })}
                  readOnly={Boolean(selectedServiceSlug)}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength="80"
                  required
                />
              </label>
              <label>
                Título
                <input value={serviceForm.title} onChange={(event) => setServiceForm({ ...serviceForm, title: event.target.value })} maxLength="140" required />
              </label>
              <label>
                Categoría
                <input value={serviceForm.category} onChange={(event) => setServiceForm({ ...serviceForm, category: event.target.value })} maxLength="100" required />
              </label>
              <label>
                Precio visible
                <input value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} maxLength="120" />
              </label>
              <label>
                Icono
                <input value={serviceForm.icon} onChange={(event) => setServiceForm({ ...serviceForm, icon: event.target.value })} maxLength="30" />
              </label>
              <label>
                Acento visual
                <input value={serviceForm.accent} onChange={(event) => setServiceForm({ ...serviceForm, accent: event.target.value })} maxLength="40" />
              </label>
              <label>
                Visibilidad
                <select value={serviceForm.status} onChange={(event) => setServiceForm({ ...serviceForm, status: event.target.value })}>
                  <option value="active">Visible</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
              <label className="admin-wide-field">
                Descripción
                <textarea value={serviceForm.description} onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} maxLength="1000" rows="3" required />
              </label>
              <label className="admin-wide-field">
                Resumen
                <textarea value={serviceForm.summary} onChange={(event) => setServiceForm({ ...serviceForm, summary: event.target.value })} maxLength="500" rows="2" />
              </label>
              <label className="admin-wide-field">
                Resultado esperado
                <textarea value={serviceForm.outcome} onChange={(event) => setServiceForm({ ...serviceForm, outcome: event.target.value })} maxLength="1000" rows="2" />
              </label>
              <label className="admin-wide-field">
                Puntos destacados (uno por línea)
                <textarea
                  value={serviceForm.pointsText ?? serviceForm.points.join('\n')}
                  onChange={(event) => setServiceForm({ ...serviceForm, pointsText: event.target.value })}
                  rows="3"
                />
              </label>
              <label className="admin-wide-field">
                Qué incluye (uno por línea)
                <textarea
                  value={serviceForm.includesText ?? serviceForm.includes.join('\n')}
                  onChange={(event) => setServiceForm({ ...serviceForm, includesText: event.target.value })}
                  rows="3"
                />
              </label>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="primary-button" disabled={busy || sessionExpired}>{busy ? 'Guardando…' : 'Guardar servicio'}</button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
};

export default Admin;
