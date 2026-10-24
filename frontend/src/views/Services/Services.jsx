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
          Desarrollo de sitios, hosting, correo, dominios y ayuda con redes y servidores. Consultá cada servicio para ver qué incluye y su precio.
        </p>

        <div className="services-summary">
          <span>Desarrollo web</span>
          <span>Hosting y dominios</span>
          <span>Redes y servidores</span>
          <span>SEO</span>
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
