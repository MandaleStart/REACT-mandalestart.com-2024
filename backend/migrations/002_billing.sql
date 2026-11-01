CREATE TABLE IF NOT EXISTS plans (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  service_slug text NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  currency text NOT NULL CHECK (currency IN ('UYU', 'USD')),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  billing_period text NOT NULL CHECK (billing_period IN ('one_time', 'monthly', 'yearly')),
  tax_rate_bp integer NOT NULL DEFAULT 2200
    CHECK (tax_rate_bp BETWEEN 0 AND 10000),
  features jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(features) = 'array'),
  is_public boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id text NOT NULL REFERENCES client_accounts(id) ON DELETE RESTRICT,
  plan_id text REFERENCES plans(id) ON DELETE RESTRICT,
  service_type text NOT NULL,
  label text NOT NULL,
  resource_name text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'cancelled', 'expired')),
  currency text NOT NULL CHECK (currency IN ('UYU', 'USD')),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  billing_period text NOT NULL CHECK (billing_period IN ('one_time', 'monthly', 'yearly')),
  started_on date,
  renews_on date,
  cancelled_on date,
  auto_renew boolean NOT NULL DEFAULT true,
  details jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(details) = 'array'),
  internal_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_client_idx ON subscriptions (client_id);
CREATE INDEX IF NOT EXISTS subscriptions_renews_idx
  ON subscriptions (renews_on) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  number text NOT NULL UNIQUE,
  client_id text NOT NULL REFERENCES client_accounts(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'overdue')),
  currency text NOT NULL CHECK (currency IN ('UYU', 'USD')),
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
    CHECK (tax_rate_bp BETWEEN 0 AND 10000)
);

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id text NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  method text NOT NULL CHECK (method IN ('transfer', 'cash', 'mercadopago', 'paypal', 'other')),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  currency text NOT NULL CHECK (currency IN ('UYU', 'USD')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  provider_payment_id text,
  provider_payload jsonb,
  recorded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_unique
  ON payments (method, provider_payment_id) WHERE provider_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  actor_uid text NOT NULL,
  actor_email text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_entity_idx
  ON audit_log (entity_type, entity_id, created_at DESC);

ALTER TABLE client_accounts ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE client_accounts ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '';
ALTER TABLE client_accounts ADD COLUMN IF NOT EXISTS tax_id text NOT NULL DEFAULT '';

WITH legacy_services AS (
  SELECT
    clients.id AS client_id,
    services.ordinality,
    services.service,
    COALESCE(NULLIF(services.service->>'type', ''), 'other') AS service_type,
    COALESCE(
      NULLIF(services.service->>'title', ''),
      NULLIF(services.service->>'name', ''),
      'Servicio importado'
    ) AS label
  FROM client_accounts AS clients
  CROSS JOIN LATERAL jsonb_array_elements(clients.services)
    WITH ORDINALITY AS services(service, ordinality)
),
normalized_services AS (
  SELECT
    client_id,
    ordinality,
    service,
    CASE
      WHEN service_type IN (
        'domain', 'hosting', 'email', 'web', 'seo', 'ddns',
        'monitoring', '3d-printing', 'other'
      ) THEN service_type
      ELSE 'other'
    END AS service_type,
    label,
    COALESCE(service->>'name', '') AS resource_name,
    CASE
      WHEN service->>'status' = 'active' THEN 'active'
      WHEN service->>'status' = 'archived' THEN 'cancelled'
      ELSE 'pending'
    END AS status,
    CASE
      WHEN pg_input_is_valid(NULLIF(service->>'expiry', ''), 'date')
        THEN (service->>'expiry')::date
      ELSE NULL
    END AS renews_on,
    CASE
      WHEN jsonb_typeof(service->'details') = 'array' THEN service->'details'
      ELSE '[]'::jsonb
    END AS details
  FROM legacy_services
)
INSERT INTO subscriptions (
  id,
  client_id,
  service_type,
  label,
  resource_name,
  status,
  currency,
  amount_cents,
  billing_period,
  renews_on,
  auto_renew,
  details,
  internal_notes
)
SELECT
  'legacy-' || md5(client_id || ':' || ordinality::text),
  client_id,
  service_type,
  label,
  resource_name,
  status,
  'UYU',
  0,
  'one_time',
  renews_on,
  false,
  details,
  format(
    'Importado desde client_accounts.services. Revisar importe, moneda y periodicidad antes de facturar. Costo original: %s; periodicidad original: no determinada.',
    COALESCE(NULLIF(service->>'cost', ''), '(sin dato)')
  )
FROM normalized_services
ON CONFLICT (id) DO NOTHING;
