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
          <h1>Soy Nicolás. Hago webs y me ocupo de todo lo que las hace funcionar.</h1>
          <p>
            Trabajo con personas y negocios de todo Uruguay. A veces el proyecto empieza con una
            web nueva; otras, con algo que dejó de funcionar o que hay que ordenar.
          </p>
          <p>
            Soy desarrollador frontend, formado en Jóvenes a Programar de Ceibal. Además de
            programar, me encargo de hosting, redes y servidores, así que no tenés que coordinar
            con tres proveedores distintos.
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
              Contame qué querés lograr o qué no funciona y vemos los próximos pasos.
            </strong>
          </div>
        </div>
      </section>

      <section className="about-story">
        <div>
          <span className="eyebrow small">Mi forma de trabajar</span>
          <h2>Soluciones simples, con una base técnica sólida.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            Uso HTML, CSS, JavaScript y React, y también Node.js, Express, Firebase y bases de datos.
            Elijo las herramientas según lo que tu proyecto necesita, no al revés.
          </p>
          <p>
            Si ya tenés un sitio, un dominio o un proveedor, primero reviso lo que hay y recién
            después te propongo cambios. Para empezar, escribime desde la página de{' '}
            <Link to="/contact">contacto</Link>.
          </p>
        </div>
      </section>
      <ShareLinks />
    </main>
  );
};

export default AboutMe;
