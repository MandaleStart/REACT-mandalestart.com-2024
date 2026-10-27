import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { extractHeadElements } from './extractHeadElements.js';

test('separates React-hoisted SEO elements from prerendered route content', () => {
  const markup = renderToString(
    React.createElement(
      React.Fragment,
      null,
      React.createElement('title', null, 'Service page'),
      React.createElement('meta', { name: 'robots', content: 'noindex, nofollow' }),
      React.createElement('link', { rel: 'canonical', href: 'https://example.com/service' }),
      React.createElement('script', {
        id: 'business-structured-data',
        type: 'application/ld+json',
        dangerouslySetInnerHTML: { __html: '{"@type":"ProfessionalService"}' },
      }),
      React.createElement('main', null, React.createElement('h1', null, 'Service')),
    ),
  );
  const { headMarkup, bodyMarkup } = extractHeadElements(markup);

  assert.match(headMarkup, /<title>Service page<\/title>/);
  assert.match(headMarkup, /name="robots" content="noindex, nofollow"/);
  assert.match(headMarkup, /rel="canonical" href="https:\/\/example\.com\/service"/);
  assert.doesNotMatch(headMarkup, /business-structured-data/);
  assert.match(bodyMarkup, /<main><h1>Service<\/h1><\/main>/);
  assert.match(bodyMarkup, /"@type":"ProfessionalService"/);
  assert.doesNotMatch(bodyMarkup, /<title|<meta|<link/);
});
