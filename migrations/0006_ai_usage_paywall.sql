-- ─────────────────────────────────────────────────────────────────────
-- ARK LEDGER — Migración 0006: Control de Cuotas y Paywall para AI
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_usage (
  tenant_id   TEXT NOT NULL,
  period      TEXT NOT NULL, -- Formato 'YYYY-MM'
  query_count INTEGER NOT NULL DEFAULT 0,
  is_pro      INTEGER NOT NULL DEFAULT 0, -- 1 si tiene suscripción Pro activa
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, period),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant
  ON ai_usage(tenant_id, period);
