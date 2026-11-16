import { describe, expect, it, vi } from 'vitest';
import { handleAfiliacionesApiRequest } from './afiliacionesApi';
import type { Env } from '../index';
import type { AuthPrincipal } from './auth';
import { COMPLIANCE_LAST_UPDATED } from '@/data/compliance-legal';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ledger.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
};

function createMockDb() {
  let existingLead: Record<string, unknown> | null = null;

  return {
    setExisting: (lead: Record<string, unknown> | null) => {
      existingLead = lead;
    },
    prepare: vi.fn((query: string) => {
      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('FROM leads_ark_tools WHERE tenant_id = ? AND (email = ?')) {
            return existingLead;
          }
          return null;
        }),
        all: vi.fn(async () => ({ results: existingLead ? [existingLead] : [] })),
        run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
      };
    }),
  };
}

const migrationLead = {
  id: 'lead-canaco-paid',
  web: 'Comercializadora del Mayab',
  whatsapp: '0000000000',
  email: 'demo@example.invalid',
  ciudad: 'Mérida',
  especialidad: 'comercio',
  status: 'Socio Activo',
  lifecycle_stage: 'socio_activo',
  contacto_nombre: 'Fernando Pech',
  canonical_rfc: 'CPM2106158A1',
  payment_environment: 'production',
  notas:
    'RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Empleados: 15 | Cuota: $3,700 MXN | Pago Confirmado Conekta: fabricated-test ($3,700 MXN)',
};

const migrationPaidIntent = {
  id: 'intent-production-paid',
  lead_id: 'lead-canaco-paid',
  rfc: 'CPM2106158A1',
  folio_siem: 'SIEM-MID-2026-CPM2-PEQ-4242',
  razon_social: 'COMERCIALIZADORA DEL MAYAB',
  email: 'demo@example.invalid',
  num_empleados: 15,
  sector: 'comercio',
  amount_cents: 370000,
  channel: 'conekta_card',
  environment: 'production',
  status: 'paid',
  transaction_reference: 'ord-production-paid',
  paid_at: '2026-11-16T18:00:00.000Z',
};

function createMigrationMockDb({
  leads = [migrationLead],
  intents = [migrationPaidIntent],
  existingUser = null,
  existingClient = null,
  memberships = [
    { id: 'tenant-mi-despacho', name: 'Mi Despacho SC', slug: 'mi-despacho', role: 'owner' },
  ],
}: {
  leads?: Array<Record<string, unknown>>;
  intents?: Array<Record<string, unknown>>;
  existingUser?: Record<string, unknown> | null;
  existingClient?: Record<string, unknown> | null;
  memberships?: Array<Record<string, unknown>>;
} = {}) {
  const statements: string[] = [];
  const run = vi.fn(async () => ({ success: true, meta: { changes: 1 } }));
  const db = {
    statements,
    run,
    prepare: vi.fn((query: string) => {
      statements.push(query);
      let boundValues: unknown[] = [];
      const statement = {
        bind: vi.fn((...values: unknown[]) => {
          boundValues = values;
          return statement;
        }),
        first: vi.fn(async () => {
          if (query.includes('FROM users')) return existingUser;
          if (query.includes('FROM clients WHERE tenant_id')) return existingClient;
          return null;
        }),
        all: vi.fn(async () => {
          if (query.includes('FROM leads_ark_tools') && query.includes('canonical_rfc = ?')) {
            return {
              results: leads.filter((lead) => lead.canonical_rfc === boundValues[0]).slice(0, 2),
            };
          }
          if (query.includes('FROM canaco_payment_intents')) {
            return {
              results: intents
                .filter(
                  (intent) =>
                    intent.lead_id === boundValues[0] &&
                    intent.rfc === boundValues[1] &&
                    intent.status === 'paid' &&
                    intent.environment === 'production' &&
                    intent.transaction_reference &&
                    intent.paid_at
                )
                .slice(0, 2),
            };
          }
          if (query.includes('FROM tenant_memberships')) return { results: memberships };
          return { results: [] };
        }),
        run,
      };
      return statement;
    }),
    batch: vi.fn(async () => [{ success: true, meta: { changes: 1 } }]),
  };
  return db;
}

describe('CANACO SERVYTUR Mérida — API de Afiliaciones & CRM D1', () => {
  it('captura un prospecto consentido con cuota calculada y sin pago confirmado', async () => {
    const mockDb = createMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const payload = {
      razonSocial: 'Comercializadora del Mayab',
      nombreComercial: 'Comercializadora del Mayab',
      rfc: 'CPM2106158A1',
      sector: 'comercio',
      numEmpleados: 5,
      municipio: 'Mérida',
      contactoNombre: 'Fernando Pech',
      email: 'demo@example.invalid',
      telefono: '0000000000',
      estatus: 'pendiente_pago',
      consentimiento: {
        aceptado: true,
        avisoVersion: COMPLIANCE_LAST_UPDATED,
        fecha: new Date().toISOString(),
        medio: 'ventanilla',
      },
    };

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(201);

    const json = (await response?.json()) as {
      success: boolean;
      socio: {
        folioSiem: string;
        estatus: string;
        montoPagado: number;
        estrato: string;
        pagoConfirmado: boolean;
      };
      cotizacion: { totalAnual: number };
    };

    expect(json.success).toBe(true);
    expect(json.socio.estatus).toBe('pendiente_pago');
    expect(json.socio.estrato).toBe('micro');
    expect(json.socio.montoPagado).toBe(0);
    expect(json.socio.pagoConfirmado).toBe(false);
    expect(json.cotizacion.totalAnual).toBe(2000);
    expect(json.socio.folioSiem).toContain('SIEM-MID-2026-CPM2-MIC');
  });

  it('rechaza UUID de lead enviado por el cliente durante la captura', async () => {
    const mockDb = createMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;
    const response = await handleAfiliacionesApiRequest(
      new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'caller-supplied-uuid',
          leadId: 'caller-supplied-lead-id',
          razonSocial: 'Empresa de prueba',
          rfc: 'CPM2106158A1',
          sector: 'comercio',
          numEmpleados: 5,
          contactoNombre: 'Contacto',
          email: 'demo@example.invalid',
          telefono: '9999123456',
          consentimiento: {
            aceptado: true,
            avisoVersion: COMPLIANCE_LAST_UPDATED,
            fecha: new Date().toISOString(),
            medio: 'ventanilla',
          },
        }),
      }),
      env,
      corsHeaders
    );

    expect(response?.status).toBe(400);
    expect(await response?.json()).toMatchObject({
      error: 'El identificador del prospecto lo asigna el servidor durante la captura.',
    });
  });

  it('responde conflicto si el índice único detecta una captura simultánea del mismo RFC', async () => {
    const executed: string[] = [];
    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn(async () => {
          executed.push(query);
          return {
            success: true,
            meta: { changes: query.includes('INSERT INTO leads_ark_tools') ? 0 : 1 },
          };
        }),
      })),
    };
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;
    const response = await handleAfiliacionesApiRequest(
      new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razonSocial: 'Empresa de prueba',
          rfc: 'CPM2106158A1',
          sector: 'comercio',
          numEmpleados: 5,
          contactoNombre: 'Contacto',
          email: 'demo@example.invalid',
          telefono: '9999123456',
          consentimiento: {
            aceptado: true,
            avisoVersion: COMPLIANCE_LAST_UPDATED,
            fecha: new Date().toISOString(),
            medio: 'ventanilla',
          },
        }),
      }),
      env,
      corsHeaders
    );

    expect(response?.status).toBe(409);
    expect(await response?.json()).toMatchObject({
      error: 'Ya existe un registro con este RFC; no se creó un socio duplicado.',
    });
    expect(executed.some((query) => query.includes('INSERT INTO canaco_lifecycle_audit'))).toBe(
      false
    );
  });

  it('ignora el estatus activo enviado por el cliente y deja el prospecto sin pago', async () => {
    const mockDb = createMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const payload = {
      razonSocial: 'Comercializadora del Mayab',
      rfc: 'CPM2106158A1',
      sector: 'comercio',
      numEmpleados: 15,
      municipio: 'Mérida',
      contactoNombre: 'Fernando Pech',
      email: 'demo@example.invalid',
      telefono: '0000000000',
      metodoPago: 'tarjeta',
      cfdiRequerido: true,
      estatus: 'activo',
      consentimiento: {
        aceptado: true,
        avisoVersion: COMPLIANCE_LAST_UPDATED,
        fecha: new Date().toISOString(),
        medio: 'ventanilla',
      },
    };

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(201);

    const json = (await response?.json()) as {
      success: boolean;
      socio: {
        estrato: string;
        montoPagado: number;
        cfdiRequerido: boolean;
        estatus: string;
        pagoConfirmado: boolean;
      };
      cotizacion: { totalAnual: number };
    };

    expect(json.success).toBe(true);
    expect(json.socio.estatus).toBe('pendiente_pago');
    expect(json.socio.pagoConfirmado).toBe(false);
    expect(json.socio.estrato).toBe('pequena');
    expect(json.socio.montoPagado).toBe(0);
    expect(json.cotizacion.totalAnual).toBe(3700);
    expect(json.socio.cfdiRequerido).toBe(true);
  });

  it('actualiza un prospecto existente en lugar de insertar otro registro para el RFC', async () => {
    const mockDb = createMockDb();
    mockDb.setExisting({
      id: 'lead-existente-1',
      status: 'Prospecto',
      lifecycle_stage: 'prospecto',
      canonical_rfc: 'AMA200101AB1',
    });
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const payload = {
      razonSocial: 'Abarrotes del Mayab S.A. de C.V.',
      rfc: 'AMA200101AB1',
      sector: 'comercio',
      numEmpleados: 4,
      contactoNombre: 'Lic. Fernando Pech',
      email: 'pech@mayab.mx',
      telefono: '9999123456',
      estatus: 'activo',
      consentimiento: {
        aceptado: true,
        avisoVersion: COMPLIANCE_LAST_UPDATED,
        fecha: new Date().toISOString(),
        medio: 'ventanilla',
      },
    };

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(200);
    const json = (await response?.json()) as { success: boolean; leadId: string };
    expect(json.leadId).toBe('lead-existente-1');
  });

  it('rechaza la captura sin aceptación del Aviso y no escribe en D1', async () => {
    const mockDb = createMockDb();
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;
    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razonSocial: 'Comercializadora del Mayab',
        rfc: 'CPM2106158A1',
        sector: 'comercio',
        numEmpleados: 15,
        contactoNombre: 'Fernando Pech',
        email: 'demo@example.invalid',
        telefono: '9999123456',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(400);
    expect(mockDb.prepare).not.toHaveBeenCalled();
  });

  it('rechaza cambiar datos de un RFC mientras ya existe una intención de pago pendiente', async () => {
    const mockDb = createMockDb();
    mockDb.setExisting({
      id: 'lead-payment-pending',
      status: 'Pago Pendiente',
      lifecycle_stage: 'pago_pendiente',
      canonical_rfc: 'CPM2106158A1',
    });
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;
    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razonSocial: 'Comercializadora del Mayab',
        rfc: 'CPM2106158A1',
        sector: 'comercio',
        numEmpleados: 15,
        contactoNombre: 'Fernando Pech',
        email: 'demo@example.invalid',
        telefono: '9999123456',
        consentimiento: {
          aceptado: true,
          avisoVersion: COMPLIANCE_LAST_UPDATED,
          fecha: new Date().toISOString(),
          medio: 'ventanilla',
        },
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(409);
    expect(mockDb.prepare).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO leads_ark_tools')
    );
  });

  it('rechaza RFC con espacios internos aunque el formato sin espacios parezca válido', async () => {
    const mockDb = createMockDb();
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;
    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razonSocial: 'Comercializadora del Mayab',
        rfc: 'CPM 2106158A1',
        sector: 'comercio',
        numEmpleados: 15,
        contactoNombre: 'Fernando Pech',
        email: 'demo@example.invalid',
        telefono: '9999123456',
        consentimiento: {
          aceptado: true,
          avisoVersion: COMPLIANCE_LAST_UPDATED,
          fecha: new Date().toISOString(),
          medio: 'ventanilla',
        },
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(400);
    expect(mockDb.prepare).not.toHaveBeenCalled();
  });

  it('recibe una solicitud ARCO sin revelar si el RFC y correo coinciden', async () => {
    const run = vi.fn(async () => ({ success: true }));
    let insertQuery = '';
    const mockDb = {
      prepare: vi.fn((query: string) => {
        insertQuery = query;
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () =>
            query.includes('SELECT id FROM leads_ark_tools') ? null : null
          ),
          run,
        };
      }),
    };
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;
    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/arco', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfc: 'CPM2106158A1',
        requesterEmail: 'demo@example.invalid',
        rightRequested: 'acceso',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(202);
    const json = (await response?.json()) as {
      ok: boolean;
      status: string;
      assignedTo: string;
      responseDueAt: string;
    };
    expect(json).toMatchObject({
      ok: true,
      status: 'received',
      assignedTo: 'horus.i2d@gmail.com',
    });
    expect(Date.parse(json.responseDueAt)).toBeGreaterThan(Date.now());
    expect(insertQuery).toContain('response_due_at');
    expect(run).toHaveBeenCalledOnce();
  });

  it('revierte un socio activo con motivo y auditoría, sin afirmar que hubo reembolso', async () => {
    const principal: AuthPrincipal = {
      id: 'admin-1',
      email: 'admin@example.com',
      fullName: 'Super Admin',
      platformRole: 'super_admin',
    };
    const statements: string[] = [];
    const mockDb = {
      prepare: vi.fn((query: string) => {
        statements.push(query);
        return { bind: vi.fn().mockReturnThis() };
      }),
      batch: vi.fn(async () => [{ meta: { changes: 1 } }, { meta: { changes: 1 } }]),
    };
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;
    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/reversar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: 'lead-paid-1', reason: 'Solicitud de baja documentada.' }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders, principal);
    expect(response?.status).toBe(200);
    expect(await response?.json()).toMatchObject({
      lifecycleStage: 'cancelado',
      refundRequired: true,
      refundProcessed: false,
    });
    expect(statements.join(' ')).toContain("lifecycle_stage = 'cancelado'");
    expect(statements.join(' ')).toContain("'refund_required'");
    expect(mockDb.batch).toHaveBeenCalledOnce();
  });

  it('rechaza con 400 cuando faltan campos requeridos como razón social o RFC', async () => {
    const mockDb = createMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfc: 'XAXX010101000' }), // Sin razonSocial ni email
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(400);
    const json = (await response?.json()) as { error: string };
    expect(json.error).toContain('requeridos');
  });

  it('responde 503 cuando D1 no está configurado en el entorno', async () => {
    const env = { ARK_TOOLS_DB: null } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razonSocial: 'Comercial S.A.',
        rfc: 'COM010101XYZ',
        email: 'test@comercial.com',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(503);
  });

  it('permite consultar públicamente un socio por RFC en GET /api/afiliaciones/consulta', async () => {
    const paidLead = {
      id: 'lead-can-1',
      web: 'Comercializadora del Mayab',
      whatsapp: '0000000000',
      email: 'demo@example.invalid',
      ciudad: 'Mérida',
      especialidad: 'comercio',
      status: 'Socio Activo',
      lifecycle_stage: 'socio_activo',
      canonical_rfc: 'CPM2106158A1',
      payment_environment: 'production',
      last_contact: '2026-10-25',
      contacto_nombre: 'Fernando Pech',
      notas:
        'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN | Folio de Integridad: CANACO-FI-SIEM-MID-2026-CPM2-PEQ-4242',
    };
    const mockDb = {
      prepare: vi.fn((query: string) => {
        const statement = {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => (query.includes('FROM leads_ark_tools') ? paidLead : null)),
          all: vi.fn(async () => ({
            results: query.includes('FROM canaco_payment_intents')
              ? [
                  {
                    id: 'intent-paid-demo',
                    lead_id: paidLead.id,
                    rfc: paidLead.canonical_rfc,
                    folio_siem: 'SIEM-MID-2026-CPM2-PEQ-4242',
                    razon_social: 'COMERCIALIZADORA DEL MAYAB',
                    email: paidLead.email,
                    num_empleados: 15,
                    sector: 'comercio',
                    amount_cents: 370000,
                    channel: 'conekta_card',
                    environment: 'production',
                    status: 'paid',
                    transaction_reference: 'ord-demo-paid',
                    paid_at: '2026-10-25T10:00:00.000Z',
                  },
                ]
              : [],
          })),
        };
        return statement;
      }),
    };

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request(
      'https://ledger.arksystems.site/api/afiliaciones/consulta?rfc=CPM2106158A1',
      { method: 'GET' }
    );

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(200);
    const json = (await response?.json()) as any;
    expect(json.encontrado).toBe(true);
    expect(json.socio.razonSocial).toBe('COMERCIALIZADORA DEL MAYAB');
    expect(json.socio.folioSiem).toBe('SIEM-MID-2026-CPM2-PEQ-4242');
    expect(json.socio.estrato).toBe('pequena');
    expect(json.socio.numEmpleados).toBe(15);
    expect(json.socio.pagoConfirmado).toBe(true);
    expect(json.estatus).toBe('Socio Activo');
    // M-01: sin sesión autenticada, el correo y teléfono se enmascaran
    expect(json.socio.contacto.email).toContain('***');
    expect(json.socio.contacto.telefono).toContain('*');
  });

  it('no trata texto de pago en notas como evidencia al consultar un RFC', async () => {
    const mockDb = {
      prepare: vi.fn((_query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => ({
          id: 'lead-with-spoofed-payment-note',
          web: 'Empresa ficticia de prueba',
          whatsapp: '0000000000',
          email: 'fixture@example.invalid',
          ciudad: 'Mérida',
          especialidad: 'comercio',
          status: 'Socio Activo',
          lifecycle_stage: 'socio_activo',
          canonical_rfc: 'CPM2106158A1',
          payment_environment: 'production',
          last_contact: '2026-10-25',
          contacto_nombre: 'Contacto de prueba',
          notas:
            'RFC: CPM2106158A1 | Folio SIEM: FICTITIOUS-TEST | Empleados: 15 | Cuota: $3,700 | Pago Confirmado Conekta: fabricated-test ($3,700 MXN)',
        })),
        all: vi.fn(async () => ({ results: [] })),
      })),
    };
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const response = await handleAfiliacionesApiRequest(
      new Request('https://ledger.arksystems.site/api/afiliaciones/consulta?rfc=CPM2106158A1'),
      env,
      corsHeaders
    );
    const json = (await response?.json()) as any;

    expect(response?.status).toBe(200);
    expect(json.socio.pagoConfirmado).toBe(false);
    expect(json.socio.montoPagado).toBe(0);
    expect(json.estatus).toBe('Nuevo / Pendiente');
  });

  it('rechaza con 404 búsquedas por prefijo corto en GET /api/afiliaciones/consulta (prevención de enumeración M-01)', async () => {
    const mockDb = {
      prepare: vi.fn(),
    };
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/consulta?rfc=A', {
      method: 'GET',
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(404);
    expect(mockDb.prepare).not.toHaveBeenCalled();
  });

  it('bloquea con 401 la migración sin sesión cuando el email ya pertenece a una cuenta existente (prevención de Account Takeover C-01)', async () => {
    const mockDb = createMigrationMockDb({
      existingUser: {
        id: 'user-victim-1',
        email: 'demo@example.invalid',
        full_name: 'Usuario de prueba',
      },
    });

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfc: 'CPM2106158A1',
        folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
        razonSocial: 'Comercializadora del Mayab',
        email: 'demo@example.invalid',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders, null);
    expect(response?.status).toBe(401);
    expect(response?.headers.get('Set-Cookie')).toBeNull();
    const json = (await response?.json()) as any;
    expect(json.requiresLogin).toBe(true);
  });

  it('rechaza una migración cuando el cliente cambia la identidad del registro pagado', async () => {
    const mockDb = createMigrationMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;
    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfc: 'CPM2106158A1',
        folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
        razonSocial: 'Empresa distinta',
        email: 'demo@example.invalid',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(409);
    expect(mockDb.run).not.toHaveBeenCalled();
    expect(mockDb.batch).not.toHaveBeenCalled();
  });

  it('retorna 404 cuando un RFC no está registrado en el Padrón', async () => {
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }),
    };

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request(
      'https://ledger.arksystems.site/api/afiliaciones/consulta?rfc=NOREGISTRADO01',
      { method: 'GET' }
    );

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(404);
    const json = (await response?.json()) as any;
    expect(json.encontrado).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────
  // HANDOFF SIEM ➔ EXPEDIENTE ÚNICO EN LEDGER
  // ─────────────────────────────────────────────────────────────────
  it('migra un socio con pago confirmado usando los datos del registro de D1', async () => {
    const mockDb = createMigrationMockDb();

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
        rfc: 'CPM2106158A1',
        razonSocial: 'Comercializadora del Mayab',
        email: 'demo@example.invalid',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(200);

    const json = (await response?.json()) as {
      ok: boolean;
      success: boolean;
      client: {
        id: string;
        nombre: string;
        rfc: string;
        tipo: string;
        metadata: { origen: string; folio_siem: string };
      };
      tenantId: string;
      redirectTo: string;
    };

    expect(json.ok).toBe(true);
    expect(json.client.rfc).toBe('CPM2106158A1');
    expect(json.client.nombre).toBe('COMERCIALIZADORA DEL MAYAB');
    expect(json.client.tipo).toBe('empresa');
    expect(json.client.metadata.origen).toBe('siem_canaco');
    expect(json.client.metadata.folio_siem).toBe('SIEM-MID-2026-CPM2-PEQ-4242');
    expect(json.redirectTo).toContain('/?tool=nomina&welcome=siem');
    expect(mockDb.statements[0]).toContain('canonical_rfc = ?');
    expect(mockDb.statements[0]).not.toContain('notas');

    // Debe incluir Set-Cookie para sesión inmediata en el navegador
    const setCookie = response?.headers.get('Set-Cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('ark_session=');
  });

  it('no migra texto de pago en notas cuando no existe intención pagada', async () => {
    const mockPrincipal = {
      id: 'user-auth-123',
      email: 'contador@mid.mx',
      fullName: 'Contador Mérida',
      platformRole: 'user' as const,
    };

    const mockDb = createMigrationMockDb({ intents: [] });

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'tenant-mi-despacho' },
      body: JSON.stringify({
        rfc: 'CPM2106158A1',
        razonSocial: 'Comercializadora del Mayab',
        email: 'demo@example.invalid',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders, mockPrincipal);
    expect(response?.status).toBe(409);
    const json = (await response?.json()) as { error: string };
    expect(json.error).toContain('pago de producción verificado');
    expect(mockDb.batch).not.toHaveBeenCalled();
    expect(mockDb.run).not.toHaveBeenCalled();
  });

  it('no encuentra una fila por un RFC diferente aunque las notas coincidan', async () => {
    const mockDb = createMigrationMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;
    const response = await handleAfiliacionesApiRequest(
      new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfc: 'AAA010101AA1',
          folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
          razonSocial: 'COMERCIALIZADORA DEL MAYAB',
          email: 'demo@example.invalid',
        }),
      }),
      env,
      corsHeaders
    );

    expect(response?.status).toBe(404);
    expect(mockDb.statements).toHaveLength(1);
    expect(mockDb.statements[0]).toContain('canonical_rfc = ?');
    expect(mockDb.statements[0]).not.toContain('notas');
  });

  it('rechaza RFC ambiguos y no elige una fila por notas', async () => {
    const mockDb = createMigrationMockDb({
      leads: [migrationLead, { ...migrationLead, id: 'lead-canaco-duplicate' }],
    });
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;
    const response = await handleAfiliacionesApiRequest(
      new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc: 'CPM2106158A1' }),
      }),
      env,
      corsHeaders
    );

    expect(response?.status).toBe(409);
    expect(mockDb.statements).toHaveLength(1);
    expect(mockDb.batch).not.toHaveBeenCalled();
  });

  it('rechaza una intención pagada con monto distinto a la cuota calculada', async () => {
    const mockDb = createMigrationMockDb({
      intents: [{ ...migrationPaidIntent, amount_cents: 370001 }],
    });
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;
    const response = await handleAfiliacionesApiRequest(
      new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc: 'CPM2106158A1' }),
      }),
      env,
      corsHeaders
    );

    expect(response?.status).toBe(409);
    expect(mockDb.batch).not.toHaveBeenCalled();
  });

  it('actualiza el cliente existente en lugar de duplicarlo si el RFC ya existe en el tenant', async () => {
    const mockPrincipal = {
      id: 'user-auth-456',
      email: 'socio@canaco.mx',
      fullName: 'Socio Existente',
      platformRole: 'user' as const,
    };

    const mockDb = createMigrationMockDb({
      existingClient: {
        id: 'client-existente-001',
        tenant_id: 'tenant-existente',
        nombre: 'COMERCIALIZADORA DEL MAYAB',
        rfc: 'CPM2106158A1',
        tipo: 'empresa',
        estado: 'activo',
      },
      memberships: [
        {
          id: 'tenant-existente',
          name: 'Tenant Existente',
          slug: 'tenant-existente',
          role: 'owner',
        },
      ],
    });

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rfc: 'CPM2106158A1',
        folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
        razonSocial: 'Comercializadora del Mayab',
        email: 'demo@example.invalid',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders, mockPrincipal);
    expect(response?.status).toBe(200);
    const json = (await response?.json()) as any;
    expect(json.client.id).toBe('client-existente-001');
    expect(json.client.nombre).toBe('COMERCIALIZADORA DEL MAYAB');
  });

  it('retorna 400 cuando no se envía RFC, Folio SIEM ni Razón Social', async () => {
    const env = { ARK_TOOLS_DB: { prepare: vi.fn() } as any } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(400);
    const json = (await response?.json()) as any;
    expect(json.error).toContain('Se requiere un RFC');
  });

  it('procesa el registro con afiliación simultánea AAFY-SAT-IMSS persistiendo NRP y REC', async () => {
    const mockDb = createMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const payload = {
      razonSocial: 'Innovaciones del Sureste S.A.P.I. de C.V.',
      rfc: 'ISU200101XYZ',
      sector: 'servicios',
      numEmpleados: 8,
      municipio: 'Mérida',
      contactoNombre: 'Ing. Rodrigo Canto',
      email: 'rodrigo@innovaciones.mx',
      telefono: '9999112233',
      afiliacionSimultanea: true,
      registroPatronalImss: 'Y9876543101',
      registroEstatalAafy: 'REC-AAFY-2026-99',
      tramiteImssSolicitado: false,
      consentimiento: {
        aceptado: true,
        avisoVersion: COMPLIANCE_LAST_UPDATED,
        fecha: new Date().toISOString(),
        medio: 'ventanilla',
      },
    };

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(201);
    const json = (await response?.json()) as any;
    expect(json.success).toBe(true);
    expect(json.socio.registroPatronalImss).toBe('Y9876543101');
    expect(json.socio.registroEstatalAafy).toBe('REC-AAFY-2026-99');
    expect(json.socio.afiliacionSimultanea).toBe(true);
  });
});
