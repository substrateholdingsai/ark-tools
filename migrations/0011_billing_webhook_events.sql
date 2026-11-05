-- ─────────────────────────────────────────────────────────────────────────────
-- ARK LEDGER — Migración 0011: Auditoría e Idempotencia de Webhooks de Billing
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id                TEXT PRIMARY KEY,
  provider          TEXT NOT NULL DEFAULT 'clip', -- 'clip' | 'spei_arkangel' | 'manual'
  external_id       TEXT NOT NULL UNIQUE,
  event_type        TEXT,
  tenant_id         TEXT,
  amount_mxn        REAL,
  payload_hash      TEXT,
  status            TEXT NOT NULL DEFAULT 'processed' CHECK(status IN ('processed','ignored','error')),
  error_reason      TEXT,
  processed_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_tenant ON billing_webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_external ON billing_webhook_events(external_id);
