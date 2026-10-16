-- ─────────────────────────────────────────────────────────────────────
-- ARK TOOLS — Migración Inicial (D1 / SQLite)
-- Arquitectura Multi-Tenant: Despachos y Usuarios
-- ─────────────────────────────────────────────────────────────────────

-- 1. Tabla de Usuarios (Sincronizada con Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk User ID (ej: user_2...)
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Tenants / Organizaciones (Despachos Contables o Cuentas Personales)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY, -- Clerk Org ID (org_2...) o User ID para cuentas personales
  name TEXT NOT NULL,
  slug TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Progreso de la Guía SAT/IMSS (Aislado por Tenant/Despacho)
CREATE TABLE IF NOT EXISTS guia_progress (
  tenant_id TEXT NOT NULL,
  step_id INTEGER NOT NULL, -- 1 al 8
  user_id TEXT NOT NULL, -- Último usuario que modificó el paso
  checklist_state TEXT, -- JSON con los checks (ej: {"s1-0": true, "s1-1": false})
  draft_text TEXT, -- Borrador generado
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, step_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_guia_progress_tenant ON guia_progress(tenant_id);

-- 4. Ledger Inmutable para Auditoría / Cobranza (Append-Only por Tenant)
CREATE TABLE IF NOT EXISTS arkangel_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  caso_id TEXT NOT NULL,
  conducta_id TEXT NOT NULL, -- Ej: "2.8", "8.1"
  estado TEXT NOT NULL, -- "BLOQUEADO" o "PERMITIDO"
  hash_sha256 TEXT NOT NULL,
  prev_hash TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ledger_tenant_caso ON arkangel_ledger(tenant_id, caso_id);

-- 5. Conductas Guardadas / Watchlist en Mapa de Activos Virtuales
CREATE TABLE IF NOT EXISTS activos_watchlist (
  tenant_id TEXT NOT NULL,
  conducta_id INTEGER NOT NULL, -- 1 al 12
  user_id TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, conducta_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activos_watchlist_tenant ON activos_watchlist(tenant_id);
