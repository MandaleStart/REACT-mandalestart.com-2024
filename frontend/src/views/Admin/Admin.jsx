import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  createAdminClient,
  archiveAdminClient,
  updateAdminUserStatus,
  updateAdminClient,
} from '../../services/adminApi';
import {
  emptyClient,
  getContractedServices,
  expiredSessionMessage,
  forbiddenMessage,
  isAuthorizationError,
  isSessionError,
  parseDetails,
  projectToForm,
  serviceToForm,
} from './adminModel';
import AdminAccessState from './components/AdminAccessState';
import AdminConfirmationDialog from './components/AdminConfirmationDialog';
import AdminDashboardOverview from './AdminDashboardOverview';
import AdminSectionContent from './AdminSectionContent';
import AdminSidebar from './AdminSidebar';
import useAdminData from './hooks/useAdminData';
import './admin.css';

const Admin = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const section = pathname.replace(/^\/administracion\/?/, '').split('/')[0];
  const {
    firebaseUser,
    authReady,
    access,
    setAccess,
    clients,
    users,
    usersError,
    error,
    setError,
    sessionExpired,
    setSessionExpired,
    refreshData,
    dashboard,
  } = useAdminData();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientForm, setClientForm] = useState(emptyClient);
  const [clientBaseline, setClientBaseline] = useState(emptyClient);
  const [clientSearch, setClientSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserUid, setSelectedUserUid] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const confirmationDialogRef = useRef(null);

  const dashboardStats = dashboard?.overview || {
    clients: clients.length,
    activeServices: 0,
    projects: 0,
    priorityItems: 0,
    overdueItems: 0,
  };
  const contractedServices = useMemo(() => getContractedServices(clients), [clients]);

  const clientIsDirty = useMemo(
    () => JSON.stringify(clientForm) !== JSON.stringify(clientBaseline),
    [clientBaseline, clientForm],
  );
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLocaleLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      [client.name, client.email, client.phone].some((value) =>
        String(value || '')
          .toLocaleLowerCase()
          .includes(query),
      ),
    );
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
        ? await updateAdminClient(selectedClientId, client, clientBaseline.updated_at)
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
      const authorizationError = isAuthorizationError(saveError);
      setSessionExpired(sessionError);
      if (sessionError || authorizationError) setAccess(sessionError ? 'signed-out' : 'forbidden');
      setError(
        sessionError
          ? expiredSessionMessage
          : authorizationError
            ? forbiddenMessage
            : saveError.message || 'No se pudo guardar el cliente.',
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteClient = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await archiveAdminClient(selectedClientId);
      await refreshData();
      setSelectedClientId('');
      setClientForm(emptyClient);
      setClientBaseline(emptyClient);
      setNotice('El cliente se archivó.');
    } catch (deleteError) {
      const sessionError = isSessionError(deleteError);
      const authorizationError = isAuthorizationError(deleteError);
      setSessionExpired(sessionError);
      if (sessionError || authorizationError) setAccess(sessionError ? 'signed-out' : 'forbidden');
      setError(
        sessionError
          ? expiredSessionMessage
          : authorizationError
            ? forbiddenMessage
            : deleteError.message || 'No se pudo archivar el cliente.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleClientDelete = () => {
    if (!selectedClientId) return;
    setPendingConfirmation({
      message: `¿Archivar la ficha de ${clientForm.name || 'este cliente'}? Dejará de aparecer en el listado, pero se conservará su historial. No se puede archivar un cliente con facturas.`,
      confirmLabel: 'Archivar cliente',
      onConfirm: deleteClient,
    });
  };

  const updateClientService = (index, field, value) => {
    setClientForm((current) => ({
      ...current,
      services: current.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, [field]: value } : service,
      ),
    }));
  };

  const updateClientProject = (index, field, value) => {
    setClientForm((current) => ({
      ...current,
      projects: current.projects.map((project, projectIndex) =>
        projectIndex === index ? { ...project, [field]: value } : project,
      ),
    }));
  };

  const updateProjectMilestone = (projectIndex, milestoneIndex, field, value) => {
    setClientForm((current) => ({
      ...current,
      projects: current.projects.map((project, currentProjectIndex) =>
        currentProjectIndex === projectIndex
          ? {
              ...project,
              milestones: project.milestones.map((milestone, currentMilestoneIndex) =>
                currentMilestoneIndex === milestoneIndex
                  ? { ...milestone, [field]: value }
                  : milestone,
              ),
            }
          : project,
      ),
    }));
  };

  const handleUserStatusChange = (user) => {
    const disabled = !user.disabled;
    setPendingConfirmation({
      message: disabled
        ? `¿Desactivar la cuenta de ${user.email || user.displayName}? No podrá iniciar sesión.`
        : `¿Reactivar la cuenta de ${user.email || user.displayName}?`,
      confirmLabel: disabled ? 'Desactivar cuenta' : 'Reactivar cuenta',
      onConfirm: async () => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
          await updateAdminUserStatus(user.uid, disabled);
          await refreshData();
          setSelectedUserUid(user.uid);
          setNotice(disabled ? 'La cuenta quedó desactivada.' : 'La cuenta quedó reactivada.');
        } catch (statusError) {
          const sessionError = isSessionError(statusError);
          const authorizationError = isAuthorizationError(statusError);
          setSessionExpired(sessionError);
          if (sessionError || authorizationError) {
            setAccess(sessionError ? 'signed-out' : 'forbidden');
          }
          setError(
            sessionError
              ? expiredSessionMessage
              : authorizationError
                ? forbiddenMessage
                : statusError.message || 'No se pudo actualizar la cuenta.',
          );
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const manageClient = (clientId) => {
    const openClient = () => {
      navigate('/administracion/clients');
      loadClient(clientId);
    };
    if (clientIsDirty) {
      setPendingConfirmation({
        message: 'Hay cambios sin guardar. Si continuás, se descartarán.',
        confirmLabel: 'Descartar y continuar',
        onConfirm: openClient,
      });
      return;
    }
    openClient();
  };

  const createClientForUser = (user) => {
    const createClient = () => {
      const newClient = {
        ...emptyClient,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
      };
      navigate('/administracion/clients');
      setSelectedClientId('');
      setClientForm(newClient);
      setClientBaseline(newClient);
      setError('');
      setNotice('');
    };
    if (clientIsDirty) {
      setPendingConfirmation({
        message: 'Hay cambios sin guardar. Si continuás, se descartarán.',
        confirmLabel: 'Descartar y continuar',
        onConfirm: createClient,
      });
      return;
    }
    createClient();
  };

  const confirmPendingAction = () => {
    const confirmAction = pendingConfirmation?.onConfirm;
    setPendingConfirmation(null);
    confirmAction?.();
  };

  const accessState = (
    <AdminAccessState
      access={access}
      authReady={authReady}
      error={error}
      sessionExpired={sessionExpired}
    />
  );
  if (access !== 'allowed') return accessState;
  const sections = [
    'dashboard',
    'clients',
    'contracts',
    'subscriptions',
    'invoices',
    'plans',
    'configuraciones',
    'users',
    'audit',
  ];
  if (!section) return <Navigate to="/administracion/dashboard" replace />;
  if (!sections.includes(section)) {
    return <Navigate to="/administracion/dashboard" replace />;
  }

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
        <div className="admin-header-actions">
          <button type="button" className="secondary-button" onClick={() => signOut(auth)}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {section === 'dashboard' ? (
        <AdminDashboardOverview dashboard={dashboard} stats={dashboardStats} />
      ) : null}

      {sessionExpired ? (
        <div className="admin-feedback error admin-session-expired" role="alert">
          <p>{expiredSessionMessage}</p>
          <Link className="primary-button" to="/login">
            Volver a ingresar
          </Link>
        </div>
      ) : (
        error && (
          <p className="admin-feedback error" role="alert">
            {error}
          </p>
        )
      )}
      {notice && (
        <p className="admin-feedback success" role="status">
          {notice}
        </p>
      )}

      <div className="admin-portal-layout">
        <AdminSidebar
          clientCount={clients.length}
          legacyServiceCount={contractedServices.length}
          userCount={users.length}
        />
        <AdminSectionContent
          section={section}
          clients={clients}
          dashboard={dashboard}
          users={users}
          usersError={usersError}
          firebaseUid={firebaseUser.uid}
          busy={busy}
          selectedUserUid={selectedUserUid}
          setSelectedUserUid={setSelectedUserUid}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          onToggleUserStatus={handleUserStatusChange}
          onManageClient={manageClient}
          onCreateClient={createClientForUser}
          onRetry={refreshData}
          onManageContractedClient={manageClient}
          filteredClients={filteredClients}
          selectedClientId={selectedClientId}
          clientSearch={clientSearch}
          setClientSearch={setClientSearch}
          onChooseClient={chooseClient}
          clientForm={clientForm}
          setClientForm={setClientForm}
          clientIsDirty={clientIsDirty}
          sessionExpired={sessionExpired}
          onSubmitClient={handleClientSubmit}
          onDeleteClient={handleClientDelete}
          onUpdateService={updateClientService}
          onUpdateProject={updateClientProject}
          onUpdateMilestone={updateProjectMilestone}
        />
      </div>
    </main>
  );
};

export default Admin;
