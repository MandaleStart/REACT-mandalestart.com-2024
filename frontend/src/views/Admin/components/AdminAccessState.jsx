import { Link } from 'react-router-dom';
import { expiredSessionMessage } from '../adminModel';

/* eslint-disable react/prop-types */
export default function AdminAccessState({ access, authReady, error, sessionExpired }) {
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

  return null;
}
