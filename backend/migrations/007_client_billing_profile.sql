ALTER TABLE client_accounts
  ADD COLUMN IF NOT EXISTS billing_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS billing_address text NOT NULL DEFAULT '';
