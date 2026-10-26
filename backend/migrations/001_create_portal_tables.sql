CREATE TABLE IF NOT EXISTS client_accounts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  email text NOT NULL
    CHECK (email = lower(email)),
  phone text NOT NULL DEFAULT '',
  services jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(services) = 'array'),
  projects jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(projects) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_accounts_email_lower_unique
  ON client_accounts (lower(email));

CREATE INDEX IF NOT EXISTS client_accounts_name_email_idx
  ON client_accounts (name, email);

CREATE TABLE IF NOT EXISTS catalog_services (
  slug text PRIMARY KEY,
  data jsonb NOT NULL
    CHECK (jsonb_typeof(data) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
