import ShareLinks from '../../components/ShareLinks/ShareLinks';
import CaseStudy from '../../components/CaseStudy/CaseStudy';
import './projects.css';

const Projects = () => (
  <main className="projects-page">
    <section className="projects-header">
      <span className="eyebrow">Proyectos</span>
      <h1>Un proyecto propio, sin métricas inventadas.</h1>
      <p>
        Por ahora comparto el sitio de MandaleStart como proyecto propio. No hay casos de clientes
        publicados; agregaré otros cuando pueda presentar su trabajo con autorización.
      </p>
    </section>

    <CaseStudy />
    <ShareLinks />
  </main>
);

export default Projects;
