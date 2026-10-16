-- ─────────────────────────────────────────────────────────────────────
-- ARK TOOLS — Migración Sprint 9: Expediente Único (D1 / SQLite)
-- Centralización de Clientes/Trabajadores e Historial de Expedientes
-- ─────────────────────────────────────────────────────────────────────

-- 1. Tabla de Clientes y Trabajadores (Aislada por Tenant / Despacho)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,                             -- UUID v4
  tenant_id TEXT NOT NULL,                         -- Despacho / Organización propietaria
  user_id TEXT,                                    -- Usuario que registró el cliente
  parent_id TEXT,                                  -- Vinculación jerárquica (ej: trabajador -> empresa)
  tipo TEXT NOT NULL DEFAULT 'trabajador' CHECK(tipo IN ('empresa', 'trabajador', 'persona_fisica')),
  nombre TEXT NOT NULL,                            -- Razón Social o Nombre Completo
  rfc TEXT,                                        -- RFC con homoclave (12 o 13 chars)
  curp TEXT,                                       -- Clave Única de Registro de Población (18 chars)
  nss TEXT,                                        -- Número de Seguridad Social (11 dígitos)
  salario_diario REAL DEFAULT 0,                   -- Cuota diaria ordinaria en MXN
  salario_diario_integrado REAL DEFAULT 0,         -- SDI para IMSS e indemnizaciones LFT en MXN
  fecha_ingreso TEXT,                              -- Fecha de inicio laboral (ISO YYYY-MM-DD)
  factor_integracion REAL DEFAULT 1.049315,        -- Factor de integración mínimo o pactado
  estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'archivado')),
  metadata TEXT,                                   -- JSON con campos libres (puesto, departamento, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_nombre ON clients(tenant_id, nombre);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_rfc ON clients(tenant_id, rfc);
CREATE INDEX IF NOT EXISTS idx_clients_parent ON clients(parent_id);

-- 2. Tabla de Expedientes / Historial de Cálculos Auditables
CREATE TABLE IF NOT EXISTS expedientes (
  id TEXT PRIMARY KEY,                             -- UUID v4
  client_id TEXT NOT NULL,                         -- Cliente / Trabajador sujeto del cálculo
  tenant_id TEXT NOT NULL,                         -- Validación estricta multi-tenant
  tool_id TEXT NOT NULL,                           -- 'sbc' | 'nomina' | 'finiquitos' | 'isn' | 'leasing' | etc.
  titulo TEXT,                                     -- Ej: "Finiquito Renuncia 2026", "Nómina Quincena 1"
  input_hash TEXT NOT NULL,                        -- SHA-256 determinista para deduplicación y auditoría
  inputs TEXT NOT NULL,                            -- JSON con parámetros de entrada exactos
  outputs TEXT NOT NULL,                           -- JSON con el resultado monetario y desglose
  catalog_version TEXT NOT NULL,                   -- Sello de certeza DOF (ej: "DOF-2026-UMA117.31-SMG315.04")
  created_by TEXT,                                 -- Email o ID del contador que emitió el cálculo
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expedientes_client ON expedientes(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expedientes_tenant_tool ON expedientes(tenant_id, tool_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expedientes_dedup ON expedientes(client_id, tool_id, input_hash);

-- 3. Vinculación opcional con herramientas existentes (retrocompatible)
ALTER TABLE arkangel_ledger ADD COLUMN client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE activos_watchlist ADD COLUMN client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE guia_progress ADD COLUMN client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;
