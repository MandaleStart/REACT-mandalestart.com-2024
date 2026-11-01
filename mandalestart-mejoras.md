# MandaleStart: mejoras, panel de clientes/admin y textos

Documento para pegar en VS Code (o pasárselo a tu asistente de código). Está pensado sobre el código actual: Express 5 + PostgreSQL + Firebase Auth + React 19/Vite.

Decisiones tomadas: **planes con precios + facturas manuales + cobro online** (se recomienda Mercado Pago como primera pasarela; verificá condiciones y comisiones vigentes para Uruguay antes de contratar).

---

## 1. Hoja de ruta (en este orden)

| Etapa | Qué | Por qué primero |
|---|---|---|
| 0 | [/] Limpieza técnica (sección 6) | Evita construir sobre deuda y sobre código muerto. |
| 1 | [X] Tablas nuevas: planes, suscripciones, facturas, pagos, auditoría (sección 2) | `002_billing.sql` aplicada y verificada en PostgreSQL 18.6; suites backend y frontend aprobadas. |
| 2 | [X] Admin: planes y precios, suscripciones por cliente, facturas manuales | Endpoints y pantallas implementados; 62/62 pruebas backend, lecturas PostgreSQL y 16 pruebas frontend focalizadas pasan. Falta un flujo de escritura autenticado de punta a punta con datos de prueba. |
| 3 | Cliente: "Mis servicios", "Facturas", "Soporte" | Autoservicio, menos mensajes por WhatsApp. |
| 4 | [/] Pagos online con webhooks (sección 5) | Checkout, cola durable, rate limit compartido, worker de Vercel y validaciones implementados; falta configurar credenciales/cron reales y probar un pago completo en Mercado Pago. |
| 5 | Roles y varios usuarios por cliente, tickets | Crecimiento. |

---

## 2. Modelo de datos (migración `002_billing.sql`)

Regla de oro: **dinero en enteros (centavos) + moneda**, nunca en texto ni `float`. Hoy `cost` y `price` son strings libres.

```sql
-- Planes (lo que vendés). Reemplaza el texto libre "price".
CREATE TABLE IF NOT EXISTS plans (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  service_slug text NOT NULL,                 -- 'hosting', 'email', 'domains', ...
  code text NOT NULL UNIQUE,                  -- 'hosting-basico'
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  currency text NOT NULL CHECK (currency IN ('UYU','USD')),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  billing_period text NOT NULL CHECK (billing_period IN ('one_time','monthly','yearly')),
  tax_rate_bp integer NOT NULL DEFAULT 2200   -- IVA en puntos básicos (22,00 %). Confirmá con tu contador.
    CHECK (tax_rate_bp BETWEEN 0 AND 10000),
  features jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(features) = 'array'),
  is_public boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Servicio contratado por un cliente (reemplaza client_accounts.services JSONB)
CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id text NOT NULL REFERENCES client_accounts(id) ON DELETE RESTRICT,
  plan_id text REFERENCES plans(id) ON DELETE RESTRICT,
  service_type text NOT NULL,                 -- mismo set que clientServiceTypes
  label text NOT NULL,                        -- "Hosting de empresa.com.uy"
  resource_name text NOT NULL DEFAULT '',     -- dominio, hostname, buzón
  status text NOT NULL CHECK (status IN ('pending','active','suspended','cancelled','expired')),
  currency text NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),   -- precio pactado (puede diferir del plan)
  billing_period text NOT NULL CHECK (billing_period IN ('one_time','monthly','yearly')),
  started_on date,
  renews_on date,
  cancelled_on date,
  auto_renew boolean NOT NULL DEFAULT true,
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  internal_notes text NOT NULL DEFAULT '',    -- NUNCA se proyecta al cliente
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_client_idx ON subscriptions (client_id);
CREATE INDEX IF NOT EXISTS subscriptions_renews_idx ON subscriptions (renews_on) WHERE status = 'active';

-- Facturas / cobros
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  number text NOT NULL UNIQUE,                -- correlativo propio: 'MS-2026-0001'
  client_id text NOT NULL REFERENCES client_accounts(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('draft','open','paid','void','overdue')),
  currency text NOT NULL,
  subtotal_cents bigint NOT NULL CHECK (subtotal_cents >= 0),
  tax_cents bigint NOT NULL CHECK (tax_cents >= 0),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  issued_on date,
  due_on date,
  paid_at timestamptz,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_client_idx ON invoices (client_id, issued_on DESC);

CREATE TABLE IF NOT EXISTS invoice_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id text NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  subscription_id text REFERENCES subscriptions(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount_cents bigint NOT NULL CHECK (unit_amount_cents >= 0),
  tax_rate_bp integer NOT NULL DEFAULT 2200
);

-- Pagos (manuales u online). Una factura puede tener varios intentos.
CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id text NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  method text NOT NULL CHECK (method IN ('transfer','cash','mercadopago','paypal','other')),
  status text NOT NULL CHECK (status IN ('pending','approved','rejected','refunded')),
  currency text NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  provider_payment_id text,                   -- id del pago en la pasarela
  provider_payload jsonb,                     -- respuesta cruda, solo admin
  recorded_by text,                           -- uid del admin si fue manual
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Idempotencia: un mismo pago de la pasarela no se registra dos veces
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_unique
  ON payments (method, provider_payment_id) WHERE provider_payment_id IS NOT NULL;

-- Bitácora de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  actor_uid text NOT NULL,
  actor_email text NOT NULL,
  action text NOT NULL,                       -- 'client.update', 'invoice.mark_paid', ...
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_log (entity_type, entity_id, created_at DESC);

-- Soft delete y control de concurrencia en clientes
ALTER TABLE client_accounts ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE client_accounts ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '';
ALTER TABLE client_accounts ADD COLUMN IF NOT EXISTS tax_id text NOT NULL DEFAULT '';   -- RUT/CI
```

**Migración de datos:** script que recorra `client_accounts.services` y cree filas en `subscriptions` (convertí `cost` a `amount_cents` a mano o con revisión; es texto libre y no se puede parsear de forma fiable). Dejá `services` en la tabla un tiempo como respaldo y luego eliminalo.

---

## 3. Endpoints nuevos

**Admin** (todos con `requireFirebaseAdmin` + registro en `audit_log`):

```
GET/POST        /api/admin/plans
PUT/DELETE      /api/admin/plans/:id            (DELETE = is_active=false)
GET/POST        /api/admin/clients/:id/subscriptions
PUT/DELETE      /api/admin/subscriptions/:id
GET/POST        /api/admin/invoices             (filtros: status, client, rango de fechas)
GET/PUT         /api/admin/invoices/:id
POST            /api/admin/invoices/:id/payments        (registrar pago manual)
POST            /api/admin/invoices/:id/void
GET             /api/admin/reports/revenue?from=&to=     (ingresos por mes, MRR, vencidos)
GET             /api/admin/audit?entity_type=&entity_id=
```

**Estado de la etapa 2 (Admin):**
- [X] Rutas protegidas para planes, suscripciones, facturas, pagos manuales, reportes y auditoría.
- [X] Escrituras transaccionales con auditoría y validación de montos/monedas; `If-Match` evita pisar cambios concurrentes.
- [X] Pantallas de administración para operar planes, suscripciones, facturas y ver auditoría.
- [/] Falta probar una escritura completa desde la interfaz con una sesión admin real y datos de prueba; la base de desarrollo está vacía y no se alteraron datos para esta comprobación.

**Cliente** (con `requireVerifiedFirebaseUser`, siempre filtrando por el `client_id` del token, nunca por un id del request):

```
GET   /api/clients/me/subscriptions
GET   /api/clients/me/invoices
GET   /api/clients/me/invoices/:id
POST  /api/clients/me/invoices/:id/checkout     (crea la preferencia de pago)
```

**Pasarela (sin auth de usuario; se autentica por firma):**

```
POST  /api/webhooks/mercadopago
```

**Concurrencia:** en los `PUT` exigí `If-Match: <updated_at>` (o un campo `version`) y respondé `409` si cambió. Hoy gana el último en escribir.

---

## 4. Pantallas

**Cliente (`/area-cliente`)**, con barra lateral:
- [X] Resumen · Servicios · Facturas · Proyectos · Soporte · Perfil; la navegación usa la barra lateral compartida.
- [X] El resumen muestra servicios, vencimientos, próximo hito y facturas pendientes con acceso al detalle.
- [X] Servicios en tarjetas con estado, recurso, precio, periodicidad, próxima renovación y enlace para pedir un cambio o una baja.
- [/] Facturas con tabla, detalle e impresión/guardado como PDF; el botón de pago inicia el checkout de Mercado Pago. Falta validar con credenciales reales y una base PostgreSQL accesible.

**Admin (`/administracion`)**, con barra lateral única:
- [X] Panel · Clientes · Suscripciones · Facturas · Planes y precios · Catálogo público · Usuarios · Auditoría.
- [X] El panel muestra ingresos del mes, MRR, facturas vencidas, servicios próximos a vencer y clientes nuevos.
- [X] La ficha permite editar datos, servicios y proyectos, y muestra las facturas y el historial de auditoría del cliente.
- [X] Planes y precios con edición de moneda, periodicidad, IVA y visibilidad pública.
- [X] `/admin`, `/administracion` y `/configuraciones` llegan al panel bajo `/administracion/*`.

**Sitio público:**
- [/] Servicios muestra planes públicos activos con precio, moneda, periodicidad y enlace de consulta por email. El botón no inicia una contratación ni se reemplazaron todos los precios estáticos del catálogo.

---

## 5. Cobro online: reglas que no se negocian

**Estado:** reglas de seguridad y flujo asíncrono implementados, con pruebas automatizadas. `003_mercadopago_webhook_queue.sql` ya se aplicó y el almacenamiento compartido fue probado en PostgreSQL local. La validación real de punta a punta y la puesta en producción siguen pendientes: requieren credenciales de Mercado Pago, configurar el cron de Vercel y probar una factura contra PostgreSQL y el proveedor. No marques la etapa global como completa hasta validar ese recorrido.

1. [X] **La redirección del navegador no acredita pagos.** La única acreditación online llega por webhook verificado; el registro manual del admin es el otro camino autorizado.
2. [X] **Firma y consulta al proveedor.** El webhook valida `x-signature`, `x-request-id` y `data.id` con el secreto configurado, y consulta luego el pago a la API de Mercado Pago antes de procesarlo.
3. [X] **Idempotencia.** El índice único `payments_provider_unique` impide insertar dos veces el mismo pago del proveedor; los reintentos ya registrados se reconocen y responden `200`.
4. [X] **Monto, moneda y preferencia.** El servidor compara el monto aprobado tanto con el saldo pendiente calculado en la base como con el checkout pendiente, además de verificar moneda, factura y `preference_id`. El monto no se acepta desde el frontend.
5. [X] **Secretos solo en backend.** `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` se leen como variables de entorno del backend; no se usan variables `VITE_*`.
6. [X] **Conciliación.** `external_reference` se establece con el id de la factura y se vuelve a verificar antes de aplicar el pago.
7. [X] **Acreditación transaccional.** En una transacción se aprueba el pago, se actualiza la factura, se extienden las suscripciones mensuales/anuales vinculadas y se escribe en `audit_log`.
8. [X] **Limitación y respuesta rápida.** El webhook usa un limitador separado y compartido mediante PostgreSQL; verifica la firma, guarda el evento en una cola durable y responde `200` sin esperar a Mercado Pago. Un cron autenticado procesa la cola, consulta el pago y reintenta fallas transitorias. Para que funcione en el despliegue, aplicá la migración `003` y configurá `CRON_SECRET` en Vercel.
9. [X] **Alcance legal documentado.** Estas facturas son comprobantes internos; no reemplazan la e-Factura de DGI. Si se necesita facturación electrónica, hay que integrarla con un facturador autorizado y validarla con un contador.

**Pendiente de operación antes de producción:** aplicar `003_mercadopago_webhook_queue.sql` en la base de producción; cargar credenciales como variables protegidas del backend (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_WEBHOOK_URL`, `PUBLIC_APP_URL`, `CRON_SECRET`); confirmar que Vercel habilitó el cron cada minuto; registrar `MP_WEBHOOK_URL` HTTPS en Mercado Pago; realizar un pago de prueba de punta a punta y comprobar factura, pago, auditoría y renovación en PostgreSQL. En el entorno local actual no están configuradas las credenciales ni `PUBLIC_APP_URL`, por lo que no se pudo hacer una transacción real. La configuración real de prueba no debe subirse al repositorio ni colocarse en variables `VITE_*`.

---

## 6. Limpieza técnica (Etapa 0)

- [X] Eliminar el soporte residual de Firestore (`typeof x.data === 'function'`) en `dashboardMetrics.js` y `clientProjection.js`.
- [X] Unificar la regla de vencimientos: los vencidos ya no cuentan como próximos; ahora aparecen en alertas separadas como "Vencido hace N días". Regla documentada en `backend/docs/client-dashboard.md`.
- [X] Calcular los días contra "hoy" en la zona `America/Montevideo`, no en UTC.
- [/] Empezar a separar `Admin.jsx` y `ClientArea.jsx`: el cliente ya tiene secciones con rutas y resumen propio; el admin delega resumen, navegación y contenido por ruta en `AdminDashboardOverview.jsx`, `AdminSidebar.jsx` y `AdminSectionContent.jsx`; aún quedan lógica y estado del cliente/usuarios en el componente principal.
- [/] Cambiar el borrado físico por archivado (`archived_at`). `002_billing.sql` ya está aplicada; falta una prueba de integración del archivado contra datos con facturas.
- [/] `.env.example`: se reemplazó el nombre real de la credencial de Firebase por `credentials/service-account.json`. No se verificó si una clave se versionó ni se rotó.
- [X] Se actualizaron `.gitignore` de backend y frontend para ignorar resultados de pruebas y artefactos de build; `frontend/test-results/.last-run.json` se retiró del índice.
- [X] `eslint` y `@eslint/js` usan la misma versión mayor; `npm ls eslint @eslint/js --depth=0` finaliza sin dependencias inválidas.
- [X] Rate limit compartido con PostgreSQL para la API, el formulario de contacto y el webhook; aplicá la migración `003_mercadopago_webhook_queue.sql` en producción antes de habilitarlos. `/api/health` queda excluido para poder informar si PostgreSQL no está disponible.
- [/] La proyección omite `internal_notes` y `provider_payload`; las pruebas validan el aislamiento de facturas por cliente y firma/idempotencia del webhook. El esquema ya está validado en PostgreSQL; falta probar el flujo completo con eventos reales de Mercado Pago.
- [/] `/comments` redirige a proyectos y `/perfil` redirige al acceso; la ruta CV no se modificó.

---


Actualicé confirmaciones de pago y archivado, conflictos `If-Match`, validación de precio y mensaje de filtros vacíos. La confirmación de archivado explica que la ficha sale del listado y conserva el historial, y no promete restauración: no existe una acción de restaurar y el backend no permite archivar clientes con facturas.

```
Confirmar borrado:      ¿Archivar a {cliente}? Sus facturas se conservan y podés restaurarlo después.
Marcar como pagada:     Registrar pago de {monto} por {método}. Esta acción queda en el historial.
Conflicto de edición:   Otra persona modificó este registro mientras lo editabas. Recargá para ver los cambios.
Plan sin precio:        Completá el precio y la moneda para poder publicarlo.
Sin resultados:         No hay resultados con estos filtros.
```

---