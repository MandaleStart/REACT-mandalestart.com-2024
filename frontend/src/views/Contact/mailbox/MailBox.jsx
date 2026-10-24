import './mail.css';

const MailBox = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name');
    const email = formData.get('email');
    const service = formData.get('service');
    const message = formData.get('message');
    const subject = `Consulta sobre ${service}`;
    const body = `Nombre: ${name}\nEmail: ${email}\nServicio: ${service}\n\nMensaje:\n${message}`;

    window.location.href = `mailto:info@mandalestart.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
        Se abrirá tu aplicación de correo con el mensaje preparado. Para enviarlo, confirmá el envío desde esa aplicación.
      </p>
      <button type="submit" className="Btn_Send">
        Preparar consulta
      </button>
    </form>
  );
};

export default MailBox;
