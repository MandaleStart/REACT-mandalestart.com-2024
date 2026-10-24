import { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, firebaseReady } from '../../firebase';
import { getBackendHealth, getClientAccount } from '../../services/authApi';
import './client-area.css';

const emptyForm = { email: '', password: '' };

const ClientArea = () => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [authInitialized, setAuthInitialized] = useState(false);
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
          setBackendStatus('demo');
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

    if (!authInitialized || backendStatus === 'checking') return undefined;

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
      } catch (accountError) {
        if (!active) return;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Cliente',
        });
        setClientData(null);
        setError(accountError?.message || 'No se pudo cargar la información de tu cuenta.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAccount();
    return () => {
      active = false;
    };
  }, [accountRetry, authInitialized, backendStatus, firebaseUser]);

  const totals = useMemo(() => {
    if (!clientData?.services) return { services: 0, expiresSoon: 0 };

    return clientData.services.reduce(
      (acc, service) => {
        acc.services += 1;
        if (service.expiry) acc.expiresSoon += 1;
        return acc;
      },
      { services: 0, expiresSoon: 0 },
    );
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
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
    } catch (loginError) {
      setError(getFriendlyAuthError(loginError));
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
      await signInWithPopup(auth, googleProvider);
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

    return (
      <main className="client-area-page">
        <section className="client-state-card" role="status">
          <span className="eyebrow">Área de clientes</span>
          <h1>
            {backendUnavailable
              ? 'El portal todavía no está disponible'
              : backendMisconfigured
                ? 'Falta configurar el acceso'
                : 'Acceso en preparación'}
          </h1>
          <p>
            {backendUnavailable
              ? 'El servicio de cuentas aún no está conectado. El backend de este portal todavía no está desplegado en un servidor.'
              : backendMisconfigured
                ? 'El backend está listo, pero falta configurar la autenticación de Firebase en el frontend.'
                : 'El backend responde, pero todavía usa autenticación de demostración. No habilitamos el acceso a datos reales hasta configurar la autenticación segura.'}
          </p>
          <p className="client-state-note">
            Tus servicios y datos no se consultan ni se guardan en este navegador. Escribinos y te ayudamos por un canal alternativo.
          </p>
          <div className="client-state-actions">
            <a className="primary-button" href="mailto:info@mandalestart.com?subject=Consulta%20sobre%20el%20%C3%A1rea%20de%20clientes">
              Contactar por email
            </a>
            <a className="secondary-button" href="https://wa.me/59891598586" target="_blank" rel="noreferrer">
              Contactar por WhatsApp
            </a>
            <button type="button" className="client-retry-button" onClick={() => setHealthCheck((count) => count + 1)}>
              Volver a comprobar
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!user || !clientData) {
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
              <a className="primary-button" href="mailto:info@mandalestart.com?subject=Problema%20con%20mi%20cuenta">
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

            <form onSubmit={handleEmailLogin}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  autoComplete="username"
                  placeholder="tu@email.com"
                  required
                  style={{ width: '100%', marginTop: '0.35rem', padding: '0.7rem', borderRadius: '0.5rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', marginTop: '0.35rem', padding: '0.7rem', borderRadius: '0.5rem' }}
                />
              </div>

              <button type="submit" className="secondary-button" disabled={submitting} style={{ width: '100%' }}>
                {submitting ? 'Ingresando...' : 'Ingresar'}
              </button>
              <button type="button" className="client-forgot-password" onClick={handlePasswordReset} disabled={submitting}>
                ¿Olvidaste tu contraseña?
              </button>
            </form>

            {firebaseReady && (
              <button type="button" className="google-button" onClick={loginWithGoogle} disabled={submitting} style={{ width: '100%', marginTop: '1rem' }}>
                {submitting ? 'Ingresando...' : 'Continuar con Google'}
              </button>
            )}
            <p className="client-login-note">
              ¿Todavía no tenés acceso? <a href="mailto:info@mandalestart.com?subject=Acceso%20al%20%C3%A1rea%20de%20clientes">Contactanos</a>.
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
          <span>Con fecha de vencimiento</span>
        </div>
        <div className="stat-card">
          <strong>Cuenta</strong>
          <span>Servicios registrados</span>
        </div>
      </section>

      <section className="services-client-list">
        {clientData.services?.length ? (
          clientData.services.map((service) => (
            <article key={`${clientData.uid}-${service.type}`} className="client-service-card">
              <div className="service-head">
                <div>
                  <span className="service-badge">{service.title}</span>
                  <h2>{service.name}</h2>
                </div>
                <span className="service-status">{service.status}</span>
              </div>

              <div className="service-grid">
                <div>
                  <label>Costo</label>
                  <strong>{service.cost}</strong>
                </div>
                <div>
                  <label>Vencimiento</label>
                  <strong>{service.expiry}</strong>
                </div>
              </div>

              <div className="service-details">
                {service.details?.map((detail) => (
                  <div key={`${service.type}-${detail.label}`} className="detail-row">
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
  };

  return messages[error?.code] || error?.message || 'No se pudo iniciar sesión.';
}

export default ClientArea;
