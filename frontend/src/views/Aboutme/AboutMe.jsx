import './about.css';

const highlights = [
  {
    title: 'Desarrollo a medida',
    text: 'Webs y herramientas que responden a una necesidad real: vender mejor, explicar mejor y operar con orden.',
  },
  {
    title: 'Enfoque técnico',
    text: 'Diseño, rendimiento y mantenimiento con criterio para que todo funcione sin complicaciones.',
  },
  {
    title: 'Soporte real',
    text: 'No se trata de entregar y olvidar: te acompaño en puesta en marcha, ajustes y evolución.',
  },
];

const values = [
  'Sitios web corporativos',
  'Landing pages y conversiones',
  'Publicación online y DDNS',
  'Monitoreo y diagnóstico de redes',
  'Automatización y soporte técnico',
  'Atención cercana y solución práctica',
];

const AboutMe = () => {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-copy">
          <span className="eyebrow">Sobre mí</span>
          <h1>Diseño soluciones web y técnicas que sirven en la práctica.</h1>
          <p>
            Soy Nicolás, desarrollador y técnico digital con foco en sitios web, infraestructura y acompañamiento
            para negocios que quieren mejorar su presencia online sin caer en soluciones de relleno o sobrecargadas.
          </p>
          <p>
            Mi enfoque combina diseño, programación, estrategia y soporte para que cada proyecto no solo se vea bien,
            sino que funcione bien, sea claro para el usuario y ayude a vender, comunicar o operar mejor.
          </p>

          <div className="about-metrics">
            <div>
              <strong>+100</strong>
              <span>proyectos/ideas</span>
            </div>
            <div>
              <strong>360°</strong>
              <span>visión digital</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>apoyo técnico</span>
            </div>
          </div>
        </div>

        <div className="about-card-stack">
          <div className="mini-profile-card">
            <span className="badge">Especialización</span>
            <h3>Web + tecnología + operación</h3>
            <ul>
              <li>Frontend moderno</li>
              <li>Servicios online</li>
              <li>Infraestructura y red</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-grid">
        {highlights.map(({ title, text }) => (
          <article key={title} className="value-card">
            <span className="card-index">0{highlights.indexOf({ title, text }) + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="about-panel">
        <div className="panel-copy">
          <span className="eyebrow small">¿Qué hago?</span>
          <h2>Ayudo a que tus ideas se conviertan en herramientas reales.</h2>
        </div>

        <div className="panel-value-wrap">
          <ul className="check-list">
            {values.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="cta-box">
            <span>Estoy listo para ayudarte</span>
            <strong>Si tenés una idea, te la convierto en algo útil y claro.</strong>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutMe;
