-- CANACO CRM lifecycle, consent, payment attempts, approvals, and ARCO tracking.
-- Apply through `wrangler d1 migrations apply`; SQLite has no
-- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, and Wrangler's migration ledger
-- prevents already-applied DDL from running again.
ALTER TABLE leads_ark_tools ADD COLUMN canonical_rfc TEXT;
ALTER TABLE leads_ark_tools ADD COLUMN lifecycle_stage TEXT NOT NULL DEFAULT 'prospecto';
ALTER TABLE leads_ark_tools ADD COLUMN consent_aviso_version TEXT;
ALTER TABLE leads_ark_tools ADD COLUMN consent_accepted_at TEXT;
ALTER TABLE leads_ark_tools ADD COLUMN consent_medium TEXT;
ALTER TABLE leads_ark_tools ADD COLUMN arkangel_share_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads_ark_tools ADD COLUMN origin TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE leads_ark_tools ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads_ark_tools ADD COLUMN payment_environment TEXT
  CHECK (payment_environment IN ('sandbox', 'production'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_tenant_canonical_rfc
  ON leads_ark_tools(tenant_id, canonical_rfc)
  WHERE canonical_rfc IS NOT NULL AND canonical_rfc != '';

CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage
  ON leads_ark_tools(tenant_id, lifecycle_stage);

CREATE TABLE IF NOT EXISTS canaco_payment_intents (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads_ark_tools(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'canaco_merida',
  rfc TEXT NOT NULL,
  folio_siem TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  email TEXT NOT NULL,
  num_empleados INTEGER NOT NULL,
  sector TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('conekta_card', 'conekta_spei', 'clip', 'arkangel_callback')),
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'paid', 'expired', 'cancelled', 'failed', 'superseded')),
  order_id TEXT,
  checkout_url TEXT,
  transaction_reference TEXT,
  payment_event_id TEXT,
  evidence_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  paid_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_canaco_payment_order
  ON canaco_payment_intents(order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_canaco_payment_transaction
  ON canaco_payment_intents(transaction_reference) WHERE transaction_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_canaco_payment_lead_status
  ON canaco_payment_intents(lead_id, status);

CREATE TABLE IF NOT EXISTS canaco_lifecycle_audit (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'canaco_merida',
  actor_id TEXT,
  actor_email TEXT,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  reason TEXT NOT NULL,
  payment_outcome TEXT,
  evidence_reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_canaco_audit_evidence
  ON canaco_lifecycle_audit(lead_id, evidence_reference)
  WHERE evidence_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS canaco_arkangel_approvals (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL UNIQUE,
  approver_id TEXT NOT NULL,
  approver_email TEXT NOT NULL,
  lead_ids_json TEXT NOT NULL,
  preview_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE TABLE IF NOT EXISTS canaco_arkangel_sync_batches (
  id TEXT PRIMARY KEY,
  approval_id TEXT NOT NULL,
  approver_id TEXT NOT NULL,
  approver_email TEXT NOT NULL,
  sent_leads_json TEXT NOT NULL,
  excluded_leads_json TEXT NOT NULL,
  simulated INTEGER NOT NULL DEFAULT 0,
  provider_result_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS canaco_arco_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'canaco_merida',
  lead_id TEXT,
  requester_email TEXT NOT NULL,
  assigned_to TEXT NOT NULL DEFAULT 'horus.i2d@gmail.com',
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  response_due_at TEXT NOT NULL,
  execution_due_at TEXT,
  right_requested TEXT NOT NULL CHECK (right_requested IN ('acceso', 'rectificacion', 'cancelacion', 'oposicion')),
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'identity_verified', 'in_progress', 'completed', 'rejected')),
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_by TEXT,
  verified_at TEXT,
  completed_by TEXT,
  completed_at TEXT,
  completion_notes TEXT
);

CREATE TABLE IF NOT EXISTS canaco_arco_processor_actions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES canaco_arco_requests(id) ON DELETE CASCADE,
  processor TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'not_applicable')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);
