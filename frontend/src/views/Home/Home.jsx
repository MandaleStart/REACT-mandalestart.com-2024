import { Link } from 'react-router-dom';
import './home.css';

const services = [
  {
    icon: '💻',
    title: 'Desarrollo web',
    description: 'Sitios, landing pages y tiendas online para que tus clientes entiendan qué ofrecés y sepan cómo contactarte.',
    accent: 'cyan',
  },
  {
    icon: '🌐',
    title: 'Hosting web',
    description: 'Alojamiento y mantenimiento para que tu sitio esté disponible y al día.',
    accent: 'blue',
  },
  {
    icon: '📧',
    title: 'Email corporativo',
    description: 'Cuentas de correo con tu dominio, configuradas para el trabajo diario.',
    accent: 'orange',
  },
  {
    icon: '🧭',
    title: 'Dominios',
    description: 'Registro y renovación de dominios. Te ayudamos a elegir y mantener el nombre de tu web.',
    accent: 'purple',
  },
  {
    icon: '📈',
    title: 'SEO',
    description: 'Revisamos la estructura y el contenido de tu sitio para facilitar que aparezca en buscadores.',
    accent: 'green',
  },
  {
    icon: '🔐',
    title: 'DDNS + acceso remoto',
    description: 'Configuración de DDNS y acceso remoto para conectarte con tus equipos y servicios desde fuera.',
    accent: 'red',
  },
];

const infrastructure = [
  { title: 'Servidores', text: 'Instalación, configuración y mantenimiento de servidores.' },
  { title: 'Routers / redes', text: 'Configuración de routers, redes y VLAN para conectar tus equipos y servicios.' },
  { title: 'Domótica', text: 'Automatización y control de ambientes, adaptados a lo que necesitás.' },
  { title: 'Monitoreo', text: 'Configuración de alertas para detectar problemas en servidores y servicios.' },
];

const steps = [
  { number: '01', title: 'Nos contás', text: 'Vemos qué necesitás y qué tenés hoy. Con eso, definimos por dónde conviene empezar.' },
  { number: '02', title: 'Lo acordamos', text: 'Te detallamos el alcance, los tiempos y el presupuesto antes de empezar.' },
  { number: '03', title: 'Lo ponemos en marcha', text: 'Desarrollamos o configuramos lo acordado y te mostramos cómo queda.' },
  { number: '04', title: 'Seguimos en contacto', text: 'Después de la entrega, podés consultarnos por ajustes, mantenimiento o soporte.' },
];

const stats = [
  { value: 'Web', label: 'Sitios y tiendas online' },
  { value: 'Hosting', label: 'Dominios y correo' },
  { value: 'Redes', label: 'Servidores y soporte' },
];

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Web • Hosting • SEO • Infraestructura</span>
          <h1>
            Ponemos en marcha tu web <span className="gradient-text">y nos ocupamos de la parte técnica.</span>
          </h1>
          <p>
            Diseñamos sitios y tiendas online, y también resolvemos lo que hay detrás: dominio, hosting, correo, SEO y redes.
            Si no sabés por dónde empezar, contanos qué necesitás y lo vemos.
          </p>

          <div className="hero-actions">
            <Link to="/contact" className="primary-button">Pedir presupuesto</Link>
            <Link to="/services" className="secondary-button">Ver servicios</Link>
          </div>

          <ul className="hero-proof">
            <li>Webs y tiendas online</li>
            <li>Dominios, hosting y correo</li>
            <li>Redes y soporte técnico</li>
          </ul>
        </div>

        <div className="hero-visual" aria-label="Vista previa de servicios">
          <div className="dashboard-panel">
            <div className="panel-header">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>

            <div className="panel-body">
              <div className="mini-card large">
                <span className="label">Servicios</span>
                <strong>Web + hosting</strong>
                <small>Dominio, correo y soporte técnico</small>
              </div>

              <div className="mini-grid">
                <div className="mini-card">
                  <span className="label">Redes</span>
                  <strong>Configuración</strong>
                </div>
                <div className="mini-card accent">
                  <span className="label">SEO</span>
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

      <section className="stats-strip">
        {stats.map((item) => (
          <div key={item.label} className="stat-item">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="services-section">
        <div className="section-heading">
          <span className="eyebrow small">Lo que ofrecemos</span>
          <h2>Servicios para tu web y la tecnología que usás todos los días.</h2>
        </div>

        <div className="services-grid">
          {services.map(({ icon, title, description, accent }) => (
            <article key={title} className={`service-card ${accent}`}>
              <div className="service-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="infrastructure-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">Infraestructura</span>
          <h2>También trabajamos con servidores, redes y automatización.</h2>
        </div>

        <div className="infrastructure-grid">
          {infrastructure.map(({ title, text }) => (
            <div key={title} className="infra-card">
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">Proceso</span>
          <h2>Cómo trabajamos</h2>
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

      <section className="cta-band">
        <div>
          <span className="eyebrow small">¿Qué necesitás resolver?</span>
          <h2>Contanos qué querés hacer o qué está fallando. Vemos juntos los próximos pasos.</h2>
        </div>
        <Link to="/contact" className="primary-button large">Hablemos de tu proyecto</Link>
      </section>
    </div>
  );
};

export default Home;
