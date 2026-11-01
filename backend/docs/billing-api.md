# API administrativa de facturación

Todas las rutas `/api/admin/*` requieren un token Firebase verificado con el claim de administración. Las respuestas privadas usan `Cache-Control: no-store`. Cada alta, cambio, baja lógica, pago manual y anulación escribe una entrada en `audit_log` dentro de la misma transacción PostgreSQL; el cambio de estado de usuarios Firebase se audita después de actualizar Firebase y requiere PostgreSQL.

## Planes y suscripciones

- `GET/POST /api/admin/plans`
- `PUT/DELETE /api/admin/plans/:id` (DELETE desactiva el plan)
- `GET/POST /api/admin/clients/:id/subscriptions`
- `PUT/DELETE /api/admin/subscriptions/:id` (DELETE cancela y desactiva renovación)

Las actualizaciones PUT requieren `If-Match` con el `updated_at` devuelto por la API. Si el registro cambió, la API responde `409`; si falta el precondicional, responde `428`. No vuelvas a enviar precios como decimales: `amount_cents` siempre es un entero y `currency` es `UYU` o `USD`.

## Facturas, pagos y auditoría

- `GET/POST /api/admin/invoices` (filtros `status`, `client_id`, `from`, `to`; paginación `limit` y `offset`)
- `GET/PUT /api/admin/invoices/:id`
- `POST /api/admin/invoices/:id/payments` (pago manual total o parcial)
- `POST /api/admin/invoices/:id/void`
- `GET /api/admin/reports/revenue?from=AAAA-MM-DD&to=AAAA-MM-DD`
- `GET /api/admin/audit?entity_type=&entity_id=&limit=`

Los totales y el IVA de cada concepto se calculan en el servidor con aritmética entera y redondeo al centavo más cercano. Una factura solo pasa a pagada cuando los pagos aprobados cubren el saldo completo. No se permite sobrepagar ni registrar una moneda distinta a la de la factura.

## Puesta en marcha

1. Hacé un respaldo y probá primero en una base PostgreSQL de desarrollo.
2. Desde `backend/`, ejecutá `npm run db:migrate`; el runner aplica `001` y luego `002` en una transacción protegida por advisory lock y registra cada archivo en `schema_migrations`.
3. La migración importa los servicios JSONB una sola vez. Revisá las notas internas y completá precio, moneda y periodicidad antes de emitir comprobantes.
4. Corré `npm test` desde `backend/` y comprobá que `GET /api/health` informa una conexión PostgreSQL disponible.

La integración SQL de `002_billing.sql` no se pudo ejecutar en el entorno de desarrollo cuando se implementó esta etapa: el servicio local estaba detenido y el proceso no tuvo permiso para iniciarlo ni para abrir un listener TCP. La migración fue revisada contra `001_create_portal_tables.sql` y tiene pruebas de contrato, pero queda pendiente ejecutarla en PostgreSQL accesible antes de usarla con datos reales.
