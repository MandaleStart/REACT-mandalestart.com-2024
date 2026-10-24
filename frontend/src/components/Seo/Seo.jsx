import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import serviceCatalog from '../../data/serviceCatalog';
import { DEFAULT_DESCRIPTION, getPageMetadata, SITE_URL, SOCIAL_IMAGE } from '../../seo/metadata';

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

  useEffect(() => {
    const page = getPageMetadata(pathname, serviceCatalog);
    const canonicalUrl = `${SITE_URL}${page.path}`;
    const description = page.description || DEFAULT_DESCRIPTION;
    const robots = page.robots || 'index, follow, max-image-preview:large';

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
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'MandaleStart',
      url: SITE_URL,
      image: SOCIAL_IMAGE,
      description: DEFAULT_DESCRIPTION,
      email: 'info@mandalestart.com',
      telephone: '+59891598586',
      areaServed: {
        '@type': 'Country',
        name: 'Uruguay',
      },
      availableLanguage: 'es-UY',
      sameAs: ['https://www.linkedin.com/in/mandalestart'],
    });
  }, [pathname]);

  return null;
};

export default Seo;
