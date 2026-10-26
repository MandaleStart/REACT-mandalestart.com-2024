/* eslint-disable react/prop-types */
export default function BackendStatusCard({
  backendStatus,
  isDevelopment,
  supportEmail,
  supportWhatsApp,
  onRetry,
}) {
  const developmentDetails = {
    unavailable: {
      title: 'No se puede conectar con el backend',
      message: 'No recibimos respuesta de la API. En desarrollo local, iniciá el backend en el puerto 4000 y comprobá que Vite use su proxy /api.',
    },
    misconfigured: {
      title: 'Falta configurar el acceso',
      message: 'El backend está listo, pero falta configurar la autenticación de Firebase en el frontend.',
    },
    'firebase-unavailable': {
      title: 'Falta configurar Firebase Admin',
      message: 'La API responde, pero Firebase Admin no está inicializado en el backend. Configurá FIREBASE_PROJECT_ID y una credencial de servicio válida en el entorno local; no la guardes en el frontend.',
    },
    'database-unavailable': {
      title: 'Falta conectar la base de datos',
      message: 'Firebase autentica tu acceso, pero PostgreSQL todavía no está conectado o falta ejecutar la migración de la base de datos.',
    },
  };

  const details = developmentDetails[backendStatus] || {
    title: 'Acceso en preparación',
    message: 'El backend respondió, pero todavía no se puede habilitar el acceso seguro.',
  };

  return (
    <main className="client-area-page">
      <section className="client-state-card" role="status">
        <span className="eyebrow">Área de clientes</span>
        <h1>{isDevelopment ? details.title : 'El área de clientes no está disponible en este momento'}</h1>
        <p>{isDevelopment ? details.message : 'Escribime y te ayudo por otro canal.'}</p>
        <p className="client-state-note">
          Tus servicios y datos no se consultan ni se guardan en este navegador. Escribinos y te ayudamos por un canal alternativo.
        </p>
        <div className="client-state-actions">
          <a className="primary-button" href={supportEmail}>Contactar por email</a>
          {supportWhatsApp && (
            <a className="secondary-button" href={supportWhatsApp} target="_blank" rel="noreferrer">
              Contactar por WhatsApp
            </a>
          )}
          <button type="button" className="client-retry-button" onClick={onRetry}>
            Volver a comprobar
          </button>
        </div>
      </section>
    </main>
  );
}
