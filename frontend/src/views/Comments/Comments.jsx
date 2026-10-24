import { useState } from 'react';
import './comments.css';

const initialTestimonials = [];

const Comments = () => {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!name.trim() || !service.trim() || !message.trim()) {
      return;
    }

    const newEntry = {
      client: name.trim(),
      service: service.trim(),
      text: message.trim(),
      rating,
    };

    setTestimonials([newEntry, ...testimonials]);
    setName('');
    setService('');
    setMessage('');
    setRating(5);
  };

  return (
    <main className="comments-page">
      <section className="comments-header">
        <span className="eyebrow">Opiniones</span>
        <h1>Opiniones de clientes</h1>
        <p>
          Si ya trabajamos juntos, podés contar cómo fue la experiencia.
        </p>
      </section>

      <section className="comments-layout">
        <div className="comments-list">
          {testimonials.length === 0 ? (
            <article className="testimonial-card">
              <p>Todavía no hay opiniones publicadas.</p>
            </article>
          ) : (
            testimonials.map(({ client, service: clientService, text, rating: clientRating }, index) => (
              <article key={`${client}-${index}`} className="testimonial-card">
                <div className="testimonial-topline">
                  <span className="client-name">{client}</span>
                  <span className="rating">{'★'.repeat(clientRating)}{'☆'.repeat(5 - clientRating)}</span>
                </div>
                <strong>{clientService}</strong>
                <p>{text}</p>
              </article>
            ))
          )}
        </div>

        <form className="review-form" onSubmit={handleSubmit}>
          <h2>Dejá tu opinión</h2>
          <div className="form-field">
            <label htmlFor="name">Nombre</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
          </div>

          <div className="form-field">
            <label htmlFor="service">Servicio</label>
            <input id="service" value={service} onChange={(e) => setService(e.target.value)} placeholder="Ej: Hosting y SEO" />
          </div>

          <div className="form-field">
            <label>Valoración</label>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= rating ? 'star active' : 'star'}
                  onClick={() => setRating(value)}
                  aria-label={`Calificar con ${value} estrellas`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="message">Comentario</label>
            <textarea
              id="message"
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="¿Qué necesitabas y cómo fue el trabajo?"
            />
          </div>

          <button type="submit" className="primary-button">Enviar comentario</button>
        </form>
      </section>
    </main>
  );
};

export default Comments;
