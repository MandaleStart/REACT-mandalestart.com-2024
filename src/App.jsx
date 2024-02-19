// Importar las dependencias necesarias
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react"

// Importar componentes
import Home from './components/Home/Home';
import AboutMe from './components/Aboutme/AboutMe';
import Contact from './components/Contact/Contact';
import ErrorPage from './components/Errors/ErrorPage';
import Projects from './components/Projects/Projects';
import Comments from './components/Comments/Comments';
//import Files from './components/Files';

import Navbar from './components/NavBar/NavBar'
import Footer from './components/Footer/Footer'

// enrutador
function App() {
  return (
    <BrowserRouter>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aboutme" element={<AboutMe />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/comments" element={<Comments />} />
        <Route path="/files" element={<AboutMe />} />
        <Route path="*" element={<ErrorPage />} />      
        </Routes>
        
      <Footer></Footer>
      <SpeedInsights/>
      </BrowserRouter>
  );
}

export default App;