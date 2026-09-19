import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

import Navbar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="page-shell">
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
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </main>
        <Footer />
        <SpeedInsights />
      </div>
    </BrowserRouter>
  );
}

export default App;