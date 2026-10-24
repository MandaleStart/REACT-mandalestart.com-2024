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
              <small>Web y soporte técnico</small>
            </span>
          </div>
          <p>Desarrollo web, hosting y soporte técnico para personas y negocios de todo Uruguay.</p>
        </div>

        <div className="footer-links">
          <h6>Explorar</h6>
          <Link to="/">Inicio</Link>
          <Link to="/services">Servicios</Link>
          <Link to="/projects">Proyectos</Link>
          <Link to="/aboutme">Sobre mí</Link>
          <Link to="/contact">Contacto</Link>
          <Link to="/comments">Opiniones</Link>
          <Link to="/cv">CV</Link>
          <Link to="/client-area">Área de clientes</Link>
        </div>

        <div className="footer-links">
          <h6>Servicios</h6>
          <span>Desarrollo web</span>
          <span>Hosting, dominios y correo</span>
          <span>Redes y servidores</span>
          <Link to="/services/impresion-3d">Diseño e impresión 3D</Link>
        </div>

        <div className="footer-contact">
          <h6>Contacto</h6>
          <a href="mailto:info@mandalestart.com">info@mandalestart.com</a>
          <a href="tel:+59891598586">+598 91 598 586</a>
          <span>Atención en todo Uruguay</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 MandaleStart</span>
        <button type="button" className="footer-privacy" onClick={() => setIsTermsOpen(true)}>
          Información de privacidad
        </button>
      </div>

      {isTermsOpen && (
        <>
          <div className="terms-modal-backdrop" onClick={() => setIsTermsOpen(false)} />
          <div className="terms-modal" role="dialog" aria-modal="true" aria-labelledby="terms-title">
            <div className="terms-modal-card">
              <div className="terms-modal-header">
                <h5 id="terms-title">Información de privacidad</h5>
                <button type="button" className="terms-close" onClick={() => setIsTermsOpen(false)} aria-label="Cerrar">
                  ×
                </button>
              </div>
              <div className="terms-modal-body">
                <p>
                  El formulario de contacto prepara un correo en la aplicación que elijas. El sitio no envía ni guarda
                  ese mensaje: se comparte cuando confirmás el envío desde tu correo.
                </p>
                <p>
                  Si creás una cuenta o iniciás sesión en el área de clientes, los datos de autenticación se procesan
                  mediante los servicios configurados para gestionar el acceso (el backend del sitio y, cuando está
                  configurado, Firebase Authentication). Vercel Speed Insights mide el rendimiento técnico del sitio.
                </p>
                <p>
                  Para consultas sobre privacidad o tus datos, escribí a{' '}
                  <a href="mailto:info@mandalestart.com">info@mandalestart.com</a>.
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