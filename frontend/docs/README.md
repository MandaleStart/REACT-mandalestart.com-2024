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

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
cd frontend
npm install
```

## Variables de entorno

Crear un archivo `.env` con un formato similar a:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
VITE_FIREBASE_API_KEY=tu_api_key
```

No incluir secretos, credenciales privadas ni claves de producción en este repositorio.

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

## Conexión con el backend

La aplicación apunta al backend local por defecto mediante:

```env
VITE_API_BASE_URL=http://localhost:4000
```

El cliente API en `src/services/authApi.js` usa esta base para conectarse a los endpoints del backend.

## Recomendaciones

- Mantener el `.env` local y no subirlo al repositorio.
- Separar credenciales y entornos por proyecto.
- Si se usa Firebase, tener un proyecto dedicado por entorno.

## Nota

Los datos de clientes visibles en la UI deben tratarse como ejemplo de desarrollo y no como información real de producción.
