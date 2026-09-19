import { useState } from 'react';
import './comments.css';

const initialTestimonials = [
  {
    client: 'Marina T.',
    service: 'Desarrollo web',
    text: 'La web quedó mucho más clara, más premium y super útil para vender. Me ayudó a ordenar la oferta y a convertir mejor.',
    rating: 5,
  },
  {
    client: 'Luciano P.',
    service: 'Hosting + SEO',
    text: 'Todo quedó funcionando mejor, más rápido y con mejor presencia. La diferencia fue notable desde el primer mes.',
    rating: 5,
  },
  {
    client: 'Diego R.',
    service: 'Infraestructura',
    text: 'Nos arregló la parte técnica y dejé de perder tiempo con fallas y configuración. Muy práctico y claro.',
    rating: 5,
  },
];

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
        <h1>Lo que dicen quienes confiaron en este proceso.</h1>
        <p>
          Trabajo claro, técnico y enfocado en resultados. Más que estética, soluciones que realmente ayudan a crecer.
        </p>
      </section>

      <section className="comments-layout">
        <div className="comments-list">
          {testimonials.map(({ client, service: clientService, text, rating: clientRating }, index) => (
            <article key={`${client}-${index}`} className="testimonial-card">
              <div className="testimonial-topline">
                <span className="client-name">{client}</span>
                <span className="rating">{'★'.repeat(clientRating)}{'☆'.repeat(5 - clientRating)}</span>
              </div>
              <strong>{clientService}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <form className="review-form" onSubmit={handleSubmit}>
          <h2>Dejá tu experiencia</h2>
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
              placeholder="Contanos qué te ayudó, qué necesitabas y cómo quedó el resultado."
            />
          </div>

          <button type="submit" className="primary-button">Enviar comentario</button>
        </form>
      </section>
    </main>
  );
};

export default Comments;
