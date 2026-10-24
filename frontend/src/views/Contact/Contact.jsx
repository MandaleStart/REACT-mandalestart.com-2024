import MailBox from './mailbox/MailBox';
import SocialNet from './socialnet/SocialNet';

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
    </main>
  );
};

export default Contact;
