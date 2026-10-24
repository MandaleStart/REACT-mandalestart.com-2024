import './mail.css';

const MailBox = () => {
  return (
    <form className="contact-form">
      <div className="form-row">
        <div className="field-group">
          <label htmlFor="name">Nombre</label>
          <input type="text" id="name" placeholder="Tu nombre" />
        </div>
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="tu@email.com" />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="subject">Servicio</label>
        <select id="subject" defaultValue="">
          <option value="" disabled>Elegí una opción</option>
          <option value="web">Desarrollo web</option>
          <option value="ddns">DDNS / hosting</option>
          <option value="red">Redes y servidores</option>
          <option value="impresion">Impresión 3D</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="message">Mensaje</label>
        <textarea id="message" rows="6" placeholder="Contame qué necesitás, para cuándo y qué resultado esperás."></textarea>
      </div>

      <button type="submit" className="Btn_Send">
        Enviar consulta
      </button>
    </form>
  );
};

export default MailBox;
