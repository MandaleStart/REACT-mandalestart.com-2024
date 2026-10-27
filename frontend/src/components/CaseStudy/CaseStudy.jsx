import { Link } from 'react-router-dom';
import cases from '../../data/cases';

const CaseStudy = () => (
  <section className="projects-grid" aria-label="Casos de estudio">
    {cases.map((study) => (
      <article key={study.title} className="project-card cyan case-study">
        <div className="project-topline">
          <span>{study.type}</span>
        </div>
        {study.image && (
          <img
            className="case-study-image"
            src={study.image.src}
            alt={study.image.alt}
            width={study.image.width}
            height={study.image.height}
            loading="lazy"
            decoding="async"
          />
        )}
        <h2>{study.title}</h2>
        <dl className="case-study-details">
          <div>
            <dt>Objetivo</dt>
            <dd>{study.objective}</dd>
          </div>
          <div>
            <dt>Solución</dt>
            <dd>{study.solution}</dd>
          </div>
          <div>
            <dt>Resultado</dt>
            <dd>{study.result}</dd>
          </div>
        </dl>
        <ul className="project-metrics" aria-label="Tecnologías">
          {study.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="project-footer">
          <Link to={study.href} className="project-button">
            Ver sitio
          </Link>
          <Link to="/contact" className="project-button">
            Consultar
          </Link>
        </div>
      </article>
    ))}
  </section>
);

export default CaseStudy;
