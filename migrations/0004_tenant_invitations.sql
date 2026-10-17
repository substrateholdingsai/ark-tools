-- ─────────────────────────────────────────────────────────────────────
-- ARK TOOLS — Migración 0004: Invitaciones a Despachos (Multi-Tenant Collaboration)
-- Permite a titulares ('owner') y administradores ('admin') invitar colaboradores
-- por correo electrónico para trabajar en expedientes y clientes del despacho.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_invitations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  revoked_at INTEGER,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant
  ON tenant_invitations(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token
  ON tenant_invitations(token_hash);
