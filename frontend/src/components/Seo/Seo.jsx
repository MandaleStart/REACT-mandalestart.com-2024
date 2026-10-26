import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useContact } from '../../config/useContact';
import { SITE } from '../../config/site';
import useServiceCatalog from '../../data/useServiceCatalog';
import { buildBusinessStructuredData, getRobots, getPageMetadata, SITE_URL, SOCIAL_IMAGE } from '../../seo/metadata';
import { getPageHeadMetadata } from '../../seo/pageHeadMetadata';

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
  const { services } = useServiceCatalog();

  useEffect(() => {
    const page = getPageMetadata(pathname, services);
    const head = getPageHeadMetadata({
      page,
      siteUrl: SITE_URL,
      socialImage: SOCIAL_IMAGE,
      robots: getRobots(page.robots),
      siteName: SITE.name,
      areaServed: SITE.areaServed,
    });

    document.documentElement.lang = 'es-UY';
    document.title = head.title;
    head.meta.forEach(({ attribute, key, content }) => {
      updateMeta(`meta[${attribute}="${key}"]`, content);
    });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = head.canonicalUrl;

    let structuredData = document.getElementById('business-structured-data');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'business-structured-data';
      structuredData.type = 'application/ld+json';
      document.head.appendChild(structuredData);
    }
    structuredData.textContent = JSON.stringify(buildBusinessStructuredData(contact, SITE_URL));
  }, [contact, pathname, services]);

  return null;
};

export default Seo;
