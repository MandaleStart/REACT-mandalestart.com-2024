import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContact } from '../../../config/useContact';
import { whatsappUrl } from '../../../config/site';
import serviceCatalog from '../../../data/serviceCatalog';
import { submitContactMessage } from '../../../services/contactApi';
import './mail.css';

const serviceOptions = [
  { value: 'web', slug: 'web', fallback: 'Desarrollo web' },
  { value: 'hosting', slug: 'hosting', fallback: 'Hosting y dominios' },
  { value: 'correo', slug: 'email', fallback: 'Correo corporativo' },
  { value: 'seo', slug: 'seo', fallback: 'SEO' },
  { value: 'ddns', slug: 'ddns', fallback: 'DDNS y acceso remoto' },
  { value: 'red', slug: 'monitoring', fallback: 'Redes, servidores y monitoreo' },
  { value: 'impresion', slug: 'impresion-3d', fallback: 'Diseño e impresión 3D' },
  { value: 'otro', fallback: 'Otro' },
].map((option) => ({
  ...option,
  label: serviceCatalog.find((service) => service.slug === option.slug)?.title || option.fallback,
}));

const MailBox = () => {
  const contact = useContact();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [messageLength, setMessageLength] = useState(0);
  const feedbackRef = useRef(null);

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await submitContactMessage({
        name: formData.get('name'),
        email: formData.get('email'),
        service: formData.get('service'),
        message: formData.get('message'),
        website: formData.get('website'),
      });
      form.reset();
      setMessageLength(0);
      setFeedback({ type: 'success', message: result.message });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = (event) => {
    const form = event.currentTarget.form;
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const service = form.elements.service.selectedOptions[0]?.textContent || '';
    const message = `Nombre: ${formData.get('name')}\nEmail: ${formData.get('email')}\nServicio: ${service}\n\nMensaje:\n${formData.get('message')}`;
    const url = whatsappUrl(contact, message);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-honeypot" aria-hidden="true">
        <label htmlFor="website">Dejá este campo vacío</label>
        <input id="website" name="website" type="text" tabIndex="-1" autoComplete="off" />
      </div>
      <div className="form-row">
        <div className="field-group">
          <label htmlFor="name">Nombre</label>
          <input type="text" id="name" name="name" autoComplete="name" placeholder="Tu nombre" maxLength={120} aria-describedby="name-help" required />
          <small id="name-help" className="contact-field-help">Hasta 120 caracteres.</small>
        </div>
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" autoComplete="email" placeholder="tu@email.com" maxLength={254} aria-describedby="email-help" required />
          <small id="email-help" className="contact-field-help">Hasta 254 caracteres.</small>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="service">Servicio</label>
        <select id="service" name="service" defaultValue="" required>
          <option value="" disabled>Elegí una opción</option>
          {serviceOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="message">Mensaje</label>
        <textarea
          id="message"
          name="message"
          rows="6"
          placeholder="Contame qué necesitás, para cuándo y qué resultado esperás."
          maxLength={5000}
          aria-describedby="message-help message-count"
          onChange={(event) => setMessageLength(event.target.value.length)}
          required
        />
        <small id="message-help" className="contact-field-help">Hasta 5000 caracteres.</small>
        <small id="message-count" className="contact-message-count" aria-live="polite">{messageLength}/5000</small>
      </div>

      {feedback && (
        <p
          className={`contact-form-feedback ${feedback.type}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          tabIndex="-1"
          ref={feedbackRef}
        >
          {feedback.message}
        </p>
      )}
      <label className="contact-form-consent" htmlFor="privacy-consent">
        <input id="privacy-consent" name="privacyConsent" type="checkbox" required />
        <span>
          Autorizo el uso de estos datos para responder mi consulta. Leé la{' '}
          <Link to="/privacidad">política de privacidad</Link>.
        </span>
      </label>
      <button type="submit" className="Btn_Send" disabled={submitting}>
        {submitting ? 'Enviando...' : 'Enviar consulta'}
      </button>
      {/* TODO(owner): confirmar si se debe mostrar el tiempo de respuesta esperado. */}
      {contact.phone && (
        <button type="button" className="secondary-button" onClick={handleWhatsApp}>
          Continuar por WhatsApp
        </button>
      )}
    </form>
  );
};

export default MailBox;
