import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizarTelefonoE164,
  extraerMontoDeNotas,
  extraerRfcDeNotas,
  generarCsvCobranzaArkangel,
  despacharLoteArkangel,
  handleCanacoArkangelSyncApi,
  type SocioCobranzaRecord,
} from './canacoArkangelSync';
import type { Env } from '../index';
import type { AuthPrincipal } from './auth';

describe('CANACO Mérida — Sincronización Call Center & Cobranza con ARKANGEL', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Funciones auxiliares y normalización E.164', () => {
    it('normaliza teléfonos mexicanos de 10 dígitos a E.164 (+52)', () => {
      expect(normalizarTelefonoE164('9999123456')).toBe('+529999123456');
      expect(normalizarTelefonoE164('(999) 912-3456')).toBe('+529999123456');
      expect(normalizarTelefonoE164('+52 999 912 3456')).toBe('+529999123456');
      expect(normalizarTelefonoE164('')).toBe('');
      expect(normalizarTelefonoE164(null)).toBe('');
    });

    it('extrae el monto de la cuota desde las notas del socio', () => {
      expect(extraerMontoDeNotas('Folio SIEM: 123 | Cuota: $3,700.00 MXN')).toBe(3700.0);
      expect(extraerMontoDeNotas('Cuota: 2150')).toBe(2150.0);
      expect(extraerMontoDeNotas('Sin cuota especificada')).toBe(1090.0);
    });

    it('extrae el RFC desde las notas del socio', () => {
      expect(extraerRfcDeNotas('RFC: RMM120301AA1 | Folio SIEM: 123')).toBe('RMM120301AA1');
      expect(extraerRfcDeNotas('Sin notas')).toBe('XAXX010101000');
    });

    it('genera un CSV bien estructurado para la ingesta de Arkangel', () => {
      const socios: SocioCobranzaRecord[] = [
        {
          id: 'lead-1',
          nombre: 'Abarrotes del Mayab',
          telefono: '+529999123456',
          email: 'contacto@mayab.mx',
          rfc: 'ABM120301AA1',
          monto: 2000.0,
          concepto: 'Registro SIEM 2026',
          vencimiento: '2026-11-15',
          estrato: 'COMERCIO',
        },
      ];

      const csv = generarCsvCobranzaArkangel(socios);
      expect(csv).toContain('nombre,telefono,email,rfc,monto,concepto,vencimiento,estrato');
      expect(csv).toContain(
        '"Abarrotes del Mayab","+529999123456","contacto@mayab.mx","ABM120301AA1",2000.00'
      );
    });
  });

  describe('Despacho Worker-to-Worker (Service Binding & Simulación)', () => {
    it('utiliza el Service Binding env.ARKANGEL cuando está disponible', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ingested', cases_created: 1 }),
      });

      const env = {
        ARKANGEL: { fetch: mockFetch } as any,
        ARKANGEL_API_KEY: 'test-key',
      } as unknown as Env;

      const socios: SocioCobranzaRecord[] = [
        {
          id: 'lead-1',
          nombre: 'Comercio A',
          telefono: '+529999123456',
          email: 'a@test.com',
          rfc: 'AAA010101AA1',
          monto: 1500,
          concepto: 'SIEM',
          vencimiento: '2026-11-15',
          estrato: 'COMERCIO',
        },
      ];

      const res = await despacharLoteArkangel(env, socios);
      expect(res.ok).toBe(true);
      expect(res.simulated).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://arkangel.internal/api/v1/ingest/csv',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Tenant-ID': 'canaco_merida',
          }),
        })
      );
    });

    it('opera en modo simulación segura si no hay Service Binding configurado', async () => {
      const env = {} as Env;
      const socios: SocioCobranzaRecord[] = [
        {
          id: 'lead-1',
          nombre: 'Comercio B',
          telefono: '+529999123456',
          email: 'b@test.com',
          rfc: 'BBB010101BB1',
          monto: 2000,
          concepto: 'SIEM',
          vencimiento: '2026-11-15',
          estrato: 'COMERCIO',
        },
      ];

      const res = await despacharLoteArkangel(env, socios);
      expect(res.ok).toBe(true);
      expect(res.simulated).toBe(true);
      expect(res.socios_enviados).toBe(1);
      expect(res.monto_total_cartera).toBe(2000);
    });
  });

  describe('Endpoints del Worker: handleCanacoArkangelSyncApi', () => {
    it('responde el estado del call center en GET /api/canaco/arkangel-status', async () => {
      const env = {
        ARK_TOOLS_DB: {
          prepare: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({ total: 4 }),
          }),
        } as any,
      } as Env;

      const req = new Request('https://ledger.arksystems.site/api/canaco/arkangel-status', {
        method: 'GET',
      });

      const res = await handleCanacoArkangelSyncApi(req, env, {}, null);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);
      const json = (await res?.json()) as any;
      expect(json.status).toBe('ok');
      expect(json.tenantId).toBe('canaco_merida');
      expect(json.sociosPendientesCobro).toBe(4);
    });

    it('rechaza la sincronización si el usuario no tiene permisos camerales', async () => {
      const env = {} as Env;
      const req = new Request('https://ledger.arksystems.site/api/canaco/sync-arkangel', {
        method: 'POST',
      });
      const principal: AuthPrincipal = {
        id: 'user-guest',
        email: 'ajeno@despacho.com',
        fullName: 'Usuario Ajeno',
        platformRole: 'user',
      };

      const res = await handleCanacoArkangelSyncApi(req, env, {}, principal);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
    });

    it('permite a horus.i2d@gmail.com disparar la sincronización hacia Arkangel', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({
            results: [
              {
                id: 'lead-1',
                web: 'Ferretería Peninsular',
                whatsapp: '9999123456',
                email: 'pagos@ferre.mx',
                ciudad: 'Mérida',
                especialidad: 'comercio',
                status: 'Nuevo / Pendiente',
                notas: 'RFC: FPE980415XYZ | Cuota: $2,150.00 MXN',
              },
            ],
          }),
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      };

      const env = {
        ARK_TOOLS_DB: mockDb as any,
      } as Env;

      const req = new Request('https://ledger.arksystems.site/api/canaco/sync-arkangel', {
        method: 'POST',
      });
      const principal: AuthPrincipal = {
        id: 'canaco-admin-1',
        email: 'horus.i2d@gmail.com',
        fullName: 'Admin CANACO Mérida',
        platformRole: 'user',
      };

      const res = await handleCanacoArkangelSyncApi(req, env, {}, principal);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);
      const json = (await res?.json()) as any;
      expect(json.ok).toBe(true);
      expect(json.socios_enviados).toBe(1);
      expect(json.monto_total_cartera).toBe(2150);
    });

    it('procesa el webhook de pago recibido desde Arkangel y actualiza el socio a Activo', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue({
            id: 'lead-1',
            notas: 'RFC: FPE980415XYZ | Estrato: MICRO',
          }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      };

      const env = {
        ARK_TOOLS_DB: mockDb as any,
        ARKANGEL_WEBHOOK_SECRET: 'secreto-arkangel',
      } as Env;

      const req = new Request('https://ledger.arksystems.site/api/canaco/webhook-pago-arkangel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer secreto-arkangel',
        },
        body: JSON.stringify({
          rfc: 'FPE980415XYZ',
          folio_pago: 'SPEI-998822',
          monto: 2150.0,
        }),
      });

      const res = await handleCanacoArkangelSyncApi(req, env, {}, null);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);
      const json = (await res?.json()) as any;
      expect(json.ok).toBe(true);
      expect(json.estatus).toBe('Socio Activo');
      expect(json.folioPago).toBe('SPEI-998822');
    });
  });
});
