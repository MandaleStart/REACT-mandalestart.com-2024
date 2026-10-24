import MailBox from './mailbox/MailBox';
import SocialNet from './socialnet/SocialNet';

const Contact = () => {
  return (
    <main className="contact-page">
      <section className="contact-header">
        <span className="eyebrow">Contacto</span>
        <h1>Contame qué necesitás resolver.</h1>
        <p>
          Puede ser una web nueva, un proyecto en marcha o un problema técnico. Contame un poco y vemos qué hace falta.
        </p>
      </section>

      <section className="contact-trustbar">
        <div>
          <strong>Primer paso</strong>
          <span>Contame qué necesitás y en qué plazo</span>
        </div>
        <div>
          <strong>Alcance y presupuesto</strong>
          <span>Los definimos antes de empezar</span>
        </div>
        <div>
          <strong>Próximos pasos</strong>
          <span>Te cuento cómo podemos avanzar</span>
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
