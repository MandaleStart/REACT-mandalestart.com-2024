import './mail.css';

const MailBox = () => {
  return (
    <form>
      <div className="form-group">
        <label className="text-white" htmlFor="name">
          Nombre
        </label>
        <input type="text" className="form-control" id="name" placeholder="Ingresa tu nombre" />
      </div>
      <div className="form-group">
        <label className="text-white" htmlFor="email">
          Email
        </label>
        <input type="email" className="form-control" id="email" placeholder="Ingresa tu email" />
      </div>
      <div className="form-group">
        <label className="text-white" htmlFor="subject">
          Asunto:
        </label>
        <select className="form-control" name="subject" id="subject" defaultValue="0">
          <option value="0" disabled>
            Seleccione una Opción
          </option>
          <option value="1">Sugerencia</option>
          <option value="2">Consulta</option>
          <option value="3">Otros</option>
        </select>
      </div>
      <div className="form-group">
        <label className="text-white" htmlFor="message">
          Mensaje
        </label>
        <textarea className="form-control" id="message" rows="5" placeholder="¡Hola! Te invito a que tomes unos minutos para escribir lo que tengas en mente."></textarea>
      </div>
      <button type="submit" className="mt-5 btn-block Btn_Send">
        Enviar
      </button>
    </form>
  );
};

export default MailBox;
