import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="text-center text-lg-start bg-dark text-muted">
      <section className="d-flex justify-content-center justify-content-lg-between p-4 border-bottom text-white">
        <div className="me-5 d-none d-lg-block">
          <span>Conéctate con nosotros en las redes sociales:</span>
        </div>
        <div>
          <a href="https://www.instagram.com/_nico_jorge" className="me-4 text-reset" target="_blank">
            <i className="fab fa-instagram">_nico_jorge</i>
          </a>
          <a href="https://www.linkedin.com/in/mandalestart" className="me-4 text-reset" target="_blank">
            <i className="fab fa-linkedin">mandalestart</i>
          </a>
          <a href="https://github.com/MandaleStart" className="me-4 text-reset" target="_blank">
            <i className="fab fa-github">mandalestart</i>
          </a>
          <a className="me-4 text-reset" href="https://twitter.com/mandalestart" target="_blank">
            <i className="fab fa-twitter">mandalestart</i>
          </a>
        </div>
      </section>

      <section className="text-white">
        <div className="container text-center text-md-start mt-5">
          <div className="row mt-3">
            <div className="col-md-3 col-lg-2 col-xl-2 mx-auto mb-4">
              <h6 className="text-uppercase fw-bold mb-4">
                Links Utiles
              </h6>
              <p>
                <Link to="/" className="text-reset">Inicio</Link>
              </p>
              <p>
                <Link to="/projects" className="text-reset">Proyectos</Link>
              </p>
              <p>
                <Link to="/aboutme" className="text-reset">Sobre Mi</Link>
              </p>
              <p>
                <Link to="/contact" className="text-reset">Contacto</Link>
              </p>
            </div>
            <div className="col-md-4 col-lg-3 col-xl-3 mx-auto mb-md-0 mb-4">
              <h6 className="text-uppercase fw-bold mb-4">Contacto</h6>
              <p><i className="fas fa-home me-3"></i> Canelones, Uruguay</p>
              <p>
                <i className="fas fa-envelope me-3"></i>
                info@mandalestart.com
              </p>
              <p><i className="fas fa-phone me-3"></i> + 598 91 598 586</p>
            </div>
          </div>
        </div>
      </section>
      <div className="text-white text-center p-4">
        <button className=" " type="button" data-bs-toggle="modal" data-bs-target="#TyC">Términos y condiciones de privacidad</button>
        © 2023 Copyright:
        <a className="text-reset fw-bold" href="https://mandalestart.com/">MandaleStart.com </a>
        by Nicolas Jorge
      </div>

      {/* Modal de Términos y Condiciones */}
      <div className="modal mt-5" id="TyC" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Términos y condiciones de privacidad</h5>
            </div>
            <div className="modal-body">
              <div className="">Al utilizar nuestro sitio web, acepta nuestra política de privacidad, que incluye el uso de cookies y la recopilación de información para mejorar su experiencia en el sitio. No venderemos ni compartiremos su información con terceros sin su consentimiento.</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
     
    </footer>
  );
};

export default Footer;