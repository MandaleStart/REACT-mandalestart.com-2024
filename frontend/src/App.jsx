import { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
const loadComments = () => import('./views/Comments/Comments');
const Comments = lazy(loadComments);
const loadCV = () => import('./views/CV/CV');
const CV = lazy(loadCV);
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

function App() {
  const ClientAreaComponent = useContext(ClientAreaContext) || ClientArea;
  const AdminComponent = useContext(AdminContext) || Admin;
  const staticRouteComponents = useContext(StaticRouteComponentsContext);
  const AboutMeComponent = staticRouteComponents.AboutMe || AboutMe;
  const ProjectsComponent = staticRouteComponents.Projects || Projects;
  const CommentsComponent = staticRouteComponents.Comments || Comments;
  const CVComponent = staticRouteComponents.CV || CV;

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
              <Route path="/comments" element={<CommentsComponent />} />
              <Route path="/files" element={<Navigate to="/aboutme" replace />} />
              <Route path="/cv" element={<CVComponent />} />
              <Route path="/privacidad" element={<Privacy />} />
              <Route
                path="/admin"
                element={
                  <Suspense
                    fallback={
                      <main className="page-shell" aria-live="polite">
                        Cargando el panel administrativo…
                      </main>
                    }
                  >
                    <AdminComponent />
                  </Suspense>
                }
              />
              <Route
                path="/client-area"
                element={
                  <Suspense
                    fallback={
                      <main className="page-shell" aria-live="polite">
                        Cargando el área de clientes…
                      </main>
                    }
                  >
                    <ClientAreaComponent />
                  </Suspense>
                }
              />
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
