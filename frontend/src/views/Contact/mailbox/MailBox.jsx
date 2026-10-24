import './mail.css';

const MailBox = () => {
  const getMessage = (form) => {
    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const service = form.elements.service.selectedOptions[0]?.textContent || '';
    const message = formData.get('message');

    return `Nombre: ${name}\nEmail: ${email}\nServicio: ${service}\n\nMensaje:\n${message}`;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const service = event.currentTarget.elements.service.selectedOptions[0]?.textContent || '';
    const subject = `Consulta sobre ${service}`;
    const body = getMessage(event.currentTarget);

    window.location.href = `mailto:info@mandalestart.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleWhatsApp = (event) => {
    const form = event.currentTarget.form;
    if (!form.reportValidity()) return;

    window.location.href = `https://wa.me/59891598586?text=${encodeURIComponent(getMessage(form))}`;
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field-group">
          <label htmlFor="name">Nombre</label>
          <input type="text" id="name" name="name" autoComplete="name" placeholder="Tu nombre" required />
        </div>
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" autoComplete="email" placeholder="tu@email.com" required />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="service">Servicio</label>
        <select id="service" name="service" defaultValue="" required>
          <option value="" disabled>Elegí una opción</option>
          <option value="web">Desarrollo web</option>
          <option value="hosting">Hosting y dominios</option>
          <option value="correo">Correo corporativo</option>
          <option value="seo">SEO</option>
          <option value="ddns">DDNS y acceso remoto</option>
          <option value="red">Redes, servidores y monitoreo</option>
          <option value="impresion">Diseño e impresión 3D</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="message">Mensaje</label>
        <textarea id="message" name="message" rows="6" placeholder="Contame qué necesitás, para cuándo y qué resultado esperás." required></textarea>
      </div>

      <p className="contact-form-note">
        Por email, se abrirá tu aplicación con el mensaje preparado y vas a tener que confirmar el envío. Por WhatsApp,
        se abrirá un chat con el mensaje listo para enviar.
      </p>
      <button type="submit" className="Btn_Send">
        Preparar consulta por email
      </button>
      <button type="button" className="secondary-button" onClick={handleWhatsApp}>
        Continuar por WhatsApp
      </button>
    </form>
  );
};

export default MailBox;
