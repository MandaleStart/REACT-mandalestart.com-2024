import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { SiteConfigProvider } from './config/SiteConfigProvider';
import { ServiceCatalogProvider } from './data/ServiceCatalogProvider';

export async function renderStaticPage(location, siteConfig, serviceCatalog) {
  return renderToString(
    React.createElement(
      StaticRouter,
      { location },
      React.createElement(
        SiteConfigProvider,
        { initialConfig: siteConfig },
        React.createElement(
          ServiceCatalogProvider,
          { initialServices: serviceCatalog },
          React.createElement(App),
        ),
      ),
    ),
  );
}
