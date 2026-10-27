import { useLocation } from 'react-router-dom';
import { useContact } from '../../config/useContact';
import { SITE } from '../../config/site';
import useServiceCatalog from '../../data/useServiceCatalog';
import {
  buildBusinessStructuredData,
  getRobots,
  getPageMetadata,
  SITE_URL,
  SOCIAL_IMAGE,
} from '../../seo/metadata';
import { getPageHeadMetadata } from '../../seo/pageHeadMetadata';
import { buildPageStructuredData } from '../../seo/structuredData';

const Seo = () => {
  const { pathname } = useLocation();
  const contact = useContact();
  const { services } = useServiceCatalog();
  const page = getPageMetadata(pathname, services);
  const head = getPageHeadMetadata({
    page,
    siteUrl: SITE_URL,
    socialImage: SOCIAL_IMAGE,
    robots: getRobots(page.robots),
    siteName: SITE.name,
    areaServed: SITE.areaServed,
  });
  const structuredData = JSON.stringify(
    buildPageStructuredData({
      pagePath: page.path,
      siteUrl: SITE_URL,
      businessData: buildBusinessStructuredData(contact, SITE_URL),
      serviceCatalog: services,
    }),
  ).replaceAll('<', '\\u003c');

  return (
    <>
      <title>{head.title}</title>
      {head.meta.map(({ attribute, key, content }) => (
        <meta key={`${attribute}:${key}`} {...{ [attribute]: key }} content={content} />
      ))}
      <link rel="canonical" href={head.canonicalUrl} />
      <script
        id="page-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
    </>
  );
};

export default Seo;
