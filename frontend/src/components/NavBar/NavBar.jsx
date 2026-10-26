import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { SITE } from '../../config/site';
import './navbar.css';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const dropdownRefs = useRef({});
  const triggerRefs = useRef({});
  const mobileTriggerRef = useRef(null);

  useEffect(() => {
    setOpenMenu('');
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!openMenu) return undefined;

    const dropdown = dropdownRefs.current[openMenu];
    const closeOnOutsideInteraction = (event) => {
      if (!dropdown?.contains(event.target)) setOpenMenu('');
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpenMenu('');
      triggerRefs.current[openMenu]?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsideInteraction);
    document.addEventListener('focusin', closeOnOutsideInteraction);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction);
      document.removeEventListener('focusin', closeOnOutsideInteraction);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key !== 'Escape' || openMenu) return;
      event.preventDefault();
      setMobileOpen(false);
      mobileTriggerRef.current?.focus();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen, openMenu]);

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
    { to: '/cv', label: 'CV' },
  ];

  const toggleMenu = (menu) => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? '' : menu));
  };

  const closeMenus = () => {
    setOpenMenu('');
    setMobileOpen(false);
  };

  return (
    <header className="topbar-wrap">
      <nav className="topbar navbar-container">
        <div className="topbar-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">M</span>
            <span>
              <strong>{SITE.name}</strong>
              <small>Web y soporte técnico</small>
            </span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            aria-controls="main-navigation"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            ref={mobileTriggerRef}
            onClick={() => setMobileOpen((isOpen) => !isOpen)}
          >
            <span className="navbar-toggler-icon" aria-hidden="true" />
          </button>

          <div className={`navbar-collapse${mobileOpen ? ' is-open' : ''}`} id="main-navigation">
            <div className="navbar-nav">
              {navItems.map(({ to, label }) => (
                <NavLink key={to} className="nav-link" to={to} onClick={closeMenus}>
                  {label}
                </NavLink>
              ))}

              <div
                className={`nav-dropdown${openMenu === 'services' ? ' is-open' : ''}`}
                id="services-dropdown"
                ref={(element) => { dropdownRefs.current.services = element; }}
              >
                <button
                  type="button"
                  className="nav-link nav-dropdown-toggle"
                  aria-expanded={openMenu === 'services'}
                  aria-controls="services-menu"
                  ref={(element) => { triggerRefs.current.services = element; }}
                  onClick={() => toggleMenu('services')}
                >
                  Servicios
                </button>
                <div className="nav-dropdown-menu" id="services-menu">
                  {serviceLinks.map(({ to, label }) => (
                    <NavLink key={to} className="nav-dropdown-link" to={to} onClick={closeMenus}>
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <div
                className={`nav-dropdown${openMenu === 'more' ? ' is-open' : ''}`}
                id="more-dropdown"
                ref={(element) => { dropdownRefs.current.more = element; }}
              >
                <button
                  type="button"
                  className="nav-link nav-dropdown-toggle"
                  aria-expanded={openMenu === 'more'}
                  aria-controls="more-menu"
                  ref={(element) => { triggerRefs.current.more = element; }}
                  onClick={() => toggleMenu('more')}
                >
                  Más
                </button>
                <div className="nav-dropdown-menu" id="more-menu">
                  {moreLinks.map(({ to, label }) => (
                    <NavLink key={to} className="nav-dropdown-link" to={to} onClick={closeMenus}>
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <NavLink className="nav-cta" to="/contact" onClick={closeMenus}>
                Pedir presupuesto
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;