import React from 'react';

const Projects = () => {
  return (
    <main className="main-projects">
      <section className="row row-cols-1 row-cols-md-3 row-cols-lg-4 mb-4 mt-5">
        {/* Proyecto 1 */}
        <div className="col mt-4">
          <div className="card h-100">
            <img className="card-img-top" src="../img/e_commerce/ecommerce.jpg" alt="imagen de proyecto sobre un eccomerce" />
            <div className="card-body">
              <h5 className="card-title">E-commerce: JAP2022</h5>
              <p className="card-text">Pagina de comercio online basada en HTML, CSS, BOOTSTRAP y JS para programa JovenesaProgramar edición 2022</p>
            </div>
            <a className="btn btn-primary btn-block" href="../view/001.html">Más información</a>
          </div>
        </div>

        {/* Proyecto 2 */}
        <div className="col mt-4">
          <div className="card h-100">
            <img className="card-img-top w-80" src="../img/personal_website/personalweb.png" alt="imagen de proyecto de una web personal" />
            <div className="card-body">
              <h5 className="card-title">Pagina Web Personal</h5>
              <p className="card-text">Pagina web personal basada en HTML, CSS, BOOTSTRAP y JS</p>
            </div>
            <a className="btn btn-primary btn-block" href="../view/002.html">Más información</a>
          </div>
        </div>

        {/* Otros proyectos ... */}
        
      </section>
    </main>
  );
};

export default Projects;