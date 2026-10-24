# Área de clientes - especificación inicial

## Objetivo
Crear un panel privado para clientes donde puedan consultar el estado del proyecto, tareas pendientes, entregables y actividad reciente.

## Alcance inicial

### Módulos previstos
- Dashboard general
- Proyectos activos
- Tareas / checklist
- Historial de actividad
- Documentación / entregables
- Mensajes o comentarios del cliente
- Autenticación por usuario

### Datos base esperados
- idCliente
- nombre
- email
- rol
- proyectos asignados
- tareas
- estados
- archivos adjuntos
- historial de actividad

## Flujo sugerido
1. Login del cliente
2. Validación de sesión
3. Carga del dashboard
4. Visualización del proyecto activo
5. Acceso a tareas, archivos y mensajes
6. Interacción con soporte

## Estructura recomendada para backend

### Entidades
- users
- clients
- projects
- project_members
- tasks
- task_comments
- activity_log
- documents
- notifications

### Relaciones
- Un cliente puede tener varios proyectos
- Un proyecto puede tener muchas tareas
- Una tarea puede tener muchos comentarios
- Un usuario puede estar asociado a varios proyectos

## Endpoints sugeridos

### Autenticación
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Clientes
- GET /api/clients/:id
- GET /api/clients/:id/projects

### Proyectos
- GET /api/projects/:id
- GET /api/projects/:id/tasks
- GET /api/projects/:id/activity

### Tareas
- GET /api/tasks/:id
- POST /api/tasks
- PATCH /api/tasks/:id

### Archivos / entregables
- GET /api/projects/:id/documents
- POST /api/projects/:id/documents

## Reglas de negocio
- Cada cliente solo puede ver sus proyectos
- Los estados posibles deben ser: pendiente, en revisión, en desarrollo, listo, cancelado
- Las tareas deben tener responsable, fecha de vencimiento y prioridad
- Todo cambio relevante debe quedar registrado en el log de actividad

## Estado actual del frontend
La interfaz inicia sesión mediante Firebase Authentication y consulta `GET /api/clients/me` con el ID token del usuario. El backend verifica el token, requiere un email confirmado y solo devuelve el registro asociado a esa identidad.

Si el backend no responde o todavía funciona en modo mock, el portal muestra una pantalla de disponibilidad y no ofrece datos de demostración como si fueran una cuenta real. El formulario de registro público está deshabilitado; para solicitar acceso, el cliente debe contactar al administrador.

## Recomendación técnica
- Backend en Node.js + Express o NestJS
- Base de datos PostgreSQL o MySQL
- JWT para autenticación
- Documentación con Swagger/OpenAPI
- Manejo de archivos con almacenamiento local o S3

## Siguiente paso
Antes de habilitar el portal en producción, desplegar el backend, configurar Firebase Authentication/Firestore y las variables `VITE_API_BASE_URL`, `VITE_FIREBASE_*` y las credenciales seguras de Firebase Admin en el servidor.
