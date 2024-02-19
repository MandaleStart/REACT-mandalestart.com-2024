import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Mandalestart
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNavAltMarkup"
          aria-controls="navbarNavAltMarkup"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
          <div className="navbar-nav">
            <Link className="nav-link" to="/">
              Inicio
            </Link>
            <Link className="nav-link" to="/contact">
              Contactame
            </Link>
            <Link className="nav-link" to="/projects">
              Proyectos
            </Link>
            <Link className="nav-link" to="/aboutme">
              Sobre mi
            </Link>
            <Link className="nav-link" to="/comments">
              Comentarios
            </Link>
          </div>
          <script
            className="nav-link col-5"
            type="text/javascript"
            src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
            data-name="bmc-button"
            data-slug="mandalesta"
            data-color="#FFDD00"
            data-emoji=""
            data-font="Lato"
            data-text="invítame un café "
            data-outline-color="#000000"
            data-font-color="#000000"
            data-coffee-color="#ffffff"
          ></script>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;