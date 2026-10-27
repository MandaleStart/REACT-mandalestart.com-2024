import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
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
  });

  return {
    define: {
      'import.meta.env.VERCEL_ENV': JSON.stringify(env.VERCEL_ENV || ''),
    },
    plugins: [
      react(),
      {
        name: 'preload-inter-font',
        apply: 'build',
        async writeBundle(outputOptions, bundle) {
          const outputFiles = Object.values(bundle);
          const font = outputFiles.find(
            (output) =>
              output.type === 'asset' &&
              output.fileName.startsWith('assets/inter-latin-wght-normal-') &&
              output.fileName.endsWith('.woff2'),
          );

          if (!font) {
            throw new Error('No se encontró el archivo WOFF2 latino de Inter en el build.');
          }

          const outputDirectory = path.resolve(outputOptions.dir || 'dist');
          const indexPath = path.join(outputDirectory, 'index.html');
          const html = await readFile(indexPath, 'utf8');
          const updatedHtml = html.replace(
            '</head>',
            `  <link rel="preload" href="/${font.fileName}" as="font" type="font/woff2" crossorigin="anonymous">\n  </head>`,
          );
          await writeFile(indexPath, updatedHtml);
        },
      },
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
    build: {
      sourcemap: false,
    },
  };
});
