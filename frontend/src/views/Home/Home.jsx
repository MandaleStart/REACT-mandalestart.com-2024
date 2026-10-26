import { Link } from 'react-router-dom';
import ShareLinks from '../../components/ShareLinks/ShareLinks';
import SiteIcon from '../../components/SiteIcon/SiteIcon';
import useServiceCatalog from '../../data/useServiceCatalog';
import './home.css';

const infrastructure = [
  { title: 'Servidores', text: 'Instalo, configuro y mantengo servidores según las necesidades de tu proyecto.' },
  { title: 'Routers y redes', text: 'Configuro routers y VLAN para conectar tus equipos y servicios.' },
  { title: 'Domótica', text: 'Automatizo dispositivos y rutinas en tu casa o espacio de trabajo.' },
  { title: 'Monitoreo', text: 'Configuro alertas para detectar cuándo un servidor o servicio deja de responder.' },
];

const steps = [
  { number: '01', title: 'Me contás', text: 'Vemos qué necesitás y qué tenés hoy. Con eso, definimos por dónde conviene empezar.' },
  { number: '02', title: 'Acordamos el trabajo', text: 'Te detallo el alcance, los tiempos y el presupuesto antes de empezar.' },
  { number: '03', title: 'Lo pongo en marcha', text: 'Desarrollo o configuro lo acordado y te muestro cómo queda.' },
  { number: '04', title: 'Seguimos en contacto', text: 'Después de la entrega, podés consultarme por ajustes, mantenimiento o soporte.' },
];

const stats = [
  { value: 'Web', label: 'Sitios y tiendas online' },
  { value: 'Hosting', label: 'Dominios y correo' },
  { value: 'Redes', label: 'Servidores y soporte' },
];

const Home = () => {
  const { services, error: catalogError } = useServiceCatalog();

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <h1>
            Diseño tu web <span className="gradient-text">y configuro lo necesario para ponerla en marcha.</span>
          </h1>
          <p>
            Trabajo con personas y negocios de todo Uruguay: diseño sitios y tiendas online y también puedo ayudarte con
            dominios, hosting, correo, SEO y redes. Si no sabés por dónde empezar, contame qué necesitás y lo vemos.
          </p>

          <div className="hero-actions">
            <Link to="/contact" className="primary-button">Pedir presupuesto</Link>
            <Link to="/services" className="secondary-button">Ver servicios</Link>
          </div>

          <ul className="hero-proof">
            <li>Webs y tiendas online</li>
            <li>Dominios, hosting y correo</li>
            <li>Redes y soporte técnico</li>
          </ul>
        </div>

        <div className="hero-visual" aria-label="Vista previa de servicios">
          <div className="dashboard-panel">
            <div className="panel-header">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>

            <div className="panel-body">
              <div className="mini-card large">
                <span className="label">Servicios</span>
                <strong>Web + hosting</strong>
                <small>Dominio, correo y soporte técnico</small>
              </div>

              <div className="mini-grid">
                <div className="mini-card">
                  <span className="label">Redes</span>
                  <strong>Configuración</strong>
                </div>
                <div className="mini-card accent">
                  <span className="label">SEO</span>
                  <strong>Contenido y técnica</strong>
                </div>
              </div>

              <div className="signal-bars" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        {stats.map((item) => (
          <div key={item.label} className="stat-item">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section className="services-section">
        <div className="section-heading">
          <span className="eyebrow small">Lo que hago</span>
          <h2>Servicios web y soluciones técnicas para personas y negocios de Uruguay.</h2>
        </div>

        <div className="services-grid">
          {services.map(({ slug, icon, title, description, accent }) => (
            <article key={slug} className={`service-card ${accent}`}>
              <div className="service-icon"><SiteIcon name={icon} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        {catalogError && <p className="catalog-notice" role="status">{catalogError} Mostramos el catálogo guardado.</p>}
      </section>

      <section className="infrastructure-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">Infraestructura</span>
          <h2>También puedo ayudarte con servidores, redes y domótica.</h2>
        </div>

        <div className="infrastructure-grid">
          {infrastructure.map(({ title, text }) => (
            <article key={title} className="infra-card">
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">Proceso</span>
          <h2>Cómo trabajo</h2>
        </div>

        <div className="steps-grid">
          {steps.map(({ number, title, text }) => (
            <div key={number} className="step-card">
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="information-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">Elegir por dónde empezar</span>
          <h2>Una presencia digital útil se construye según tus objetivos.</h2>
        </div>
        <div className="information-copy">
          <p>
            Antes de elegir una herramienta, conviene tener claro qué querés conseguir. Tal vez necesitás mostrar tus
            servicios, recibir consultas, vender productos o simplemente ordenar la comunicación de tu negocio. Esa
            respuesta ayuda a definir qué páginas hacen falta, qué información debe aparecer primero y cuál es la forma
            más sencilla para que una persona se ponga en contacto.
          </p>
          <p>
            <strong>No todos los proyectos necesitan una web compleja.</strong> Una página clara puede ser suficiente
            para presentar una actividad y recibir consultas, mientras que una tienda online requiere organizar
            productos, medios de pago y el recorrido de compra. La propuesta se adapta al alcance acordado, sin sumar
            funciones que no aporten a tu objetivo.
          </p>
        </div>
        <div className="information-grid">
          <article className="information-card">
            <h3>Si recién empezás</h3>
            <p>
              Una landing page puede reunir qué ofrecés, a quién ayudás y cómo contactarte. También es posible registrar
              un dominio propio y configurar correo corporativo para que tu comunicación tenga una identidad coherente.
              Primero definimos el contenido esencial; luego se puede ampliar el sitio cuando el proyecto lo necesite.
            </p>
          </article>
          <article className="information-card">
            <h3>Si ya tenés un sitio</h3>
            <p>
              Podemos revisar qué funciona y qué conviene mejorar: visualización en celulares, claridad de los textos,
              enlaces de contacto, velocidad percibida o tareas de mantenimiento. En vez de rehacer todo por defecto,
              identificamos prioridades y acordamos los cambios que realmente hacen falta.
            </p>
          </article>
          <article className="information-card">
            <h3>Si necesitás vender online</h3>
            <p>
              Una tienda debe facilitar que las personas encuentren los productos, entiendan sus características y sepan
              cómo completar una compra. Conversamos sobre el catálogo, los pagos y las consultas antes de definir el
              alcance. La integración depende de los servicios y las cuentas que utilice cada negocio.
            </p>
          </article>
        </div>
      </section>

      <section className="information-section technical-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">La parte técnica también importa</span>
          <h2>Dominio, alojamiento y soporte para que tu proyecto esté bien conectado.</h2>
        </div>
        <div className="information-copy">
          <p>
            El dominio es la dirección de tu sitio; el hosting es el servicio donde se alojan sus archivos. Para que
            ambos funcionen juntos hay que configurar sus registros y mantener el acceso a las cuentas correspondientes.
            Si ya tenés un proveedor, revisamos la configuración existente antes de proponer cambios. Si todavía no
            elegiste uno, puedo orientarte según el tipo de sitio y las necesidades que definamos.
          </p>
          <p>
            También puedo ayudarte a configurar correos con tu dominio, copias de seguridad y tareas de mantenimiento.
            Para redes, servidores o acceso remoto, primero relevamos los equipos y el uso esperado; después acordamos
            qué se configurará y cómo se probará. <strong>El alcance y el presupuesto se confirman antes de empezar</strong>,
            para que sepas qué incluye el trabajo y qué queda fuera.
          </p>
          <p>
            El SEO técnico y de contenido ayuda a que los buscadores comprendan mejor las páginas, pero no garantiza una
            posición específica: influyen la competencia, las búsquedas y otros factores externos. El trabajo puede
            incluir revisar títulos, descripciones, estructura y contenido, y priorizar mejoras concretas para tu sitio.
          </p>
        </div>
      </section>

      <section className="information-section questions-section">
        <div className="section-heading left-align">
          <span className="eyebrow small">Antes de consultar</span>
          <h2>¿Cómo solicitar una propuesta?</h2>
        </div>
        <div className="information-copy">
          <p>
            Contame qué querés hacer, si ya tenés un sitio o dominio y qué resultado esperás. Si todavía no tenés todos
            esos datos, no pasa nada: podemos empezar por una conversación y ordenar las prioridades. Cuanto más claro
            esté el objetivo, más fácil será recomendar una solución apropiada y estimar el trabajo.
          </p>
          <p>
            Trabajo con personas y negocios de todo Uruguay. La coordinación puede hacerse a distancia y, cuando el
            proyecto lo requiera, definimos de antemano los pasos y la forma de seguimiento. <strong>Recibís una propuesta
            con el alcance, los tiempos y el presupuesto acordados</strong>; no se inicia ninguna tarea adicional sin
            conversarla primero.
          </p>
          <p>
            Después de la entrega, podés consultar por ajustes, mantenimiento o soporte relacionado con el trabajo
            realizado. Cada servicio puede variar según la situación y los accesos disponibles, por eso revisamos esos
            detalles antes de cotizar. Escribime por el canal que prefieras y contame brevemente qué necesitás resolver.
          </p>
        </div>
      </section>

      <section className="cta-band">
        <div>
          <span className="eyebrow small">¿Qué necesitás resolver?</span>
          <h2>Contame qué querés hacer o qué está fallando. Definimos juntos los próximos pasos.</h2>
        </div>
        <Link to="/contact" className="primary-button large">Hablemos de tu proyecto</Link>
      </section>

      <ShareLinks />
    </main>
  );
};

export default Home;
