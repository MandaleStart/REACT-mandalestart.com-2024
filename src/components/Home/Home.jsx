import React from 'react';

const Home = () => {
  return (
    <main className="main-index">
      <h1 className="text-white d-flex justify-content-center">¿Necesitas desarrollar un sitio web?</h1>

      <div className="banner">
        <h2>Web Institucionales o de negocio</h2>
        <div className="slider">
          <div>
            <p className="p_slider d-none d-lg-block">Incluso para un negocio pequeño o que va comenzando</p>
          </div>
          <div>
            <p className="p_slider">Un sitio web institucional o corporativo debe ser una de sus primeras inversiones importantes.</p>
          </div>
        </div>
      </div>
      <div className="banner">
        <h2 className="">Web Personal o portafolios</h2>
        <div className="slider">
          <p className="p_slider">El sitio web personal o portafolios ayudan a mostrar el CV de una manera atractiva y fácil de entender.</p>
        </div>
      </div>

      <div className="banner">
        <h2 className="">Ecommerce</h2>
        <div className="slider">
          <p className="p_slider d-none d-lg-block">Creados para realizar compras en línea</p>
          <p className="p_slider">Los Ecommerce permiten que tu negocio ya no dependa de tiendas físicas para realizar ventas.</p>
        </div>
      </div>
      <div className="banner">
        <h2 className="">Wiki o foros de comunidades</h2>
        <div className="slider">
          <p className="p_slider">Las wiki son una buena opción para mejorar y compartir tu conocimiento.</p>
          <p className="p_slider d-none d-lg-block">Porque este se construye de manera colaborativa y se puede actualizar en cualquier momento.</p>
        </div>
      </div>
      <div className="banner">
        <h2 className="">Blogs</h2>
        <div className="slider">
          <p className="p_slider">En un blog se publican artículos cortos con contenido actualizado y novedoso sobre temas específicos o libres.</p>
        </div>
      </div>
      <div className="banner">
        <h2 className="">¡O lo que se te ocurra!</h2>
        <div className="slider">
          <p className="p_slider">Libera tu imaginación</p>
        </div>
      </div>
    </main>
  );
};

export default Home;
