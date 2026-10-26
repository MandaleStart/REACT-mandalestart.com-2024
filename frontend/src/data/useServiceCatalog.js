import { useEffect, useState } from 'react';
import serviceCatalog from './serviceCatalog';
import normalizeServiceCatalog from './normalizeServiceCatalog';
import { getPublicServices } from '../services/serviceCatalogApi';

export default function useServiceCatalog() {
  const [services, setServices] = useState(serviceCatalog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    getPublicServices(controller.signal)
      .then((catalog) => setServices(normalizeServiceCatalog(catalog)))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'No se pudo actualizar el catálogo de servicios.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { services, loading, error };
}
