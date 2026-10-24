import { Link } from 'react-router-dom';
import ShareLinks from '../../components/ShareLinks/ShareLinks';
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
        <span className="eyebrow">Soluciones</span>
        <h1>Soluciones que puedo desarrollar para tu proyecto.</h1>
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

      <section className="projects-process">
        <div>
          <span className="eyebrow small">Cómo se define una solución</span>
          <h2>De una necesidad concreta a un alcance claro.</h2>
        </div>
        <div className="projects-process-copy">
          <p>
            Los ejemplos de esta página describen tipos de trabajo que puedo realizar; no son proyectos atribuidos a
            clientes ni resultados garantizados. Cada sitio, configuración de red o pieza 3D depende de sus requisitos,
            del material disponible y de las condiciones técnicas del caso.
          </p>
          <p>
            Para una web, por ejemplo, primero definimos a quién debe llegar, qué información necesita mostrar y qué
            acción debería poder realizar una persona visitante. Luego se acuerdan las páginas, el diseño adaptable y
            las vías de contacto. Si se requiere una tienda, también conversamos sobre el catálogo y los servicios de
            pago que se utilizarán.
          </p>
          <p>
            En tareas de DDNS, redes o monitoreo, el punto de partida es conocer los equipos, la conexión y el acceso
            disponible. Para modelado e impresión 3D revisamos el uso previsto, las medidas y las características de la
            pieza. <strong>El detalle se ajusta a cada necesidad y se confirma antes de comenzar.</strong>
          </p>
          <p>
            Una vez acordado el alcance, se realiza el trabajo y se revisa el resultado con vos. Según el servicio, la
            entrega puede incluir una web publicada, una configuración probada, archivos del modelo o indicaciones para
            continuar. Si luego necesitás cambios o mantenimiento, podemos conversar una etapa de soporte por separado.
          </p>
          <h3>Qué se revisa en una solución web</h3>
          <p>
            Además del diseño, una web debe organizar la información para que sea fácil encontrarla y entenderla. En
            una propuesta podemos definir qué páginas necesita, cómo se conectan entre sí y qué contenido debe estar
            visible desde un celular. También se acuerda cómo llegan las consultas: por formulario, correo, mensajería
            u otro canal disponible para el proyecto. El resultado depende de los textos, imágenes, accesos e
            integraciones que se definan para cada sitio.
          </p>
          <h3>Qué se revisa en una tarea de infraestructura</h3>
          <p>
            En redes y acceso remoto importa saber cómo está conectada la infraestructura y qué dispositivos deben
            comunicarse. Antes de tocar una configuración, se identifica el objetivo y se comprueba qué accesos y
            documentación existen. La disponibilidad de algunas funciones depende del router, el proveedor de internet
            o las políticas de la red, de modo que esas condiciones forman parte de la evaluación. Para monitoreo,
            definimos qué comprobar y cómo avisar si el servicio observado deja de responder.
          </p>
          <h3>Qué se revisa para una pieza impresa en 3D</h3>
          <p>
            Un modelo para impresión debe considerar dimensiones, geometría y uso previsto. Una pieza decorativa y una
            pieza sometida a carga no tienen las mismas necesidades, y la fabricación tiene límites según el material
            y el proceso disponible. Por eso, compartir medidas, fotografías o un dibujo de referencia ayuda a evaluar
            si hace falta modelar desde cero o adaptar un archivo existente. El diseño, el material y el alcance se
            confirman antes de fabricar.
          </p>
          <h3>Qué conviene incluir en una consulta</h3>
          <p>
            Para un sitio, mencioná qué actividad querés presentar y qué secciones imaginás; para una tarea de
            infraestructura, indicá qué equipos intervienen y qué resultado esperás. Si la consulta es sobre una pieza
            3D, las dimensiones aproximadas y una imagen de referencia ayudan a entender la forma. No hace falta tener
            toda la documentación lista: podemos identificar qué información falta durante la evaluación inicial y
            acordar los siguientes pasos antes de definir una propuesta.
          </p>
        </div>
      </section>
      <ShareLinks />
    </main>
  );
};

export default Projects;