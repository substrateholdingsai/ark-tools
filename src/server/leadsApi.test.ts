import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleLeadsApiRequest } from './leadsApi';
import { ingestCanacoSalesContact } from './canacoSalesIngest';
import type { Env } from '../index';
import type { AuthPrincipal } from './auth';

vi.mock('./canacoSalesIngest', () => ({
  ingestCanacoSalesContact: vi.fn(),
}));

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ledger.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
};

const superAdminUser: AuthPrincipal = {
  id: 'user-admin',
  email: 'admin@example.com',
  fullName: 'Super Admin',
  platformRole: 'super_admin',
};

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

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
          if (
            query.includes('SELECT * FROM leads_ark_tools') ||
            query.includes('FROM leads_ark_tools AS lead')
          ) {
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
    ALLOWED_ORIGIN: 'https://ledger.arksystems.site',
  } as unknown as Env;
}

function consentRequest(authorized: boolean, tenant = 'canaco_merida'): Request {
  return new Request(
    `https://ledger.arksystems.site/api/admin/leads/lead-1?tenant=${encodeURIComponent(tenant)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sales_share_consent: authorized }),
    }
  );
}

function createConsentDb(
  role: 'admin' | 'member',
  consent: Record<string, unknown> = {}
): { database: D1Database; updateBindings: unknown[][] } {
  const row = {
    ...sampleLeadRow,
    tenant_id: 'canaco_merida',
    is_demo: 0,
    sales_share_consent: 0,
    sales_consent_accepted_at: null,
    ...consent,
  };
  const updateBindings: unknown[][] = [];
  const database = {
    prepare: vi.fn((query: string) => {
      let bindings: unknown[] = [];
      const statement = {
        bind: vi.fn((...args: unknown[]) => {
          bindings = args;
          return statement;
        }),
        first: vi.fn(async () => {
          if (query.includes('tenant_memberships')) {
            return {
              id: 'canaco_merida',
              name: 'CANACO',
              slug: 'canaco_merida',
              role,
            };
          }
          if (query.includes('FROM leads_ark_tools WHERE id = ?')) return row;
          return null;
        }),
        all: vi.fn(async () => ({ results: [] })),
        run: vi.fn(async () => {
          if (query.includes('UPDATE leads_ark_tools SET')) {
            updateBindings.push(bindings);
          }
          return { success: true, meta: { changes: 1 } };
        }),
      };
      return statement;
    }),
  } as unknown as D1Database;
  return { database, updateBindings };
}

describe('handleLeadsApiRequest', () => {
  it('retorna null para rutas que no coinciden con /api/admin/leads', async () => {
    const env = createEnv();
    const req = new Request('https://ledger.arksystems.site/api/other');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res).toBeNull();
  });

  it('retorna 503 si la base de datos D1 no está disponible', async () => {
    const env = {
      JWT_SECRET: 'test-secret',
      ENVIRONMENT: 'development',
    } as unknown as Env;
    const req = new Request('https://ledger.arksystems.site/api/admin/leads');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(503);
  });

  it('retorna 401 si no hay usuario autenticado', async () => {
    const env = createEnv();
    const req = new Request('https://ledger.arksystems.site/api/admin/leads');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, null);
    expect(res?.status).toBe(401);
  });

  it('retorna 403 si un usuario estándar sin membresía intenta acceder al tenant ark (A-01)', async () => {
    const env = createEnv();
    const regularUser: AuthPrincipal = {
      id: 'user-regular',
      email: 'regular@example.com',
      fullName: 'Usuario Regular',
      platformRole: 'user',
    };
    const req = new Request('https://ledger.arksystems.site/api/admin/leads');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, regularUser);
    expect(res?.status).toBe(403);
  });

  it('obtiene estadísticas agrupadas en GET /api/admin/leads/stats', async () => {
    const env = createEnv();
    const req = new Request('https://ledger.arksystems.site/api/admin/leads/stats');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as {
      ok: boolean;
      total: number;
      por_ciudad: Array<{ ciudad: string; count: number }>;
    };
    expect(json.ok).toBe(true);
    expect(json.total).toBe(1);
    expect(json.por_ciudad).toHaveLength(1);
    expect(json.por_ciudad[0]?.ciudad).toBe('Merida');
  });

  it('lista prospectos con filtros en GET /api/admin/leads', async () => {
    const env = createEnv();
    const req = new Request(
      'https://ledger.arksystems.site/api/admin/leads?ciudad=Merida&status=Nuevo'
    );
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as {
      ok: boolean;
      leads: Array<{ id: string; email: string }>;
    };
    expect(json.ok).toBe(true);
    expect(json.leads).toHaveLength(1);
    expect(json.leads[0]?.id).toBe('lead-1');
  });

  it('proyecta pago CANACO sólo desde una intención pagada de producción', async () => {
    const paidLeadRow = {
      ...sampleLeadRow,
      canonical_rfc: 'CPM2106158A1',
      verified_payment_amount_cents: 370000,
      verified_payment_channel: 'conekta_card',
      verified_payment_environment: 'production',
      verified_payment_rfc: 'CPM2106158A1',
      verified_payment_folio_siem: 'SIEM-TEST-1',
      verified_payment_razon_social: 'COMERCIALIZADORA DEL MAYAB',
      verified_payment_num_empleados: 15,
      verified_payment_sector: 'comercio',
    };
    const prepare = vi.fn((_query: string) => ({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn(async () => ({ results: [paidLeadRow] })),
    }));
    const db = { prepare } as unknown as D1Database;
    const env = createEnv(db);

    const response = await handleLeadsApiRequest(
      new Request('https://ledger.arksystems.site/api/admin/leads?tenant=canaco_merida'),
      env,
      corsHeaders,
      superAdminUser
    );
    const json = (await response?.json()) as {
      leads: Array<{
        verified_payment_amount_cents: number | null;
        verified_payment_environment: string | null;
        verified_payment_rfc: string | null;
      }>;
    };
    const query = prepare.mock.calls[0]?.[0] as string;

    expect(response?.status).toBe(200);
    expect(json.leads[0]?.verified_payment_amount_cents).toBe(370000);
    expect(json.leads[0]?.verified_payment_environment).toBe('production');
    expect(json.leads[0]?.verified_payment_rfc).toBe('CPM2106158A1');
    expect(query).toContain('LEFT JOIN canaco_payment_intents');
    expect(query).toContain("payment.status = 'paid'");
    expect(query).toContain("payment.environment = 'production'");
    expect(query).toContain("lead.payment_environment = 'production'");
    expect(query).toContain('payment.rfc = lead.canonical_rfc');
    expect(query).toContain('payment.transaction_reference IS NOT NULL');
    expect(query).toContain('HAVING COUNT(*) = 1');
  });

  it('obtiene un lead por ID en GET /api/admin/leads/:id', async () => {
    const env = createEnv();
    const req = new Request('https://ledger.arksystems.site/api/admin/leads/lead-1');
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as { ok: boolean; lead: { id: string; ciudad: string } };
    expect(json.ok).toBe(true);
    expect(json.lead.id).toBe('lead-1');
    expect(json.lead.ciudad).toBe('Merida');
  });

  it('crea un nuevo prospecto en POST /api/admin/leads', async () => {
    const env = createEnv();
    const req = new Request('https://ledger.arksystems.site/api/admin/leads', {
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
    const req = new Request('https://ledger.arksystems.site/api/admin/leads/lead-1', {
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

  it('deniega a un miembro cambiar el consentimiento de Sales', async () => {
    const member: AuthPrincipal = {
      id: 'member-1',
      email: 'member@example.com',
      fullName: 'Miembro',
      platformRole: 'user',
    };
    const db = createConsentDb('member');
    const response = await handleLeadsApiRequest(
      consentRequest(true),
      createEnv(db.database),
      corsHeaders,
      member
    );

    expect(response?.status).toBe(403);
    expect(db.updateBindings).toHaveLength(0);
  });

  it('permite opt-in admin y persiste consentimiento, fecha e ingesta Sales', async () => {
    const db = createConsentDb('admin');
    const tenantAdmin: AuthPrincipal = {
      id: 'tenant-admin-1',
      email: 'tenant-admin@example.com',
      fullName: 'Admin CANACO',
      platformRole: 'user',
    };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T16:00:00.000Z'));

    const response = await handleLeadsApiRequest(
      consentRequest(true),
      createEnv(db.database),
      corsHeaders,
      tenantAdmin
    );

    expect(response?.status).toBe(200);
    expect(db.updateBindings).toHaveLength(1);
    expect(db.updateBindings[0]?.slice(9, 11)).toEqual([1, '2026-11-18T16:00:00.000Z']);
    expect(ingestCanacoSalesContact).toHaveBeenCalledTimes(1);
  });

  it('retira el consentimiento sin ingestar y limpia la fecha', async () => {
    const db = createConsentDb('admin', {
      sales_share_consent: 1,
      sales_consent_accepted_at: '2026-11-17T10:00:00.000Z',
    });

    const response = await handleLeadsApiRequest(
      consentRequest(false),
      createEnv(db.database),
      corsHeaders,
      superAdminUser
    );

    expect(response?.status).toBe(200);
    expect(db.updateBindings[0]?.slice(9, 11)).toEqual([0, null]);
    expect(ingestCanacoSalesContact).not.toHaveBeenCalled();
  });

  it('no ingesta Sales en PATCH sin cambio de consentimiento ni fuera de canaco', async () => {
    const adminDb = createConsentDb('admin');
    const unrelatedResponse = await handleLeadsApiRequest(
      new Request('https://ledger.arksystems.site/api/admin/leads/lead-1?tenant=canaco_merida', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciudad: 'Mérida' }),
      }),
      createEnv(adminDb.database),
      corsHeaders,
      superAdminUser
    );

    expect(unrelatedResponse?.status).toBe(200);
    expect(ingestCanacoSalesContact).not.toHaveBeenCalled();

    const otherTenantDb = createConsentDb('admin');
    const otherTenantResponse = await handleLeadsApiRequest(
      consentRequest(true, 'ark'),
      createEnv(otherTenantDb.database),
      corsHeaders,
      superAdminUser
    );
    expect(otherTenantResponse?.status).toBe(200);
    expect(ingestCanacoSalesContact).not.toHaveBeenCalled();
  });

  it('no persiste consentimiento si falla la ingesta Sales', async () => {
    vi.mocked(ingestCanacoSalesContact).mockRejectedValueOnce(new Error('Sales unavailable'));
    const db = createConsentDb('admin');

    const response = await handleLeadsApiRequest(
      consentRequest(true),
      createEnv(db.database),
      corsHeaders,
      superAdminUser
    );

    expect(response?.status).toBe(500);
    expect(db.updateBindings).toHaveLength(0);
  });

  it('elimina un prospecto en DELETE /api/admin/leads/:id', async () => {
    const env = createEnv();
    const req = new Request('https://ledger.arksystems.site/api/admin/leads/lead-1', {
      method: 'DELETE',
    });
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as { ok: boolean; deleted: boolean };
    expect(json.ok).toBe(true);
    expect(json.deleted).toBe(true);
  });

  it('envía correo de propuesta y actualiza estatus en POST /api/admin/leads/:id/send-email', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes('api.resend.com/emails')) {
        return new Response(JSON.stringify({ id: 'resend-msg-123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(url);
    });

    try {
      const env = createEnv();
      const req = new Request('https://ledger.arksystems.site/api/admin/leads/lead-1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_name: 'Lic. Perez' }),
      });
      const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
      expect(res?.status).toBe(200);

      const json = (await res?.json()) as {
        ok: boolean;
        resend_id: string;
        lead: { status: string };
      };
      expect(json.ok).toBe(true);
      expect(json.resend_id).toBe('resend-msg-123');
      expect(json.lead.status).toMatch(/^Mail_enviado_/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('soporta enviar correo de prueba a una dirección alternativa sin modificar el estatus del prospecto', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes('api.resend.com/emails')) {
        return new Response(JSON.stringify({ id: 'resend-test-456' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(url);
    });

    try {
      const env = createEnv();
      const req = new Request('https://ledger.arksystems.site/api/admin/leads/lead-1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_email: 'pavel@arksystems.site' }),
      });
      const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
      expect(res?.status).toBe(200);

      const json = (await res?.json()) as {
        ok: boolean;
        message: string;
        lead: { status: string };
      };
      expect(json.ok).toBe(true);
      expect(json.message).toContain('pavel@arksystems.site');
      // No debe cambiar el status del prospecto cuando es prueba
      expect(json.lead.status).toBe('Nuevo');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('conmuta transparentemente a Telnyx Email API cuando TELNYX_API_KEY está configurada', async () => {
    const originalFetch = globalThis.fetch;
    let telnyxCalled = false;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes('api.telnyx.com/v2/email_messages')) {
        telnyxCalled = true;
        return new Response(
          JSON.stringify({
            data: { id: 'telnyx-lead-email-789', record_type: 'email_message' },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return originalFetch(url);
    });

    try {
      const env = {
        ...createEnv(),
        TELNYX_API_KEY: 'KEY_TELNYX_PROD_LEADS',
      };
      const req = new Request('https://ledger.arksystems.site/api/admin/leads/lead-1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_name: 'Lic. Perez Telnyx' }),
      });
      const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
      expect(res?.status).toBe(200);

      const json = (await res?.json()) as {
        ok: boolean;
        resend_id: string;
      };
      expect(json.ok).toBe(true);
      expect(json.resend_id).toBe('telnyx-lead-email-789');
      expect(telnyxCalled).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('registra actividad de WhatsApp Studio y retorna whatsapp_url en POST /api/admin/leads/:id/log-whatsapp', async () => {
    const env = createEnv();
    const req = new Request('https://ledger.arksystems.site/api/admin/leads/lead-1/log-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_profile: 'ark',
        template_id: 'ark_marca_blanca',
        template_name: 'Plan Corporate Firm (Marca Blanca + IA)',
        message: 'Hola Lic. Perez, le escribimos de Ark Systems.',
      }),
    });
    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as {
      ok: boolean;
      whatsapp_url: string;
      lead: { status: string; notas: string; whatsapp_link: string };
    };
    expect(json.ok).toBe(true);
    expect(json.whatsapp_url).toContain('https://wa.me/5219991234567?text=');
    expect(json.lead.status).toBe('WhatsApp_enviado');
    expect(json.lead.notas).toContain('💬 WhatsApp enviado vía wa.me [Ark Systems');
    expect(json.lead.whatsapp_link).toBe('https://wa.me/5219991234567');
  });

  it('rechaza cambiar el estado CANACO a Socio Activo desde log-whatsapp', async () => {
    const run = vi.fn(async () => ({ success: true, meta: { changes: 1 } }));
    const env = createEnv({
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () =>
          query.includes('SELECT * FROM leads_ark_tools')
            ? {
                ...sampleLeadRow,
                tenant_id: 'canaco_merida',
                status: 'Pago Pendiente',
                lifecycle_stage: 'pago_pendiente',
              }
            : null
        ),
        run,
      })),
    } as unknown as D1Database);
    const req = new Request(
      'https://ledger.arksystems.site/api/admin/leads/lead-1/log-whatsapp?tenant=canaco_merida',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Socio Activo', message: 'prueba' }),
      }
    );

    const res = await handleLeadsApiRequest(req, env, corsHeaders, superAdminUser);

    expect(res?.status).toBe(403);
    expect(run).not.toHaveBeenCalled();
  });

  it('conserva el registro legítimo de WhatsApp para un prospecto CANACO sin cambiar su etapa', async () => {
    const run = vi.fn(async () => ({ success: true, meta: { changes: 1 } }));
    const env = createEnv({
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () =>
          query.includes('SELECT * FROM leads_ark_tools')
            ? {
                ...sampleLeadRow,
                tenant_id: 'canaco_merida',
                status: 'Pago Pendiente',
                lifecycle_stage: 'pago_pendiente',
              }
            : null
        ),
        run,
      })),
    } as unknown as D1Database);
    const response = await handleLeadsApiRequest(
      new Request(
        'https://ledger.arksystems.site/api/admin/leads/lead-1/log-whatsapp?tenant=canaco_merida',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Seguimiento acordado' }),
        }
      ),
      env,
      corsHeaders,
      superAdminUser
    );

    expect(response?.status).toBe(200);
    const body = (await response?.json()) as { lead: { status: string } };
    expect(body.lead.status).toBe('Pago Pendiente');
    expect(run).toHaveBeenCalledOnce();
  });
});
