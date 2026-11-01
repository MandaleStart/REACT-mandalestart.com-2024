import { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { auth } from './firebase';

import './App.css';

import Home from './views/Home/Home';
import Contact from './views/Contact/Contact';
import ErrorPage from './components/Errors/ErrorPage';
import Services from './views/Services/Services';
import ServiceDetail from './views/Services/ServiceDetail';
import Privacy from './views/Privacy/Privacy';

import Navbar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';
import Seo from './components/Seo/Seo';
import ClientAreaContext from './components/ClientAreaContext';
import AdminContext from './components/AdminContext';
import StaticRouteComponentsContext from './components/StaticRouteComponentsContext';
import { getPageMetadata } from './seo/metadata';
import useServiceCatalog from './data/useServiceCatalog';

const loadAboutMe = () => import('./views/Aboutme/AboutMe');
const AboutMe = lazy(loadAboutMe);
const loadProjects = () => import('./views/Projects/Projects');
const Projects = lazy(loadProjects);
const loadClientArea = () => import('./views/ClientArea/ClientArea');
const ClientArea = lazy(loadClientArea);
const loadAdmin = () => import('./views/Admin/Admin');
const Admin = lazy(loadAdmin);
function RouteFocusManager() {
  const { pathname } = useLocation();
  const { services } = useServiceCatalog();
  const [routeTitle, setRouteTitle] = useState('');

  useEffect(() => {
    setRouteTitle(getPageMetadata(pathname, services).title);

    const content = document.getElementById('contenido');
    content?.focus({ preventScroll: true });

    const focusHeading = () => {
      const heading = content?.querySelector('main h1');
      if (!heading) return;

      heading.tabIndex = -1;
      heading.focus();
      observer.disconnect();
    };
    const observer = new MutationObserver(focusHeading);

    if (content) {
      observer.observe(content, { childList: true, subtree: true });
      focusHeading();
    }

    return () => observer.disconnect();
  }, [pathname, services]);

  return (
    <span className="visually-hidden" aria-live="polite" aria-atomic="true">
      {routeTitle}
    </span>
  );
}

function LoginRouter() {
  const ClientAreaComponent = useContext(ClientAreaContext) || ClientArea;
  const AdminComponent = useContext(AdminContext) || Admin;
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/administracion');
  const isConfigurationRoute = pathname.startsWith('/administracion/configuraciones');
  const isClientRoute = pathname.startsWith('/area-cliente');
  const requiredRole = isAdminRoute ? 'admin' : isClientRoute ? 'client' : null;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setIsAdmin(false);
      setIsAuthenticated(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setIsAuthenticated(false);
        setAuthReady(true);
        return;
      }

      setAuthReady(false);
      setIsAuthenticated(true);
      try {
        const tokenResult = await user.getIdTokenResult(true);
        setIsAdmin(tokenResult.claims.admin === true);
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <main className="page-shell" aria-live="polite">
        Comprobando permisos…
      </main>
    );
  }

  if (!requiredRole) {
    return isAuthenticated ? (
      <Navigate to={isAdmin ? '/administracion' : '/area-cliente'} replace />
    ) : (
      <ClientAreaComponent />
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (isAdmin !== (requiredRole === 'admin')) {
    return <Navigate to={isAdmin ? '/administracion' : '/area-cliente'} replace />;
  }

  if (!isAdmin) return <ClientAreaComponent />;
  return <AdminComponent />;
}

function LegacyConfigurationsRedirect() {
  const { pathname, search, hash } = useLocation();
  const suffix = pathname.slice('/configuraciones'.length);
  return (
    <Navigate
      to={`/administracion/configuraciones${suffix}${search}${hash}`}
      replace
    />
  );
}

function App() {
  const staticRouteComponents = useContext(StaticRouteComponentsContext);
  const AboutMeComponent = staticRouteComponents.AboutMe || AboutMe;
  const ProjectsComponent = staticRouteComponents.Projects || Projects;

  return (
    <>
      <Seo />
      <div className="app-shell">
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <Navbar />
        <div className="page-shell" id="contenido" tabIndex="-1">
          <RouteFocusManager />
          <Suspense
            fallback={
              <div className="page-shell" role="status">
                Cargando página…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/aboutme" element={<AboutMeComponent />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/projects" element={<ProjectsComponent />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:slug" element={<ServiceDetail />} />
              <Route path="/comments" element={<Navigate to="/projects" replace />} />
              <Route path="/files" element={<Navigate to="/aboutme" replace />} />
              <Route path="/privacidad" element={<Privacy />} />
              <Route
                path="/login"
                element={
                  <Suspense
                    fallback={
                      <main className="page-shell" aria-live="polite">
                        Cargando acceso…
                      </main>
                    }
                  >
                    <LoginRouter />
                  </Suspense>
                }
              />
              <Route path="/perfil" element={<Navigate to="/login" replace />} />
              <Route
                path="/area-cliente/*"
                element={
                  <Suspense fallback={<main className="page-shell">Cargando área de clientes…</main>}>
                    <LoginRouter />
                  </Suspense>
                }
              />
              <Route
                path="/administracion/*"
                element={
                  <Suspense fallback={<main className="page-shell">Cargando administración…</main>}>
                    <LoginRouter />
                  </Suspense>
                }
              />
              <Route
                path="/configuraciones/*"
                element={
                  <LegacyConfigurationsRedirect />
                }
              />
              <Route path="/admin" element={<Navigate to="/administracion" replace />} />
              <Route path="/client-area" element={<Navigate to="/area-cliente" replace />} />
              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
        <SpeedInsights />
      </div>
    </>
  );
}

export default App;
