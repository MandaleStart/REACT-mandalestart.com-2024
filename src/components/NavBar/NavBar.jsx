import { Link } from 'react-router-dom';
import './navbar.css';

const Navbar = () => {
  const navItems = [
    { to: '/', label: 'Inicio' },
    { to: '/projects', label: 'Proyectos' },
    { to: '/aboutme', label: 'Sobre mí' },
    { to: '/contact', label: 'Contacto' },
    { to: '/comments', label: 'Opiniones' },
    { to: '/cv', label: 'CV' },
  ];

  const serviceLinks = [
    { to: '/services', label: 'Todos los servicios' },
    { to: '/services/web', label: 'Desarrollo web' },
    { to: '/services/hosting', label: 'Hosting web' },
    { to: '/services/email', label: 'Email / mail' },
    { to: '/services/domains', label: 'Dominios' },
    { to: '/services/seo', label: 'SEO' },
    { to: '/services/ddns', label: 'DDNS' },
    { to: '/services/monitoring', label: 'Infraestructura' },
  ];

  return (
    <header className="topbar-wrap">
      <nav className="navbar navbar-expand-lg topbar">
        <div className="container-fluid topbar-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">M</span>
            <span>
              <strong>MandaleStart</strong>
              <small>Growth Studio</small>
            </span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              {navItems.map(({ to, label }) => (
                <Link key={to} className="nav-link" to={to}>
                  {label}
                </Link>
              ))}

              <div className="nav-dropdown">
                <button type="button" className="nav-link nav-dropdown-toggle">
                  Servicios
                </button>
                <div className="nav-dropdown-menu">
                  {serviceLinks.map(({ to, label }) => (
                    <Link key={to} className="nav-dropdown-link" to={to}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <Link className="nav-cta" to="/contact">
                Cotizar proyecto
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;