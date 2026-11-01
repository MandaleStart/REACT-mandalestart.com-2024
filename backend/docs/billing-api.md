# API administrativa de facturación

Todas las rutas `/api/admin/*` requieren un token Firebase verificado con el claim de administración. Las respuestas privadas usan `Cache-Control: no-store`. Cada alta, cambio, baja lógica, pago manual y anulación escribe una entrada en `audit_log` dentro de la misma transacción PostgreSQL; el cambio de estado de usuarios Firebase se audita después de actualizar Firebase y requiere PostgreSQL.

## Catálogo público

- `GET /api/plans/public`
- `PUT /api/clients/me/profile` requiere un token Firebase verificado; el cliente se identifica desde el token, no desde un ID recibido.

Devuelve únicamente planes activos y marcados como públicos, con una proyección de campos apta para el sitio. Si PostgreSQL no está configurado, devuelve una lista vacía. La respuesta se puede cachear durante cinco minutos. El botón de contratación de planes públicos todavía abre una consulta por email; el checkout de Mercado Pago se usa para facturas emitidas.

El perfil del cliente permite actualizar nombre, teléfono y datos de facturación (razón social, RUT/documento, email y dirección). Aplicá `007_client_billing_profile.sql` para agregar los campos de email y dirección de facturación.

## Mercado Pago Checkout Pro

- `POST /api/clients/me/invoices/:id/checkout` (token Firebase verificado; el cliente se resuelve desde el email del token)
- `POST /api/webhooks/mercadopago` (firma `x-signature`, `x-request-id` y `data.id` obligatoria)

Configurá `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_WEBHOOK_URL`, `PUBLIC_APP_URL` y `CRON_SECRET` únicamente en el backend. `MP_WEBHOOK_URL` tiene que ser una URL HTTPS pública registrada como notificación de pagos en Mercado Pago; `PUBLIC_APP_URL` tiene que ser el origen público del frontend. En Vercel, definí también `CRON_SECRET` para autenticar el cron de procesamiento. En desarrollo local se permite `http://localhost` para `PUBLIC_APP_URL`, pero el webhook del proveedor siempre exige HTTPS.

El checkout usa el saldo calculado en PostgreSQL, no un importe del navegador. La factura se bloquea solo para crear una reserva breve de checkout; la llamada HTTP a Mercado Pago ocurre fuera de la transacción, con una clave de idempotencia derivada de la reserva. Luego una segunda transacción vuelve a validar el saldo y guarda el enlace. Solicitudes concurrentes reutilizan el enlace listo o reciben `202` mientras se prepara. Se conserva la preferencia durante 30 minutos. Se excluye el tipo de pago `ticket` (efectivo/redes de cobranza); la pantalla informa esa limitación y ofrece coordinar una transferencia. Mientras una preferencia está activa no se permite editar, anular ni registrar pagos manuales en esa factura. El proveedor debe devolver un pago aprobado que coincida con factura, preferencia, moneda y saldo; solo entonces se actualizan pago, factura, suscripciones mensuales/anuales vinculadas y auditoría en una transacción. La fecha de renovación se extiende desde la fecha más tardía entre el vencimiento actual y hoy en `America/Montevideo`. La redirección de éxito del navegador nunca acredita el pago. Los webhooks repetidos son idempotentes por el índice `payments_provider_unique`.

Los pagos aprobados que no puedan asociarse o aplicarse se guardan idempotentemente en `unapplied_payments`, con el motivo y datos de proveedor limitados para revisión. Aplicá `004_unapplied_mercadopago_payments.sql` antes de procesar esos casos. En el panel admin, `/administracion/unapplied-payments` permite listar los pagos, aplicarlos a una factura compatible o marcarlos como revisados; ambas acciones se auditan. Marcar un pago como revisado no inicia un reembolso. El webhook envía avisos de revisión por correo a `CONTACT_TO`; también requiere SMTP. La solicitud y confirmación de reembolsos desde la pantalla aún no están implementadas. Los reembolsos y contracargos verificados que llegan por webhook actualizan el estado del pago, reabren facturas que ya no están cubiertas por otros pagos, escriben auditoría y envían un aviso a `CONTACT_TO`, sin retroceder fechas de renovación. Aplicá también `006_mercadopago_reversals.sql`.

El webhook valida la firma y guarda el identificador de notificación en `mercadopago_webhook_events`, respondiendo `200` después de la escritura durable, sin esperar una llamada externa. El cron de Vercel ejecuta `GET /api/jobs/mercadopago-webhooks` cada minuto; el endpoint exige `Authorization: Bearer <CRON_SECRET>`, reclama eventos con bloqueo y reintenta fallas transitorias con espera exponencial. El procesador consulta el pago a la API de Mercado Pago antes de aplicar cualquier cambio. Eventos repetidos se reconocen y los pagos ya procesados siguen protegidos por `payments_provider_unique`. Las inconsistencias se registran como advertencia y se confirman para evitar reintentos inútiles; revisá `mercadopago_payment_not_applied`. El limitador del webhook usa `api_rate_limit_windows` en PostgreSQL y comparte sus ventanas entre instancias.

La respuesta rápida requiere que `003_mercadopago_webhook_queue.sql` esté aplicada y que el cron esté habilitado en el proyecto Vercel. El procesador puede invocarse manualmente con el mismo header de autorización para validar eventos en desarrollo.

## Renovaciones automáticas y recordatorios

`GET /api/jobs/recurring-billing` es un job diario protegido por el mismo `CRON_SECRET`; Vercel lo programa a las 06:00 UTC. Aplicá `005_recurring_billing.sql` antes de habilitarlo y configurá el SMTP existente (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` y, opcionalmente, `SMTP_FROM`).

El job genera una factura `open` siete días antes de `renews_on` para suscripciones `active` con `auto_renew = true` y periodicidad `monthly` o `yearly`. La fecha `renews_on` se usa como vencimiento; la factura pasa a `overdue` en esa fecha si conserva saldo impago. Se encolan avisos D-7, D-1, D+1 y D+7 para facturas abiertas/vencidas con saldo pendiente. Una suscripción asociada a una renovación vencida se suspende al cumplir siete días de mora. Las fechas se evalúan en `America/Montevideo`.

`subscription_renewal_invoices` evita duplicar la renovación de una misma suscripción/fecha, y `invoice_reminders` mantiene una fila única por factura y etapa. Los recordatorios se reclaman con bloqueo y reintentan fallas de SMTP; el `Message-ID` es estable por fila. Como SMTP no ofrece idempotencia transaccional, una caída justo después de aceptar un correo pero antes de marcarlo como enviado puede causar un reenvío en el siguiente intento. Las acciones de creación de factura, mora, suspensión y envío exitoso se escriben en `audit_log` con actor `system`.

`GET /api/health` informa `pendingWebhookCount`, `oldestPendingWebhookAgeSeconds`, `pendingWebhookAlert` y `alerts`. El indicador se activa cuando el evento pendiente más antiguo supera 600 segundos; conectá un monitor externo a ese indicador para recibir notificaciones.

## Planes y suscripciones

- `GET/POST /api/admin/plans`
- `PUT/DELETE /api/admin/plans/:id` (DELETE desactiva el plan)
- `GET/POST /api/admin/clients/:id/subscriptions`
- `PUT/DELETE /api/admin/subscriptions/:id` (DELETE cancela y desactiva renovación)

Las actualizaciones PUT requieren `If-Match` con el `updated_at` devuelto por la API. Si el registro cambió, la API responde `409`; si falta el precondicional, responde `428`. No vuelvas a enviar precios como decimales: `amount_cents` siempre es un entero y `currency` es `UYU` o `USD`.

## Facturas, pagos y auditoría

- `GET/POST /api/admin/invoices` (GET devuelve `{ items, total, limit, offset }`; filtros `status`, `client_id`, `from`, `to`, `search`; búsqueda por número/cliente y monto exacto; paginación `limit` y `offset`)
- `GET/PUT /api/admin/invoices/:id`
- `POST /api/admin/invoices/:id/payments` (pago manual total o parcial)
- `POST /api/admin/invoices/:id/void`
- `GET /api/admin/reports/revenue?from=AAAA-MM-DD&to=AAAA-MM-DD`
- `GET /api/admin/reports/receivables` (saldo pendiente por moneda, aging de vencidas, próximos 7/30 días y hasta 20 saldos pendientes)
- `GET /api/admin/audit?entity_type=&entity_id=&limit=`

El dashboard administrativo también incluye `webhook_backlog` con disponibilidad de la tabla, cantidad de eventos pendientes, antigüedad del más antiguo y alerta cuando supera 10 minutos. No incluye identificadores del proveedor.

Los totales y el IVA de cada concepto se calculan en el servidor con aritmética entera y redondeo al centavo más cercano. Una factura solo pasa a pagada cuando los pagos aprobados cubren el saldo completo. No se permite sobrepagar ni registrar una moneda distinta a la de la factura.

## Puesta en marcha

1. Hacé un respaldo y probá primero en una base PostgreSQL de desarrollo.
2. Desde `backend/`, ejecutá `npm run db:migrate`; el runner aplica las migraciones SQL pendientes (`001` a `006`) en transacciones protegidas por advisory lock y registra cada archivo en `schema_migrations`.
3. La migración importa los servicios JSONB una sola vez. Revisá las notas internas y completá precio, moneda y periodicidad antes de emitir comprobantes.
4. Corré `npm test` desde `backend/` y comprobá que `GET /api/health` informa una conexión PostgreSQL disponible.

Validación previa: `002_billing.sql` se aplicó en PostgreSQL 18.6 y se verificaron las seis tablas de facturación/auditoría y las columnas adicionales de `client_accounts`. La nueva migración `003` agrega la cola durable de webhooks y el almacenamiento compartido del rate limit. Las pruebas de controlador y validación están en `backend/test/`. Antes de producción todavía se requiere validar una notificación firmada y un pago de prueba con credenciales reales del proveedor, el cron habilitado y una factura en PostgreSQL.
