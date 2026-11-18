import type { Env } from '../index';

export async function ingestCanacoSalesContact(
  env: Env,
  lead: {
    id: string;
    tenantId: string;
    name: string;
    company: string;
    email: string;
    phone: string;
  }
): Promise<void> {
  const tenantId = env.CANACO_SALES_TENANT_ID?.trim();
  const key = env.SALES_WORKER_INTERNAL_KEY?.trim();
  const url = env.SALES_WORKER_URL?.trim();
  if (!env.ARK_TOOLS_DB || !tenantId || tenantId !== lead.tenantId || !key || !url) {
    throw new Error('La configuración de Sales no coincide con el tenant CANACO.');
  }
  const response = await fetch(new URL('/api/internal/leads/comms-ingest', url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Ark-Internal-Key': key },
    body: JSON.stringify({
      tenant_id: tenantId,
      ledger_lead_id: lead.id,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      consent: true,
    }),
  });
  if (!response.ok) throw new Error(`Sales rechazó la ingesta (${response.status}).`);
  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== 'object' ||
    !('tenant_id' in result) ||
    result.tenant_id !== tenantId ||
    !('ledger_lead_id' in result) ||
    result.ledger_lead_id !== lead.id ||
    !('contact_id' in result) ||
    typeof result.contact_id !== 'string' ||
    !result.contact_id
  ) {
    throw new Error('Sales devolvió una identidad de contacto inválida.');
  }
  const mapping = await env.ARK_TOOLS_DB.prepare(
    `INSERT INTO canaco_comms_contact_mappings (tenant_id, ledger_lead_id, sales_contact_id)
     VALUES (?, ?, ?)
     ON CONFLICT(tenant_id, ledger_lead_id) DO UPDATE SET sales_contact_id = excluded.sales_contact_id
     WHERE canaco_comms_contact_mappings.sales_contact_id = excluded.sales_contact_id`
  )
    .bind(tenantId, lead.id, result.contact_id)
    .run();
  if (mapping.meta.changes !== 1) throw new Error('El vínculo existente no coincide con Sales.');
}
