export function getPageHeadMetadata({
  page,
  siteUrl,
  socialImage,
  robots,
  siteName,
  areaServed,
}) {
  const description = page.description;

  return {
    title: page.title,
    description,
    robots,
    canonicalUrl: `${siteUrl}${page.path}`,
    meta: [
      { attribute: 'name', key: 'description', content: description },
      { attribute: 'name', key: 'robots', content: robots },
      { attribute: 'property', key: 'og:type', content: 'website' },
      { attribute: 'property', key: 'og:locale', content: 'es_UY' },
      { attribute: 'property', key: 'og:site_name', content: siteName },
      { attribute: 'property', key: 'og:title', content: page.title },
      { attribute: 'property', key: 'og:description', content: description },
      { attribute: 'property', key: 'og:url', content: `${siteUrl}${page.path}` },
      { attribute: 'property', key: 'og:image', content: socialImage },
      {
        attribute: 'property',
        key: 'og:image:alt',
        content: `${siteName}: desarrollo web y soporte técnico en ${areaServed}`,
      },
      { attribute: 'property', key: 'og:image:width', content: '1200' },
      { attribute: 'property', key: 'og:image:height', content: '630' },
      { attribute: 'name', key: 'twitter:card', content: 'summary_large_image' },
      { attribute: 'name', key: 'twitter:title', content: page.title },
      { attribute: 'name', key: 'twitter:description', content: description },
      { attribute: 'name', key: 'twitter:image', content: socialImage },
    ],
  };
}
