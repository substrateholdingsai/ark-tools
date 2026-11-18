ALTER TABLE leads_ark_tools ADD COLUMN sales_share_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads_ark_tools ADD COLUMN sales_consent_accepted_at TEXT;
