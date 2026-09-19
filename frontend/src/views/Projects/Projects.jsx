import './projects.css';

const projects = [
  {
    category: 'Web',
    title: 'Landing profesional',
    description: 'Sitio institucional con enfoque comercial para captar clientes y vender servicios de forma clara y convincente.',
    accent: 'cyan',
    tag: 'Conversión',
    metrics: ['UX premium', 'SEO técnico', 'Lead capture'],
    result: '+38% de leads',
  },
  {
    category: 'DDNS',
    title: 'Publicación online',
    description: 'Configuración de DNS dinámico y publicación de servicios para que infraestructura y proyectos estén siempre accesibles.',
    accent: 'orange',
    tag: 'Infraestructura',
    metrics: ['DNS dinámico', 'Acceso remoto', 'Disponibilidad'],
    result: '99.9% estable',
  },
  {
    category: 'Red',
    title: 'Monitoreo y diagnóstico',
    description: 'Supervisión de disponibilidad, alertas y análisis para mantener la red estable y detectar problemas antes de que escalen.',
    accent: 'green',
    tag: 'Monitoreo',
    metrics: ['Alertas', 'Diagnóstico', 'Estabilidad'],
    result: 'Menos caídas',
  },
  {
    category: '3D',
    title: 'Prototipos funcionales',
    description: 'Materialización de ideas, piezas prácticas y proyectos creativos para uso real o prueba de concepto.',
    accent: 'purple',
    tag: 'Fabricación',
    metrics: ['Prototipos', 'Iteración rápida', 'Uso real'],
    result: 'Idea validada',
  },
];

const Projects = () => {
  return (
    <main className="projects-page">
      <section className="projects-header">
        <span className="eyebrow">Proyectos y soluciones</span>
        <h1>Diseño, infraestructura y soporte técnico en un mismo ecosistema.</h1>
        <p>
          Cada proyecto se diseña para resolver una necesidad real: mejorar presencia online,
          simplificar acceso a servicios o hacer que la operación tecnológica sea más estable.
        </p>
      </section>

      <section className="projects-stats">
        <div className="projects-stat">
          <strong>+100</strong>
          <span>ideas convertidas</span>
        </div>
        <div className="projects-stat">
          <strong>360°</strong>
          <span>visión digital y técnica</span>
        </div>
        <div className="projects-stat">
          <strong>24/7</strong>
          <span>apoyo operativo</span>
        </div>
      </section>

      <section className="projects-grid">
        {projects.map(({ category, title, description, accent, tag, metrics, result }) => (
          <article key={title} className={`project-card ${accent}`}>
            <div className="project-topline">
              <span>{category}</span>
              <span className="project-tag">{tag}</span>
            </div>
            <h3>{title}</h3>
            <p>{description}</p>

            <div className="project-metrics">
              {metrics.map((metric) => (
                <span key={metric}>{metric}</span>
              ))}
            </div>

            <div className="project-footer">
              <span className="project-result">{result}</span>
              <button type="button" className="project-button">Más información</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Projects;