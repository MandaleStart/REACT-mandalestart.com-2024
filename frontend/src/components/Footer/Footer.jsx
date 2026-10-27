import { Link } from 'react-router-dom';
import { useContact } from '../../config/useContact';
import { SITE, mailtoUrl, telUrl } from '../../config/site';

const Footer = () => {
  const contact = useContact();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand-block">
          <div className="brand brand-footer">
            <span className="brand-mark">M</span>
            <span>
              <strong>{SITE.name}</strong>
              <small>Web y soporte técnico</small>
            </span>
          </div>
          <p>
            Desarrollo web, hosting y soporte técnico para personas y negocios de {SITE.areaServed}.
          </p>
        </div>

        <nav className="footer-links" aria-label="Explorar">
          <h6>Explorar</h6>
          <Link to="/">Inicio</Link>
          <Link to="/services">Servicios</Link>
          <Link to="/projects">Proyectos</Link>
          <Link to="/aboutme">Sobre mí</Link>
          <Link to="/contact">Contacto</Link>
          <Link to="/login">Ingresar</Link>
        </nav>

        <nav className="footer-links" aria-label="Servicios">
          <h6>Servicios</h6>
          <Link to="/services/web">Desarrollo web</Link>
          <Link to="/services/hosting">Hosting, dominios y correo</Link>
          <Link to="/services/monitoring">Redes y servidores</Link>
          <Link to="/services/impresion-3d">Diseño e impresión 3D</Link>
        </nav>

        <div className="footer-contact">
          <h6>Contacto</h6>
          <a href={mailtoUrl(contact)}>{contact.email}</a>
          {contact.phone && <a href={telUrl(contact)}>{contact.phone.display}</a>}
          <span>Atención en todo {SITE.areaServed}</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 {SITE.name}</span>
        <Link to="/privacidad" className="footer-privacy">
          Información de privacidad
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
