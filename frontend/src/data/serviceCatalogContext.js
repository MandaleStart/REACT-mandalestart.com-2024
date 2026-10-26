import { createContext } from 'react';
import serviceCatalog from './serviceCatalog';

const ServiceCatalogContext = createContext({
  services: serviceCatalog,
  loading: false,
  error: '',
});

export default ServiceCatalogContext;
