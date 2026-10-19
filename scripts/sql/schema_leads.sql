CREATE TABLE IF NOT EXISTS leads_ark_tools (
  id TEXT PRIMARY KEY,
  web TEXT,
  whatsapp TEXT, -- E.164 normalizado: 521999... , 52155...
  email TEXT,
  ciudad TEXT, -- Merida / Metropolitana / Durango / etc
  especialidad TEXT, -- Crypto / General / Cobranza / Abogados
  status TEXT, -- Nuevo / Mail_enviado_091026 / Mail_enviado_121026 / WhatsApp_enviado / Respondio_2_whats / Anti_spam / Bloqueado
  last_contact DATE,
  contacto_nombre TEXT,
  notas TEXT,
  tenant_id TEXT DEFAULT 'ark' REFERENCES tenants(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leads_tenant ON leads_ark_tools(tenant_id);
CREATE INDEX idx_leads_ciudad ON leads_ark_tools(ciudad);
CREATE INDEX idx_leads_status ON leads_ark_tools(status);
CREATE INDEX idx_leads_especialidad ON leads_ark_tools(especialidad);
