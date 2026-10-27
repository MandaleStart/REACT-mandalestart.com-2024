import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { SITE } from '../../config/site';
import { auth } from '../../firebase';
import './navbar.css';

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navUser, setNavUser] = useState(null);
  const { pathname } = useLocation();
  const dropdownRefs = useRef({});
  const triggerRefs = useRef({});
  const mobileTriggerRef = useRef(null);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, setNavUser);
  }, []);

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
    { to: '/', label: SITE.nav.home },
    { to: '/projects', label: SITE.nav.projects },
    { to: '/aboutme', label: SITE.nav.about },
    { to: '/contact', label: SITE.nav.contact },
  ];

  const serviceLinks = SITE.services.menu;

  const moreLinks = [{ to: '/login', label: SITE.nav.clientArea }];

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
              <small>{SITE.brand.subtitle}</small>
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
              <div className="navbar-primary">
                {navItems.map(({ to, label }) => (
                  <NavLink key={to} className="nav-link" to={to} onClick={closeMenus}>
                    {label}
                  </NavLink>
                ))}

                <div
                  className={`nav-dropdown${openMenu === 'services' ? ' is-open' : ''}`}
                  id="services-dropdown"
                  ref={(element) => {
                    dropdownRefs.current.services = element;
                  }}
                >
                  <button
                    type="button"
                    className="nav-link nav-dropdown-toggle"
                    aria-expanded={openMenu === 'services'}
                    aria-controls="services-menu"
                    ref={(element) => {
                      triggerRefs.current.services = element;
                    }}
                    onClick={() => toggleMenu('services')}
                  >
                    {SITE.nav.services}
                  </button>
                  <div className="nav-dropdown-menu" id="services-menu">
                    {serviceLinks.map(({ to, label }) => (
                      <NavLink key={to} className="nav-dropdown-link" to={to} onClick={closeMenus}>
                        {label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>

              <div className="navbar-actions">
                {navUser ? (
                  <NavLink
                    className="nav-link nav-account-link"
                    to="/perfil"
                    onClick={closeMenus}
                    aria-label={`Perfil de ${navUser.displayName || navUser.email}`}
                    title={navUser.displayName || navUser.email}
                  >
                    {navUser.displayName || navUser.email || 'Mi perfil'}
                  </NavLink>
                ) : (
                  <div
                    className={`nav-dropdown${openMenu === 'more' ? ' is-open' : ''}`}
                    id="more-dropdown"
                    ref={(element) => {
                      dropdownRefs.current.more = element;
                    }}
                  >
                    <button
                      type="button"
                      className="nav-link nav-dropdown-toggle"
                      aria-expanded={openMenu === 'more'}
                      aria-controls="more-menu"
                      ref={(element) => {
                        triggerRefs.current.more = element;
                      }}
                      onClick={() => toggleMenu('more')}
                    >
                      Acceso
                    </button>
                    <div className="nav-dropdown-menu" id="more-menu">
                      {moreLinks.map(({ to, label }) => (
                        <NavLink key={to} className="nav-dropdown-link" to={to} onClick={closeMenus}>
                          {label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}

                <NavLink className="nav-cta" to="/contact" onClick={closeMenus}>
                  {SITE.brand.ctaLabel}
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
