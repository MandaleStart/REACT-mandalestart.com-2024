import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useContact } from '../../config/useContact';
import serviceCatalog from '../../data/serviceCatalog';
import {
  buildBusinessStructuredData,
  DEFAULT_DESCRIPTION,
  DEFAULT_ROBOTS,
  getPageMetadata,
  SITE_URL,
  SOCIAL_IMAGE,
} from '../../seo/metadata';
import { getPublicServiceBySlug } from '../../services/serviceCatalogApi';

function updateMeta(selector, value) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    const [key, keyValue] = selector.match(/\[(name|property)="([^"]+)"\]/).slice(1);
    element.setAttribute(key, keyValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

const Seo = () => {
  const { pathname } = useLocation();
  const contact = useContact();

  useEffect(() => {
    const page = getPageMetadata(pathname, serviceCatalog);
    const canonicalUrl = `${SITE_URL}${page.path}`;
    const description = page.description || DEFAULT_DESCRIPTION;
    const robots = page.robots || DEFAULT_ROBOTS;

    document.documentElement.lang = 'es-UY';
    document.title = page.title;
    updateMeta('meta[name="description"]', description);
    updateMeta('meta[name="robots"]', robots);
    updateMeta('meta[property="og:type"]', 'website');
    updateMeta('meta[property="og:locale"]', 'es_UY');
    updateMeta('meta[property="og:site_name"]', 'MandaleStart');
    updateMeta('meta[property="og:title"]', page.title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:url"]', canonicalUrl);
    updateMeta('meta[property="og:image"]', SOCIAL_IMAGE);
    updateMeta('meta[property="og:image:alt"]', 'MandaleStart: desarrollo web y soporte técnico en Uruguay');
    updateMeta('meta[property="og:image:width"]', '1200');
    updateMeta('meta[property="og:image:height"]', '630');
    updateMeta('meta[name="twitter:card"]', 'summary_large_image');
    updateMeta('meta[name="twitter:title"]', page.title);
    updateMeta('meta[name="twitter:description"]', description);
    updateMeta('meta[name="twitter:image"]', SOCIAL_IMAGE);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    let structuredData = document.getElementById('business-structured-data');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'business-structured-data';
      structuredData.type = 'application/ld+json';
      document.head.appendChild(structuredData);
    }
    structuredData.id = 'business-structured-data';
    structuredData.type = 'application/ld+json';
    structuredData.textContent = JSON.stringify(buildBusinessStructuredData(contact, SITE_URL));

    if (pathname.startsWith('/services/')) {
      const controller = new AbortController();
      const slug = pathname.slice('/services/'.length);
      getPublicServiceBySlug(slug, controller.signal)
        .then((service) => {
          if (controller.signal.aborted) return;
          if (!service) {
            document.title = 'Servicio no encontrado | MandaleStart';
            updateMeta('meta[name="robots"]', 'noindex, nofollow');
            return;
          }

          const title = `${service.title} en Uruguay | MandaleStart`;
          const description = `${service.description} Atención a personas y negocios de todo Uruguay.`;
          document.title = title;
          updateMeta('meta[name="description"]', description);
          updateMeta('meta[property="og:title"]', title);
          updateMeta('meta[property="og:description"]', description);
          updateMeta('meta[name="twitter:title"]', title);
          updateMeta('meta[name="twitter:description"]', description);
        })
        .catch((requestError) => {
          if (requestError.name !== 'AbortError') {
            console.warn('No se pudo actualizar el SEO del servicio:', requestError.message);
          }
        });
      return () => controller.abort();
    }

    return undefined;
  }, [contact, pathname]);

  return null;
};

export default Seo;
