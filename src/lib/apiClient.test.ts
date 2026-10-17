import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiAuthorizationError, apiClient } from './apiClient';

describe('apiClient authentication transport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses same-origin cookies instead of a client-generated bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ clients: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.clients.list({ tenant_id: 'tenant-1' });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(requestInit.credentials).toBe('same-origin');
    expect(headers.has('Authorization')).toBe(false);
  });

  it('preserves authorization status so callers can clear stale tenant data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'No tienes acceso a este despacho.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(apiClient.clients.list({ tenant_id: 'tenant-1' })).rejects.toMatchObject({
      name: ApiAuthorizationError.name,
      status: 403,
    });
  });
});
