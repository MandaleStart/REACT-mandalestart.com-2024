import { useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, firebaseReady } from '../../firebase';
import { getClientDataByEmail } from '../../data/clientAccounts';
import {
  getClientByEmailBackend,
  getCurrentUserSession,
  loginWithEmailBackend,
  loginWithGoogleBackend,
  registerWithEmailBackend,
} from '../../services/authApi';
import './client-area.css';

const emptyForm = { name: '', email: 'clienteb@demo.com', password: 'demo1234' };

const ClientArea = () => {
  const [user, setUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState(emptyForm);
  const [token, setToken] = useState(localStorage.getItem('mandalestart-token') || '');

  const loadClientByEmail = async (email) => {
    try {
      const response = await getClientByEmailBackend(email);
      setClientData(response || null);
      return response || null;
    } catch {
      const fallback = getClientDataByEmail(email || '');
      setClientData(fallback || null);
      return fallback || null;
    }
  };

  useEffect(() => {
    if (!token) return;

    const restoreSession = async () => {
      try {
        const session = await getCurrentUserSession(token);
        setUser(session.user);
        await loadClientByEmail(session.user.email);
      } catch {
        localStorage.removeItem('mandalestart-token');
        setToken('');
        setUser(null);
        setClientData(null);
      }
    };

    restoreSession();
  }, [token]);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) return;
      setUser({
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
      });
      loadClientByEmail(currentUser.email || '');
    });

    return () => unsubscribe();
  }, []);

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
    setLoading(true);
    setError('');

    try {
      const response = await loginWithEmailBackend({
        email: form.email,
        password: form.password,
      });

      const userData = response.user;
      setUser(userData);
      setToken(response.token);
      localStorage.setItem('mandalestart-token', response.token);
      await loadClientByEmail(userData.email);
    } catch (loginError) {
      setError(loginError?.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await registerWithEmailBackend({
        email: form.email,
        password: form.password,
        name: form.name || form.email.split('@')[0],
      });

      const userData = response.user;
      setUser(userData);
      setToken(response.token);
      localStorage.setItem('mandalestart-token', response.token);
      await loadClientByEmail(userData.email);
      setAuthMode('login');
    } catch (loginError) {
      setError(loginError?.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      setError('Firebase no está configurado, pero puedes usar login con email y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const response = await loginWithGoogleBackend({
        idToken: result.user?.uid || 'google-demo-token',
        email: result.user?.email || '',
      });

      const userData = response.user;
      setUser(userData);
      setToken(response.token);
      localStorage.setItem('mandalestart-token', response.token);
      await loadClientByEmail(userData.email);
    } catch (loginError) {
      setError(loginError?.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth).catch(() => undefined);
    }
    localStorage.removeItem('mandalestart-token');
    setToken('');
    setUser(null);
    setClientData(null);
    setError('');
  };

  if (!user || !clientData) {
    return (
      <main className="client-area-page">
        <section className="client-login-shell">
          <div className="login-card">
            <span className="eyebrow">Atención al cliente</span>
            <h1>{authMode === 'login' ? 'Ingresá a tu área de clientes' : 'Creá tu cuenta'}</h1>
            <p>
              Entrá con el correo y la contraseña de tu cuenta. Google está disponible para las cuentas configuradas.
            </p>

            {error && <div className="error-box">{error}</div>}

            <div className="auth-toggle" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button type="button" className={authMode === 'login' ? 'secondary-button' : 'google-button'} onClick={() => setAuthMode('login')}>
                Iniciar sesión
              </button>
              <button type="button" className={authMode === 'register' ? 'secondary-button' : 'google-button'} onClick={() => setAuthMode('register')}>
                Registrarme
              </button>
            </div>

            <form onSubmit={authMode === 'login' ? handleEmailLogin : handleRegister}>
              {authMode === 'register' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label htmlFor="name">Nombre</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    style={{ width: '100%', marginTop: '0.35rem', padding: '0.7rem', borderRadius: '0.5rem' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="cliente@demo.com"
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
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', marginTop: '0.35rem', padding: '0.7rem', borderRadius: '0.5rem' }}
                />
              </div>

              <button type="submit" className="secondary-button" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Procesando...' : authMode === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </button>
            </form>

            {firebaseReady && (
              <button type="button" className="google-button" onClick={loginWithGoogle} disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? 'Ingresando...' : 'Continuar con Google'}
              </button>
            )}
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
          <span>Servicios activos</span>
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

export default ClientArea;
