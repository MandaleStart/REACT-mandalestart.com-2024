import { Link, useParams } from 'react-router-dom';
import serviceCatalog from '../../data/serviceCatalog';
import './services.css';

const ServiceDetail = () => {
  const { slug } = useParams();
  const service = serviceCatalog.find((item) => item.slug === slug) ?? serviceCatalog[0];

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
            <Link to="/contact" className="primary-button large">Solicitar este servicio</Link>
          </div>
        </div>
      </section>

      <section className="related-services">
        <div className="section-heading left-align">
          <span className="eyebrow small">También puede interesarte</span>
          <h2>Complementa tu proyecto</h2>
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
    </main>
  );
};

export default ServiceDetail;
