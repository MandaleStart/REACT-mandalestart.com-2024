import './about.css';
import ShareLinks from '../../components/ShareLinks/ShareLinks';

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
          <h1>Soy Nicolás. Desarrollo sitios web y también resuelvo lo que hay detrás.</h1>
          <p>
            Trabajo con personas y negocios de todo Uruguay en sitios web, hosting y redes. A veces el proyecto empieza
            con una web nueva; otras, con algo que no funciona o que hace falta ordenar.
          </p>
          <p>
            Antes de empezar, hablamos de lo que necesitás y definimos el alcance. Me ocupo del desarrollo o la
            configuración y, si hace falta, sigo con soporte.
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

      <section className="about-story">
        <div>
          <span className="eyebrow small">Mi recorrido</span>
          <h2>Aprender, resolver y seguir mejorando.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            Soy Nicolás Jorge, desarrollador web frontend. Empecé mi formación en Jóvenes a Programar de Ceibal y
            continúo aprendiendo desarrollo full stack, C# y creación de videojuegos. Mi recorrido combina el desarrollo
            de interfaces con el interés por entender cómo se conectan las distintas partes de un servicio digital.
          </p>
          <p>
            En los proyectos web, trabajo con tecnologías como HTML, CSS, JavaScript y React. También tengo experiencia
            formativa con Node.js, Express, Firebase, MongoDB, Git y GitHub. La elección de herramientas depende del
            problema y del alcance; no se trata de agregar tecnología porque sí, sino de construir algo que sea claro y
            útil para quien lo va a usar.
          </p>
          <p>
            Mi interés por la parte técnica también incluye soporte IT, redes y servidores. Esa combinación me permite
            conversar tanto sobre el contenido y la navegación de una página como sobre su publicación, sus dominios o
            la configuración de los servicios relacionados. Cuando una tarea necesita conocimientos o recursos que
            exceden el alcance acordado, lo conversamos antes de avanzar.
          </p>
          <p>
            Me interesa especialmente el desarrollo de videojuegos con C# y Unity, y sigo ampliando mis conocimientos en
            programación y herramientas de creación 3D. Mantenerme en formación es parte de mi manera de trabajar:
            investigar una necesidad, probar alternativas y explicar con claridad qué solución se puede implementar.
          </p>
          <p>
            Si tenés una idea, un sitio que quieras mejorar o una consulta técnica, podemos empezar por definir el
            objetivo y revisar el punto de partida. <strong>La propuesta se conversa antes de comenzar</strong>: acordamos
            qué incluye, qué información o accesos hacen falta y cuáles son los próximos pasos.
          </p>
          <h3>¿Con qué tipo de consultas puedo ayudarte?</h3>
          <p>
            Podés consultar tanto por un proyecto nuevo como por una tarea puntual: una página que necesitás publicar,
            un sitio que querés ordenar o una configuración técnica que no está funcionando como esperabas. No hace
            falta llegar con una solución decidida. Describir el problema, quiénes lo usan y qué resultado te gustaría
            obtener ya es un buen comienzo para evaluar alternativas.
          </p>
          <h3>¿Qué pasa si ya tengo una web o proveedor?</h3>
          <p>
            Podemos revisar lo que existe antes de proponer cambios. Si el sitio está publicado, el dominio está
            registrado o ya usás servicios de correo y alojamiento, esos elementos se consideran al definir el trabajo.
            La idea es aprovechar lo que sirva y evitar cambios innecesarios. Los accesos o modificaciones se coordinan
            solamente cuando hacen falta para el alcance acordado.
          </p>
          <h3>¿Cómo se define el acompañamiento?</h3>
          <p>
            Antes de empezar, conversamos qué incluye la entrega y cómo vamos a revisar el resultado. El mantenimiento
            y el soporte posterior pueden depender de la plataforma, los proveedores y el tipo de tarea, por lo que se
            definen de acuerdo con cada proyecto. Si aparece una necesidad nueva, la evaluamos y acordamos por separado
            en vez de asumir que estaba incluida.
          </p>
        </div>
      </section>
      <ShareLinks />
    </main>
  );
};

export default AboutMe;
