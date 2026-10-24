import './about.css';

const highlights = [
  {
    title: 'Desarrollo a medida',
    text: 'Diseño y desarrollo sitios web y tiendas online según lo que necesita cada proyecto.',
  },
  {
    title: 'Enfoque técnico',
    text: 'También me ocupo de la publicación, el hosting, los dominios y la configuración de redes.',
  },
  {
    title: 'Soporte real',
    text: 'Después de publicar, puedo ayudarte con cambios, mantenimiento y problemas técnicos.',
  },
];

const values = [
  'Sitios web y tiendas online',
  'Landing pages',
  'Hosting, dominios y correo',
  'DDNS y acceso remoto',
  'Servidores y redes',
  'Mantenimiento y soporte técnico',
];

const AboutMe = () => {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-copy">
          <span className="eyebrow">Sobre mí</span>
          <h1>Soy Nicolás. Desarrollo webs y también resuelvo lo que hay detrás.</h1>
          <p>
            Trabajo en sitios web, hosting y redes. A veces el proyecto empieza con una web nueva; otras, con algo
            que no funciona o que hace falta ordenar.
          </p>
          <p>
            Antes de empezar, hablamos de lo que necesitás y definimos el alcance. Me ocupo del desarrollo o la
            configuración y, si hace falta, seguimos con soporte.
          </p>

          <div className="about-metrics">
            <div>
              <strong>Web</strong>
              <span>Sitios y tiendas online</span>
            </div>
            <div>
              <strong>Infraestructura</strong>
              <span>Hosting, servidores y redes</span>
            </div>
            <div>
              <strong>Soporte</strong>
              <span>Puesta en marcha y mantenimiento</span>
            </div>
          </div>
        </div>

        <div className="about-card-stack">
          <div className="mini-profile-card">
            <span className="badge">En qué trabajo</span>
            <h3>Web y soporte técnico</h3>
            <ul>
              <li>Desarrollo web</li>
              <li>Hosting y publicación</li>
              <li>Redes y servidores</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-grid">
        {highlights.map(({ title, text }, index) => (
          <article key={title} className="value-card">
            <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="about-panel">
        <div className="panel-copy">
          <span className="eyebrow small">¿Qué hago?</span>
          <h2>En qué puedo ayudarte</h2>
        </div>

        <div className="panel-value-wrap">
          <ul className="check-list">
            {values.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="cta-box">
            <span>¿Tenés algo en mente?</span>
            <strong>Contame qué querés hacer o qué no está funcionando y vemos los próximos pasos.</strong>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutMe;
