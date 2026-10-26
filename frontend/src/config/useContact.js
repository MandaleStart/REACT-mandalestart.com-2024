import { useContext } from 'react';
import SiteConfigContext from './siteConfigContext';

export function useContact() {
  return useContext(SiteConfigContext);
}
