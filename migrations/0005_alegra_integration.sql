-- ─────────────────────────────────────────────────────────────────────
-- ARK TOOLS — Migración 0005: Integración Timbrado CFDI vía Alegra
-- Permite a los despachos conectar una o múltiples cuentas de Alegra
-- para emitir y timbrar facturas CFDI 4.0 (delegado a Alegra / PAC Quadrum).
-- ─────────────────────────────────────────────────────────────────────

-- 1. Cuentas de Alegra por Despacho (Multi-Empresa)
CREATE TABLE IF NOT EXISTS tenant_alegra_accounts (
  tenant_id           TEXT NOT NULL,
  alegra_account_id   TEXT NOT NULL,
  alegra_email        TEXT NOT NULL,
  alegra_token_enc    TEXT NOT NULL,
  alegra_company_name TEXT,
  alegra_company_id   TEXT,
  alegra_rfc          TEXT,
  csd_configured      INTEGER NOT NULL DEFAULT 0,
  is_default          INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'error')),
  last_checked_at     INTEGER,
  last_error          TEXT,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, alegra_account_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_alegra_status
  ON tenant_alegra_accounts(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_tenant_alegra_default
  ON tenant_alegra_accounts(tenant_id, is_default);

-- 2. Registro de Facturas Timbradas (Historial y Folios Fiscales)
CREATE TABLE IF NOT EXISTS alegra_invoices (
  id                  TEXT PRIMARY KEY,
  tenant_id           TEXT NOT NULL,
  alegra_account_id   TEXT NOT NULL,
  alegra_invoice_id   TEXT,
  client_id           TEXT,
  uuid                TEXT,
  folio               TEXT,
  customer_name       TEXT NOT NULL,
  customer_rfc        TEXT NOT NULL,
  total               REAL NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'MXN',
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'void', 'draft')),
  pdf_url             TEXT,
  xml_url             TEXT,
  created_by          TEXT,
  created_at          INTEGER NOT NULL,
  FOREIGN KEY (tenant_id, alegra_account_id) REFERENCES tenant_alegra_accounts(tenant_id, alegra_account_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alegra_invoices_tenant
  ON alegra_invoices(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alegra_invoices_uuid
  ON alegra_invoices(uuid);
