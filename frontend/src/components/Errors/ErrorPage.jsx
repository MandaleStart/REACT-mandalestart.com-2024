import { Link } from 'react-router-dom';
import './ErrorPage.css';

const ErrorPage = () => {
  return (
    <main className="error-page-container text-center">
      <div className="error-page-content">
        <h1 className="error-heading">Error 404 - Página no encontrada</h1>
        <p className="error-message">No encontramos la página que buscás.</p>
        <p className="error-message">Esta dirección no lleva a una página disponible.</p>
        <p>Volvé al <Link to="/" className="home-link">inicio</Link> para seguir navegando.</p>
      </div>
    </main>
  );
}

export default ErrorPage;