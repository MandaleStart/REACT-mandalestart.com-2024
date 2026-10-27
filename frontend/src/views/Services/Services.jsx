import { Link } from 'react-router-dom';
import ShareLinks from '../../components/ShareLinks/ShareLinks';
import SiteIcon from '../../components/SiteIcon/SiteIcon';
import useServiceCatalog from '../../data/useServiceCatalog';
import './services.css';

const Services = () => {
  const { services: serviceCatalog, error: catalogError } = useServiceCatalog();

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
