# Backend - mandalestart

Este backend sirve como API base para el proyecto de mandalestart. Está preparado para funcionar con Express y para integrar Firebase Admin cuando exista una configuración real.

## Objetivo

- Exponer una API para servicios, clientes y autenticación.
- Permitir que el frontend consume datos desde un origen separado.
- Mantener una estructura clara para crecimiento futuro.

## Estructura

- src/app.js: configuración principal de Express y endpoints.
- src/server.js: arranque del servidor.
- src/firebase.js: inicialización de Firebase Admin.
- src/mockDb.js: base temporal de ejemplo para desarrollo local.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
cd backend
npm install
```

## Variables de entorno

Se recomienda tener un archivo `.env` con variables mínimas de entorno, por ejemplo:

```env
PORT=4000
```

No se deben incluir credenciales reales, claves privadas ni secretos en repositorios.

## Arranque

```bash
cd backend
node src/server.js
```

## Endpoints principales

### Salud

```http
GET /api/health
```

Devuelve estado del backend y si la conexión a Firebase está disponible.

### Servicios

```http
GET /api/services
GET /api/services/:slug
```

### Clientes

```http
GET /api/clients
GET /api/clients/by-email?email=usuario@ejemplo.com
```

### Autenticación

```http
POST /api/auth/register
POST /api/auth/email
POST /api/auth/google
GET /api/auth/me
```

## Notas importantes

- El servicio se inicia en modo mock si no hay configuración de Firebase.
- La estructura está preparada para migrar a Firebase real sin cambiar la API pública.
- Los datos de prueba no deben usarse en producción.

## Seguridad

- No publicar credenciales ni archivos de servicio.
- Usar variables de entorno para datos sensibles.
- Mantener los archivos `.env` fuera del control de versiones.
