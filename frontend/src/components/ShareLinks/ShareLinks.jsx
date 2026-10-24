import { useLocation } from 'react-router-dom';
import serviceCatalog from '../../data/serviceCatalog';
import { getPageMetadata, SITE_URL } from '../../seo/metadata';
import './share-links.css';

const ShareLinks = () => {
  const { pathname } = useLocation();
  const pagePath = pathname === '/files' ? '/aboutme' : pathname;
  const pageUrl = `${SITE_URL}${pagePath}`;
  const title = getPageMetadata(pagePath, serviceCatalog).title;
  const encodedUrl = encodeURIComponent(pageUrl);
  const message = encodeURIComponent(`${title}: ${pageUrl}`);

  return (
    <section className="sharing-section" aria-labelledby="sharing-title">
      <div>
        <span className="eyebrow small">Compartir</span>
        <h2 id="sharing-title">¿Te resultó útil esta página?</h2>
        <p>Compartila con alguien a quien también pueda servirle.</p>
      </div>
      <div className="sharing-links">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartir ${title} en Facebook`}
        >
          Facebook
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartir ${title} en LinkedIn`}
        >
          LinkedIn
        </a>
        <a
          href={`https://api.whatsapp.com/send/?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartir ${title} por WhatsApp`}
        >
          WhatsApp
        </a>
      </div>
    </section>
  );
};

export default ShareLinks;
