import { Link } from 'react-router-dom';
import ShareLinks from '../../components/ShareLinks/ShareLinks';
import SiteIcon from '../../components/SiteIcon/SiteIcon';
import useServiceCatalog from '../../data/useServiceCatalog';
import './services.css';

const Services = () => {
  const { services: serviceCatalog, error: catalogError } = useServiceCatalog();

  return (
    <main className="services-page">
      <section className="services-hero">
        <span className="eyebrow">Servicios</span>
        <h1>Servicios web y soporte técnico.</h1>
        <p>
          Atiendo consultas de todo Uruguay. Revisá qué incluye cada servicio y escribime para recibir un presupuesto según tu proyecto.
        </p>

        <div className="services-summary">
          <span>Desarrollo web</span>
          <span>Hosting y dominios</span>
          <span>Redes y servidores</span>
          <span>SEO</span>
          <span>Diseño e impresión 3D</span>
        </div>
      </section>

      <section className="services-list">
        {serviceCatalog.map(({ slug, icon, title, category, description, price, accent }) => (
          <article key={slug} className={`service-showcase ${accent}`}>
            <div className="service-showcase-top">
              <span className="service-mini-icon"><SiteIcon name={icon} /></span>
              <span className="service-chip">{category}</span>
            </div>

            <h2>{title}</h2>
            <p>{description}</p>

            <div className="service-meta">
              <strong>{price}</strong>
              <Link to={`/services/${slug}`} className="service-link">Ver detalle</Link>
            </div>
          </article>
        ))}
      </section>
      {catalogError && <p className="services-catalog-notice" role="status">{catalogError} Mostramos el catálogo guardado.</p>}
      <p className="services-pricing-note">
        El alcance, los plazos y el presupuesto se confirman con vos antes de comenzar.
      </p>
      <section className="services-guide">
        <div className="section-heading left-align">
          <span className="eyebrow small">Cómo elegir</span>
          <h2>Empezá por el objetivo y sumá solo lo que tu proyecto necesita.</h2>
        </div>
        <div className="services-guide-copy">
          <p>
            Si querés presentar tu actividad o recibir consultas, podés empezar por un sitio informativo o una landing
            page. Si necesitás vender productos, conviene definir primero el catálogo, el proceso de compra y las
            opciones de pago. <strong>La estructura y las funciones se deciden según el uso real del sitio</strong>, no
            por la cantidad de herramientas disponibles.
          </p>
          <p>
            Para una presencia online también hay que considerar el dominio, el alojamiento y, si corresponde, el correo
            con dominio propio. Estos elementos se pueden contratar o configurar juntos o por separado, según lo que ya
            tengas y el control que quieras conservar sobre tus cuentas. Antes de cambiar una configuración existente,
            revisamos qué proveedor y qué servicios están en uso.
          </p>
          <p>
            El SEO técnico y de contenido puede complementar un sitio nuevo o ayudar a priorizar mejoras en uno ya
            publicado. Redes, servidores, monitoreo y acceso remoto corresponden a necesidades distintas: en esos casos
            primero se revisan la infraestructura, los equipos y el acceso disponible. El diseño e impresión 3D parte
            de una idea, medidas y uso previsto para establecer qué puede fabricarse.
          </p>
          <p>
            Para pedir presupuesto, contame qué querés resolver, qué existe hoy y si tenés una fecha objetivo. No es
            necesario que conozcas todos los términos técnicos; podemos revisar juntos las opciones. La propuesta
            especifica el alcance y los tiempos acordados. <strong>Cualquier tarea adicional se consulta antes de
            realizarla.</strong>
          </p>
          <h3>¿Puedo contratar más de un servicio?</h3>
          <p>
            Sí. Algunas necesidades se relacionan entre sí, como el desarrollo de una web con su dominio y alojamiento,
            o la puesta en marcha de un sitio con la configuración del correo corporativo. Se puede revisar el conjunto
            y acordar qué tareas conviene coordinar, o empezar por una etapa concreta. La cotización detalla cada parte
            para que quede claro qué se realizará y qué servicios quedan fuera.
          </p>
          <h3>¿Puedo mantener mis proveedores actuales?</h3>
          <p>
            En muchos casos sí. Si ya tenés un proveedor de hosting, dominio, correo o conectividad, podemos tomarlo en
            cuenta al evaluar una solución. La posibilidad de realizar una tarea depende de las funciones del servicio
            y de los permisos disponibles. Antes de recomendar una migración o modificación, revisamos sus efectos y
            conversamos contigo para decidir si realmente es necesaria.
          </p>
          <h3>¿Cómo se organiza un trabajo por etapas?</h3>
          <p>
            Cuando un proyecto tiene varias necesidades, se pueden priorizar entregas y abordar cada una de forma
            ordenada. Por ejemplo, primero se puede definir el contenido esencial de una web y luego evaluar funciones
            adicionales, o revisar una red antes de configurar monitoreo. Las etapas, los plazos y las dependencias se
            acuerdan de acuerdo con el proyecto; cualquier cambio en el alcance se comunica antes de avanzar.
          </p>
        </div>
      </section>
      <ShareLinks />
    </main>
  );
};

export default Services;
