# Backend de MandaleStart

API Express 5 desplegable como función serverless de Vercel. Firebase Authentication valida los ID tokens; PostgreSQL almacena las fichas de clientes, servicios contratados, proyectos y el catálogo público. La base de datos debe existir en el proveedor PostgreSQL antes de ejecutar las migraciones. Si no se configura `DATABASE_URL`, solo el catálogo público usa una copia estática de respaldo; el backend no simula almacenamiento ni autenticación.

## Desarrollo local

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run db:create
npm run db:migrate
npm run dev
```

En el entorno local, configurá temporalmente `DATABASE_ADMIN_URL` con acceso administrativo al PostgreSQL local. `npm run db:create` crea `DATABASE_NAME` (por defecto `mandalestart`) únicamente si todavía no existe, genera un rol de aplicación con una contraseña aleatoria y guarda solo su conexión en el `.env` ignorado por Git. Si la base ya existe y no es propiedad del rol de la aplicación, el script se detiene sin modificarla. Después, `npm run db:migrate` crea las tablas `client_accounts`, `catalog_services` y el registro de migraciones con el rol de aplicación. Para producción, crear la base en el proveedor y ejecutar las migraciones usando su `DATABASE_URL`; no ejecutar `db:create` en el proveedor. El frontend Vite reenvía `/api` a `http://localhost:4000` por defecto. Para probar el backend en otro host, configurá `VITE_API_PROXY_TARGET` en el entorno de Vite.

## Despliegue de backend en Vercel

Crear un proyecto Vercel con `backend/` como Root Directory y asignarle `https://apisite.mandalestart.com`. Configurar en el entorno de Vercel:

- `NODE_ENV=production`
- `TRUST_PROXY_HOPS=1` (un proxy de confianza; ajustarlo solo si la topología real requiere más saltos)
- `FRONTEND_ORIGINS=https://mandalestart.com,https://www.mandalestart.com,https://dev.mandalestart.com`
- `DATABASE_URL` (conexión de PostgreSQL; usar TLS según los requisitos del proveedor)
- `PG_POOL_MAX=1` recomendado en Vercel para limitar conexiones por instancia (localmente el pool usa 5 si no se configura)
- `FIREBASE_PROJECT_ID`
- Una credencial de Firebase Admin mediante identidad de carga de trabajo o la variable secreta `FIREBASE_SERVICE_ACCOUNT` con el JSON de la cuenta de servicio. `FIREBASE_SERVICE_ACCOUNT_PATH` es para desarrollo local; Vercel excluye `credentials/` del despliegue.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, y opcionalmente `SMTP_FROM` y `CONTACT_TO`
- `PUBLIC_CONTACT_EMAIL` (opcional; predeterminado `info@mandalestart.com`), `PUBLIC_CONTACT_PHONE_E164` y `PUBLIC_CONTACT_PHONE_DISPLAY` (configurar ambos para publicar el teléfono comercial; nunca usar un teléfono privado)

Ejecutar `npm run db:migrate` desde el directorio del backend con la misma `DATABASE_URL` antes de desplegar. Las migraciones son seguras para volver a ejecutar. Los secretos se configuran en Vercel, nunca en el repositorio ni en variables `VITE_*`. En local, `.env.example` muestra la ruta de la credencial existente; mantené el archivo dentro de `backend/credentials/`, que está excluida de Git. La lista de orígenes CORS contiene los dominios conocidos; añadir cualquier dominio nuevo explícitamente.

Vercel puede crear varias instancias serverless, por lo que el limitador en memoria es una defensa básica por instancia, no un contador global. Para límites consistentes a escala, usar un store compartido compatible con `express-rate-limit`.

## Rutas

- `GET /api/health`: disponibilidad de Firebase Admin y conexión PostgreSQL (`databaseConfigured`, `databaseReady`).
- `GET /api/site-config`: email, teléfono comercial opcional y número de WhatsApp públicos, configurados con `PUBLIC_CONTACT_EMAIL`, `PUBLIC_CONTACT_PHONE_E164` y `PUBLIC_CONTACT_PHONE_DISPLAY`. El teléfono se omite si ambas variables telefónicas están vacías; si se configuran, deben ser válidas y completarse juntas. La respuesta se cachea por cinco minutos.
- `GET /api/services` y `GET /api/services/:slug`: catálogo público.
- `GET /api/clients/me`: cuenta asociada al token Firebase verificado; exige correo confirmado y proyecta solo los campos públicos del perfil, servicios y proyectos.
- `PUT /api/clients/me/profile`: actualiza solo nombre y teléfono de la ficha asociada; no permite cambiar email, servicios ni proyectos.
- `POST /api/contact`: envío de consulta por SMTP, con validación, honeypot y límite de solicitudes.

Los endpoints demo `/api/auth/register`, `/api/auth/email`, `/api/auth/google` y `/api/auth/me` se eliminaron. El acceso usa Firebase Authentication directamente desde el frontend.
Los usuarios pueden crear su cuenta desde el portal con email y contraseña, pero deben verificar el email. El registro no crea una ficha ni da acceso automáticamente: los datos solo se muestran cuando un administrador asocia previamente una ficha de cliente al mismo email verificado. Las cuentas sin ficha reciben una respuesta sin datos y una indicación para solicitar acceso.
En Firebase Authentication hay que habilitar el proveedor Email/Password y añadir los dominios reales a Authorized domains; configurar el envío de verificación y recuperación de contraseña antes de publicar el flujo. Google es opcional y requiere habilitar su proveedor.

## Panel administrativo

El panel está en `/admin`. Autenticá al usuario con Firebase Authentication y otorgale el custom claim `admin: true` usando una credencial privilegiada del servidor:

```bash
npm run admin:claim -- <firebase-uid> grant
npm run admin:claim -- <firebase-uid> revoke
```

El cambio de custom claims se refleja al renovar el ID token; el panel fuerza una actualización antes de comprobar el acceso. Nunca agregar este claim desde el cliente, permitir que un usuario lo elija ni publicar credenciales del script.

El panel administra datos en PostgreSQL:

- `client_accounts`: nombre, email, teléfono, servicios contratados y proyectos. Los servicios y proyectos se guardan como JSONB validados por el backend; el email tiene un índice único sin distinguir mayúsculas y minúsculas.
- `catalog_services`: catálogo público en JSONB, indexado por slug. Se aceptan únicamente campos públicos conocidos; la clave debe ser uno de los slugs estáticos publicados. Eliminar archiva el servicio con `status: archived` para poder restaurarlo. Los servicios predefinidos están disponibles incluso antes de guardar su primera fila en PostgreSQL.

Las operaciones administrativas se autorizan en el backend después de verificar el ID token con comprobación de revocación, el email y el custom claim; el control visual del frontend no sustituye esta protección. Las páginas dinámicas nuevas deben tener una ruta estática generada por el frontend, por lo que los slugs publicados se limitan al catálogo desplegado. Si quedan fichas históricas en Firestore, no se copian automáticamente: antes de cambiar el tráfico, exportarlas e importarlas a PostgreSQL y verificar los registros. Los endpoints de datos del panel operan sobre PostgreSQL.

Para que un cambio de texto o visibilidad aparezca también en los HTML pre-renderizados y el sitemap, volver a compilar y desplegar el frontend. El catálogo visible se actualiza desde el backend; los slugs nuevos requieren agregar su ruta estática y realizar un despliegue de frontend, por lo que el panel solo permite editar los slugs ya publicados.

## Verificación local

```bash
npm test
```
