import { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, firebaseReady } from '../../firebase';
import { useContact } from '../../config/useContact';
import { mailtoUrl, whatsappUrl } from '../../config/site';
import { getBackendHealth, getClientAccount, updateClientProfile } from '../../services/authApi';
import { isExpiringWithinDays } from './dateUtils';
import './client-area.css';

const emptyForm = { name: '', email: '', password: '', confirmPassword: '' };
const isDevelopment = import.meta.env.DEV;

const ClientArea = () => {
  const contact = useContact();
  const supportEmail = mailtoUrl(contact, 'Consulta sobre el área de clientes');
  const accessEmail = mailtoUrl(contact, 'Solicitud de acceso al portal');
  const accountHelpEmail = mailtoUrl(contact, 'Problema con mi cuenta');
  const supportWhatsApp = whatsappUrl(contact);
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [accountPending, setAccountPending] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [registrationPending, setRegistrationPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [healthCheck, setHealthCheck] = useState(0);
  const [accountRetry, setAccountRetry] = useState(0);

  useEffect(() => {
    let active = true;

    getBackendHealth()
      .then((health) => {
        if (!active) return;
        if (health.firebaseReady !== true) {
          setBackendStatus('firebase-unavailable');
        } else if (health.databaseReady !== true) {
          setBackendStatus('database-unavailable');
        } else {
          setBackendStatus(firebaseReady ? 'ready' : 'misconfigured');
        }
      })
      .catch(() => {
        if (active) setBackendStatus('unavailable');
      });

    return () => {
      active = false;
    };
  }, [healthCheck]);

  useEffect(() => {
    if (!auth) {
      setAuthInitialized(true);
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setAuthInitialized(true);
    });
  }, []);

  useEffect(() => {
    let active = true;

    if (!authInitialized || backendStatus === 'checking' || registrationPending) return undefined;

    if (!firebaseUser || backendStatus !== 'ready') {
      setUser(null);
      setClientData(null);
      setError('');
      setLoading(false);
      return undefined;
    }

    const loadAccount = async () => {
      setLoading(true);
      setError('');

      try {
        const idToken = await firebaseUser.getIdToken();
        const account = await getClientAccount(idToken);
        if (!active) return;

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: account.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Cliente',
        });
        setClientData(account);
        setProfileForm({ name: account.name || '', phone: account.phone || '' });
        setAccountPending(false);
      } catch (accountError) {
        if (!active) return;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Cliente',
        });
        setClientData(null);
        setAccountPending(accountError?.status === 404);
        setError(accountError?.message || 'No se pudo cargar la información de tu cuenta.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAccount();
    return () => {
      active = false;
    };
  }, [accountRetry, authInitialized, backendStatus, firebaseUser, registrationPending]);

  const totals = useMemo(() => {
    if (!clientData) return { services: 0, expiresSoon: 0, projects: 0, pendingMilestones: 0 };

    const projects = Array.isArray(clientData.projects) ? clientData.projects : [];
    return {
      services: Array.isArray(clientData.services) ? clientData.services.length : 0,
      expiresSoon: (clientData.services || []).filter((service) => isExpiringWithinDays(service.expiry)).length,
      projects: projects.filter((project) => project.status !== 'completed').length,
      pendingMilestones: projects.reduce(
        (total, project) => total + (project.status === 'completed'
          ? 0
          : (project.milestones || []).filter((milestone) => milestone.status !== 'completed').length),
        0,
      ),
    };
  }, [clientData]);

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
          setNotice('Te enviamos un enlace para verificar tu correo. Confirmalo antes de volver a ingresar al área de clientes.');
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
      if (form.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
      if (form.password !== form.confirmPassword) throw new Error('Las contraseñas no coinciden.');

      setRegistrationPending(true);
      const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      try {
        await updateProfile(credential.user, { displayName: form.name.trim() });
        await sendEmailVerification(credential.user);
      } finally {
        await signOut(auth);
      }
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
      setAuthMode('login');
      setNotice('Cuenta creada. Te enviamos un enlace para verificar tu correo. Una vez verificado, podrás ingresar; el acceso a los datos se habilita cuando el administrador asocie tu email a una ficha de cliente.');
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
          setNotice('Te enviamos un enlace para verificar tu correo. Confirmalo antes de volver a ingresar al área de clientes.');
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
      setNotice('Si existe una cuenta con ese correo, te enviamos las instrucciones para restablecer la contraseña.');
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
    const backendUnavailable = backendStatus === 'unavailable';
    const backendMisconfigured = backendStatus === 'misconfigured';
    const firebaseUnavailable = backendStatus === 'firebase-unavailable';
    const databaseUnavailable = backendStatus === 'database-unavailable';

    return (
      <main className="client-area-page">
        <section className="client-state-card" role="status">
          <span className="eyebrow">Área de clientes</span>
          <h1>{isDevelopment
            ? backendUnavailable
              ? 'No se puede conectar con el backend'
              : backendMisconfigured
                ? 'Falta configurar el acceso'
                : firebaseUnavailable
                  ? 'Falta configurar Firebase Admin'
                  : databaseUnavailable
                    ? 'Falta conectar la base de datos'
                    : 'Acceso en preparación'
            : 'El área de clientes no está disponible en este momento'}</h1>
          <p>{isDevelopment
            ? backendUnavailable
              ? 'No recibimos respuesta de la API. En desarrollo local, iniciá el backend en el puerto 4000 y comprobá que Vite use su proxy /api.'
              : backendMisconfigured
                ? 'El backend está listo, pero falta configurar la autenticación de Firebase en el frontend.'
                : firebaseUnavailable
                  ? 'La API responde, pero Firebase Admin no está inicializado en el backend. Configurá FIREBASE_PROJECT_ID y una credencial de servicio válida en el entorno local; no la guardes en el frontend.'
                  : databaseUnavailable
                    ? 'Firebase autentica tu acceso, pero PostgreSQL todavía no está conectado o falta ejecutar la migración de la base de datos.'
                    : 'El backend respondió, pero todavía no se puede habilitar el acceso seguro.'
            : 'Escribime y te ayudo por otro canal.'}</p>
          <p className="client-state-note">
            Tus servicios y datos no se consultan ni se guardan en este navegador. Escribinos y te ayudamos por un canal alternativo.
          </p>
          <div className="client-state-actions">
            <a className="primary-button" href={supportEmail}>
              Contactar por email
            </a>
            {supportWhatsApp && <a className="secondary-button" href={supportWhatsApp} target="_blank" rel="noreferrer">
              Contactar por WhatsApp
            </a>}
            <button type="button" className="client-retry-button" onClick={() => setHealthCheck((count) => count + 1)}>
              Volver a comprobar
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!user || !clientData) {
    if (firebaseUser && accountPending) {
      return (
        <main className="client-area-page">
          <section className="client-state-card" role="status">
            <span className="eyebrow">Área de clientes</span>
            <h1>Estamos preparando tu acceso</h1>
            <p>Tu correo está verificado, pero todavía no hay una ficha de cliente asociada a esta cuenta. El administrador debe vincular el mismo email que usaste para registrarte.</p>
            <p className="client-state-note">Si ya sos cliente, contactanos para revisar la asociación de tu cuenta.</p>
            <div className="client-state-actions">
              <a className="primary-button" href={accessEmail}>Solicitar acceso</a>
              <button type="button" className="secondary-button" onClick={() => setAccountRetry((count) => count + 1)}>Ya tengo acceso: volver a comprobar</button>
              <button type="button" className="secondary-button" onClick={handleLogout}>Cerrar sesión</button>
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
              <button type="button" className="secondary-button" onClick={() => setAccountRetry((count) => count + 1)}>
                Reintentar
              </button>
              <button type="button" className="secondary-button" onClick={handleLogout}>Cerrar sesión</button>
              <a className="primary-button" href={accountHelpEmail}>
                Pedir ayuda
              </a>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className="client-area-page">
        <section className="client-login-shell">
          <div className="login-card">
            <span className="eyebrow">Atención al cliente</span>
            <h1>Ingresá a tu área de clientes</h1>
            <p>
              Usá la cuenta que te indicamos para consultar los servicios asociados.
            </p>

            {error && <div className="error-box" role="alert">{error}</div>}
            {notice && <div className="client-success-box" role="status">{notice}</div>}

            <div className="client-auth-switch" role="group" aria-label="Tipo de acceso">
              <button type="button" className={authMode === 'login' ? 'is-active' : ''} onClick={() => { setAuthMode('login'); setError(''); setNotice(''); }}>
                Iniciar sesión
              </button>
              <button type="button" className={authMode === 'register' ? 'is-active' : ''} onClick={() => { setAuthMode('register'); setError(''); setNotice(''); }}>
                Crear cuenta
              </button>
            </div>

            <form onSubmit={authMode === 'register' ? handleRegistration : handleEmailLogin}>
              {authMode === 'register' && (
                <div className="client-login-field">
                  <label htmlFor="register-name">Nombre</label>
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleInputChange}
                    autoComplete="name"
                    maxLength="120"
                    required
                  />
                </div>
              )}
              <div className="client-login-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="client-login-field password-field">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleInputChange}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  minLength={authMode === 'register' ? 8 : undefined}
                  placeholder="••••••••"
                  required
                />
              </div>

              {authMode === 'register' && (
                <div className="client-login-field password-field">
                  <label htmlFor="confirm-password">Confirmar contraseña</label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    minLength="8"
                    required
                  />
                </div>
              )}

              <button type="submit" className="secondary-button client-login-submit" disabled={submitting}>
                {submitting ? 'Procesando…' : authMode === 'register' ? 'Crear cuenta y verificar email' : 'Ingresar'}
              </button>
              {authMode === 'login' && (
                <button type="button" className="client-forgot-password" onClick={handlePasswordReset} disabled={submitting}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </form>

            {firebaseReady && (
              <button type="button" className="google-button" onClick={loginWithGoogle} disabled={submitting}>
                {submitting ? 'Ingresando...' : 'Continuar con Google'}
              </button>
            )}
            <p className="client-login-note">
              El registro crea tu cuenta de acceso; para ver información del portal, el administrador debe asociar tu email verificado a una ficha de cliente.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="client-area-page">
      <section className="client-hero client-logged-in">
        <div>
          <span className="eyebrow">Área de cliente</span>
          <h1>Hola, {clientData.name || user.name || user.email}</h1>
          <p>
            Acá podés consultar los servicios asociados a tu cuenta, sus costos y fechas de vencimiento.
          </p>
        </div>

        <div className="client-actions">
          <span className="client-email">{user.email}</span>
          <button type="button" className="secondary-button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </section>

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
          <strong>{totals.projects}</strong>
          <span>Proyectos en curso</span>
        </div>
        <div className="stat-card">
          <strong>{totals.pendingMilestones}</strong>
          <span>Hitos pendientes</span>
        </div>
      </section>

      {error && <div className="error-box" role="alert">{error}</div>}
      {notice && <div className="client-success-box" role="status">{notice}</div>}

      <section className="client-workspace-grid">
        <section className="client-panel">
          <div className="client-panel-heading">
            <div>
              <span className="panel-tag">Seguimiento</span>
              <h2>Proyectos y entregas</h2>
            </div>
          </div>
          {clientData.projects?.length ? (
            <div className="client-project-list">
              {clientData.projects.map((project) => {
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
                        <div className="client-project-progress" role="progressbar" aria-label={`Avance de ${project.title}`} aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
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

        <form className="client-panel client-profile-form" onSubmit={handleProfileSubmit}>
          <div className="client-panel-heading">
            <div>
              <span className="panel-tag">Cuenta</span>
              <h2>Datos de contacto</h2>
            </div>
          </div>
          <label htmlFor="profile-name">Nombre</label>
          <input id="profile-name" value={profileForm.name} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} maxLength="120" required />
          <label htmlFor="profile-email">Email verificado</label>
          <input id="profile-email" type="email" value={user.email || ''} readOnly />
          <label htmlFor="profile-phone">Teléfono</label>
          <input id="profile-phone" type="tel" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} maxLength="40" autoComplete="tel" />
          <button type="submit" className="secondary-button" disabled={submitting}>Guardar contacto</button>
        </form>
      </section>

      <section className="services-client-list">
        {clientData.services?.length ? (
          clientData.services.map((service, index) => (
            <article
              key={service.id || `${clientData.id || user.uid}-${service.type}-${service.name}-${index}`}
              className="client-service-card"
            >
              <div className="service-head">
                <div>
                  <span className="service-badge">{service.title}</span>
                  <h2>{service.name}</h2>
                </div>
                <span className="service-status">{service.status}</span>
              </div>

              <div className="service-grid">
                <div>
                  <span>Costo</span>
                  <strong>{service.cost}</strong>
                </div>
                <div>
                  <span>Vencimiento</span>
                  <strong>{service.expiry}</strong>
                </div>
              </div>

              <div className="service-details">
                {service.details?.map((detail, detailIndex) => (
                  <div key={`${detail.label}-${detailIndex}`} className="detail-row">
                    <span>{detail.label}</span>
                    <strong>{detail.value}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <article className="client-service-card">
            <div className="service-head">
              <div>
                <span className="service-badge">Sin servicios</span>
                <h2>Todavía no hay servicios asociados a esta cuenta</h2>
              </div>
            </div>
          </article>
        )}
      </section>
    </main>
  );
};

function getFriendlyAuthError(error) {
  const messages = {
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
    'auth/wrong-password': 'El correo o la contraseña no son correctos.',
    'auth/too-many-requests': 'Hubo demasiados intentos. Esperá un momento y volvé a probar.',
    'auth/popup-closed-by-user': 'Se cerró la ventana de inicio de sesión antes de completar el acceso.',
    'auth/network-request-failed': 'No se pudo conectar con el servicio de autenticación. Revisá tu conexión.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese email. Iniciá sesión o restablecé la contraseña.',
    'auth/weak-password': 'La contraseña debe tener al menos 8 caracteres.',
    'auth/invalid-email': 'Ingresá un email válido.',
  };

  return messages[error?.code] || error?.message || 'No se pudo iniciar sesión.';
}

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

export default ClientArea;
