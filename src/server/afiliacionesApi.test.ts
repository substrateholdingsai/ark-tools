import { describe, expect, it, vi } from 'vitest';
import { handleAfiliacionesApiRequest } from './afiliacionesApi';
import type { Env } from '../index';

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
        run: vi.fn(async () => ({ success: true })),
      };
    }),
  };
}

describe('CANACO SERVYTUR Mérida — API de Afiliaciones & CRM D1', () => {
  it('registra un comercio nuevo en D1 con estatus "Nuevo / Pendiente" y cuota calculada', async () => {
    const mockDb = createMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const payload = {
      razonSocial: 'Abarrotes del Mayab S.A. de C.V.',
      nombreComercial: 'Abarrotes Mayab',
      rfc: 'AMA200101AB1',
      sector: 'comercio',
      numEmpleados: 4,
      municipio: 'Mérida',
      contactoNombre: 'Lic. Fernando Pech',
      email: 'pech@mayab.mx',
      telefono: '9999123456',
      estatus: 'pendiente_pago',
    };

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/registro', {
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
      };
      cotizacion: { totalAnual: number };
    };

    expect(json.success).toBe(true);
    expect(json.socio.estatus).toBe('pendiente_pago');
    expect(json.socio.estrato).toBe('micro');
    expect(json.socio.montoPagado).toBe(2000); // $200 SIEM + $1800 Membresía
    expect(json.socio.folioSiem).toContain('SIEM-MID-2026-AMA2-MIC');
  });

  it('registra la liquidación de cuota y cambia el estatus a "Socio Activo" con CFDI', async () => {
    const mockDb = createMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const payload = {
      razonSocial: 'Servicios Turísticos de Mérida S.A.',
      rfc: 'STM150420XYZ',
      sector: 'turismo',
      numEmpleados: 25,
      municipio: 'Progreso',
      contactoNombre: 'Lic. Carla Gómez',
      email: 'carla@turismomerida.com',
      telefono: '9999887766',
      metodoPago: 'tarjeta',
      cfdiRequerido: true,
      estatus: 'activo',
    };

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/registro', {
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
      };
    };

    expect(json.success).toBe(true);
    expect(json.socio.estatus).toBe('activo');
    expect(json.socio.estrato).toBe('pequena');
    expect(json.socio.montoPagado).toBe(3700); // $500 SIEM + $3200 Membresía
    expect(json.socio.cfdiRequerido).toBe(true);
  });

  it('actualiza un lead existente en lugar de duplicar cuando el comercio ya existía en D1', async () => {
    const mockDb = createMockDb();
    mockDb.setExisting({ id: 'lead-existente-1', status: 'Nuevo / Pendiente' });
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
    };

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(201);
    const json = (await response?.json()) as { success: boolean; leadId: string };
    expect(json.leadId).toBe('lead-existente-1');
  });

  it('rechaza con 400 cuando faltan campos requeridos como razón social o RFC', async () => {
    const mockDb = createMockDb();
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/afiliaciones/registro', {
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
          web: 'Abarrotes del Mayab S.A. de C.V.',
          whatsapp: '9999123456',
          email: 'contacto@mayab.mx',
          ciudad: 'Mérida',
          especialidad: 'comercio',
          status: 'Socio Activo',
          last_contact: '2026-10-25',
          contacto_nombre: 'Lic. Fernando Pech',
          notas:
            'Folio SIEM: SIEM-MID-2026-AMA2-MIC-4819 | RFC: AMA200101AB1 | Cuota: $2,000 MXN | Sello: SHA256:CANACO-MID-4819-2026',
        }),
      }),
    };

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const request = new Request(
      'https://ledger.arksystems.site/api/afiliaciones/consulta?rfc=AMA200101AB1',
      { method: 'GET' }
    );

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(200);
    const json = (await response?.json()) as any;
    expect(json.encontrado).toBe(true);
    expect(json.socio.razonSocial).toBe('Abarrotes del Mayab S.A. de C.V.');
    expect(json.socio.folioSiem).toBe('SIEM-MID-2026-AMA2-MIC-4819');
    expect(json.estatus).toBe('Socio Activo');
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
  it('migra un socio registrado en SIEM hacia el Expediente Único (Guest Onboarding con Set-Cookie)', async () => {
    const mockLead = {
      id: 'lead-canaco-99',
      web: 'Comercializadora del Mayab S.A. de C.V.',
      whatsapp: '9999123456',
      email: 'facturas@mayab.mx',
      ciudad: 'Mérida',
      especialidad: 'comercio',
      status: 'Socio Activo',
      contacto_nombre: 'Lic. Fernando Pech',
      notas:
        'Folio SIEM: SIEM-MID-2026-AMA2-MIC-4819 | RFC: AMA200101AB1 | Cuota: $2,000 MXN | Sello: SHA256:CANACO-MID-4819-2026',
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
        folioSiem: 'SIEM-MID-2026-AMA2-MIC-4819',
        rfc: 'AMA200101AB1',
        razonSocial: 'Comercializadora del Mayab S.A. de C.V.',
        email: 'facturas@mayab.mx',
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
    expect(json.client.rfc).toBe('AMA200101AB1');
    expect(json.client.nombre).toBe('COMERCIALIZADORA DEL MAYAB S.A. DE C.V.');
    expect(json.client.tipo).toBe('empresa');
    expect(json.client.metadata.origen).toBe('siem_canaco');
    expect(json.client.metadata.folio_siem).toBe('SIEM-MID-2026-AMA2-MIC-4819');
    expect(json.redirectTo).toContain('/?tool=nomina&welcome=siem');

    // Debe incluir Set-Cookie para sesión inmediata en el navegador
    const setCookie = response?.headers.get('Set-Cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('ark_session=');
  });

  it('migra el socio dentro del tenant existente cuando el usuario ya tiene sesión iniciada', async () => {
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
    expect(response?.status).toBe(200);

    const json = (await response?.json()) as any;
    expect(json.ok).toBe(true);
    expect(json.tenantId).toBe('tenant-mi-despacho');
    expect(json.client.tipo).toBe('persona_fisica');
    expect(json.client.nombre).toBe('PEDRO CANCHÉ MEDINA');
  });

  it('actualiza el cliente existente en lugar de duplicarlo si el RFC ya existe en el tenant', async () => {
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
          if (query.includes('FROM clients WHERE tenant_id')) {
            return {
              id: 'client-existente-001',
              tenant_id: 'tenant-existente',
              nombre: 'NOMBRE ANTERIOR',
              rfc: 'AMA200101AB1',
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
        rfc: 'AMA200101AB1',
        razonSocial: 'NOMBRE ACTUALIZADO S.A. DE C.V.',
      }),
    });

    const response = await handleAfiliacionesApiRequest(request, env, corsHeaders, mockPrincipal);
    expect(response?.status).toBe(200);
    const json = (await response?.json()) as any;
    expect(json.client.id).toBe('client-existente-001');
    expect(json.client.nombre).toBe('NOMBRE ACTUALIZADO S.A. DE C.V.');
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
});
