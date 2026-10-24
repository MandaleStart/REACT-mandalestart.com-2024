import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App';

export function renderStaticPage(location) {
  return renderToString(
    React.createElement(StaticRouter, { location }, React.createElement(App)),
  );
}
