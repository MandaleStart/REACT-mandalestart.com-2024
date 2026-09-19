import { Link } from 'react-router-dom';
import './home.css';

const services = [
  {
    icon: '💻',
    title: 'Desarrollo web',
    description: 'Webs, landing pages y storefronts pensados para vender, explicar bien y convertir más.',
    accent: 'cyan',
  },
  {
    icon: '🌐',
    title: 'Hosting web',
    description: 'Alojamiento estable y mantenido para que tu sitio esté online, rápido y sin dolores de cabeza.',
    accent: 'blue',
  },
  {
    icon: '📧',
    title: 'Email corporativo',
    description: 'Correos con tu dominio para reforzar la imagen profesional del negocio y ordenar la comunicación.',
    accent: 'orange',
  },
  {
    icon: '🧭',
    title: 'Dominios',
    description: 'Registro, renovación y gestión de nombres web para dejar la marca bien posicionada online.',
    accent: 'purple',
  },
  {
    icon: '📈',
    title: 'SEO',
    description: 'Optimización técnica y de contenido para que te encuentren en buscadores y ganes más oportunidades.',
    accent: 'green',
  },
  {
    icon: '🔐',
    title: 'DDNS + acceso remoto',
    description: 'Configuración segura de redes, servicios y acceso remoto para operar sin fricción.',
    accent: 'red',
  },
];

const infrastructure = [
  { title: 'Servidores', text: 'Instalación, gestión y mantenimiento para que tus servicios sigan en funcionamiento.' },
  { title: 'Routers / redes', text: 'Configuración sólida de redes, VLAN y conectividad para operar con menos fricción.' },
  { title: 'Domótica', text: 'Automatización y control de ambientes con soluciones prácticas y bien integradas.' },
  { title: 'Monitoreo', text: 'Supervisión constante para detectar fallas antes de que te afecten al negocio.' },
];

const steps = [
  { number: '01', title: 'Diagnóstico', text: 'Revisamos tu objetivo, tu público y la parte técnica para definir qué realmente hace falta.' },
  { number: '02', title: 'Diseño', text: 'Armamos una propuesta clara, útil y alineada con tu marca y tus metas de negocio.' },
  { number: '03', title: 'Desarrollo', text: 'Construimos la solución con foco en rendimiento, estabilidad y experiencia de uso.' },
  { number: '04', title: 'Soporte', text: 'Te acompañamos después de la entrega con ajustes, mantenimiento y evolución continua.' },
];

const stats = [
  { value: '360°', label: 'Estrategia digital y técnica' },
  { value: 'Web', label: 'Especialización principal' },
  { value: '24/7', label: 'Monitoreo y soporte' },
];

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Web • Hosting • SEO • Infraestructura</span>
          <h1>
            Soluciones digitales para <span className="gradient-text">que tu negocio se vea claro, esté online y venda mejor.</span>
          </h1>
          <p>
            MandaleStart ayuda a empresas y proyectos a dejar su presencia online ordenada, rápida y profesional:
            desde la web y el dominio hasta la infraestructura, el SEO y el soporte técnico que la sostiene.
          </p>

          <div className="hero-actions">
            <Link to="/contact" className="primary-button">Solicitar presupuesto</Link>
            <Link to="/services" className="secondary-button">Ver servicios</Link>
          </div>

          <ul className="hero-proof">
            <li>Presencia online profesional</li>
            <li>Hosting y dominio</li>
            <li>Infraestructura y soporte</li>
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
                <span className="label">Operación</span>
                <strong>+28%</strong>
                <small>mejora de visibilidad y uptime</small>
              </div>

              <div className="mini-grid">
                <div className="mini-card">
                  <span className="label">Web</span>
                  <strong>Online</strong>
                </div>
                <div className="mini-card accent">
                  <span className="label">SEO</span>
                  <strong>Visible</strong>
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
          <h2>Todo lo necesario para estar online y operar mejor.</h2>
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
          <h2>Monitoreo y soporte para servidores, redes y automatización.</h2>
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
          <span className="eyebrow small">¿Necesitás tu presencia online clara y funcionando?</span>
          <h2>Te ayudamos a armar una solución web, técnica y operativa que realmente sirva.</h2>
        </div>
        <Link to="/contact" className="primary-button large">Hablemos de tu proyecto</Link>
      </section>
    </div>
  );
};

export default Home;
