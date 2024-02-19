import React from 'react';

const Contact = () => {
  return (
    <main className="d-flex flex-wrap justify-content-center">
      <section className="ws_box col-lg-4 col-12">
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
            <select className="form-control" name="subject" id="subject">
              <option value="0" disabled selected>
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
          <button type="submit" className="mt-5 btn btn-success">
            Enviar
          </button>
        </form>
      </section>
      <section className="ws_box col-lg-5 col-12">
        {/* Código para los banners de contacto */}
        {/* ... */}
      </section>
    </main>
  );
};

export default Contact;
