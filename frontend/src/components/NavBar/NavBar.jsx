import { Link } from 'react-router-dom';
import { useState } from 'react';
import './navbar.css';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState('');

  const navItems = [
    { to: '/', label: 'Inicio' },
    { to: '/projects', label: 'Proyectos' },
    { to: '/aboutme', label: 'Sobre mí' },
    { to: '/contact', label: 'Contacto' },
  ];

  const serviceLinks = [
    { to: '/services', label: 'Todos los servicios' },
    { to: '/services/web', label: 'Desarrollo web' },
    { to: '/services/hosting', label: 'Hosting web' },
    { to: '/services/email', label: 'Correo empresarial' },
    { to: '/services/domains', label: 'Dominios' },
    { to: '/services/seo', label: 'SEO' },
    { to: '/services/ddns', label: 'DDNS' },
    { to: '/services/monitoring', label: 'Infraestructura' },
    { to: '/services/impresion-3d', label: 'Diseño e impresión 3D' },
  ];

  const moreLinks = [
    { to: '/client-area', label: 'Área de clientes' },
    { to: '/comments', label: 'Opiniones' },
    { to: '/cv', label: 'CV' },
  ];

  const toggleMenu = (menu) => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? '' : menu));
  };

  const closeMenus = () => setOpenMenu('');

  return (
    <header className="topbar-wrap">
      <nav className="navbar navbar-expand-xl topbar">
        <div className="container-fluid topbar-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">M</span>
            <span>
              <strong>MandaleStart</strong>
              <small>Web y soporte técnico</small>
            </span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Abrir menú de navegación"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              {navItems.map(({ to, label }) => (
                <Link key={to} className="nav-link" to={to} onClick={closeMenus}>
                  {label}
                </Link>
              ))}

              <div className={`nav-dropdown${openMenu === 'services' ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="nav-link nav-dropdown-toggle"
                  aria-haspopup="true"
                  aria-expanded={openMenu === 'services'}
                  onClick={() => toggleMenu('services')}
                >
                  Servicios
                </button>
                <div className="nav-dropdown-menu">
                  {serviceLinks.map(({ to, label }) => (
                    <Link key={to} className="nav-dropdown-link" to={to} onClick={closeMenus}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className={`nav-dropdown${openMenu === 'more' ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="nav-link nav-dropdown-toggle"
                  aria-haspopup="true"
                  aria-expanded={openMenu === 'more'}
                  onClick={() => toggleMenu('more')}
                >
                  Más
                </button>
                <div className="nav-dropdown-menu">
                  {moreLinks.map(({ to, label }) => (
                    <Link key={to} className="nav-dropdown-link" to={to} onClick={closeMenus}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <Link className="nav-cta" to="/contact" onClick={closeMenus}>
                Pedir presupuesto
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;