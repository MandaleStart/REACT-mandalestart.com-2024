import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import serviceCatalog from './src/data/serviceCatalog.js';
import { buildMetadata } from './src/seo/metadata.js';
import { createSeoFiles } from './src/seo/seoFiles.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const metadata = buildMetadata(env);
  const routes = [
    ...Object.keys(metadata.staticPages),
    ...serviceCatalog.map(({ slug }) => `/services/${slug}`),
  ];
  const { robots, sitemap } = createSeoFiles({
    siteUrl: metadata.SITE_URL,
    isIndexable: metadata.IS_INDEXABLE_SITE,
    routes,
    getPageMetadata: metadata.getPageMetadata,
    serviceCatalog,
    date: new Date().toISOString().slice(0, 10),
  });

  return {
    plugins: [
      react(),
      {
        name: 'seo-files-dev-middleware',
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            const pathname = new URL(request.url, 'http://localhost').pathname;
            if (pathname === '/robots.txt') {
              response.statusCode = 200;
              response.setHeader('Content-Type', 'text/plain; charset=utf-8');
              response.end(robots);
              return;
            }
            if (pathname === '/sitemap.xml') {
              if (!sitemap) {
                response.statusCode = 404;
                response.end();
                return;
              }
              response.statusCode = 200;
              response.setHeader('Content-Type', 'application/xml; charset=utf-8');
              response.end(sitemap);
              return;
            }
            next();
          });
        },
      },
    ],
    ssr: {
      resolve: {
        conditions: ['module-sync', 'module', 'node'],
      },
      noExternal: ['react-router-dom', 'react-router'],
    },
    server: {
      proxy: {
        '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
      },
    },
  };
})
