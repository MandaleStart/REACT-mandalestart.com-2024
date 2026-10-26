# Área de clientes

## Funcionalidad implementada

- Registro con email/contraseña y verificación obligatoria del correo, inicio de sesión, Google cuando está configurado y recuperación de contraseña mediante Firebase Authentication.
- El registro no crea ni asigna una ficha de cliente. El acceso a los datos queda pendiente hasta que el administrador cree una ficha con el mismo email verificado.
- Para cuentas sin correo verificado, el frontend solicita enviar el enlace de verificación y cierra la sesión hasta que se confirme.
- El ID token se envía al backend en `Authorization: Bearer ...`.
- `GET /api/clients/me` valida el token y vincula la cuenta por el email verificado.
- El backend proyecta únicamente `id`, `name`, `email`, `phone`, `services` y `projects` con los campos mostrados por la interfaz. No devuelve el documento Firestore completo.
- El cliente puede actualizar nombre y teléfono mediante `PUT /api/clients/me/profile`; el email verificado, los servicios y los proyectos no son editables desde su cuenta.
- Los proyectos incluyen estado, descripción, fechas y hasta 50 hitos/entregas con estado y fecha. El administrador los gestiona desde la ficha del cliente; el portal calcula el avance según los hitos completados.
- Los archivos compartidos y las cargas/descargas no están incluidos todavía.
- Si el backend o Firebase no están desplegados, el frontend informa que el servicio no está disponible; no expone cuentas ficticias.

## Datos admitidos por la interfaz

Cada elemento de `services` puede incluir `id`, `type`, `title`, `name`, `cost`, `expiry`, `status` y `details` (`label`, `value`). Cada proyecto incluye `id`, `title`, `description`, `status`, `startDate`, `targetDate` y `milestones`; cada hito tiene `id`, `title`, `description`, `status` y `dueDate`. Campos nuevos deben añadirse explícitamente a la proyección y revisarse por posible información interna antes de mostrarlos.

La tarjeta de vencimientos contabiliza servicios con fecha ISO `YYYY-MM-DD` desde hoy hasta los próximos 30 días. Fechas expiradas o inválidas no cuentan.

## Despliegue previsto

El frontend de producción usa `https://mandalestart.com` y configura `VITE_API_BASE_URL=https://apisite.mandalestart.com`. El backend todavía no está desplegado; Firebase Admin, Firestore, CORS y SMTP requieren variables del entorno de servidor. El staging `dev.mandalestart.com` permanece no indexable.

## Administración actual y alcance pendiente

El panel privado está disponible en `/admin` para cuentas con el custom claim `admin: true`. Permite crear, editar y eliminar fichas de clientes, modificar sus servicios contratados y editar o archivar/restaurar los servicios del catálogo. Los permisos se validan tanto en el backend como en la interfaz. Para otorgar o revocar el claim, usar el script privilegiado documentado en `../../backend/docs/README.md`.

La eliminación de una ficha borra el documento de Firestore y sus servicios/proyectos asociados; no elimina la identidad de Firebase Authentication. El panel no agrega almacenamiento de notas, márgenes ni otros campos internos; las actualizaciones preservan los campos privados existentes pero no los exponen.

La gestión de proyectos e hitos está disponible en la ficha del cliente. Archivos, actividad y notificaciones siguen pendientes. Los slugs del catálogo se limitan a rutas estáticas publicadas: archivar/restaurar funciona sobre el catálogo sin cambiar rutas; cualquier texto o visibilidad actualizado se refleja también en prerender y sitemap al volver a desplegar el frontend.
