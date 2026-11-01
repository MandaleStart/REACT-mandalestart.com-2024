# API administrativa de facturación

Todas las rutas `/api/admin/*` requieren un token Firebase verificado con el claim de administración. Las respuestas privadas usan `Cache-Control: no-store`. Cada alta, cambio, baja lógica, pago manual y anulación escribe una entrada en `audit_log` dentro de la misma transacción PostgreSQL; el cambio de estado de usuarios Firebase se audita después de actualizar Firebase y requiere PostgreSQL.

## Catálogo público

- `GET /api/plans/public`

Devuelve únicamente planes activos y marcados como públicos, con una proyección de campos apta para el sitio. Si PostgreSQL no está configurado, devuelve una lista vacía. La respuesta se puede cachear durante cinco minutos. El botón de contratación de planes públicos todavía abre una consulta por email; el checkout de Mercado Pago se usa para facturas emitidas.

## Mercado Pago Checkout Pro

- `POST /api/clients/me/invoices/:id/checkout` (token Firebase verificado; el cliente se resuelve desde el email del token)
- `POST /api/webhooks/mercadopago` (firma `x-signature`, `x-request-id` y `data.id` obligatoria)

Configurá `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_WEBHOOK_URL` y `PUBLIC_APP_URL` únicamente en el backend. `MP_WEBHOOK_URL` tiene que ser una URL HTTPS pública registrada como notificación de pagos en Mercado Pago; `PUBLIC_APP_URL` tiene que ser el origen público del frontend. En desarrollo local se permite `http://localhost` para `PUBLIC_APP_URL`, pero el webhook del proveedor siempre exige HTTPS.

El checkout usa el saldo calculado en PostgreSQL, no un importe del navegador. Se conserva la preferencia durante 30 minutos y solicitudes concurrentes reutilizan el mismo enlace. Mientras una preferencia está activa no se permite editar, anular ni registrar pagos manuales en esa factura. El proveedor debe devolver un pago aprobado que coincida con factura, preferencia, moneda y saldo; solo entonces se actualizan pago, factura, suscripciones mensuales/anuales vinculadas y auditoría en una transacción. La fecha de renovación se extiende desde la fecha más tardía entre el vencimiento actual y hoy en `America/Montevideo`. La redirección de éxito del navegador nunca acredita el pago. Los webhooks repetidos son idempotentes por el índice `payments_provider_unique`.

El webhook consulta el pago aprobado a la API de Mercado Pago antes de aplicarlo. Las notificaciones con pago válido pero inconsistente se registran como advertencia y responden `200` para detener reintentos; revisá los logs `mercadopago_payment_not_applied` para corregirlas. El limitador del webhook es local a la instancia; para despliegues con varias instancias, agregá un limitador compartido en el proxy o almacenamiento distribuido antes de producción.

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

Validación realizada: `002_billing.sql` se aplicó en PostgreSQL 18.6 y se verificaron las seis tablas de facturación/auditoría y las columnas adicionales de `client_accounts`. La base de desarrollo estaba vacía al validar la etapa administrativa; se comprobaron las consultas de lectura de planes, facturas, auditoría e informes, sin crear registros de prueba. Las pruebas de controlador, validación y repositorio están en `backend/test/`; el flujo de escritura completo desde la interfaz con una sesión admin real sigue pendiente.
