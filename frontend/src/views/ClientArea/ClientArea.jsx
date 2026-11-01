import { useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, firebaseReady } from '../../firebase';
import { Navigate, useLocation } from 'react-router-dom';
import { useContact } from '../../config/useContact';
import { mailtoUrl, whatsappUrl } from '../../config/site';
import { updateClientProfile } from '../../services/authApi';
import { getDaysFromToday, isExpiringWithinDays } from './dateUtils';
import ClientAuthCard from './components/ClientAuthCard';
import ClientProfileForm from './components/ClientProfileForm';
import BackendStatusCard from './components/BackendStatusCard';
import ClientProjectsPanel from './components/ClientProjectsPanel';
import ClientServicesList from './components/ClientServicesList';
import ClientOverview from './ClientOverview';
import ClientBilling from './ClientBilling';
import ClientSubscriptions from './ClientSubscriptions';
import ClientSupport from './ClientSupport';
import PortalSidebar from '../../components/PortalSidebar';
import { getClientAreaGuidance } from './clientAreaHelpers';
import useClientAccount from './hooks/useClientAccount';
import './client-area.css';

const emptyForm = { name: '', email: '', password: '', confirmPassword: '' };
const isDevelopment = import.meta.env.DEV;

const ClientArea = () => {
  const { pathname } = useLocation();
  const routeParts = pathname.replace(/^\/area-cliente\/?/, '').split('/');
  const section = routeParts[0] || 'overview';
  const invoiceId = section === 'invoices' ? routeParts[1] : undefined;
  const contact = useContact();
  const supportEmail = mailtoUrl(contact, 'Consulta sobre el área de clientes');
  const accessEmail = mailtoUrl(
    contact,
    'Solicitud de acceso al portal',
    'Hola, soy cliente de MandaleStart y quiero vincular mi cuenta al área de clientes.',
  );
  const accountHelpEmail = mailtoUrl(contact, 'Problema con mi cuenta');
  const supportWhatsApp = whatsappUrl(contact);
  const {
    user,
    setUser,
    firebaseUser,
    clientData,
    setClientData,
    dashboardData,
    profileForm,
    setProfileForm,
    accountPending,
    backendStatus,
    authInitialized,
    setRegistrationPending,
    loading,
    setHealthCheck,
    setAccountRetry,
    error,
    setError,
  } = useClientAccount();
  const [authMode, setAuthMode] = useState('login');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(emptyForm);

  const totals = useMemo(() => {
    if (dashboardData?.overview) {
      return {
        services: dashboardData.overview.totalServices || 0,
        expiresSoon: dashboardData.alerts?.length || 0,
        overdue: dashboardData.overview.overdueServices || dashboardData.overdue?.length || 0,
        projects: dashboardData.overview.totalProjects || 0,
        pendingMilestones: dashboardData.overview.upcomingMilestones || 0,
      };
    }

    if (!clientData) return { services: 0, expiresSoon: 0, overdue: 0, projects: 0, pendingMilestones: 0 };

    const projects = Array.isArray(clientData.projects) ? clientData.projects : [];
    const services = Array.isArray(clientData.services) ? clientData.services : [];
    return {
      services: services.length,
      expiresSoon: services.filter((service) => isExpiringWithinDays(service.expiry)).length,
      overdue: services.filter((service) => {
        const diffDays = getDaysFromToday(service.expiry);
        return diffDays !== null && diffDays < 0;
      }).length,
      projects: projects.filter((project) => project.status !== 'completed').length,
      pendingMilestones: projects.reduce(
        (total, project) =>
          total +
          (project.status === 'completed'
            ? 0
            : (project.milestones || []).filter((milestone) => milestone.status !== 'completed')
              .length),
        0,
      ),
    };
  }, [clientData, dashboardData]);

  const guidance = getClientAreaGuidance({
    servicesCount: totals.services,
    alertsCount: totals.expiresSoon,
    pendingMilestones: totals.pendingMilestones,
    nextMilestone: dashboardData?.nextMilestone,
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      if (!auth) throw new Error('El inicio de sesión no está configurado.');
      const credential = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      if (!credential.user.emailVerified) {
        try {
          await sendEmailVerification(credential.user);
          setNotice(
            'Te enviamos un enlace para verificar tu correo. Confirmalo antes de volver a ingresar al área de clientes.',
          );
        } finally {
          await signOut(auth);
        }
        return;
      }
    } catch (loginError) {
      setError(getFriendlyAuthError(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegistration = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      if (!auth) throw new Error('El registro no está configurado.');
      if (form.password.length < 8)
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      if (form.password !== form.confirmPassword) throw new Error('Las contraseñas no coinciden.');

      setRegistrationPending(true);
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password,
      );
      try {
        await updateProfile(credential.user, { displayName: form.name.trim() });
        await sendEmailVerification(credential.user);
      } finally {
        await signOut(auth);
      }
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
      setAuthMode('login');
      setNotice(
        'Cuenta creada. Te enviamos un enlace para verificar tu correo. Una vez verificado, podrás ingresar; el acceso a los datos se habilita cuando el administrador asocie tu email a una ficha de cliente.',
      );
    } catch (registrationError) {
      setError(getFriendlyAuthError(registrationError));
    } finally {
      setRegistrationPending(false);
      setSubmitting(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!firebaseUser) return;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const idToken = await firebaseUser.getIdToken();
      const updatedAccount = await updateClientProfile(idToken, profileForm);
      setClientData(updatedAccount);
      setUser((current) => ({ ...current, name: updatedAccount.name }));
      setProfileForm({ name: updatedAccount.name, phone: updatedAccount.phone || '' });
      setNotice('Tus datos de contacto se actualizaron.');
    } catch (profileError) {
      setError(profileError.message || 'No se pudo actualizar el perfil.');
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      setError('El inicio de sesión con Google no está configurado.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setNotice('');
      const credential = await signInWithPopup(auth, googleProvider);
      if (!credential.user.emailVerified) {
        try {
          await sendEmailVerification(credential.user);
          setNotice(
            'Te enviamos un enlace para verificar tu correo. Confirmalo antes de volver a ingresar al área de clientes.',
          );
        } finally {
          await signOut(auth);
        }
        return;
      }
    } catch (loginError) {
      setError(getFriendlyAuthError(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (event) => {
    const emailInput = event.currentTarget.form.elements.email;
    if (!emailInput.reportValidity()) return;

    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      if (!auth) throw new Error('La recuperación de contraseña no está configurada.');
      await sendPasswordResetEmail(auth, form.email.trim());
      setNotice(
        'Si existe una cuenta con ese correo, te enviamos las instrucciones para restablecer la contraseña.',
      );
    } catch (resetError) {
      setError(getFriendlyAuthError(resetError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    try {
      if (auth) await signOut(auth);
      setUser(null);
      setClientData(null);
    } catch (logoutError) {
      setError(logoutError?.message || 'No se pudo cerrar la sesión.');
    }
  };

  if (!authInitialized || backendStatus === 'checking' || (firebaseUser && loading)) {
    return (
      <main className="client-area-page">
        <section className="client-state-card" aria-live="polite">
          <span className="eyebrow">Área de clientes</span>
          <h1>Comprobando el acceso</h1>
          <p>Estamos verificando la conexión y preparando la información de tu cuenta.</p>
          <div className="client-loading-bar" role="status" aria-label="Cargando" />
        </section>
      </main>
    );
  }

  if (backendStatus !== 'ready') {
    return (
      <BackendStatusCard
        backendStatus={backendStatus}
        isDevelopment={isDevelopment}
        supportEmail={supportEmail}
        supportWhatsApp={supportWhatsApp}
        onRetry={() => setHealthCheck((count) => count + 1)}
      />
    );
  }

  if (!user || !clientData) {
    if (firebaseUser && accountPending) {
      return (
        <main className="client-area-page">
          <section className="client-state-card" role="status">
            <span className="eyebrow">Área de clientes</span>
            <h1>Estamos preparando tu acceso</h1>
            <p>
              No encontramos una ficha de cliente vinculada a este correo. Si ya sos cliente,
              escribime para que pueda asociarla.
            </p>
            <p className="client-state-note">
              Si ya sos cliente, contactanos para revisar la asociación de tu cuenta.
            </p>
            <div className="client-state-actions">
              <a className="primary-button" href={accessEmail}>
                Pedir acceso
              </a>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAccountRetry((count) => count + 1)}
              >
                Ya tengo acceso: volver a comprobar
              </button>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </section>
        </main>
      );
    }
    if (firebaseUser && error) {
      return (
        <main className="client-area-page">
          <section className="client-state-card" role="alert">
            <span className="eyebrow">Área de clientes</span>
            <h1>No pudimos cargar tu cuenta</h1>
            <p>{error}</p>
            <div className="client-state-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAccountRetry((count) => count + 1)}
              >
                Reintentar
              </button>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Cerrar sesión
              </button>
              <a className="primary-button" href={accountHelpEmail}>
                Pedir ayuda
              </a>
            </div>
          </section>
        </main>
      );
    }

    return (
      <ClientAuthCard
        authMode={authMode}
        setAuthMode={setAuthMode}
        error={error}
        setError={setError}
        notice={notice}
        setNotice={setNotice}
        form={form}
        onInputChange={handleInputChange}
        onRegister={handleRegistration}
        onEmailLogin={handleEmailLogin}
        onGoogleLogin={loginWithGoogle}
        onPasswordReset={handlePasswordReset}
        submitting={submitting}
        firebaseReady={firebaseReady}
      />
    );
  }

  return (
    <main className="client-area-page">
      <section className="client-hero client-logged-in">
        <div>
          <span className="eyebrow">Área de cliente</span>
          <h1>Tu cuenta</h1>
          <p>
            Hola, {clientData.name || user.name || user.email}. Acá consultás tus servicios,
            vencimientos, facturas y el avance de tus proyectos.
          </p>
        </div>

        <div className="client-actions">
          <span className="client-email">{user.email}</span>
        </div>
      </section>

      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="client-success-box" role="status">
          {notice}
        </div>
      )}

      <div className="client-area-layout">
        <PortalSidebar
          label="Secciones del área de cliente"
          onLogout={handleLogout}
          items={[
            { to: '/area-cliente', label: 'Resumen', end: true },
            { to: '/area-cliente/services', label: 'Servicios' },
            { to: '/area-cliente/invoices', label: 'Facturas' },
            { to: '/area-cliente/projects', label: 'Proyectos' },
            { to: '/area-cliente/support', label: 'Soporte' },
            { to: '/area-cliente/profile', label: 'Perfil' },
          ]}
        />

        <section className="client-section-content">
          {section === 'overview' ? (
            <ClientOverview
              firebaseUser={firebaseUser}
              dashboardData={dashboardData}
              totals={totals}
              guidance={guidance}
              supportEmail={supportEmail}
              supportWhatsApp={supportWhatsApp}
            />
          ) : section === 'services' ? (
            <ClientSubscriptions firebaseUser={firebaseUser} />
          ) : section === 'legacy-services' ? (
            <ClientServicesList
              services={clientData.services}
              clientId={clientData.id}
              userId={user.uid}
            />
          ) : section === 'invoices' ? (
            <ClientBilling firebaseUser={firebaseUser} invoiceId={invoiceId} />
          ) : section === 'support' ? (
            <ClientSupport />
          ) : section === 'projects' ? (
            <ClientProjectsPanel projects={clientData.projects} />
          ) : section === 'profile' ? (
            <ClientProfileForm
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              email={user.email}
              onSubmit={handleProfileSubmit}
              submitting={submitting}
            />
          ) : (
            <Navigate to="/area-cliente" replace />
          )}
        </section>
      </div>
    </main>
  );
};

function getFriendlyAuthError(error) {
  const messages = {
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
    'auth/wrong-password': 'El correo o la contraseña no son correctos.',
    'auth/too-many-requests': 'Hubo demasiados intentos. Esperá un momento y volvé a probar.',
    'auth/popup-closed-by-user':
      'Se cerró la ventana de inicio de sesión antes de completar el acceso.',
    'auth/network-request-failed':
      'No se pudo conectar con el servicio de autenticación. Revisá tu conexión.',
    'auth/email-already-in-use':
      'Ya existe una cuenta con ese email. Iniciá sesión o restablecé la contraseña.',
    'auth/weak-password': 'La contraseña debe tener al menos 8 caracteres.',
    'auth/invalid-email': 'Ingresá un email válido.',
  };

  return messages[error?.code] || error?.message || 'No se pudo iniciar sesión.';
}

export default ClientArea;
