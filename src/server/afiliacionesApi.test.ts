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
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'lead-can-1',
          web: 'Comercializadora del Mayab',
          whatsapp: '0000000000',
          email: 'demo@example.invalid',
          ciudad: 'Mérida',
          especialidad: 'comercio',
          status: 'Socio Activo',
          lifecycle_stage: 'socio_activo',
          last_contact: '2026-10-25',
          contacto_nombre: 'Fernando Pech',
          notas:
            'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN | Pago Confirmado Conekta: ord_demo_1 ($3,700 MXN) | Folio de Integridad: CANACO-FI-SIEM-MID-2026-CPM2-PEQ-4242',
        }),
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
    const paidLead = {
      id: 'lead-demo-paid',
      web: 'Comercializadora del Mayab',
      whatsapp: '0000000000',
      email: 'demo@example.invalid',
      ciudad: 'Mérida',
      especialidad: 'comercio',
      status: 'Socio Activo',
      lifecycle_stage: 'socio_activo',
      contacto_nombre: 'Fernando Pech',
      notas:
        'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN | Pago Confirmado Conekta: ord_demo_1 ($3,700 MXN)',
    };
    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('FROM leads_ark_tools')) return paidLead;
          if (query.includes('FROM users')) {
            return {
              id: 'user-victim-1',
              email: 'demo@example.invalid',
              full_name: 'Usuario de prueba',
            };
          }
          return null;
        }),
        all: vi.fn(async () => ({ results: [] })),
        run: vi.fn(async () => ({ success: true })),
      })),
      batch: vi.fn(async () => [{ success: true }]),
    };

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
    const paidLead = {
      id: 'lead-demo-paid',
      web: 'Comercializadora del Mayab',
      whatsapp: '0000000000',
      email: 'demo@example.invalid',
      ciudad: 'Mérida',
      especialidad: 'comercio',
      status: 'Socio Activo',
      lifecycle_stage: 'socio_activo',
      contacto_nombre: 'Fernando Pech',
      notas:
        'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN | Pago Confirmado Conekta: ord_demo_1 ($3,700 MXN)',
    };
    const run = vi.fn();
    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => (query.includes('FROM leads_ark_tools') ? paidLead : null)),
        run,
      })),
      batch: vi.fn(),
    };
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
    expect(run).not.toHaveBeenCalled();
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
    const mockLead = {
      id: 'lead-canaco-99',
      web: 'Comercializadora del Mayab',
      whatsapp: '0000000000',
      email: 'demo@example.invalid',
      ciudad: 'Mérida',
      especialidad: 'comercio',
      status: 'Socio Activo',
      lifecycle_stage: 'socio_activo',
      contacto_nombre: 'Fernando Pech',
      notas:
        'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN | Pago Confirmado Conekta: ord_demo_1 ($3,700 MXN) | Folio de Integridad: CANACO-FI-SIEM-MID-2026-CPM2-PEQ-4242',
    };

    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('FROM leads_ark_tools')) return mockLead;
          if (query.includes('FROM users')) return null; // Usuario nuevo
          if (query.includes('FROM clients WHERE tenant_id')) return null; // Cliente nuevo
          return null;
        }),
        all: vi.fn(async () => ({ results: [] })),
        run: vi.fn(async () => ({ success: true })),
      })),
      batch: vi.fn(async () => [{ success: true }]),
    };

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

    // Debe incluir Set-Cookie para sesión inmediata en el navegador
    const setCookie = response?.headers.get('Set-Cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('ark_session=');
  });

  it('no crea un cliente cuando no existe un registro pagado en el padrón', async () => {
    const mockPrincipal = {
      id: 'user-auth-123',
      email: 'contador@mid.mx',
      fullName: 'Contador Mérida',
      platformRole: 'user' as const,
    };

    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('FROM leads_ark_tools')) return null;
          if (query.includes('FROM clients WHERE tenant_id')) return null;
          return null;
        }),
        all: vi.fn(async () => ({
          results: [
            {
              id: 'tenant-mi-despacho',
              name: 'Mi Despacho SC',
              slug: 'mi-despacho',
              role: 'owner',
            },
          ],
        })),
        run: vi.fn(async () => ({ success: true })),
      })),
      batch: vi.fn(async () => [{ success: true }]),
    };

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/migrar-a-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'tenant-mi-despacho' },
      body: JSON.stringify({
        rfc: 'PECM850101XYZ', // 13 chars -> Persona Física
        razonSocial: 'Pedro Canché Medina',
        email: 'pedro@mayab.mx',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders, mockPrincipal);
    expect(response?.status).toBe(409);
    const json = (await response?.json()) as { error: string };
    expect(json.error).toContain('pendiente de confirmación de pago');
  });

  it('actualiza el cliente existente en lugar de duplicarlo si el RFC ya existe en el tenant', async () => {
    const paidLead = {
      id: 'lead-demo-paid',
      web: 'Comercializadora del Mayab',
      whatsapp: '0000000000',
      email: 'demo@example.invalid',
      ciudad: 'Mérida',
      especialidad: 'comercio',
      status: 'Socio Activo',
      lifecycle_stage: 'socio_activo',
      contacto_nombre: 'Fernando Pech',
      notas:
        'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN | Pago Confirmado Conekta: ord_demo_1 ($3,700 MXN)',
    };
    const mockPrincipal = {
      id: 'user-auth-456',
      email: 'socio@canaco.mx',
      fullName: 'Socio Existente',
      platformRole: 'user' as const,
    };

    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('FROM leads_ark_tools')) return paidLead;
          if (query.includes('FROM clients WHERE tenant_id')) {
            return {
              id: 'client-existente-001',
              tenant_id: 'tenant-existente',
              nombre: 'COMERCIALIZADORA DEL MAYAB',
              rfc: 'CPM2106158A1',
              tipo: 'empresa',
              estado: 'activo',
            };
          }
          return null;
        }),
        all: vi.fn(async () => ({
          results: [
            {
              id: 'tenant-existente',
              name: 'Tenant Existente',
              slug: 'tenant-existente',
              role: 'owner',
            },
          ],
        })),
        run: vi.fn(async () => ({ success: true })),
      })),
      batch: vi.fn(async () => [{ success: true }]),
    };

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
    expect(json.error).toContain('Se requiere RFC');
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
