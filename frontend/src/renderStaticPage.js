import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import StaticRouteComponentsContext from './components/StaticRouteComponentsContext';
import AboutMe from './views/Aboutme/AboutMe';
import Projects from './views/Projects/Projects';
import Comments from './views/Comments/Comments';
import CV from './views/cv/cv';
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
          React.createElement(
            StaticRouteComponentsContext.Provider,
            { value: { AboutMe, Projects, Comments, CV } },
            React.createElement(App),
          ),
        ),
      ),
    ),
  );
}
