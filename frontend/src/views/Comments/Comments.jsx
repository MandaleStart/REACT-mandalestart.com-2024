import { Link } from 'react-router-dom';
import './comments.css';

const Comments = () => {
  return (
    <main className="comments-page">
      <section className="comments-header">
        <span className="eyebrow">Opiniones</span>
        <h1>Opiniones sobre mi trabajo</h1>
        <p>
          Voy a publicar aquí opiniones verificadas con autorización de cada cliente. Todavía no
          tengo reseñas publicadas.
        </p>
      </section>

      <section className="comments-empty-state">
        <article className="testimonial-card">
          <h2>Aún no hay opiniones publicadas</h2>
          <p>
            Si ya trabajaste conmigo, podés escribirme para compartir tu experiencia. Solo voy a
            publicar tu comentario con tu autorización.
          </p>
          <Link to="/contact" className="primary-button">
            Contactarme
          </Link>
        </article>
      </section>
    </main>
  );
};

export default Comments;
