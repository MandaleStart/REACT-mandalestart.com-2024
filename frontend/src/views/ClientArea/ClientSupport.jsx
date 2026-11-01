import { useContact } from '../../config/useContact';
import { mailtoUrl, whatsappUrl } from '../../config/site';

export default function ClientSupport() {
  const contact = useContact();
  const whatsapp = whatsappUrl(contact);
  return (
    <section className="client-panel client-support-panel">
      <span className="panel-tag">A tu lado</span>
      <h2>Soporte</h2>
      <p>Contame qué pasó. Cuantos más detalles me des, mejor voy a poder ayudarte.</p>
      <div className="client-guidance-actions">
        <a
          className="primary-button"
          href={mailtoUrl(
            contact,
            'Consulta desde mi área de cliente',
            'Contame qué pasó. Cuantos más detalles me des, mejor voy a poder ayudarte.',
          )}
        >
          Escribirme por email
        </a>
        {whatsapp && (
          <a className="secondary-button" href={whatsapp} target="_blank" rel="noreferrer">
            Contactarme por WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}
