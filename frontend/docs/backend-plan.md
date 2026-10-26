# Backend actual y próximos pasos

## Arquitectura actual

El backend de `../backend/` usa Express 5, Firebase Authentication y Firestore. No usa PostgreSQL, Prisma ni JWT propios: el frontend obtiene un ID token de Firebase y lo envía en `Authorization: Bearer ...`.

Rutas implementadas:

- `GET /api/health`
- `GET /api/services` y `GET /api/services/:slug`
- `GET /api/clients/me` (solo identidad Firebase autenticada y con email verificado)
- `/api/admin/clients` y `/api/admin/services` (requieren el custom claim Firebase `admin: true`)
- `POST /api/contact` (validación, honeypot, rate limit y SMTP)

El acceso de demostración con contraseñas y tokens fijos se retiró. El backend se prepara para desplegarse como Vercel project con `backend/` como raíz y `https://apisite.mandalestart.com` como dominio.

## Seguridad y configuración

- CORS se configura con `FRONTEND_ORIGINS`.
- `TRUST_PROXY_HOPS` debe reflejar la cantidad de proxies confiables delante de Express.
- Firebase Admin, SMTP y dominios se configuran en variables del backend; no exponer secretos como `VITE_*`.
- El endpoint de cuenta devuelve una proyección explícita. Para agregar campos al portal, ampliar el esquema de respuesta de manera deliberada y probar que campos internos se mantengan excluidos.
- El rate limiter usa memoria local y no reemplaza un store compartido al escalar en Vercel.

## Gestión administrativa

El panel `/admin` permite administrar clientes y servicios contratados, y actualizar o archivar el catálogo público. El backend valida cada operación, aplica listas permitidas y mantiene los campos internos fuera de la respuesta del cliente.

Un administrador debe recibir `admin: true` mediante el script privilegiado `backend/scripts/set-admin-claim.js`; el claim no se administra desde el navegador. La eliminación de un cliente borra su ficha de Firestore, no su identidad de Firebase Authentication. Los nuevos slugs requieren una ruta estática y despliegue del frontend.

Posibles siguientes etapas: agregar bitácora de cambios, gestionar proyectos/tareas/entregables y configurar un almacén de rate limit compartido para las funciones serverless.
