import { describe, expect, it, vi } from 'vitest';
import { handleLeadsApiRequest } from './leadsApi';
import type { Env } from '../index';
import type { AuthPrincipal } from './auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tools.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
};

const superAdminUser: AuthPrincipal = {
  id: 'user-admin',
  email: 'admin@example.com',
  fullName: 'Super Admin',
  platformRole: 'super_admin',
};

const sampleLeadRow = {
  id: 'lead-1',
  web: 'https://despachoejemplo.mx',
  whatsapp: '5219991234567',
  email: 'contacto@despachoejemplo.mx',
  ciudad: 'Merida',
  especialidad: 'Fiscal',
  status: 'Nuevo',
  last_contact: '2026-10-15',
  contacto_nombre: 'Lic. Perez',
  notas: 'Interesado en calculadoras fiscales',
  tenant_id: 'ark',
  created_at: '2026-10-15 10:00:00',
  updated_at: '2026-10-15 10:00:00',
};

function createMockDb() {
  return {
    prepare: vi.fn((query: string) => {
      const statement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('COUNT(*) AS total')) return { total: 1 };
          if (query.includes('FROM leads_ark_tools WHERE id = ?')) return sampleLeadRow;
          return null;
        }),
        all: vi.fn(async () => {
          if (query.includes('GROUP BY ciudad')) {
            return { results: [{ ciudad: 'Merida', count: 1 }] };
          }
          if (query.includes('GROUP BY status')) {
            return { results: [{ status: 'Nuevo', count: 1 }] };
          }
          if (query.includes('GROUP BY especialidad')) {
            return { results: [{ especialidad: 'Fiscal', count: 1 }] };
          }
          if (query.includes('SELECT * FROM leads_ark_tools')) {
            return { results: [sampleLeadRow] };
          }
          return { results: [] };
        }),
        run: vi.fn(async () => ({ success: true })),
      };
      return statement;
    }),
  } as unknown as D1Database;
}

function createEnv(db?: D1Database): Env {
  return {
    ARK_TOOLS_DB: db ?? createMockDb(),
    JWT_SECRET: 'test-secret',
    RESEND_API_KEY: 're_test',
    RESEND_FROM_EMAIL: 'soporte@arksystems.site',
    ENVIRONMENT: 'development',
    ALLOWED_ORIGIN: 'https://tools.arksystems.site',
  } as unknown as Env;
}

describe('handleLeadsApiRequest', () => {
  it('retorna null para rutas que no coinciden con /api/admin/leads', async () => {
    const env = createEnv();
    const req = new Request('https://tools.arksystems.site/api/other');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res).toBeNull();
  });

  it('retorna 503 si la base de datos D1 no está disponible', async () => {
    const env = {
      JWT_SECRET: 'test-secret',
      ENVIRONMENT: 'development',
    } as unknown as Env;
    const req = new Request('https://tools.arksystems.site/api/admin/leads');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(503);
  });

  it('retorna 401 si no hay usuario autenticado', async () => {
    const env = createEnv();
    const req = new Request('https://tools.arksystems.site/api/admin/leads');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, null);
    expect(res?.status).toBe(401);
  });

  it('obtiene estadísticas agrupadas en GET /api/admin/leads/stats', async () => {
    const env = createEnv();
    const req = new Request('https://tools.arksystems.site/api/admin/leads/stats');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as { ok: boolean; total: number; por_ciudad: Array<{ ciudad: string; count: number }> };
    expect(json.ok).toBe(true);
    expect(json.total).toBe(1);
    expect(json.por_ciudad).toHaveLength(1);
    expect(json.por_ciudad[0]?.ciudad).toBe('Merida');
  });

  it('lista prospectos con filtros en GET /api/admin/leads', async () => {
    const env = createEnv();
    const req = new Request('https://tools.arksystems.site/api/admin/leads?ciudad=Merida&status=Nuevo');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as { ok: boolean; leads: Array<{ id: string; email: string }> };
    expect(json.ok).toBe(true);
    expect(json.leads).toHaveLength(1);
    expect(json.leads[0]?.id).toBe('lead-1');
  });

  it('obtiene un lead por ID en GET /api/admin/leads/:id', async () => {
    const env = createEnv();
    const req = new Request('https://tools.arksystems.site/api/admin/leads/lead-1');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as { ok: boolean; lead: { id: string; ciudad: string } };
    expect(json.ok).toBe(true);
    expect(json.lead.id).toBe('lead-1');
    expect(json.lead.ciudad).toBe('Merida');
  });

  it('crea un nuevo prospecto en POST /api/admin/leads', async () => {
    const env = createEnv();
    const req = new Request('https://tools.arksystems.site/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        web: 'https://nuevo.mx',
        whatsapp: '5219999999999',
        email: 'nuevo@despacho.mx',
        ciudad: 'Merida',
        especialidad: 'Contabilidad',
        contacto_nombre: 'CP Sanchez',
      }),
    });
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(201);

    const json = (await res?.json()) as { ok: boolean; lead: { id: string } };
    expect(json.ok).toBe(true);
    expect(json.lead).toBeDefined();
  });

  it('actualiza un prospecto en PATCH /api/admin/leads/:id', async () => {
    const env = createEnv();
    const req = new Request('https://tools.arksystems.site/api/admin/leads/lead-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'WhatsApp_enviado',
      }),
    });
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as { ok: boolean; lead: { id: string } };
    expect(json.ok).toBe(true);
  });

  it('elimina un prospecto en DELETE /api/admin/leads/:id', async () => {
    const env = createEnv();
    const req = new Request('https://tools.arksystems.site/api/admin/leads/lead-1', {
      method: 'DELETE',
    });
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as { ok: boolean; deleted: boolean };
    expect(json.ok).toBe(true);
    expect(json.deleted).toBe(true);
  });
});
