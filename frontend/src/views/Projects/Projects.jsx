import ShareLinks from '../../components/ShareLinks/ShareLinks';
import CaseStudy from '../../components/CaseStudy/CaseStudy';
import './projects.css';

const Projects = () => (
  <main className="projects-page">
    <section className="projects-header">
      <span className="eyebrow">Proyectos</span>
      <h1>Mi proyecto más reciente: este sitio.</h1>
      <p>
        Todavía no publico trabajos de clientes porque prefiero hacerlo solo con su autorización.
        Mientras tanto, podés ver cómo está hecho este sitio.
      </p>
    </section>

    <CaseStudy />
    <ShareLinks />
  </main>
);

export default Projects;
