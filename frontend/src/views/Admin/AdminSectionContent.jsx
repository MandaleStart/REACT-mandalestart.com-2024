import { lazy, Suspense } from 'react';
import AdminClientHistory from './components/AdminClientHistory';
import AdminClientInvoices from './components/AdminClientInvoices';
import AdminClientEditor from './components/AdminClientEditor';
import AdminClientList from './components/AdminClientList';
import AdminContractedServices from './components/AdminContractedServices';
import AdminUserDirectory from './components/AdminUserDirectory';
import BillingAudit from './BillingAudit';
import BillingInvoices from './BillingInvoices';
import BillingPlans from './BillingPlans';
import BillingSubscriptions from './BillingSubscriptions';
import BillingDashboard from './BillingDashboard';

const Configurations = lazy(() => import('../Configurations/Configurations'));

/* eslint-disable react/prop-types */
export default function AdminSectionContent({
  section,
  clients,
  dashboard,
  users,
  usersError,
  firebaseUid,
  busy,
  selectedUserUid,
  setSelectedUserUid,
  userSearch,
  setUserSearch,
  onToggleUserStatus,
  onManageClient,
  onCreateClient,
  onRetry,
  onManageContractedClient,
  filteredClients,
  selectedClientId,
  clientSearch,
  setClientSearch,
  onChooseClient,
  clientForm,
  setClientForm,
  clientIsDirty,
  sessionExpired,
  onSubmitClient,
  onDeleteClient,
  onUpdateService,
  onUpdateProject,
  onUpdateMilestone,
}) {
  let content = null;

  if (section === 'plans') {
    content = <BillingPlans />;
  } else if (section === 'subscriptions') {
    content = <BillingSubscriptions clients={clients} />;
  } else if (section === 'invoices') {
    content = <BillingInvoices clients={clients} />;
  } else if (section === 'audit') {
    content = <BillingAudit />;
  } else if (section === 'configuraciones') {
    content = (
      <Suspense fallback={<p role="status">Cargando catálogo…</p>}>
        <Configurations />
      </Suspense>
    );
  } else if (section === 'dashboard') {
    content = <BillingDashboard dashboard={dashboard} clients={clients} />;
  } else if (section === 'users') {
    content = (
      <AdminUserDirectory
        users={users}
        selectedUid={selectedUserUid}
        search={userSearch}
        onSearchChange={setUserSearch}
        onSelect={setSelectedUserUid}
        onToggleDisabled={onToggleUserStatus}
        onManageClient={onManageClient}
        onCreateClient={onCreateClient}
        onRetry={onRetry}
        currentUid={firebaseUid}
        busy={busy}
        error={usersError}
      />
    );
  } else if (section === 'contracts') {
    content = (
      <AdminContractedServices
        clients={clients}
        onManageClient={onManageContractedClient}
      />
    );
  } else if (section === 'clients') {
    content = (
      <section className="admin-workspace">
        <AdminClientList
          clients={clients}
          filteredClients={filteredClients}
          selectedClientId={selectedClientId}
          search={clientSearch}
          onSearchChange={setClientSearch}
          onNew={() => onChooseClient('')}
          onSelect={onChooseClient}
        />
        <AdminClientEditor
          selectedClientId={selectedClientId}
          client={clientForm}
          setClient={setClientForm}
          isDirty={clientIsDirty}
          busy={busy}
          sessionExpired={sessionExpired}
          onSubmit={onSubmitClient}
          onDelete={onDeleteClient}
          onUpdateService={onUpdateService}
          onUpdateProject={onUpdateProject}
          onUpdateMilestone={onUpdateMilestone}
        />
        {selectedClientId && <AdminClientInvoices clientId={selectedClientId} />}
        {selectedClientId && <AdminClientHistory clientId={selectedClientId} />}
      </section>
    );
  }

  return <section className="admin-section-content">{content}</section>;
}
