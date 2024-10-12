import React from 'react';

const AboutMe = () => {
  return (
    <main className="main-about mb-4 text-white">
      <div className="d-flex flex-column flex-sm-row">
        <section className="mb-4 mb-sm-0 order-1">
          <div className="container mx-auto">
            <div className="bg_perfil"></div>
            <img src="../img/img_perfil.png" alt="foto personal" />
            <div className="bg_perfil"></div>
          </div>
        </section>
        <section id="am_text" className="flex-grow-1 flex-sm-grow-0 pl-sm-3 order-2 ws_box">
          <div className="col-sm-12 col-lg-6 am_p">
            <h1>Quién soy?</h1>
            <p>Hola me llamo Nicolas, un joven desarrollador web con una pasión por crear soluciones digitales atractivas y eficientes.</p>
            <p>Después de completar un curso en desarrollo web, tengo una sólida comprensión de las tecnologías web, incluyendo HTML, CSS y JavaScript.</p>
          </div>
          <div className="col-sm-12 am_p">
            <p>Me apasiona el diseño y la experiencia de usuario, y siempre busco maneras de hacer que mi trabajo sea atractivo y accesible para todos los usuarios.</p>
            <p>Además de mi formación técnica, también tengo una mentalidad de trabajo en equipo y colaboración.</p>
          </div>
          <div className="col-sm-12 am_p">
            <p>Me gusta trabajar con otros desarrolladores, diseñadores y stakeholders para comprender sus necesidades y crear soluciones personalizadas que se ajusten a sus requisitos.</p>
            <p>Soy un buen comunicador y siempre estoy dispuesto a escuchar y aprender de mis colegas.</p>
            <p>En mi tiempo libre, me encanta experimentar con nuevas tecnologías y mejorar mis habilidades en línea.</p>
            <p>También disfruto de la fotografía y la exploración urbana.</p>
            <p>Estoy emocionado de empezar a trabajar en proyectos innovadores que tengan un impacto positivo en la sociedad.</p>
            <p>Y estoy abierto a nuevas oportunidades y desafíos, además de ansioso de ver a dónde me llevará mi carrera en el futuro.</p>
          </div>
        </section>
      </div>
      <div className="banner bg-dark text-white py-5">
        <div className="container text-center">
          <h1 className="mb-1">...y ahora, ¿hablamos de ti y tu proyecto?</h1>
          <a href="../view/projects.html" className="mb-3 btn btn-success">
            VAMOS
          </a>
        </div>
      </div>
    </main>
  );
};

export default AboutMe;
