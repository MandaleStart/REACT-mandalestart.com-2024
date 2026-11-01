import { useEffect, useState } from 'react';
import { getClientSubscriptions } from '../../services/billingApi.js';
import { formatBillingPeriod, formatMoneyCents } from '../../services/billingFormat.js';
import { useContact } from '../../config/useContact';
import { mailtoUrl } from '../../config/site';

/* eslint-disable react/prop-types */
export default function ClientSubscriptions({ firebaseUser }) {
  const contact = useContact();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    firebaseUser
      .getIdToken()
      .then(getClientSubscriptions)
      .then((result) => {
        if (active) setSubscriptions(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'No pude cargar tus servicios.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [firebaseUser]);

  return (
    <section className="client-panel">
      <header className="client-panel-heading">
        <div>
          <span className="panel-tag">Servicios</span>
          <h2>Mis servicios</h2>
        </div>
      </header>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {loading && <p role="status">Cargando servicios…</p>}
      {!loading && !error && subscriptions.length === 0 && (
        <p>Todavía no hay servicios asociados a tu cuenta.</p>
      )}
      <div className="services-client-list">
        {subscriptions.map((subscription) => (
          <article className="client-service-card" key={subscription.id}>
            <div className="client-service-top">
              <span className="panel-tag">{subscription.status}</span>
              <span>{formatBillingPeriod(subscription.billing_period)}</span>
            </div>
            <h3>{subscription.label}</h3>
            <p>{subscription.resource_name || subscription.service_type}</p>
            <strong>{formatMoneyCents(subscription.amount_cents, subscription.currency)}</strong>
            <p>Próxima renovación: {subscription.renews_on || 'Sin fecha'}</p>
            <a href={mailtoUrl(contact, `Consulta sobre ${subscription.label}`)}>
              Pedir cambio o baja
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
