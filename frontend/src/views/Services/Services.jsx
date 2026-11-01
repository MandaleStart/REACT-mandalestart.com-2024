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
  const { services: serviceCatalog } = useServiceCatalog();
  const contact = useContact();
  const [plans, setPlans] = useState([]);
  const planSlugs = new Set(plans.map((plan) => plan.service_slug));

  useEffect(() => {
    let active = true;
    getPublicBillingPlans()
      .then((result) => { if (active) setPlans(result); })
      .catch((error) => {
        console.warn('No se pudieron cargar los planes públicos:', error);
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="services-page">
      <section className="services-hero">
        <span className="eyebrow">Servicios</span>
        <h1>Servicios y planes</h1>
        <p>
          Elegí lo que necesitás. Si tu caso es particular, escribime y te armo una propuesta a
          medida.
        </p>

        <div className="services-summary">
          <span>Webs y tiendas</span>
          <span>Dominio y hosting</span>
          <span>Correo</span>
          <span>SEO</span>
          <span>Redes y servidores</span>
          <span>Impresión 3D</span>
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
                <span className="service-chip">
                  {serviceCatalog.find((service) => service.slug === plan.service_slug)?.title ||
                    plan.service_slug}
                </span>
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
      <section className="services-list">
        {serviceCatalog.map(
          ({ slug, icon, title, category, description, accent }) => (
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
                <strong>
                  {planSlugs.has(slug) ? 'Planes disponibles' : 'Presupuesto a medida'}
                </strong>
                <Link to={`/services/${slug}`} className="service-link">
                  Ver qué incluye
                </Link>
              </div>
            </article>
          ),
        )}
      </section>
      <section className="services-guide">
        <div className="section-heading left-align">
          <span className="eyebrow small">Cómo elegir</span>
          <h2>Empezá por lo que querés lograr.</h2>
        </div>
        <div className="services-guide-copy">
          <p>
            Si recién arrancás, lo más común es web + dominio + correo. Si ya tenés algo
            funcionando, puedo revisarlo y decirte qué conviene cambiar y qué no.
          </p>
          <p>
            ¿Ya tenés un proveedor? No hace falta cambiarlo: lo reviso y trabajo con lo que tengas.
          </p>
        </div>
      </section>
      <ShareLinks />
    </main>
  );
};

export default Services;
