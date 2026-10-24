import { Link } from 'react-router-dom';
import './projects.css';

const projects = [
  {
    category: 'Web',
    title: 'Sitio o landing page',
    description: 'Una página para explicar qué ofrecés, responder dudas frecuentes y facilitar el contacto.',
    accent: 'cyan',
    tag: 'Desarrollo web',
    metrics: ['Contenido y estructura', 'Diseño adaptable', 'Vías de contacto'],
    scope: 'Sitios y landing pages',
  },
  {
    category: 'DDNS',
    title: 'Acceso remoto',
    description: 'Configuración de DNS dinámico para acceder a equipos y servicios fuera de la red local.',
    accent: 'orange',
    tag: 'Infraestructura',
    metrics: ['DNS dinámico', 'Configuración de red', 'Acceso remoto'],
    scope: 'DDNS e infraestructura',
  },
  {
    category: 'Red',
    title: 'Redes y servidores',
    description: 'Revisión de equipos y servicios, con alertas para identificar cuándo algo deja de responder.',
    accent: 'green',
    tag: 'Monitoreo',
    metrics: ['Revisión técnica', 'Alertas', 'Diagnóstico'],
    scope: 'Monitoreo y soporte',
  },
  {
    category: '3D',
    title: 'Piezas y prototipos 3D',
    description: 'Modelado y fabricación de piezas para probar una idea, revisar medidas o resolver una necesidad concreta.',
    accent: 'purple',
    tag: 'Fabricación',
    metrics: ['Modelado 3D', 'Impresión', 'Ajustes de diseño'],
    scope: 'Prototipado',
  },
];

const Projects = () => {
  return (
    <main className="projects-page">
      <section className="projects-header">
        <span className="eyebrow">Proyectos y soluciones</span>
        <h1>        Ejemplos de soluciones que puedo desarrollar para tu proyecto.</h1>
        <p>
          Estos son ejemplos de servicios, no casos de clientes. Trabajo con personas y negocios de todo Uruguay; cada propuesta empieza por entender qué necesitás y acordar qué voy a entregar.
        </p>
      </section>

      <section className="projects-stats">
        <div className="projects-stat">
          <strong>Web</strong>
          <span>Sitios y landing pages</span>
        </div>
        <div className="projects-stat">
          <strong>Redes</strong>
          <span>DDNS, redes y servidores</span>
        </div>
        <div className="projects-stat">
          <strong>3D</strong>
          <span>Modelado y prototipos</span>
        </div>
      </section>

      <section className="projects-grid">
        {projects.map(({ category, title, description, accent, tag, metrics, scope }) => (
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
              <span className="project-result">{scope}</span>
              <Link to="/contact" className="project-button">Consultar</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Projects;