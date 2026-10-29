-- ─────────────────────────────────────────────────────────────────────
-- ARK LEDGER — Migración 0008: Suscripciones y Plan Despacho Pro
-- Control de membresías SaaS, facturación Clip / SPEI y acceso ilimitado
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  tenant_id            TEXT PRIMARY KEY,
  plan                 TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'enterprise')),
  status               TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'past_due', 'canceled')),
  billing_provider     TEXT DEFAULT 'clip', -- 'clip' | 'spei_arkangel' | 'manual'
  external_id          TEXT,               -- ID de referencia Clip o folio SPEI
  monto_mensual        REAL DEFAULT 399.0,
  current_period_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_period_end   DATETIME,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON tenant_subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON tenant_subscriptions(status);
