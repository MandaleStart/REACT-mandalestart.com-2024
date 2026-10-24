import { Link, useParams } from 'react-router-dom';
import serviceCatalog from '../../data/serviceCatalog';
import ErrorPage from '../../components/Errors/ErrorPage';
import ShareLinks from '../../components/ShareLinks/ShareLinks';
import './services.css';

const ServiceDetail = () => {
  const { slug } = useParams();
  const service = serviceCatalog.find((item) => item.slug === slug);

  if (!service) return <ErrorPage />;

  const relatedServices = serviceCatalog.filter((item) => item.slug !== service.slug).slice(0, 3);

  return (
    <main className="service-detail-page">
      <Link to="/services" className="back-link">← Volver a servicios</Link>

      <section className={`service-detail-hero ${service.accent}`}>
        <div className="service-detail-header">
          <span className="service-mini-icon large">{service.icon}</span>
          <span className="service-chip">{service.category}</span>
        </div>

        <h1>{service.title}</h1>
        <p>{service.summary}</p>
        <p className="service-detail-description">{service.description}</p>

        <div className="service-detail-points">
          {service.points.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
      </section>

      <section className="service-detail-grid">
        <div className="service-panel">
          <h2>Qué incluye</h2>
          <ul>
            {service.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="service-panel highlight">
          <h2>Resultado esperado</h2>
          <p>{service.outcome}</p>
          <div className="service-price-row">
            <strong>{service.price}</strong>
            <Link to="/contact" className="primary-button large">Consultar y pedir presupuesto</Link>
          </div>
        </div>
      </section>

      <section className="service-detail-guidance">
        <h2>Qué conviene definir</h2>
        {service.details.map((detail) => (
          <p key={detail}>{detail}</p>
        ))}
        <p>
          Para pedir una propuesta, contame qué resultado buscás y qué tenés actualmente. Si hay configuraciones o
          cuentas existentes, podemos revisar qué información hace falta antes de empezar. <strong>El alcance, los
          tiempos y el presupuesto se confirman con vos antes de realizar el trabajo.</strong>
        </p>
      </section>

      <section className="related-services">
        <div className="section-heading left-align">
          <span className="eyebrow small">También puede interesarte</span>
          <h2>Completá tu proyecto</h2>
        </div>

        <div className="services-list compact">
          {relatedServices.map(({ slug: relatedSlug, icon, title, description, accent }) => (
            <article key={relatedSlug} className={`service-showcase ${accent}`}>
              <div className="service-showcase-top">
                <span className="service-mini-icon">{icon}</span>
                <span className="service-chip">Servicio</span>
              </div>
              <h2>{title}</h2>
              <p>{description}</p>
              <Link to={`/services/${relatedSlug}`} className="service-link">Ver detalle</Link>
            </article>
          ))}
        </div>
      </section>
      <ShareLinks />
    </main>
  );
};

export default ServiceDetail;
