import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizarTelefonoE164,
  extraerMontoDeNotas,
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
      expect(extraerMontoDeNotas('Sin cuota especificada')).toBe(0);
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
      let candidateQuery = '';
      const env = {
        ARK_TOOLS_DB: {
          prepare: vi.fn((query: string) => {
            candidateQuery = query;
            return {
              first: vi.fn().mockResolvedValue({ total: 4 }),
            };
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
      expect(candidateQuery).toContain("'Pago Pendiente'");
      expect(candidateQuery).toContain("'Nuevo / Pendiente'");
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

    it('previsualiza registros nuevos y solo despacha tras aprobar la vista previa', async () => {
      const lead = {
        id: 'lead-1',
        web: 'Comercializadora del Mayab',
        whatsapp: '9999123456',
        email: 'demo@example.invalid',
        ciudad: 'Mérida',
        especialidad: 'comercio',
        status: 'Pago Pendiente',
        lifecycle_stage: 'pago_pendiente',
        canonical_rfc: 'CPM2106158A1',
        arkangel_share_consent: 1,
        is_demo: 0,
        notas:
          'Razón Social: COMERCIALIZADORA DEL MAYAB | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN',
      };
      let approval: Record<string, unknown> | null = null;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ingested' }),
      });
      const mockDb = {
        prepare: vi.fn((query: string) => {
          let values: unknown[] = [];
          const statement = {
            bind: vi.fn((...args: unknown[]) => {
              values = args;
              return statement;
            }),
            all: vi.fn(async () => ({
              results: query.includes('SELECT id FROM leads_ark_tools')
                ? [{ id: lead.id }]
                : [lead],
            })),
            first: vi.fn(async () => {
              if (query.includes('FROM canaco_arkangel_approvals')) return approval;
              return null;
            }),
            run: vi.fn(async () => {
              if (query.includes('INSERT INTO canaco_arkangel_approvals')) {
                approval = {
                  id: values[0],
                  approver_id: values[2],
                  approver_email: values[3],
                  preview_json: values[5],
                  expires_at: values[7],
                  consumed_at: null,
                };
                return { success: true, meta: { changes: 1 } };
              }
              return { success: true, meta: { changes: 1 } };
            }),
          };
          return statement;
        }),
      };

      const env = {
        ARK_TOOLS_DB: mockDb as any,
        ARKANGEL: { fetch: mockFetch },
      } as unknown as Env;
      const principal: AuthPrincipal = {
        id: 'pavel-1',
        email: 'pavel@arksystems.site',
        fullName: 'Pavel',
        platformRole: 'super_admin',
      };

      const previewResponse = await handleCanacoArkangelSyncApi(
        new Request('https://ledger.arksystems.site/api/canaco/sync-arkangel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preview' }),
        }),
        env,
        {},
        principal
      );
      expect(previewResponse?.status).toBe(200);
      const preview = (await previewResponse?.json()) as any;
      expect(preview.preview.rows).toHaveLength(1);
      expect(preview.preview.rows[0].status).toBeUndefined();
      expect(preview.preview.channels).toEqual(['arkangel_ingest_csv']);
      expect(preview.preview.content).toContain('CPM2106158A1');
      expect(mockFetch).not.toHaveBeenCalled();

      const blockedResponse = await handleCanacoArkangelSyncApi(
        new Request('https://ledger.arksystems.site/api/canaco/sync-arkangel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dispatch' }),
        }),
        env,
        {},
        principal
      );
      expect(blockedResponse?.status).toBe(428);
      expect(mockFetch).not.toHaveBeenCalled();

      const dispatchResponse = await handleCanacoArkangelSyncApi(
        new Request('https://ledger.arksystems.site/api/canaco/sync-arkangel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dispatch', approvalId: preview.approvalId }),
        }),
        env,
        {},
        principal
      );
      expect(dispatchResponse?.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('no acepta pagos ni activa socios desde el webhook de Arkangel', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue({
            id: 'lead-demo-1',
            email: 'demo@example.invalid',
            web: 'Comercializadora del Mayab',
            contacto_nombre: 'Fernando Pech',
            status: 'Nuevo / Pendiente',
            especialidad: 'comercio',
            notas:
              'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN',
          }),
          run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
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
          rfc: 'CPM2106158A1',
          folio_pago: 'SPEI-DEMO-4242',
          monto: 3700,
        }),
      });

      const res = await handleCanacoArkangelSyncApi(req, env, {}, null);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(410);
    });
  });
});
