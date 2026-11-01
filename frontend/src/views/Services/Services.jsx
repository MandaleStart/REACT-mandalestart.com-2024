import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ShareLinks from '../../components/ShareLinks/ShareLinks';
import SiteIcon from '../../components/SiteIcon/SiteIcon';
import useServiceCatalog from '../../data/useServiceCatalog';
import { useContact } from '../../config/useContact';
import { mailtoUrl } from '../../config/site';
import { getPublicBillingPlans } from '../../services/billingApi.js';
import { formatBillingPeriod, formatMoneyCents } from '../../services/billingFormat.js';
import './services.css';

const Services = () => {
  const { services: serviceCatalog, error: catalogError } = useServiceCatalog();
  const contact = useContact();
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState('');

  useEffect(() => {
    let active = true;
    getPublicBillingPlans()
      .then((result) => { if (active) setPlans(result); })
      .catch((error) => {
        if (active) setPlansError(error.message || 'No pude cargar los planes.');
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="services-page">
      <section className="services-hero">
        <span className="eyebrow">Servicios</span>
        <h1>Servicios web y soporte técnico.</h1>
        <p>
          Atiendo consultas de todo Uruguay. Revisá qué incluye cada servicio y escribime para
          recibir un presupuesto según tu proyecto.
        </p>

        <div className="services-summary">
          <span>Desarrollo web</span>
          <span>Hosting y dominios</span>
          <span>Redes y servidores</span>
          <span>SEO</span>
          <span>Diseño e impresión 3D</span>
        </div>
      </section>

      {plans.length > 0 && (
        <section className="public-plans-section">
          <div className="section-heading left-align">
            <span className="eyebrow small">Precios transparentes</span>
            <h2>Planes con precio definido</h2>
            <p>Elegí una opción y escribime para confirmar disponibilidad y próximos pasos.</p>
          </div>
          <div className="public-plans-grid">
            {plans.map((plan) => (
              <article className="public-plan-card" key={plan.id}>
                <span className="service-chip">{plan.service_slug}</span>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <strong>{formatMoneyCents(plan.amount_cents, plan.currency)}</strong>
                <span>{formatBillingPeriod(plan.billing_period)}</span>
                {plan.features.length > 0 && (
                  <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                )}
                <a className="primary-button" href={mailtoUrl(contact, `Quiero contratar el plan ${plan.name}`)}>
                  Contratar
                </a>
              </article>
            ))}
          </div>
        </section>
      )}
      {plansError && <p className="services-catalog-notice" role="status">{plansError}</p>}

      <section className="services-list">
        {serviceCatalog.map(
          ({ slug, icon, title, category, description, price, priceFrom, accent }) => (
            <article key={slug} className={`service-showcase ${accent}`}>
              <div className="service-showcase-top">
                <span className="service-mini-icon">
                  <SiteIcon name={icon} />
                </span>
                <span className="service-chip">{category}</span>
              </div>

              <h2>{title}</h2>
              <p>{description}</p>

              <div className="service-meta">
                <strong>{priceFrom ? `Desde ${priceFrom}` : price}</strong>
                <Link to={`/services/${slug}`} className="service-link">
                  Ver detalle
                </Link>
              </div>
            </article>
          ),
        )}
      </section>
      {catalogError && (
        <p className="services-catalog-notice" role="status">
          {catalogError} Mostramos el catálogo guardado.
        </p>
      )}
      <section className="services-guide">
        <div className="section-heading left-align">
          <span className="eyebrow small">Cómo elegir</span>
          <h2>Empezá por el objetivo y sumá solo lo que tu proyecto necesita.</h2>
        </div>
        <div className="services-guide-copy">
          <p>
            Elegí un servicio para revisar qué incluye. Si no sabés cuál se ajusta a tu necesidad,
            contame qué querés resolver y qué servicios o equipos ya usás.
          </p>
          <p>
            Si ya trabajás con un proveedor, también podemos tomarlo en cuenta al evaluar opciones.
          </p>
        </div>
      </section>
      <ShareLinks />
    </main>
  );
};

export default Services;
