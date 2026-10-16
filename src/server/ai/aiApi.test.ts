import { describe, it, expect, vi } from 'vitest';
import { handleAiApiRequest } from './aiApi';
import type { Env } from '../../index';

describe('Workers AI — API Handlers (/api/ai/*)', () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  it('ignora rutas que no comienzan con /api/ai', async () => {
    const req = new Request('http://localhost/api/version', { method: 'GET' });
    const res = await handleAiApiRequest(req, {} as Env, corsHeaders);
    expect(res).toBeNull();
  });

  it('responde 200 en /api/ai/status si env.AI está presente', async () => {
    const req = new Request('http://localhost/api/ai/status', { method: 'GET' });
    const mockEnv = { AI: {} } as unknown as Env;

    const res = await handleAiApiRequest(req, mockEnv, corsHeaders);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);

    const data = (await res?.json()) as any;
    expect(data.status).toBe('available');
    expect(data.binding_ai).toBe(true);
  });

  it('responde 503 en /api/ai/status si env.AI no está presente', async () => {
    const req = new Request('http://localhost/api/ai/status', { method: 'GET' });
    const mockEnv = {} as Env;

    const res = await handleAiApiRequest(req, mockEnv, corsHeaders);
    expect(res?.status).toBe(503);

    const data = (await res?.json()) as any;
    expect(data.status).toBe('unconfigured');
    expect(data.binding_ai).toBe(false);
  });

  it('devuelve el catálogo de modelos en /api/ai/models', async () => {
    const req = new Request('http://localhost/api/ai/models', { method: 'GET' });
    const res = await handleAiApiRequest(req, {} as Env, corsHeaders);

    expect(res?.status).toBe(200);
    const data = (await res?.json()) as any;
    expect(data.default).toContain('llama-3.3-70b-instruct');
    expect(Array.isArray(data.models)).toBe(true);
    expect(data.models.length).toBeGreaterThan(0);
  });

  it('devuelve el catálogo de herramientas en /api/ai/tools', async () => {
    const req = new Request('http://localhost/api/ai/tools', { method: 'GET' });
    const res = await handleAiApiRequest(req, {} as Env, corsHeaders);

    expect(res?.status).toBe(200);
    const data = (await res?.json()) as any;
    expect(data.tools_count).toBeGreaterThan(0);
    expect(Array.isArray(data.tools)).toBe(true);
  });

  it('rechaza solicitudes POST /api/ai/chat sin mensajes', async () => {
    const req = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const mockEnv = { AI: { run: vi.fn() } } as unknown as Env;

    const res = await handleAiApiRequest(req, mockEnv, corsHeaders);
    expect(res?.status).toBe(400);
    const data = (await res?.json()) as any;
    expect(data.error).toContain('messages');
  });
});
