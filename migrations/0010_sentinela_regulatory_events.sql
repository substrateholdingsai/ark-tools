-- ==============================================================================
-- ARK LEDGER — Migración 0010: Eventos Regulatorios y Fiscales (Sentinela Legal)
--
-- Tabla receptora de webhooks del worker 'sentinela-legal' (Cloudflare Edge RegTech).
-- Almacena alertas tempranas del DOF, SAT, CONDUSEF y BANXICO para alimentar:
-- 1. Radar Regulatorio en Vivo (Frontend Dashboard).
-- 2. Contexto de Inteligencia para Noah (Agente IA de Ark Ledger).
-- 3. Alertas de desactualización de catálogos fiscales oficiales.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sentinela_events (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  effective_date TEXT,
  laws_affected TEXT,
  action_required TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_status INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sentinela_events_channel ON sentinela_events(channel);
CREATE INDEX IF NOT EXISTS idx_sentinela_events_severity ON sentinela_events(severity);
CREATE INDEX IF NOT EXISTS idx_sentinela_events_created_at ON sentinela_events(created_at DESC);
