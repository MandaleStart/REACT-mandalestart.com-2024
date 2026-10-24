import MailBox from './mailbox/MailBox';
import SocialNet from './socialnet/SocialNet';
import ShareLinks from '../../components/ShareLinks/ShareLinks';

const Contact = () => {
  return (
    <main className="contact-page">
      <section className="contact-header">
        <span className="eyebrow">Contacto</span>
        <h1>Contame qué necesitás resolver.</h1>
        <p>
          Atiendo a personas y negocios de todo Uruguay. Puede ser una web nueva, un proyecto en marcha o un problema técnico.
          Contame un poco y vemos qué hace falta.
        </p>
      </section>

      <section className="contact-trustbar">
        <div>
          <strong>Primer paso</strong>
          <span>Me contás qué necesitás y en qué plazo</span>
        </div>
        <div>
          <strong>Alcance y presupuesto</strong>
          <span>Te los detallo antes de empezar</span>
        </div>
        <div>
          <strong>Próximos pasos</strong>
          <span>Te cuento cómo seguimos</span>
        </div>
      </section>

      <section className="contact-layout">
        <div className="contact-form-panel">
          <MailBox />
        </div>

        <div className="contact-side-panel">
          <SocialNet />
        </div>
      </section>

      <section className="contact-guidance">
        <h2>Qué información ayuda para preparar una propuesta</h2>
        <p>
          Contame cuál es tu objetivo y qué servicio te interesa, si ya hay un sitio o una configuración en marcha y
          qué plazo tenés en mente. Para una web, podés compartir las páginas que necesitás o algunos ejemplos de lo
          que buscás. Para soporte técnico, describí qué equipo o servicio está involucrado y qué comportamiento
          observás.
        </p>
        <p>
          No envíes contraseñas ni datos sensibles en el primer mensaje. Si hacen falta accesos para realizar el trabajo,
          coordinamos una forma apropiada de compartirlos una vez definido el alcance. Si todavía no tenés claro qué
          servicio corresponde, explicá la necesidad con tus palabras y revisamos juntos los próximos pasos.
        </p>
        <p>
          El formulario permite enviar una consulta por correo; también podés elegir WhatsApp, Telegram o LinkedIn en el
          panel de contacto. <strong>El alcance, los tiempos y el presupuesto se confirman antes de comenzar.</strong>
        </p>
      </section>
      <ShareLinks />
    </main>
  );
};

export default Contact;
