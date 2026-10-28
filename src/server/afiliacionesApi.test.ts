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
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

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
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

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
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

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
    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

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

    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

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

    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

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
});
