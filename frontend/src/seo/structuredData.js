import homeFaq from '../data/homeFaq.js';
import { SITE } from '../config/site.js';

export function buildPageStructuredData({ pagePath, siteUrl, businessData, serviceCatalog }) {
  const entities = [{ ...businessData, '@id': `${siteUrl}/#business` }];

  if (pagePath === '/aboutme') {
    entities.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `${siteUrl}/aboutme#person`,
      name: 'Nicolás Jorge',
      jobTitle: 'Desarrollador frontend',
      url: `${siteUrl}/aboutme`,
      sameAs: [SITE.social.linkedin.url, SITE.social.telegram.url],
      worksFor: { '@id': `${siteUrl}/#business` },
    });
  }

  if (pagePath.startsWith('/services/')) {
    const slug = pagePath.slice('/services/'.length);
    const service = serviceCatalog.find((item) => item.slug === slug);
    if (service) {
      entities.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${siteUrl}${pagePath}#service`,
        name: service.title,
        description: service.description,
        url: `${siteUrl}${pagePath}`,
        serviceType: service.category || service.title,
        provider: { '@id': `${siteUrl}/#business` },
        areaServed: {
          '@type': 'Country',
          name: SITE.areaServed,
        },
      });
      entities.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { name: 'Inicio', item: siteUrl },
          { name: 'Servicios', item: `${siteUrl}/services` },
          { name: service.title, item: `${siteUrl}${pagePath}` },
        ].map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          ...item,
        })),
      });
    }
  }

  if (pagePath === '/') {
    entities.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: homeFaq.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    });
  }

  return entities;
}
