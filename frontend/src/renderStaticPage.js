import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import AdminContext from './components/AdminContext';
import ClientAreaContext from './components/ClientAreaContext';
import Admin from './views/Admin/Admin';
import ClientArea from './views/ClientArea/ClientArea';
import { SiteConfigProvider } from './config/SiteConfigProvider';

export async function renderStaticPage(location, siteConfig) {
  return renderToString(
    React.createElement(
      StaticRouter,
      { location },
      React.createElement(
        SiteConfigProvider,
        { initialConfig: siteConfig },
        React.createElement(
          ClientAreaContext.Provider,
          { value: ClientArea },
          React.createElement(
            AdminContext.Provider,
            { value: Admin },
            React.createElement(App),
          ),
        ),
      ),
    ),
  );
}
