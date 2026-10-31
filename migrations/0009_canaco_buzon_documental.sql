-- ─────────────────────────────────────────────────────────────────────
-- ARK LEDGER — Migración 0009: Buzón Documental CANACO (Oficialía de Partes)
-- Expediente de afiliación / refrendo SIEM: un documento vigente por casillero.
-- Los archivos viven en R2 (CANACO_DOCS) o, como respaldo, en base64 dentro de D1.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS canaco_documentos (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT NOT NULL DEFAULT 'canaco_merida',
  rfc              TEXT NOT NULL,
  lead_id          TEXT,
  tipo_documento   TEXT NOT NULL CHECK(tipo_documento IN (
                     'ine_representante', 'constancia_fiscal', 'comprobante_domicilio',
                     'acta_constitutiva', 'poder_representante',
                     'solicitud_registro', 'aviso_privacidad')),
  nombre_archivo   TEXT NOT NULL,
  mime_type        TEXT NOT NULL,
  tamano_bytes     INTEGER NOT NULL,
  sha256           TEXT NOT NULL,
  storage          TEXT NOT NULL CHECK(storage IN ('r2', 'd1')),
  r2_key           TEXT,
  contenido_base64 TEXT,
  estatus          TEXT NOT NULL DEFAULT 'recibido' CHECK(estatus IN ('recibido', 'aprobado', 'rechazado')),
  motivo_rechazo   TEXT,
  revisado_por     TEXT,
  revisado_at      DATETIME,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_canaco_docs_slot
  ON canaco_documentos(tenant_id, rfc, tipo_documento);
CREATE INDEX IF NOT EXISTS idx_canaco_docs_rfc ON canaco_documentos(tenant_id, rfc);
CREATE INDEX IF NOT EXISTS idx_canaco_docs_estatus ON canaco_documentos(tenant_id, estatus);
