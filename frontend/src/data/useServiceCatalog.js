import { useContext } from 'react';
import ServiceCatalogContext from './serviceCatalogContext';

export default function useServiceCatalog() {
  return useContext(ServiceCatalogContext);
}
