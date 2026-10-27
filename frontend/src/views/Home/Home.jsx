import { Link } from 'react-router-dom';
import ShareLinks from '../../components/ShareLinks/ShareLinks';
import SiteIcon from '../../components/SiteIcon/SiteIcon';
import { SITE } from '../../config/site';
import useServiceCatalog from '../../data/useServiceCatalog';
import homeFaq from '../../data/homeFaq';
import './home.css';

const infrastructure = [
  {
    title: 'Servidores',
    text: 'Instalo, configuro y mantengo servidores según las necesidades de tu proyecto.',
  },
  {
    title: 'Routers y redes',
    text: 'Configuro routers y VLAN para conectar tus equipos y servicios.',
  },
  { title: 'Domótica', text: 'Automatizo dispositivos y rutinas en tu casa o espacio de trabajo.' },
  {
    title: 'Monitoreo',
    text: 'Configuro alertas para detectar cuándo un servidor o servicio deja de responder.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Me contás',
    text: 'Vemos qué necesitás y qué tenés hoy. Con eso, definimos por dónde conviene empezar.',
  },
  {
    number: '02',
    title: 'Acordamos el trabajo',
    text: 'Te detallo el alcance, los tiempos y el presupuesto antes de empezar.',
  },
  {
    number: '03',
    title: 'Lo pongo en marcha',
    text: 'Desarrollo o configuro lo acordado y te muestro cómo queda.',
  },
  {
    number: '04',
    title: 'Seguimos en contacto',
    text: 'Después de la entrega, podés consultarme por ajustes, mantenimiento o soporte.',
  },
];

const Home = () => {
  const { services, error: catalogError } = useServiceCatalog();

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <h1>
            {SITE.home.heroTitle}{' '}
            <span className="gradient-text">{SITE.home.heroHighlight}</span>
          </h1>
          <p>{SITE.home.intro}</p>

          <div className="hero-actions">
            <Link to="/contact" className="primary-button">
              {SITE.home.ctaPrimary}
            </Link>
            <Link to="/services" className="secondary-button">
              {SITE.home.ctaSecondary}
            </Link>
          </div>

          <ul className="hero-proof">
            {SITE.home.proof.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="hero-visual" aria-label="Vista previa de servicios">
          <div className="dashboard-panel">
            <div className="panel-header">
              <span className="home-dashboard-dot red" />
              <span className="home-dashboard-dot yellow" />
              <span className="home-dashboard-dot green" />
            </div>

            <div className="panel-body">
              <div className="mini-card large">
                <span className="home-dashboard-label">Servicios</span>
                <strong>Web + hosting</strong>
                <small>Dominio, correo y soporte técnico</small>
              </div>

              <div className="mini-grid">
                <div className="mini-card">
                  <span className="home-dashboard-label">Redes</span>
                  <strong>Configuración</strong>
                </div>
                <div className="mini-card accent">
                  <span className="home-dashboard-label">SEO</span>
                  <strong>Contenido y técnica</strong>
                </div>
              </div>

              <div className="signal-bars" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="services-section">
        <div className="section-heading">
          <span className="eyebrow small">{SITE.home.whatIDo}</span>
          <h2>{SITE.home.servicesHeadline}</h2>
        </div>

        <div className="services-grid">
          {services.map(({ slug, icon, title, description, accent }) => (
            <article key={slug} className={`service-card ${accent}`}>
              <div className="service-icon">
                <SiteIcon name={icon} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        {catalogError && (
          <p className="catalog-notice" role="status">
            {catalogError} Mostramos el catálogo guardado.
          </p>
        )}
      </section>

      <section className="infrastructure-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">{SITE.home.infrastructure}</span>
          <h2>{SITE.home.infrastructureHeadline}</h2>
        </div>

        <div className="infrastructure-grid">
          {infrastructure.map(({ title, text }) => (
            <article key={title} className="infra-card">
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">{SITE.home.process}</span>
          <h2>{SITE.home.processHeadline}</h2>
        </div>

        <div className="steps-grid">
          {steps.map(({ number, title, text }) => (
            <div key={number} className="step-card">
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="information-section questions-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">{SITE.home.faqLabel}</span>
          <h2>{SITE.home.faqHeadline}</h2>
        </div>
        <div className="home-faq">
          {homeFaq.map(({ question, answer }) => (
            <details key={question} className="home-faq-item">
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <span className="eyebrow small">{SITE.home.ctaBandLabel}</span>
          <h2>{SITE.home.ctaBandHeadline}</h2>
        </div>
        <Link to="/contact" className="primary-button large">
          {SITE.home.ctaBandButton}
        </Link>
      </section>

      <ShareLinks />
    </main>
  );
};

export default Home;
