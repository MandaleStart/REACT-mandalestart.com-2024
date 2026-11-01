CREATE TABLE IF NOT EXISTS mercadopago_webhook_events (
  id bigserial PRIMARY KEY,
  provider_payment_id text NOT NULL,
  request_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  processed_at timestamptz,
  last_error text,
  UNIQUE (provider_payment_id, request_id)
);
CREATE INDEX IF NOT EXISTS mercadopago_webhook_events_pending_idx
  ON mercadopago_webhook_events (available_at, received_at)
  WHERE processed_at IS NULL;

CREATE TABLE IF NOT EXISTS api_rate_limit_windows (
  rate_key text PRIMARY KEY,
  hits integer NOT NULL CHECK (hits >= 0),
  reset_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS api_rate_limit_windows_reset_idx
  ON api_rate_limit_windows (reset_at);
