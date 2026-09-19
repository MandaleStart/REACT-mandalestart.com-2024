import MailBox from './mailbox/MailBox';
import SocialNet from './socialnet/SocialNet';

const Contact = () => {
  return (
    <main className="contact-page">
      <section className="contact-header">
        <span className="eyebrow">Contacto</span>
        <h1>Hablemos de lo que necesitás resolver.</h1>
        <p>
          Si tenés una idea, un proyecto en marcha o un problema técnico que te está frenando,
          te ayudo a entender qué hace falta y a armar la solución más clara y útil para tu negocio.
        </p>
      </section>

      <section className="contact-trustbar">
        <div>
          <strong>Respuesta rápida</strong>
          <span>Primer contacto en menos de 24 hs</span>
        </div>
        <div>
          <strong>Proyecto claro</strong>
          <span>Reunión para definir alcance y objetivos</span>
        </div>
        <div>
          <strong>Sin rodeos</strong>
          <span>Soluciones útiles, prácticas y orientadas a vender</span>
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
