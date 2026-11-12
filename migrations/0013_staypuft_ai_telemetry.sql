-- =============================================================================
-- Migración 0013: Telemetría Persistente de Workers AI (Neurons & Tokens)
-- Persiste el consumo real de neuronas (usage.neurons) y tokens por tenant y
-- período mensual para que GET /api/internal/metrics y GET /api/internal/status
-- mantengan consistencia entre distintos isolates del Worker.
-- =============================================================================

CREATE TABLE IF NOT EXISTS staypuft_ai_telemetry (
    tenant_id TEXT NOT NULL,
    period TEXT NOT NULL,
    neurons_available INTEGER NOT NULL DEFAULT 0,
    neurons_total REAL NOT NULL DEFAULT 0,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (tenant_id, period)
);

CREATE INDEX IF NOT EXISTS idx_staypuft_ai_telemetry_period
    ON staypuft_ai_telemetry (period);
