import { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';

import './App.css';

import Home from './views/Home/Home';
import AboutMe from './views/Aboutme/AboutMe';
import Contact from './views/Contact/Contact';
import ErrorPage from './components/Errors/ErrorPage';
import Projects from './views/Projects/Projects';
import Services from './views/Services/Services';
import ServiceDetail from './views/Services/ServiceDetail';
import Comments from './views/Comments/Comments';
import CV from './views/cv/cv';
import Privacy from './views/Privacy/Privacy';

import Navbar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';
import Seo from './components/Seo/Seo';
import ClientAreaContext from './components/ClientAreaContext';
import AdminContext from './components/AdminContext';
import { getPageMetadata } from './seo/metadata';
import useServiceCatalog from './data/useServiceCatalog';

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

  return <span className="visually-hidden" aria-live="polite" aria-atomic="true">{routeTitle}</span>;
}

function App() {
  const ClientAreaComponent = useContext(ClientAreaContext) || ClientArea;
  const AdminComponent = useContext(AdminContext) || Admin;

  return (
    <>
      <Seo />
      <div className="app-shell">
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <Navbar />
        <div className="page-shell" id="contenido" tabIndex="-1">
          <RouteFocusManager />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/aboutme" element={<AboutMe />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/files" element={<AboutMe />} />
            <Route path="/cv" element={<CV />} />
            <Route path="/privacidad" element={<Privacy />} />
            <Route
              path="/admin"
              element={(
                <Suspense fallback={<main className="page-shell" aria-live="polite">Cargando el panel administrativo…</main>}>
                  <AdminComponent />
                </Suspense>
              )}
            />
            <Route
              path="/client-area"
              element={(
                <Suspense fallback={<main className="page-shell" aria-live="polite">Cargando el área de clientes…</main>}>
                  <ClientAreaComponent />
                </Suspense>
              )}
            />
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </div>
        <Footer />
        <SpeedInsights />
      </div>
    </>
  );
}

export default App;