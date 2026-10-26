import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  archiveAdminService,
  createAdminClient,
  deleteAdminClient,
  saveAdminService,
  updateAdminClient,
} from '../../services/adminApi';
import {
  emptyClient,
  emptyPublicService,
  expiredSessionMessage,
  isSessionError,
  parseDetails,
  projectToForm,
  serviceToForm,
} from './adminModel';
import AdminAccessState from './components/AdminAccessState';
import AdminClientList from './components/AdminClientList';
import AdminClientEditor from './components/AdminClientEditor';
import AdminConfirmationDialog from './components/AdminConfirmationDialog';
import AdminServiceEditor from './components/AdminServiceEditor';
import AdminServiceList from './components/AdminServiceList';
import useAdminData from './hooks/useAdminData';
import './admin.css';

const Admin = () => {
  const {
    firebaseUser,
    authReady,
    access,
    clients,
    services,
    error,
    setError,
    sessionExpired,
    setSessionExpired,
    refreshData,
  } = useAdminData();
  const [section, setSection] = useState('clients');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientForm, setClientForm] = useState(emptyClient);
  const [clientBaseline, setClientBaseline] = useState(emptyClient);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedServiceSlug, setSelectedServiceSlug] = useState('');
  const [serviceForm, setServiceForm] = useState(emptyPublicService);
  const [serviceBaseline, setServiceBaseline] = useState(emptyPublicService);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const confirmationDialogRef = useRef(null);

  const visibleServices = useMemo(
    () => services.filter((service) => service.status !== 'archived'),
    [services],
  );

  const clientIsDirty = useMemo(
    () => JSON.stringify(clientForm) !== JSON.stringify(clientBaseline),
    [clientBaseline, clientForm],
  );
  const serviceIsDirty = useMemo(
    () => JSON.stringify(serviceForm) !== JSON.stringify(serviceBaseline),
    [serviceBaseline, serviceForm],
  );
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLocaleLowerCase();
    if (!query) return clients;
    return clients.filter((client) => (
      [client.name, client.email, client.phone]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query))
    ));
  }, [clientSearch, clients]);

  useEffect(() => {
    const dialog = confirmationDialogRef.current;
    if (pendingConfirmation && dialog && !dialog.open) dialog.showModal();
    if (!pendingConfirmation && dialog?.open) dialog.close();
  }, [pendingConfirmation]);

  const loadClient = (id) => {
    setSelectedClientId(id);
    const client = clients.find((item) => item.id === id);
    const form = client
      ? {
        ...client,
        services: client.services.map(serviceToForm),
        projects: (client.projects || []).map(projectToForm),
      }
      : emptyClient;
    setClientForm(form);
    setClientBaseline(form);
    setError('');
    setNotice('');
  };

  const chooseClient = (id) => {
    if (id === selectedClientId) return;
    if (clientIsDirty) {
      setPendingConfirmation({
        message: 'Hay cambios sin guardar. Si cambiás de cliente, se van a descartar.',
        confirmLabel: 'Descartar y cambiar',
        onConfirm: () => loadClient(id),
      });
      return;
    }
    loadClient(id);
  };

  const loadService = (slug) => {
    setSelectedServiceSlug(slug);
    const service = services.find((item) => item.slug === slug);
    const form = service
      ? { ...emptyPublicService, ...service, points: service.points || [], includes: service.includes || [] }
      : emptyPublicService;
    setServiceForm(form);
    setServiceBaseline(form);
    setError('');
    setNotice('');
  };

  const chooseService = (slug) => {
    if (slug === selectedServiceSlug) return;
    if (serviceIsDirty) {
      setPendingConfirmation({
        message: 'Hay cambios sin guardar. Si cambiás de servicio, se van a descartar.',
        confirmLabel: 'Descartar y cambiar',
        onConfirm: () => loadService(slug),
      });
      return;
    }
    loadService(slug);
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
      const savedForm = {
        ...saved,
        services: saved.services.map(serviceToForm),
        projects: (saved.projects || []).map(projectToForm),
      };
      setClientForm(savedForm);
      setClientBaseline(savedForm);
      setNotice('Los datos del cliente se guardaron correctamente.');
    } catch (saveError) {
      const sessionError = isSessionError(saveError);
      setSessionExpired(sessionError);
      setError(sessionError ? expiredSessionMessage : saveError.message || 'No se pudo guardar el cliente.');
    } finally {
      setBusy(false);
    }
  };

  const deleteClient = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await deleteAdminClient(selectedClientId);
      await refreshData();
      setSelectedClientId('');
      setClientForm(emptyClient);
      setClientBaseline(emptyClient);
      setNotice('El cliente se eliminó.');
    } catch (deleteError) {
      const sessionError = isSessionError(deleteError);
      setSessionExpired(sessionError);
      setError(sessionError ? expiredSessionMessage : deleteError.message || 'No se pudo eliminar el cliente.');
    } finally {
      setBusy(false);
    }
  };

  const handleClientDelete = () => {
    if (!selectedClientId) return;
    setPendingConfirmation({
      message: `¿Eliminar la ficha de ${clientForm.name || 'este cliente'} y sus servicios asociados? La cuenta de acceso no se elimina.`,
      confirmLabel: 'Eliminar cliente',
      onConfirm: deleteClient,
    });
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
      loadService(saved.slug);
      setNotice('El catálogo público se actualizó correctamente.');
    } catch (saveError) {
      const sessionError = isSessionError(saveError);
      setSessionExpired(sessionError);
      setError(sessionError ? expiredSessionMessage : saveError.message || 'No se pudo guardar el servicio.');
    } finally {
      setBusy(false);
    }
  };

  const archiveService = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await archiveAdminService(selectedServiceSlug);
      await refreshData();
      const archivedForm = { ...serviceForm, status: 'archived' };
      setServiceForm(archivedForm);
      setServiceBaseline(archivedForm);
      setNotice('El servicio se archivó y dejó de mostrarse en el sitio público.');
    } catch (archiveError) {
      const sessionError = isSessionError(archiveError);
      setSessionExpired(sessionError);
      setError(sessionError ? expiredSessionMessage : archiveError.message || 'No se pudo archivar el servicio.');
    } finally {
      setBusy(false);
    }
  };

  const handleServiceArchive = () => {
    if (!selectedServiceSlug) return;
    setPendingConfirmation({
      message: '¿Archivar este servicio? Dejará de aparecer en el sitio público, pero se podrá restaurar.',
      confirmLabel: 'Archivar servicio',
      onConfirm: archiveService,
    });
  };

  const confirmPendingAction = () => {
    const confirmAction = pendingConfirmation?.onConfirm;
    setPendingConfirmation(null);
    confirmAction?.();
  };

  const accessState = (
    <AdminAccessState access={access} authReady={authReady} error={error} sessionExpired={sessionExpired} />
  );
  if (access !== 'allowed') return accessState;

  return (
    <main className="admin-page">
      <AdminConfirmationDialog
        dialogRef={confirmationDialogRef}
        confirmation={pendingConfirmation}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={confirmPendingAction}
      />

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
          <AdminClientList
            clients={clients}
            filteredClients={filteredClients}
            selectedClientId={selectedClientId}
            search={clientSearch}
            onSearchChange={setClientSearch}
            onNew={() => chooseClient('')}
            onSelect={chooseClient}
          />

          <AdminClientEditor
            selectedClientId={selectedClientId}
            client={clientForm}
            setClient={setClientForm}
            isDirty={clientIsDirty}
            busy={busy}
            sessionExpired={sessionExpired}
            onSubmit={handleClientSubmit}
            onDelete={handleClientDelete}
            onUpdateService={updateClientService}
            onUpdateProject={updateClientProject}
            onUpdateMilestone={updateProjectMilestone}
          />
        </section>
      ) : (
        <section className="admin-workspace">
          <AdminServiceList
            services={services}
            selectedSlug={selectedServiceSlug}
            onSelect={chooseService}
          />

          <AdminServiceEditor
            selectedSlug={selectedServiceSlug}
            service={serviceForm}
            setService={setServiceForm}
            isDirty={serviceIsDirty}
            busy={busy}
            sessionExpired={sessionExpired}
            onSubmit={handlePublicServiceSubmit}
            onArchive={handleServiceArchive}
          />
        </section>
      )}
    </main>
  );
};

export default Admin;
