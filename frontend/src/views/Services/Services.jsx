import { Link } from 'react-router-dom';
import serviceCatalog from '../../data/serviceCatalog';
import './services.css';

const Services = () => {
  return (
    <main className="services-page">
      <section className="services-hero">
        <span className="eyebrow">Servicios</span>
        <h1>Servicios web y soporte técnico.</h1>
        <p>
          Atiendo consultas de todo Uruguay. Revisá qué incluye cada servicio y escribime para recibir un presupuesto según tu proyecto.
        </p>

        <div className="services-summary">
          <span>Desarrollo web</span>
          <span>Hosting y dominios</span>
          <span>Redes y servidores</span>
          <span>SEO</span>
          <span>Diseño e impresión 3D</span>
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
      <p className="services-pricing-note">
        El alcance, los plazos y el presupuesto se confirman con vos antes de comenzar.
      </p>
    </main>
  );
};

export default Services;
