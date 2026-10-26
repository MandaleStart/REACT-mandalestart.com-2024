import SiteIcon from '../../../components/SiteIcon/SiteIcon';
import { useContact } from '../../../config/useContact';
import { SITE, whatsappUrl } from '../../../config/site';

const SocialNet = () => {
  const contact = useContact();
  const channels = [
    ...(contact.phone
      ? [{ name: 'WhatsApp', value: contact.phone.display, href: whatsappUrl(contact), icon: 'whatsapp', tone: 'cyan' }]
      : []),
    { name: 'Telegram', value: SITE.social.telegram.handle, href: SITE.social.telegram.url, icon: 'telegram', tone: 'green' },
    { name: 'LinkedIn', value: SITE.social.linkedin.label, href: SITE.social.linkedin.url, icon: 'linkedin', tone: 'purple' },
  ];

  return (
    <div className="contact-links-wrap">
      <div className="contact-intro">
        <h3>También podés escribirme por acá</h3>
        <p>Elegí el canal que te quede más cómodo.</p>
      </div>

      {channels.map(({ name, value, href, icon, tone }) => (
        <a key={name} className={`contact-link-item ${tone}`} href={href} target="_blank" rel="noreferrer">
          <span className="contact-icon"><SiteIcon name={icon} /></span>
          <span className="contact-link-copy">
            <strong>{name}</strong>
            <small>{value}</small>
          </span>
        </a>
      ))}
    </div>
  );
};

export default SocialNet;
