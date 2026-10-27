import serviceCatalog from './serviceCatalog.js';

const fallbackServicesBySlug = new Map(serviceCatalog.map((service) => [service.slug, service]));

export default function normalizeServiceCatalog(services) {
  if (!Array.isArray(services)) return serviceCatalog;

  return services
    .filter((service) => service && typeof service === 'object' && !Array.isArray(service))
    .map((service) => {
      const fallback = fallbackServicesBySlug.get(service.slug);
      const details =
        Array.isArray(service.details) && service.details.length > 0
          ? service.details
          : fallback?.details || [];

      return {
        ...fallback,
        ...service,
        points: Array.isArray(service.points) ? service.points : fallback?.points || [],
        includes: Array.isArray(service.includes) ? service.includes : fallback?.includes || [],
        details,
      };
    });
}
