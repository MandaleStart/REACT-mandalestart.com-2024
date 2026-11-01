CREATE TABLE IF NOT EXISTS unapplied_payments (
  id bigserial PRIMARY KEY,
  provider_payment_id text NOT NULL UNIQUE,
  invoice_id text REFERENCES invoices(id) ON DELETE SET NULL,
  external_reference text,
  reason text NOT NULL,
  amount_cents bigint CHECK (amount_cents IS NULL OR amount_cents > 0),
  currency text CHECK (currency IS NULL OR currency IN ('UYU', 'USD')),
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'applied', 'refunded', 'dismissed')),
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS unapplied_payments_pending_idx
  ON unapplied_payments (created_at DESC)
  WHERE status = 'pending_review';
