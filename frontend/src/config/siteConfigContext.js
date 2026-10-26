import { createContext } from 'react';
import { fallbackContact } from './site';

const SiteConfigContext = createContext(fallbackContact);

export default SiteConfigContext;
