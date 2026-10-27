import './about.css';
import { Link } from 'react-router-dom';
import ShareLinks from '../../components/ShareLinks/ShareLinks';

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
          <h1>Soy Nicolás. Desarrollo sitios web y también resuelvo lo que hay detrás.</h1>
          <p>
            Trabajo con personas y negocios de todo Uruguay en sitios web, hosting y redes. A veces
            el proyecto empieza con una web nueva; otras, con algo que no funciona o que hace falta
            ordenar.
          </p>
          <p>
            Soy Nicolás Jorge, desarrollador frontend formado en Jóvenes a Programar de Ceibal.
            Combino desarrollo web con soporte técnico, redes y servidores.
          </p>
        </div>

        <div className="about-card-stack">
          <div className="mini-profile-card">
            <span className="about-badge">En qué trabajo</span>
            <h3>Web y soporte técnico</h3>
            <ul>
              <li>Desarrollo web</li>
              <li>Hosting y publicación</li>
              <li>Redes y servidores</li>
            </ul>
          </div>
        </div>
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
            <strong>
              Contame qué querés hacer o qué no está funcionando y vemos los próximos pasos.
            </strong>
          </div>
        </div>
      </section>

      <section className="about-story">
        <div>
          <span className="eyebrow small">Mi forma de trabajar</span>
          <h2>Soluciones claras, con una base técnica.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            Trabajo principalmente con HTML, CSS, JavaScript y React. También me formé con Node.js,
            Express, Firebase, MongoDB, Git y GitHub; elijo las herramientas de acuerdo con el
            alcance de cada proyecto.
          </p>
          <p>
            Si ya tenés un sitio, un dominio o un proveedor, puedo revisar lo existente antes de
            sugerir cambios. Para empezar, contame qué querés resolver desde la página de{' '}
            <Link to="/contact">contacto</Link>.
          </p>
        </div>
      </section>
      <ShareLinks />
    </main>
  );
};

export default AboutMe;
