import { Link } from 'react-router-dom';
import './home.css';

const services = [
  {
    icon: '💻',
    title: 'Desarrollo web',
    description: 'Diseño sitios, landing pages y tiendas online para que tus clientes entiendan qué ofrecés y sepan cómo contactarte.',
    accent: 'cyan',
  },
  {
    icon: '🌐',
    title: 'Hosting web',
    description: 'Alojo y mantengo tu sitio para que esté disponible y al día.',
    accent: 'blue',
  },
  {
    icon: '📧',
    title: 'Correo corporativo',
    description: 'Configuro cuentas de correo con tu dominio para el trabajo diario.',
    accent: 'orange',
  },
  {
    icon: '🧭',
    title: 'Dominios',
    description: 'Gestiono el registro y la renovación de dominios, y te asesoro para elegir el nombre de tu web.',
    accent: 'purple',
  },
  {
    icon: '📈',
    title: 'SEO',
    description: 'Reviso la estructura y el contenido de tu sitio para facilitar que los buscadores lo entiendan.',
    accent: 'green',
  },
  {
    icon: '🔐',
    title: 'DDNS + acceso remoto',
    description: 'Configuro DDNS y acceso remoto para que te conectes con tus equipos y servicios desde fuera.',
    accent: 'red',
  },
  {
    icon: '🧩',
    title: 'Diseño e impresión 3D',
    description: 'Diseño y fabrico piezas y prototipos 3D según las medidas y el uso que necesitás.',
    accent: 'purple',
  },
];

const infrastructure = [
  { title: 'Servidores', text: 'Instalo, configuro y mantengo servidores según las necesidades de tu proyecto.' },
  { title: 'Routers y redes', text: 'Configuro routers y VLAN para conectar tus equipos y servicios.' },
  { title: 'Domótica', text: 'Automatizo dispositivos y rutinas en tu casa o espacio de trabajo.' },
  { title: 'Monitoreo', text: 'Configuro alertas para detectar cuándo un servidor o servicio deja de responder.' },
];

const steps = [
  { number: '01', title: 'Me contás', text: 'Vemos qué necesitás y qué tenés hoy. Con eso, definimos por dónde conviene empezar.' },
  { number: '02', title: 'Acordamos el trabajo', text: 'Te detallo el alcance, los tiempos y el presupuesto antes de empezar.' },
  { number: '03', title: 'Lo pongo en marcha', text: 'Desarrollo o configuro lo acordado y te muestro cómo queda.' },
  { number: '04', title: 'Seguimos en contacto', text: 'Después de la entrega, podés consultarme por ajustes, mantenimiento o soporte.' },
];

const stats = [
  { value: 'Web', label: 'Sitios y tiendas online' },
  { value: 'Hosting', label: 'Dominios y correo' },
  { value: 'Redes', label: 'Servidores y soporte' },
];

const Home = () => {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <h1>
            Diseño tu web <span className="gradient-text">y configuro lo necesario para ponerla en marcha.</span>
          </h1>
          <p>
            Trabajo con personas y negocios de todo Uruguay: diseño sitios y tiendas online y también puedo ayudarte con
            dominios, hosting, correo, SEO y redes. Si no sabés por dónde empezar, contame qué necesitás y lo vemos.
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
          <span className="eyebrow small">Lo que hago</span>
          <h2>Servicios web y soluciones técnicas para personas y negocios de Uruguay.</h2>
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
          <h2>También puedo ayudarte con servidores, redes y domótica.</h2>
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
          <span className="eyebrow small">Proceso</span>
          <h2>Cómo trabajo</h2>
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
          <h2>Contame qué querés hacer o qué está fallando. Definimos juntos los próximos pasos.</h2>
        </div>
        <Link to="/contact" className="primary-button large">Hablemos de tu proyecto</Link>
      </section>
    </main>
  );
};

export default Home;
