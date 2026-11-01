# MandaleStart: mejoras, panel de clientes/admin y textos

Documento para pegar en VS Code (o pasárselo a tu asistente de código). Está pensado sobre el código actual: Express 5 + PostgreSQL + Firebase Auth + React 19/Vite.

Decisiones tomadas: **planes con precios + facturas manuales + cobro online** (se recomienda Mercado Pago como primera pasarela; verificá condiciones y comisiones vigentes para Uruguay antes de contratar).

---

## 1. Hoja de ruta (en este orden)

| Etapa | Qué | Por qué primero |
|---|---|---|
| 0 | [/] Limpieza técnica (sección 6) | Evita construir sobre deuda y sobre código muerto. |
| 1 | [X] Tablas nuevas: planes, suscripciones, facturas, pagos, auditoría (sección 2) | `002_billing.sql` aplicada y verificada en PostgreSQL 18.6; suites backend y frontend aprobadas. |
| 2 | Admin: planes y precios, suscripciones por cliente, facturas manuales | Ya podés operar el negocio sin pasarela. |
| 3 | Cliente: "Mis servicios", "Facturas", "Soporte" | Autoservicio, menos mensajes por WhatsApp. |
| 4 | Pagos online con webhooks (sección 5) | Se apoya en facturas ya existentes. |
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

- [/] Implementé Checkout Pro por factura, validación de firma del webhook, consulta del pago a la API, comparación de monto/moneda/preferencia, idempotencia, auditoría y extensión de renovaciones. El cliente usa saldo calculado en el servidor; faltan credenciales, URL HTTPS pública y prueba completa contra Mercado Pago/PostgreSQL.
- [/] El webhook tiene un limitador propio por instancia; sigue pendiente compartir el rate limit entre instancias de Vercel.

1. **Nunca marques una factura como pagada por la redirección del navegador** (la URL de "éxito" la puede abrir cualquiera). Solo por webhook verificado o por registro manual del admin.
2. **Verificá la firma del webhook** con el secreto de la pasarela y, además, **consultá el pago a su API** antes de acreditarlo.
3. **Idempotencia:** el índice único `payments_provider_unique` evita duplicados cuando la pasarela reintenta.
4. **Monto y moneda:** comparás lo que pagó contra `total_cents` de la factura en el servidor; el importe nunca viene del frontend.
5. Credenciales solo en variables de entorno del backend (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`), jamás como `VITE_*`.
6. `external_reference` = id de la factura, para conciliar.
7. Al aprobar: transacción única que cree el `payment`, pase la factura a `paid`, extienda `renews_on` de la suscripción y escriba en `audit_log`.
8. Rate limit del webhook aparte, y que responda `200` rápido.
9. Facturas "legales" en Uruguay: si necesitás e-Factura DGI, esto **no** la reemplaza. Estas facturas son comprobantes internos hasta que lo integres con un facturador autorizado. Consultalo con tu contador.

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
- [ ] Rate limit compartido (Upstash/Redis) para Vercel; el actual es por instancia.
- [/] La proyección omite `internal_notes` y `provider_payload`; las pruebas validan el aislamiento de facturas por cliente y firma/idempotencia del webhook. El esquema ya está validado en PostgreSQL; falta probar el flujo completo con eventos reales de Mercado Pago.
- [/] `/comments` redirige a proyectos y `/perfil` redirige al acceso; la ruta CV no se modificó.

---

## 7. Textos propuestos

**Criterios:** una sola voz (primera persona del singular, porque trabajás como persona: "te ayudo", "configuro"), voseo, frases cortas, beneficio antes que jerga, sin promesas que no podés garantizar (consistente con lo que ya hacés en SEO). Reemplazá los `[...]` con datos reales; **no publiques plazos, cifras ni garantías que no puedas cumplir.**

### 7.1 [X] `SITE.home` (`site.js`)

```js
brand: { subtitle: 'Webs, hosting y soporte técnico', ctaLabel: 'Pedir presupuesto' },

home: {
  heroTitle: 'Tu web, tu dominio y tu correo,',
  heroHighlight: 'funcionando y a cargo de una sola persona.',
  intro:
    'Soy Nicolás. Hago sitios web y me encargo de lo que hay detrás: dominio, hosting, correo, SEO y redes. Vos me contás qué necesitás; yo me ocupo de la parte técnica y te explico todo en simple.',
  proof: ['Webs y tiendas online', 'Dominio, hosting y correo', 'Soporte técnico en Uruguay'],
  ctaPrimary: 'Pedir presupuesto',
  ctaSecondary: 'Ver servicios y planes',
  whatIDo: 'Servicios',
  servicesHeadline: 'Todo lo que tu negocio necesita para estar en internet.',
  infrastructure: 'Más allá de la web',
  infrastructureHeadline: 'También cuido servidores, redes y equipos.',
  process: 'Cómo trabajo',
  processHeadline: 'Cuatro pasos, sin sorpresas.',
  faqLabel: 'Antes de escribirme',
  faqHeadline: 'Preguntas frecuentes',
  ctaBandLabel: '¿Hablamos?',
  ctaBandHeadline: 'Contame qué querés lograr o qué no está funcionando. Te respondo con los próximos pasos.',
  ctaBandButton: 'Escribime',
},
```

### 7.2 Pasos del proceso (`Home.jsx`)

```js
const steps = [
  { number: '01', title: 'Me contás', text: 'Me explicás qué necesitás y qué tenés hoy. No hace falta saber de tecnología.' },
  { number: '02', title: 'Te hago una propuesta', text: 'Recibís por escrito qué incluye, cuánto cuesta y cuánto demora. Sin letra chica.' },
  { number: '03', title: 'Lo pongo en marcha', text: 'Desarrollo o configuro lo acordado y te muestro cómo quedó antes de dar el trabajo por terminado.' },
  { number: '04', title: 'Me quedo a tu lado', text: 'Si después necesitás cambios, mantenimiento o ayuda, me escribís desde tu área de cliente.' },
];

const infrastructure = [
  { title: 'Servidores', text: 'Los instalo, los configuro y los mantengo al día.' },
  { title: 'Routers y redes', text: 'Configuro routers y redes para que tus equipos se conecten de forma segura.' },
  { title: 'Domótica', text: 'Automatizo luces, equipos y rutinas en tu casa o en tu local.' },
  { title: 'Monitoreo', text: 'Te aviso cuando un servidor o un servicio deja de responder.' },
];
```

### 7.3 Catálogo (`serviceCatalog.js` y `serviceCatalogFallback.js`)

Los `includes` pasan a lenguaje de beneficio; `price` queda como respaldo cuando el servicio no tiene planes.

| slug | `description` | `summary` | `outcome` | `includes` |
|---|---|---|---|---|
| `web` | Sitios, landing pages y tiendas online hechos a tu medida y pensados para que te encuentren y te escriban. | Una web clara para mostrar lo que hacés y recibir consultas o ventas. | Recibís un sitio publicado con las secciones y funciones que acordamos. | Diseño que se ve bien en celular · Desarrollo del sitio · Base de SEO técnico · Ajustes posteriores a la entrega |
| `hosting` | Alojamiento para tu sitio, con copias de seguridad y soporte cuando lo necesites. | Tu sitio en línea y alguien que se ocupa del servidor. | Tu sitio queda alojado con el mantenimiento y las copias de seguridad que definimos. | Alojamiento · Copias de seguridad · Revisión del rendimiento · Soporte técnico |
| `email` | Correo con tu propio dominio (tu@tuempresa.com.uy), configurado en tu celular y tu computadora. | Mails con tu marca, listos para usar en todos tus dispositivos. | Cuentas de correo funcionando en los dispositivos que indiques. | Cuentas con tu dominio · Migración del correo actual · Filtro de spam · Ayuda con la configuración |
| `domains` | Registro, renovación y configuración de tu dominio. | Elijo contigo el nombre y me encargo del trámite. | Tu dominio registrado y configurado, sujeto a disponibilidad. | Registro · Renovación · Configuración de DNS · Asesoramiento para elegir el nombre |
| `seo` | Revisión de tu sitio para que los buscadores lo entiendan mejor. | Un diagnóstico claro con mejoras ordenadas por prioridad. | Recibís un informe con mejoras para aplicar. No se garantizan posiciones: dependen también de los buscadores y de la competencia. | Revisión técnica · Títulos y descripciones · Estructura del contenido · Lista de mejoras priorizada |
| `ddns` | DNS dinámico y acceso remoto a tus equipos, incluso con IP que cambia. | Entrá a tu equipo desde afuera de forma segura. | Los equipos acordados quedan accesibles de forma remota, con las medidas de seguridad definidas. | Nombre de acceso fijo · Configuración de router y servidor · Acceso remoto seguro · Soporte técnico |
| `monitoring` | Vigilo tus servidores, routers y servicios y te aviso si algo deja de responder. | Alertas en tu mail o celular cuando algo falla. | Recibís avisos por los equipos y eventos que definimos. | Monitoreo de equipos · Alertas · Primer diagnóstico · Revisión técnica |
| `impresion-3d` | Diseño e impresión de piezas y prototipos para probar una idea o resolver un problema concreto. | Me contás la idea y las medidas; yo diseño e imprimo la pieza. | Antes de empezar confirmamos alcance, material, plazo y presupuesto. | Revisión de la idea y las medidas · Diseño o ajuste del modelo · Elección de material e impresión |

Notas: en `monitoring.points` cambiá "Domótica y automatización" por "Alertas por mail o mensaje" (domótica no es un servicio del catálogo). Cambiá "Servidor optimizado" por algo que puedas respaldar, como "Servidor administrado".

### 7.4 Servicios (`Services.jsx`)

```
Título:    Servicios y planes
Párrafo:   Elegí lo que necesitás. Si tu caso es particular, escribime y te armo una propuesta a medida.
Chips:     Webs y tiendas · Dominio y hosting · Correo · SEO · Redes y servidores · Impresión 3D

Sección "Cómo elegir":
  Título:  Empezá por lo que querés lograr.
  P1:      Si recién arrancás, lo más común es web + dominio + correo. Si ya tenés algo funcionando, puedo revisarlo y decirte qué conviene cambiar y qué no.
  P2:      ¿Ya tenés un proveedor? No hace falta cambiarlo: lo reviso y trabajo con lo que tengas.

Etiqueta de precio: "Desde {precio} / mes"  ·  "Desde {precio} / año"  ·  "Presupuesto a medida"
Botón tarjeta: "Ver qué incluye"  ·  Botón plan: "Contratar"
```

### 7.5 Preguntas frecuentes (`homeFaq.js`)

```js
[
  { question: '¿Qué servicios ofrecés?',
    answer: 'Webs y tiendas online, dominios, hosting, correo con tu dominio, SEO, redes y servidores, acceso remoto y diseño e impresión 3D. Podés contratar uno solo o varios juntos.' },
  { question: '¿Trabajás con todo Uruguay?',
    answer: 'Sí. Casi todo el trabajo es a distancia, así que podés estar en cualquier departamento.' },
  { question: '¿Cómo empiezo?',
    answer: 'Escribime desde la página de contacto y contame qué necesitás y qué tenés hoy. No hace falta que sepas qué solución técnica elegir; eso lo definimos juntos.' },
  { question: '¿Puedo seguir con mi dominio y mi proveedor actual?',
    answer: 'Sí. Primero reviso lo que ya usás y te digo si conviene mantenerlo o cambiarlo. No toco nada sin avisarte y sin tu acuerdo.' },
  { question: '¿El SEO garantiza que voy a aparecer primero en Google?',
    answer: 'No, y desconfiá de quien lo prometa. Puedo mejorar los aspectos técnicos y de contenido de tu sitio, pero la posición depende también de la competencia y de los buscadores.' },
  { question: '¿Cómo se define el precio?',
    answer: 'Los servicios con plan tienen precio publicado. Para webs y trabajos a medida te envío una propuesta por escrito con alcance, plazo y costo antes de empezar.' },
  { question: '¿Cómo pago?',
    answer: 'Podés pagar por transferencia o online desde tu área de cliente. Cada pago queda registrado en tu historial de facturas.' },
  { question: '¿Qué pasa si quiero cancelar un servicio?',
    answer: 'Me avisás desde tu área de cliente o por mail. Te explico qué pasa con tus datos y tu dominio antes de dar de baja. [Completar con tu política real de cancelación y reembolsos.]' },
  { question: '¿Puedo ver el estado de mis servicios?',
    answer: 'Sí. En tu área de cliente ves tus servicios, sus vencimientos, tus facturas y el avance de tus proyectos.' },
]
```

### 7.6 Sobre mí (`AboutMe.jsx`)

```
H1:  Soy Nicolás. Hago webs y me ocupo de todo lo que las hace funcionar.
P1:  Trabajo con personas y negocios de todo Uruguay. A veces el proyecto empieza con una web nueva; otras, con algo que dejó de funcionar o que hay que ordenar.
P2:  Soy desarrollador frontend, formado en Jóvenes a Programar de Ceibal. Además de programar, me encargo de hosting, redes y servidores, así que no tenés que coordinar con tres proveedores distintos.

Tarjeta: "En qué trabajo" → Webs y tiendas online · Hosting y publicación · Redes y servidores

Bloque "Mi forma de trabajar":
  Título: Soluciones simples, con una base técnica sólida.
  P1:     Uso HTML, CSS, JavaScript y React, y también Node.js, Express, Firebase y bases de datos. Elijo las herramientas según lo que tu proyecto necesita, no al revés.
  P2:     Si ya tenés un sitio, un dominio o un proveedor, primero reviso lo que hay y recién después te propongo cambios. Para empezar, escribime desde [contacto].

CTA: ¿Tenés algo en mente? → Contame qué querés lograr o qué no funciona y vemos los próximos pasos.
```

### 7.7 Contacto (`Contact.jsx`)

```
H1:  Contame qué necesitás.
P:   Atiendo a personas y negocios de todo Uruguay. Puede ser una web nueva, un proyecto en marcha o un problema técnico. Escribime unas líneas y te respondo con los próximos pasos.

Barra de confianza:
  Paso 1 · Me escribís        → Me contás qué necesitás y para cuándo.
  Paso 2 · Te respondo        → [Completar con tu tiempo real de respuesta, p. ej. "en 1 día hábil"].
  Paso 3 · Propuesta clara    → Alcance, plazo y costo por escrito, antes de empezar.
```

### 7.8 Proyectos (`Projects.jsx`)

```
H1:  Mi proyecto más reciente: este sitio.
P:   Todavía no publico trabajos de clientes porque prefiero hacerlo solo con su autorización. Mientras tanto, podés ver cómo está hecho este sitio.
```
(Cuando tengas un cliente que lo autorice, agregá un caso con: problema → qué hice → resultado, **sin cifras que no puedas comprobar**.)

### 7.9 Textos del área de cliente (microcopy)

```
Título:                 Tu cuenta
Sin ficha asociada:     Tu cuenta está creada, pero todavía no tiene servicios asociados. Escribime a {email} y la vinculo a tu correo.
Resumen vacío:          Todavía no tenés servicios contratados.
Servicio activo:        Activo · Se renueva el {fecha}
Servicio por vencer:    Vence en {n} días. Podés renovarlo desde Facturas.
Servicio vencido:       Venció el {fecha}. Escribime para reactivarlo.
Factura pendiente:      Tenés {n} factura(s) pendiente(s) por {monto}.
Botón de pago:          Pagar ahora
Pago en revisión:       Estamos confirmando tu pago. Se actualiza solo en unos minutos.
Pago acreditado:        ¡Listo! Recibimos tu pago. Gracias.
Pago rechazado:         No pudimos procesar el pago. Probá con otro medio o pagá por transferencia.
Pedir baja:             Pedir baja o cambio
Soporte (nuevo ticket): Contame qué pasó. Cuantos más detalles, más rápido lo resuelvo.
```

### 7.10 Textos del panel admin (microcopy)

```
Confirmar borrado:      ¿Archivar a {cliente}? Sus facturas se conservan y podés restaurarlo después.
Marcar como pagada:     Registrar pago de {monto} por {método}. Esta acción queda en el historial.
Conflicto de edición:   Otra persona modificó este registro mientras lo editabas. Recargá para ver los cambios.
Plan sin precio:        Completá el precio y la moneda para poder publicarlo.
Sin resultados:         No hay resultados con estos filtros.
```

---