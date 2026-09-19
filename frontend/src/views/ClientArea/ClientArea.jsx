import { useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, firebaseReady } from '../../firebase';
import { getClientDataByEmail } from '../../data/clientAccounts';
import './client-area.css';

const ClientArea = () => {
  const [user, setUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setClientData(null);
        return;
      }

      const account = getClientDataByEmail(currentUser.email || '');
      setClientData(account);
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

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      setError('Firebase no está configurado. Agrega las variables de entorno del proyecto.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const matchedClient = getClientDataByEmail(result.user?.email || '');

      if (!matchedClient) {
        await signOut(auth);
        setClientData(null);
        setError('Este usuario no tiene acceso al área de clientes.');
        return;
      }

      setClientData(matchedClient);
    } catch (loginError) {
      setError(loginError?.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setClientData(null);
    setError('');
  };

  if (!firebaseReady) {
    return (
      <main className="client-area-page">
        <section className="client-login-shell">
          <div className="login-card warning-card">
            <span className="eyebrow">Configuración pendiente</span>
            <h1>Firebase no está configurado</h1>
            <p>
              Agrega las variables VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN y demás en tu archivo .env
              para activar el login con Google.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!user || !clientData) {
    return (
      <main className="client-area-page">
        <section className="client-login-shell">
          <div className="login-card">
            <span className="eyebrow">Atención al cliente</span>
            <h1>Ingresá con Google para ver tus servicios.</h1>
            <p>
              Cada cliente solo podrá acceder a los servicios asociados a su cuenta. Si compraste dominio, hosting,
              mail o monitoreo, aparecerán aquí con costo, estado y vencimiento.
            </p>

            {error && <div className="error-box">{error}</div>}

            <button type="button" className="google-button" onClick={loginWithGoogle} disabled={loading}>
              {loading ? 'Ingresando...' : 'Continuar con Google'}
            </button>
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
          <h1>Bienvenido, {clientData.name}</h1>
          <p>
            Aquí verás solo los servicios asociados a tu cuenta, con costo, vencimiento y detalles relevantes.
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
          <span>Vencimientos</span>
        </div>
        <div className="stat-card">
          <strong>Estado</strong>
          <span>Todo operativo</span>
        </div>
      </section>

      <section className="services-client-list">
        {clientData.services.map((service) => (
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
              {service.details.map((detail) => (
                <div key={`${service.type}-${detail.label}`} className="detail-row">
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

export default ClientArea;
