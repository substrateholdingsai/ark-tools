-- Migration: 0007_leads_crm.sql
-- Sistema de gestión de leads y prospección (CRM)

-- Garantizar existencia del tenant 'ark' para integridad referencial
INSERT OR IGNORE INTO tenants (id, name, slug) VALUES ('ark', 'ARK Tools Platform', 'ark');

CREATE TABLE IF NOT EXISTS leads_ark_tools (
  id TEXT PRIMARY KEY,
  web TEXT,
  whatsapp TEXT,
  email TEXT,
  ciudad TEXT,
  especialidad TEXT,
  status TEXT DEFAULT 'Nuevo',
  last_contact DATE,
  contacto_nombre TEXT,
  notas TEXT,
  tenant_id TEXT DEFAULT 'ark' REFERENCES tenants(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads_ark_tools(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_ciudad ON leads_ark_tools(ciudad);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads_ark_tools(status);
CREATE INDEX IF NOT EXISTS idx_leads_especialidad ON leads_ark_tools(especialidad);
