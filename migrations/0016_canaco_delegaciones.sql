CREATE TABLE canaco_delegaciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE canaco_delegacion_leads (
  lead_id TEXT PRIMARY KEY REFERENCES leads_ark_tools(id) ON DELETE CASCADE,
  delegacion_id TEXT NOT NULL REFERENCES canaco_delegaciones(id),
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by TEXT NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_canaco_delegacion_leads_delegacion
  ON canaco_delegacion_leads(delegacion_id);
