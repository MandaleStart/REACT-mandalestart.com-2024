import { useEffect, useState } from 'react';
import { fallbackContact, normalizeContactConfig } from './site';
import SiteConfigContext from './siteConfigContext';
import { apiRequest } from '../services/apiClient.js';

function getInitialContact(initialConfig) {
  if (initialConfig) {
    try {
      return normalizeContactConfig(initialConfig);
    } catch {
      return fallbackContact;
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const embeddedConfig = document.getElementById('site-config')?.textContent;
      if (embeddedConfig) return normalizeContactConfig(JSON.parse(embeddedConfig));
    } catch {
      return fallbackContact;
    }
  }

  return fallbackContact;
}

// The project uses JavaScript without runtime prop-type declarations.
// eslint-disable-next-line react/prop-types
export function SiteConfigProvider({ children, initialConfig }) {
  const [contact, setContact] = useState(() => getInitialContact(initialConfig));

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/api/site-config', { signal: controller.signal, timeoutMs: 8000 })
      .then((config) => setContact(normalizeContactConfig(config)))
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.warn(
            'No se pudo actualizar la configuración pública de contacto:',
            error.message,
          );
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return <SiteConfigContext.Provider value={contact}>{children}</SiteConfigContext.Provider>;
}
