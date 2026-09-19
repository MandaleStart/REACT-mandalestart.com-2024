import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isTermsOpen) {
        setIsTermsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTermsOpen]);

  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-brand-block">
          <div className="brand brand-footer">
            <span className="brand-mark">M</span>
            <span>
              <strong>MandaleStart</strong>
              <small>Growth Studio</small>
            </span>
          </div>
          <p>
            Soluciones digitales para negocios que quieren crecer con automatización,
            presencia online y tecnología confiable.
          </p>
        </div>

        <div className="footer-links">
          <h6>Explorar</h6>
          <Link to="/">Inicio</Link>
          <Link to="/services">Servicios</Link>
          <Link to="/projects">Proyectos</Link>
          <Link to="/aboutme">Sobre mí</Link>
          <Link to="/contact">Contacto</Link>
        </div>

        <div className="footer-links">
          <h6>Servicios</h6>
          <span>Desarrollo web</span>
          <span>DDNS y hosting</span>
          <span>Monitoreo de red</span>
          <span>Impresión 3D</span>
        </div>

        <div className="footer-contact">
          <h6>Contacto</h6>
          <a href="mailto:info@mandalestart.com">info@mandalestart.com</a>
          <a href="tel:+59891598586">+598 91 598 586</a>
          <span>Canelones, Uruguay</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 MandaleStart</span>
        <button type="button" className="footer-privacy" onClick={() => setIsTermsOpen(true)}>
          Términos y privacidad
        </button>
      </div>

      {isTermsOpen && (
        <>
          <div className="terms-modal-backdrop" onClick={() => setIsTermsOpen(false)} />
          <div className="terms-modal" role="dialog" aria-modal="true" aria-labelledby="terms-title">
            <div className="terms-modal-card">
              <div className="terms-modal-header">
                <h5 id="terms-title">Términos y condiciones</h5>
                <button type="button" className="terms-close" onClick={() => setIsTermsOpen(false)} aria-label="Cerrar">
                  ×
                </button>
              </div>
              <div className="terms-modal-body">
                <p>
                  Al utilizar este sitio, aceptás la política de privacidad, el uso de cookies y el tratamiento
                  de información para mejorar la experiencia, ofrecer servicios personalizados y mantener la
                  operación del sitio de forma segura y funcional.
                </p>
                <p>
                  La información que se comparte por formulario o contacto se utiliza exclusivamente para responder
                  consultas, cotizaciones, soporte y comunicación relacionada con los servicios ofrecidos.
                </p>
                <p>
                  En ningún caso se comparte información personal con terceros sin consentimiento expreso, salvo
                  obligación legal o necesaria para brindar el servicio solicitado.
                </p>
              </div>
              <div className="terms-modal-footer">
                <button type="button" className="terms-confirm" onClick={() => setIsTermsOpen(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </footer>
  );
};

export default Footer;