import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <main className="home-main">
      <section className="home-hero">
        <h1 className="home-title">¿Necesitas desarrollar un sitio web?</h1>
      </section>

      <section className="home-banner">
        <h2 className="home-heading">Web Institucionales o de negocio</h2>
        <div className="home-slider">
          <p className="home-paragraph">Incluso para un negocio pequeño o que va comenzando</p>
          <p className="home-paragraph">Un sitio web institucional o corporativo debe ser una de sus primeras inversiones importantes.</p>
        </div>
      </section>

      <section className="home-banner">
        <h2 className="home-heading">Web Personal o portafolios</h2>
        <div className="home-slider">
          <p className="home-paragraph">El sitio web personal o portafolios ayudan a mostrar el CV de una manera atractiva y fácil de entender.</p>
        </div>
      </section>

      <section className="home-banner">
        <h2 className="home-heading">Ecommerce</h2>
        <div className="home-slider">
          <p className="home-paragraph">Creados para realizar compras en línea</p>
          <p className="home-paragraph">Los Ecommerce permiten que tu negocio ya no dependa de tiendas físicas para realizar ventas.</p>
        </div>
      </section>

      <section className="home-banner">
        <h2 className="home-heading">Wiki o foros de comunidades</h2>
        <div className="home-slider">
          <p className="home-paragraph">Las wiki son una buena opción para mejorar y compartir tu conocimiento.</p>
          <p className="home-paragraph">Porque este se construye de manera colaborativa y se puede actualizar en cualquier momento.</p>
        </div>
      </section>

      <section className="home-banner">
        <h2 className="home-heading">Blogs</h2>
        <div className="home-slider">
          <p className="home-paragraph">En un blog se publican artículos cortos con contenido actualizado y novedoso sobre temas específicos o libres.</p>
        </div>
      </section>

      <section className="home-banner">
        <h2 className="home-heading">¡O lo que se te ocurra!</h2>
        <div className="home-slider">
          <p className="home-paragraph">Libera tu imaginación</p>
        </div>
      </section>

      <section className="home-services">
        <h2 className="home-heading">Nuestros Servicios</h2>
        <div className="home-services-cards">
          <div className="home-card">
            <h3 className="home-card-title">Marketing Digital</h3>
            <p className="home-paragraph">Aumenta la visibilidad de tu negocio en línea y atrae más clientes con estrategias de marketing digital efectivas.</p>
            <p className="home-paragraph">Ofrecemos servicios de SEO, SEM, marketing de contenidos y más.</p>
          </div>
          <div className="home-card">
            <h3 className="home-card-title">Gestión de Redes Sociales</h3>
            <p className="home-paragraph">Potencia tu presencia en redes sociales con estrategias personalizadas.</p>
            <p className="home-paragraph">Nos encargamos de la creación de contenido, gestión de comunidades y análisis de rendimiento.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
