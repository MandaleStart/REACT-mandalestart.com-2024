import React from 'react';
import { Link } from 'react-router-dom'; // Asegúrate de tener react-router-dom instalado para el uso de Link
import './ErrorPage.css'; // Importa tus estilos personalizados si es necesario

const ErrorPage = () => {
  return (
    <div className="error-page-container text-center">
      <div className="error-page-content">
        <h2 className="error-heading">Error 404 - Página no encontrada</h2>
        <p className="error-message">Lo sentimos, la página que estás buscando no existe.</p>
        <p className="error-message">Esta dirección no lleva a una página disponible.</p>
        <p>Volvé al <Link to="/" className="home-link">inicio</Link> para seguir navegando.</p>
      </div>
    </div>
  );
}

export default ErrorPage;