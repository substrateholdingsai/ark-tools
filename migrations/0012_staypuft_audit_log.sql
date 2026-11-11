-- =============================================================================
-- Migración 0012: Bitácora Inmutable de Auditoría del Conector StayPuft
-- Registra todas las operaciones internas de lectura y acción del operador
-- StayPuft / Marina. Sin PII, sin RFC completos y sin XML de CFDI.
-- =============================================================================

CREATE TABLE IF NOT EXISTS staypuft_audit_log (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    operator TEXT NOT NULL DEFAULT 'staypuft',
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    tenant_id TEXT,
    status_code INTEGER NOT NULL,
    result TEXT NOT NULL,
    details TEXT
);

CREATE INDEX IF NOT EXISTS idx_staypuft_audit_timestamp
    ON staypuft_audit_log (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_staypuft_audit_tenant
    ON staypuft_audit_log (tenant_id, timestamp DESC);
