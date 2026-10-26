import serviceCatalog from './serviceCatalog.js';
import normalizeServiceCatalog from './normalizeServiceCatalog.js';
import { getPublicServices } from '../services/serviceCatalogApi.js';

export function createServiceCatalogCache(fetchServices = getPublicServices) {
  let cachedServices = null;
  let pendingRequest = null;

  function requestServices() {
    if (pendingRequest) return pendingRequest;

    pendingRequest = fetchServices()
      .then((services) => normalizeServiceCatalog(services))
      .then((services) => {
        cachedServices = services;
        return services;
      })
      .finally(() => {
        pendingRequest = null;
      });

    return pendingRequest;
  }

  return {
    getCachedServices() {
      return cachedServices;
    },

    load() {
      if (cachedServices) return Promise.resolve(cachedServices);
      return requestServices();
    },

    refresh: requestServices,
  };
}

export const serviceCatalogCache = createServiceCatalogCache();
export const fallbackServiceCatalog = serviceCatalog;
