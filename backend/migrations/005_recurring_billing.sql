CREATE TABLE IF NOT EXISTS subscription_renewal_invoices (
  subscription_id text NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
  renewal_due_on date NOT NULL,
  invoice_id text NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subscription_id, renewal_due_on)
);

CREATE TABLE IF NOT EXISTS invoice_reminders (
  id bigserial PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type text NOT NULL
    CHECK (reminder_type IN ('D-7', 'D-1', 'D+1', 'D+7')),
  scheduled_on date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invoice_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS invoice_reminders_pending_idx
  ON invoice_reminders (available_at, scheduled_on, id)
  WHERE status IN ('pending', 'sending');
