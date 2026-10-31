import { describe, it, expect, vi } from 'vitest';
import { handleCanacoBuzonApiRequest } from './canacoBuzonApi';
import type { Env } from '../index';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ledger.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

describe('CANACO SERVYTUR Mérida — Buzón Documental API (Oficialía de Partes)', () => {
  const rfcMoral = 'AMA200101AB1'; // 12 chars -> Moral (7 documentos)
  const rfcFisica = 'PECM850101XYZ'; // 13 chars -> Física (5 documentos)
  const emailSocio = 'facturas@mayab.mx';

  const mockLead = {
    id: 'lead-can-buzon-1',
    web: 'Comercializadora del Mayab S.A. de C.V.',
    email: emailSocio,
    status: 'Socio Activo',
    contacto_nombre: 'Lic. Fernando Pech',
    notas: 'RFC: AMA200101AB1 | Folio SIEM: SIEM-MID-2026-AMA2-MIC-4819',
  };

  it('permite consultar públicamente el estado de avance (X de Y) sin autenticación en GET /estado', async () => {
    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('FROM leads_ark_tools')) return mockLead;
          return null;
        }),
        all: vi.fn(async () => ({
          results: [
            {
              id: 'doc-1',
              rfc: rfcMoral,
              tipo_documento: 'ine_representante',
              nombre_archivo: 'ine.pdf',
              estatus: 'recibido',
              tamano_bytes: 120000,
            },
          ],
        })),
      })),
    };

    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

    const req = new Request(
      `https://ledger.arksystems.site/api/canaco/buzon/estado?rfc=${rfcMoral}`
    );
    const res = await handleCanacoBuzonApiRequest(req, env, corsHeaders);
    expect(res?.status).toBe(200);

    const json = (await res?.json()) as any;
    expect(json.encontrado).toBe(true);
    expect(json.tipoPersona).toBe('moral');
    expect(json.requeridos).toBe(7);
    expect(json.depositados).toBe(1);
    expect(json.completo).toBe(false);
  });

  it('valida que persona física solo requiera 5 documentos (excluye acta y poder)', async () => {
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => ({
          id: 'lead-pf-1',
          web: 'Pedro Canche Medina',
          email: 'pedro@canche.mx',
          status: 'Socio Activo',
          notas: 'RFC: PECM850101XYZ',
        })),
        all: vi.fn(async () => ({ results: [] })),
      })),
    };

    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

    const req = new Request(
      `https://ledger.arksystems.site/api/canaco/buzon/estado?rfc=${rfcFisica}`
    );
    const res = await handleCanacoBuzonApiRequest(req, env, corsHeaders);
    const json = (await res?.json()) as any;
    expect(json.tipoPersona).toBe('fisica');
    expect(json.requeridos).toBe(5);
  });

  it('permite al socio abrir su buzón con RFC y correo registrado en POST /acceso', async () => {
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => mockLead),
        all: vi.fn(async () => ({ results: [] })),
      })),
    };

    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

    const req = new Request('https://ledger.arksystems.site/api/canaco/buzon/acceso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfc: rfcMoral, email: emailSocio }),
    });

    const res = await handleCanacoBuzonApiRequest(req, env, corsHeaders);
    expect(res?.status).toBe(200);
    const json = (await res?.json()) as any;
    expect(json.ok).toBe(true);
    expect(json.razonSocial).toBe(mockLead.web);
    expect(json.slots).toHaveLength(7);
  });

  it('rechaza acceso si el correo no coincide con el registrado en el SIEM', async () => {
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => mockLead),
      })),
    };

    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;

    const req = new Request('https://ledger.arksystems.site/api/canaco/buzon/acceso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfc: rfcMoral, email: 'correo_distinto@intruso.com' }),
    });

    const res = await handleCanacoBuzonApiRequest(req, env, corsHeaders);
    expect(res?.status).toBe(403);
  });

  it('permite a horus.i2d@gmail.com dictaminar (aprobar o rechazar) un documento', async () => {
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn(async () => ({ success: true })),
      })),
    };

    const env = { ARK_TOOLS_DB: mockDb as any } as unknown as Env;
    const adminPrincipal = {
      id: 'admin-horus',
      email: 'horus.i2d@gmail.com',
      fullName: 'Admin Canaco',
      platformRole: 'user' as const,
    };

    const req = new Request('https://ledger.arksystems.site/api/canaco/buzon/admin/dictaminar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'doc-uuid-1',
        estatus: 'aprobado',
      }),
    });

    const res = await handleCanacoBuzonApiRequest(req, env, corsHeaders, adminPrincipal);
    expect(res?.status).toBe(200);
    const json = (await res?.json()) as any;
    expect(json.ok).toBe(true);
    expect(json.estatus).toBe('aprobado');
  });
});
