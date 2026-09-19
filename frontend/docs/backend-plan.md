# Plan de backend para Área de clientes

## Objetivo
Crear una API para gestionar clientes, proyectos, tareas y entregables de forma segura y escalable.

## Stack sugerida
- Node.js
- Express.js
- PostgreSQL
- JWT
- Prisma o Sequelize
- Swagger

## Arquitectura recomendada

### Capas
- app (routes/controllers)
- domain (entities/services)
- infrastructure (repository/database)
- auth (JWT, middleware)
- utils (validators, response helpers)

## Modelo de datos

### Tabla users
- id
- name
- email
- password_hash
- role
- created_at
- updated_at

### Tabla clients
- id
- user_id
- company_name
- contact_name
- email
- phone
- status

### Tabla projects
- id
- client_id
- name
- status
- description
- progress
- start_date
- due_date

### Tabla tasks
- id
- project_id
- title
- description
- status
- priority
- assigned_to
- due_date

### Tabla documents
- id
- project_id
- title
- file_url
- uploaded_by
- created_at

### Tabla activity_log
- id
- project_id
- user_id
- action
- description
- created_at

## JWT y seguridad
- Llenar token con userId, role, clientId si aplica
- Middleware de autorización por rol
- Middleware para validar propiedad del recurso
- Validación de payloads con Zod o Joi

## Endpoints principales

### Auth
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me

### Clients
GET /api/clients/:id
GET /api/clients/:id/projects
PATCH /api/clients/:id

### Projects
GET /api/projects/:id
GET /api/projects/:id/tasks
GET /api/projects/:id/activity
POST /api/projects
PATCH /api/projects/:id

### Tasks
POST /api/tasks
PATCH /api/tasks/:id
DELETE /api/tasks/:id

### Documents
POST /api/projects/:id/documents
GET /api/projects/:id/documents

## Mejoras recomendadas
- cache de dashboard
- logs de auditoría
- paginación en listados
- filtros por estado o cliente
- notificaciones por email o WhatsApp
- uploads con almacenamiento externo

## Criterios de aceptación
- Un cliente solo puede acceder a sus propios datos
- Las tareas deben reflejar cambios en proyecto y historial
- El panel debe cargar sin errores en un entorno real
- Los endpoints deben estar documentados en Swagger

## Siguiente fase
Una vez implementado el backend, se conectará el frontend con fetch o axios y se reemplazarán los mocks por datos reales.
