CREATE TABLE IF NOT EXISTS canaco_comms_jobs (
  job_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'voice_ai')),
  audience_size INTEGER NOT NULL CHECK (audience_size > 0),
  status TEXT NOT NULL,
  cost_estimate_json TEXT,
  preview_json TEXT,
  preview_expires_at TEXT,
  detail_json TEXT,
  receipt_json TEXT,
  draft_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_canaco_comms_jobs_tenant_created
  ON canaco_comms_jobs(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS canaco_comms_contact_mappings (
  tenant_id TEXT NOT NULL,
  ledger_lead_id TEXT NOT NULL REFERENCES leads_ark_tools(id) ON DELETE CASCADE,
  sales_contact_id TEXT NOT NULL,
  PRIMARY KEY (tenant_id, ledger_lead_id),
  UNIQUE (tenant_id, sales_contact_id)
);
