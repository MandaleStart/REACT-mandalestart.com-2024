import './privacy.css';
import { useContact } from '../../config/useContact';
import { mailtoUrl } from '../../config/site';

const Privacy = () => {
  const contact = useContact();
  const emailUrl = mailtoUrl(contact);

  return (
  <main className="privacy-page">
    <h1>Política de privacidad</h1>

    <section className="privacy-section about-panel">
      <h2>Quién es responsable</h2>
      <p>Nicolás Jorge, MandaleStart.</p>
    </section>

    <section className="privacy-section about-panel">
      <h2>Contacto</h2>
      <p>
        <a href={emailUrl}>{contact.email}</a>
      </p>
    </section>

    <section className="privacy-section about-panel">
      <h2>Formulario de contacto</h2>
      <p>
        Si me escribís por el formulario, se envían tu nombre, tu email, el servicio de interés y tu mensaje a mi
        servidor. Ahí se comprueba que los datos sean válidos y que no se trate de spam. El proveedor SMTP configurado
        en el servidor procesa el envío y el mensaje llega a mi casilla de correo. El sitio no guarda el mensaje en la
        base PostgreSQL; lo uso para responderte y, si trabajamos juntos, para gestionar el servicio. El mensaje pasa
        por los proveedores técnicos necesarios para enviarlo y recibirlo.
      </p>
      <p>
        Lo conservo.
        {' '}
        {/* [TODO: plazo, por ejemplo “hasta 2 años desde la última comunicación”]. */}
      </p>
    </section>

    <section className="privacy-section about-panel">
      <h2>Área de clientes</h2>
      <p>
        Si tenés cuenta, Firebase Authentication procesa tu email, nombre y datos de acceso según el método de inicio
        disponible (email y contraseña o, si está habilitado, Google). La ficha de cliente se guarda en PostgreSQL e
        incluye los datos de contacto y los servicios y proyectos asociados. La API limita el acceso a la persona
        asociada a la ficha y al administrador. Para mantener tu sesión iniciada, el navegador guarda datos de sesión
        en tu dispositivo.
      </p>
    </section>

    <section className="privacy-section about-panel">
      <h2>Medición del sitio</h2>
      <p>
        Uso Vercel Speed Insights para medir el rendimiento técnico de las páginas.
        {' '}
        {/* [TODO: confirmar con la documentación de Vercel qué datos recoge y si se asocian a personas.] */}
      </p>
    </section>

    <section className="privacy-section about-panel">
      <h2>Enlaces para compartir</h2>
      <p>
        Los botones de Facebook, LinkedIn y WhatsApp son enlaces comunes: no cargan sus scripts ni les envían datos
        hasta que hacés clic.
      </p>
    </section>

    <section className="privacy-section about-panel">
      <h2>Tus derechos</h2>
      <p>
        Podés pedirme acceso, rectificación o eliminación de tus datos escribiendo a{' '}
        <a href={emailUrl}>{contact.email}</a>. Te respondo.
        {' '}
        {/* [TODO: plazo]. */}
      </p>
    </section>

    <section className="privacy-section about-panel">
      <h2>Última actualización</h2>
      {/* [fecha] */}
    </section>
  </main>
  );
};

export default Privacy;
