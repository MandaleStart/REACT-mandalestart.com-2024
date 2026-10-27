# Frontend - mandalestart

Este frontend está desarrollado con React + Vite y representa la interfaz pública del proyecto mandalestart.

## Objetivo

- Mostrar la landing page y portfolio.
- Proveer la zona de clientes para login y acceso a información asociada.
- Consumir la API backend desde el entorno local de desarrollo.

## Estructura principal

- src/App.jsx: rutas principales de la aplicación.
- src/views/: vistas de la app.
- src/components/: componentes reutilizables.
- src/services/: clientes HTTP y lógica de conexión con la API.
- src/firebase.js: configuración de Firebase para autenticación.
- src/data/: datos estáticos y mocks de ejemplo.
- src/seo/: metadatos compartidos por las páginas y el prerender.
- src/styles/: estilos globales, tokens y componentes visuales compartidos.
- src/views/CV/: vista y datos del currículum.

## Catálogo y metadatos

`ServiceCatalogProvider` comparte el catálogo público entre las vistas y sus consumidores, con caché en memoria y revalidación. `Seo.jsx` define el título, las etiquetas sociales, robots y canonical como elementos React; React 19 los coloca en el `<head>`. El prerender extrae esos elementos hoisteados al `<head>` del HTML estático y conserva el marcado del cuerpo para hidratar la misma vista en el navegador. Las rutas privadas no se prerenderizan.

Los estilos globales y los valores reutilizables viven en `src/index.css`, `src/styles/base.css`, `src/styles/buttons.css` y `src/styles/layout.css`. Al cambiar estilos, usá las variables CSS definidas en `:root` para colores, espaciado, radios y sombras. El repo aplica Prettier y EditorConfig; ejecutá `npm run format` para formatear y `npm run format:check` para validar.

## Requisitos

- Node.js 20+
- npm 9+

## Instalación

```bash
cd frontend
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar únicamente las claves públicas de Firebase. El backend local se resuelve mediante el proxy de Vite; en Vercel, configurar las variables de build:

```env
VITE_API_BASE_URL=https://apisite.mandalestart.com
VITE_SITE_URL=https://mandalestart.com
VITE_INDEXABLE_SITE=true
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
VITE_FIREBASE_API_KEY=tu_api_key
```

No incluir secretos, credenciales privadas ni claves de producción en este repositorio.

La API key web de Firebase se incluye en el bundle del navegador y no es un secreto. Restringila en Google Cloud Console por HTTP referrer a los dominios exactos de producción, pruebas y desarrollo que uses. Evaluá habilitar Firebase App Check para reducir el uso de la API desde clientes no autorizados; App Check complementa, pero no reemplaza, la autenticación y las reglas de autorización.

## Arranque

```bash
cd frontend
npm run dev
```

## Build de producción

```bash
cd frontend
npm run build
```

`npm start` sirve el build ya generado con Vite Preview en el puerto 4173; para desarrollo usá `npm run dev`.

## Conexión con el backend

En desarrollo, Vite reenvía `/api` a `http://localhost:4000`. Para producción, desplegar primero el backend con `backend/` como raíz del proyecto Vercel, configurar el dominio `apisite.mandalestart.com` y después usar:

```env
VITE_API_BASE_URL=https://apisite.mandalestart.com
```

Si la API todavía no está desplegada, el área de clientes y el envío del formulario no estarán disponibles en producción. El contacto mantiene WhatsApp como alternativa y muestra el error del envío cuando la API no responde.

## Dominio e indexación

| Entorno    | `VITE_SITE_URL`                | `VITE_INDEXABLE_SITE` | Resultado                                    |
| ---------- | ------------------------------ | --------------------- | -------------------------------------------- |
| Producción | `https://mandalestart.com`     | `true`                | Indexable, sitemap, `robots.txt` abierto     |
| Pruebas    | `https://dev.mandalestart.com` | (vacío)               | `noindex`, `robots.txt` cerrado, sin sitemap |
| Local      | (vacío)                        | (vacío)               | Igual que pruebas                            |

En Vercel, Production se indexa por defecto; Preview no. Para controlar el comportamiento explícitamente, configurar `VITE_INDEXABLE_SITE=true` solo en Production y mantenerla vacía o en `false` en Preview y desarrollo. `VITE_SITE_URL` usa `https://mandalestart.com` como fallback para canonical y etiquetas sociales.

En el entorno Production de Vercel, configurar `STRICT_SEO=1` para que el build falle si el dominio es de producción pero se omitió `VITE_INDEXABLE_SITE=true`.

`noindex` y `robots.txt` no protegen contenido. Si el sitio de pruebas no debe ser público, usar Deployment Protection de Vercel o autenticación básica.

## Cabeceras y recursos estáticos

`vercel.json` configura CSP para Firebase Auth, la API pública y Vercel Speed Insights, además de
`Cross-Origin-Opener-Policy: same-origin-allow-popups` para los flujos de autenticación. Si cambia
`VITE_API_BASE_URL`, revisar también el origen de `connect-src`.

El sitio envía HSTS con `max-age=63072000; includeSubDomains`. No se habilita `preload`: hacerlo
requiere confirmar que todos los subdominios permanecen disponibles por HTTPS. Los assets
versionados de `/assets/` (incluidas las fuentes WOFF2) se cachean por un año; `/img/` usa caché
revalidable de un día.

El teléfono y correo visibles se sirven desde `GET /api/site-config`. Configurá `PUBLIC_CONTACT_EMAIL`, `PUBLIC_CONTACT_PHONE_E164` y `PUBLIC_CONTACT_PHONE_DISPLAY` en el backend; el teléfono comercial no se guarda en el frontend. Para que el prerender obtenga la instantánea, definir `VITE_API_BASE_URL` al backend durante el build. Si la API no responde, el sitio usa `info@mandalestart.com`, oculta llamada y WhatsApp, y registra una advertencia de build.

## Backend

El backend utiliza Firebase Admin para verificar identidad, PostgreSQL para fichas y catálogo, rate limits, CORS explícito y SMTP para el formulario. Consultar `../../backend/docs/README.md` para las variables sensibles y el despliegue. Las credenciales privadas nunca van en variables `VITE_*`.

## Recomendaciones

- Mantener el `.env` local y no subirlo al repositorio.
- Separar credenciales y entornos por proyecto.
- Si se usa Firebase, tener un proyecto dedicado por entorno.

## Nota

El catálogo de servicios puede usar datos de respaldo públicos. Los datos del portal de clientes nunca se simulan: si Firebase o la API no están disponibles, se informa el error.
