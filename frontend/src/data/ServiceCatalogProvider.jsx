import { useEffect, useState } from 'react';
import ServiceCatalogContext from './serviceCatalogContext';
import serviceCatalog from './serviceCatalog';
import normalizeServiceCatalog from './normalizeServiceCatalog';
import { serviceCatalogCache } from './serviceCatalogCache';

function getInitialServices(initialServices) {
  if (Array.isArray(initialServices)) return normalizeServiceCatalog(initialServices);

  const cachedServices = serviceCatalogCache.getCachedServices();
  if (cachedServices) return cachedServices;

  if (typeof document !== 'undefined') {
    try {
      const embeddedCatalog = document.getElementById('service-catalog')?.textContent;
      if (embeddedCatalog) return normalizeServiceCatalog(JSON.parse(embeddedCatalog));
    } catch (error) {
      console.warn('No se pudo leer el catálogo prerenderizado:', error.message);
    }
  }

  return serviceCatalog;
}

// eslint-disable-next-line react/prop-types
export function ServiceCatalogProvider({ children, initialServices }) {
  const [services, setServices] = useState(() => getInitialServices(initialServices));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const cachedServices = serviceCatalogCache.getCachedServices();
    if (cachedServices) {
      setServices(cachedServices);
      setLoading(false);
      return undefined;
    }

    serviceCatalogCache.refresh()
      .then((catalog) => {
        if (active) setServices(catalog);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'No se pudo actualizar el catálogo de servicios.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <ServiceCatalogContext.Provider value={{ services, loading, error }}>
      {children}
    </ServiceCatalogContext.Provider>
  );
}
