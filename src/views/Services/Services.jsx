import { Link } from 'react-router-dom';
import serviceCatalog from '../../data/serviceCatalog';
import './services.css';

const Services = () => {
  return (
    <main className="services-page">
      <section className="services-hero">
        <span className="eyebrow">Servicios</span>
        <h1>Soluciones digitales y técnicas para operar con más claridad.</h1>
        <p>
          Desarrollo web, hosting, SEO, infraestructura y soporte pensado para que tu negocio esté online,
          sea más confiable y te ayude a vender sin complicaciones técnicas.
        </p>

        <div className="services-summary">
          <span>Web premium</span>
          <span>DNS & acceso online</span>
          <span>Monitoreo</span>
          <span>3D</span>
        </div>
      </section>

      <section className="services-list">
        {serviceCatalog.map(({ slug, icon, title, category, description, price, accent }) => (
          <article key={slug} className={`service-showcase ${accent}`}>
            <div className="service-showcase-top">
              <span className="service-mini-icon">{icon}</span>
              <span className="service-chip">{category}</span>
            </div>

            <h2>{title}</h2>
            <p>{description}</p>

            <div className="service-meta">
              <strong>{price}</strong>
              <Link to={`/services/${slug}`} className="service-link">Ver detalle</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Services;
