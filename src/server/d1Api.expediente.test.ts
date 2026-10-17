import { describe, it, expect, vi } from 'vitest';
import {
  handleExpedienteApiRequest,
  computeDeterministicHash,
  CURRENT_CATALOG_VERSION,
} from './d1Api.expediente';
import type { Env } from '../index';

describe('Expediente Único — Backend Handlers (/api/clients & /api/expedientes)', () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  const principal = {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Test User',
    platformRole: 'user' as const,
  };
  const tenantMembership = {
    id: 't-123',
    name: 'Test Tenant',
    slug: 'test-tenant',
    role: 'owner' as const,
  };

  describe('computeDeterministicHash', () => {
    it('genera el mismo hash independientemente del orden de las llaves', async () => {
      const obj1 = { salario: 1500, dias: 30, extras: { bono: 500, comision: 200 } };
      const obj2 = { extras: { comision: 200, bono: 500 }, dias: 30, salario: 1500 };

      const hash1 = await computeDeterministicHash(obj1);
      const hash2 = await computeDeterministicHash(obj2);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 en hexadecimal
    });

    it('genera hashes distintos para valores diferentes', async () => {
      const hash1 = await computeDeterministicHash({ val: 100 });
      const hash2 = await computeDeterministicHash({ val: 101 });

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('handleExpedienteApiRequest — Routing y Control de Base de Datos', () => {
    it('retorna null para rutas que no corresponden a clients o expedientes', async () => {
      const req = new Request('http://localhost/api/other', { method: 'GET' });
      const res = await handleExpedienteApiRequest(req, {} as Env, corsHeaders);
      expect(res).toBeNull();
    });

    it('retorna 503 si el binding ARK_TOOLS_DB no está presente', async () => {
      const req1 = new Request('http://localhost/api/clients?tenant_id=t1', { method: 'GET' });
      const res1 = await handleExpedienteApiRequest(req1, {} as Env, corsHeaders);
      expect(res1?.status).toBe(503);

      const req2 = new Request('http://localhost/api/expedientes?tenant_id=t1', { method: 'GET' });
      const res2 = await handleExpedienteApiRequest(req2, {} as Env, corsHeaders);
      expect(res2?.status).toBe(503);
    });
  });

  describe('handleExpedienteApiRequest — Endpoints de Clientes', () => {
    function createMockDb(mockResults: Record<string, unknown> = {}) {
      const firstResults = [tenantMembership, ...((mockResults.firstSequence as unknown[]) || [])];
      let firstIndex = 0;
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockResults.all || [] }),
        first: vi.fn().mockImplementation(() => {
          const result = firstResults[firstIndex];
          firstIndex += 1;
          return Promise.resolve(result ?? mockResults.first ?? null);
        }),
        run: vi.fn().mockResolvedValue({ success: true }),
      };

      return {
        prepare: vi.fn().mockReturnValue(mockStatement),
        _statement: mockStatement,
      };
    }

    it('falla con 400 si falta tenant_id en GET /api/clients', async () => {
      const db = createMockDb();
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;

      const req = new Request('http://localhost/api/clients', { method: 'GET' });
      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders);

      expect(res?.status).toBe(400);
      const data = (await res?.json()) as { error: string };
      expect(data.error).toContain('tenant_id');
    });

    it('rechaza solicitudes sin identidad autenticada', async () => {
      const db = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(null),
        })),
      };
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;
      const req = new Request('http://localhost/api/clients?tenant_id=t-123', { method: 'GET' });

      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders);

      expect(res?.status).toBe(401);
    });

    it('rechaza a una identidad autenticada que no es miembro del tenant', async () => {
      const db = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(null),
        })),
      };
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;
      const req = new Request('http://localhost/api/clients?tenant_id=tenant-alien', {
        method: 'GET',
      });

      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders, principal);

      expect(res?.status).toBe(403);
    });

    it('lista clientes del tenant decodificando metadata', async () => {
      const db = createMockDb({
        all: [
          {
            id: 'client-1',
            tenant_id: 't-123',
            tipo: 'trabajador',
            nombre: 'Juan Pérez',
            salario_diario: 500,
            metadata: JSON.stringify({ puesto: 'Contador Jr' }),
          },
        ],
      });
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;

      const req = new Request('http://localhost/api/clients?tenant_id=t-123', { method: 'GET' });
      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders, principal);

      expect(res?.status).toBe(200);
      const data = (await res?.json()) as {
        clients: Array<{ id: string; metadata: Record<string, unknown> }>;
      };
      expect(data.clients).toHaveLength(1);
      expect(data.clients[0]?.id).toBe('client-1');
      expect(data.clients[0]?.metadata).toEqual({ puesto: 'Contador Jr' });
    });

    it('falla con 400 si falta nombre o tenant_id en POST /api/clients', async () => {
      const db = createMockDb();
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;

      const req = new Request('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({ tenant_id: 't-123' }), // falta nombre
      });
      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders, principal);

      expect(res?.status).toBe(400);
    });

    it('crea cliente con defaults correctos y retorna el registro', async () => {
      const db = createMockDb();
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;

      const req = new Request('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: 't-123',
          nombre: 'Industrias Alfa SA',
          tipo: 'empresa',
          rfc: 'IAL200101XYZ',
        }),
      });
      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders, principal);

      expect(res?.status).toBe(201);
      const data = (await res?.json()) as {
        client: { id: string; nombre: string; factor_integracion: number };
      };
      expect(data.client.nombre).toBe('Industrias Alfa SA');
      expect(data.client.factor_integracion).toBeCloseTo(1.0493, 3);
      expect(db.prepare).toHaveBeenCalled();
    });

    it('no incluye datos privados en la respuesta de verificación pública', async () => {
      const db = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue({
            input_hash: 'a'.repeat(64),
            tool_id: 'nomina',
            titulo: 'Cálculo de nómina',
            catalog_version: CURRENT_CATALOG_VERSION,
            created_at: '2026-01-01T00:00:00.000Z',
            client_nombre: 'Nombre Privado',
            client_rfc: 'RFC123456ABC',
            inputs: JSON.stringify({ salario: 500 }),
            outputs: JSON.stringify({ neto: 10000 }),
            tenant_name: 'Despacho Privado',
          }),
        })),
      };
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;
      const req = new Request(`http://localhost/api/expedientes/verify?hash=${'a'.repeat(64)}`);

      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders);
      const data = (await res?.json()) as { certificado: Record<string, unknown> };

      expect(res?.status).toBe(200);
      expect(data.certificado).toMatchObject({
        tool_id: 'nomina',
        input_hash: 'a'.repeat(64),
      });
      expect(data.certificado).not.toHaveProperty('inputs');
      expect(data.certificado).not.toHaveProperty('outputs');
      expect(data.certificado).not.toHaveProperty('cliente');
      expect(data.certificado).not.toHaveProperty('despacho');
    });
  });

  describe('handleExpedienteApiRequest — Endpoints de Expedientes', () => {
    function createMockDb(mockResults: Record<string, unknown> = {}) {
      const firstResults = [tenantMembership, ...((mockResults.firstSequence as unknown[]) || [])];
      let firstIndex = 0;
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockResults.all || [] }),
        first: vi.fn().mockImplementation(() => {
          const result = firstResults[firstIndex];
          firstIndex += 1;
          return Promise.resolve(result ?? mockResults.first ?? null);
        }),
        run: vi.fn().mockResolvedValue({ success: true }),
      };

      return {
        prepare: vi.fn().mockReturnValue(mockStatement),
        _statement: mockStatement,
      };
    }

    it('falla con 400 si faltan campos obligatorios en POST /api/expedientes', async () => {
      const db = createMockDb();
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;

      const req = new Request('http://localhost/api/expedientes', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: 't-123',
          client_id: 'c-1',
          // falta tool_id, inputs, outputs
        }),
      });
      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders);

      expect(res?.status).toBe(400);
    });

    it('falla con 403 si el cliente no pertenece al tenant', async () => {
      // Mock db returns null for client check
      const db = createMockDb({ firstSequence: [null], first: null });
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;

      const req = new Request('http://localhost/api/expedientes', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: 't-123',
          client_id: 'c-alien',
          tool_id: 'finiquitos',
          inputs: { salario: 500 },
          outputs: { finiquito: 15000 },
        }),
      });
      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders, principal);

      expect(res?.status).toBe(403);
      const data = (await res?.json()) as { error: string };
      expect(data.error).toContain('despacho');
    });

    it('guarda un expediente y asigna la versión DOF vigente', async () => {
      // first call to db.first is for clientExists -> returns { id: 'c-1', nombre: 'Juan' }
      // second call is for existing duplicate check -> returns null
      const mockFirst = vi
        .fn()
        .mockResolvedValueOnce(tenantMembership) // tenant membership
        .mockResolvedValueOnce({ id: 'c-1', nombre: 'Juan' }) // clientExists
        .mockResolvedValueOnce(null); // deduplication check

      const db = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
          first: mockFirst,
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      };
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;

      const req = new Request('http://localhost/api/expedientes', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: 't-123',
          client_id: 'c-1',
          tool_id: 'finiquitos',
          inputs: { salario: 500 },
          outputs: { finiquito: 15000 },
        }),
      });
      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders, principal);

      expect(res?.status).toBe(201);
      const data = (await res?.json()) as {
        expediente: { catalog_version: string; input_hash: string };
        deduplicated: boolean;
      };
      expect(data.expediente.catalog_version).toBe(CURRENT_CATALOG_VERSION);
      expect(data.expediente.input_hash).toHaveLength(64);
      expect(data.deduplicated).toBe(false);
    });

    it('detecta duplicados recientes y retorna deduplicated: true sin reinsertar', async () => {
      const inputs = { salario: 500 };
      const hash = await computeDeterministicHash(inputs);

      const existingExpediente = {
        id: 'exp-existente',
        client_id: 'c-1',
        tenant_id: 't-123',
        tool_id: 'finiquitos',
        titulo: 'Finiquito',
        input_hash: hash,
        inputs: JSON.stringify(inputs),
        outputs: JSON.stringify({ finiquito: 15000 }),
        catalog_version: CURRENT_CATALOG_VERSION,
        created_at: new Date().toISOString(),
      };

      const mockFirst = vi
        .fn()
        .mockResolvedValueOnce(tenantMembership) // tenant membership
        .mockResolvedValueOnce({ id: 'c-1', nombre: 'Juan' }) // clientExists
        .mockResolvedValueOnce(existingExpediente); // existing duplicate found

      const db = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
          first: mockFirst,
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      };
      const mockEnv = { ARK_TOOLS_DB: db } as unknown as Env;

      const req = new Request('http://localhost/api/expedientes', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: 't-123',
          client_id: 'c-1',
          tool_id: 'finiquitos',
          inputs,
          outputs: { finiquito: 15000 },
        }),
      });
      const res = await handleExpedienteApiRequest(req, mockEnv, corsHeaders, principal);

      expect(res?.status).toBe(200);
      const data = (await res?.json()) as {
        expediente: { id: string };
        deduplicated: boolean;
      };
      expect(data.deduplicated).toBe(true);
      expect(data.expediente.id).toBe('exp-existente');
    });
  });
});
