import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CanacoAdminPadron } from './CanacoAdminPadron';

vi.mock('@/context/AuthContext', () => ({
  useOptionalAuth: () => ({
    platformRole: 'super_admin',
    user: { email: 'admin@example.test' },
    tenants: [],
  }),
}));

describe('Delegaciones en el CRM CANACO', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_CANACO_DELEGACIONES', 'true');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('mantiene la función oculta y no consulta delegaciones sin la bandera', async () => {
    vi.stubEnv('VITE_CANACO_DELEGACIONES', 'false');
    const fetchMock = vi.fn(async (_url: string) => ({
      ok: true,
      json: async () => ({ leads: [], requests: [] }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    render(<CanacoAdminPadron />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByRole('heading', { name: 'Delegaciones' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/canaco/delegaciones')).toBe(false);
  });

  it('filtra, asigna y crea delegaciones sin asignar automáticamente los registros históricos', async () => {
    let assignments: Array<{ lead_id: string; delegacion_id: string }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/admin/leads')) {
        return {
          ok: true,
          json: async () => ({
            leads: [
              { id: 'a', web: 'Empresa A', is_demo: 0 },
              { id: 'b', web: 'Empresa B', is_demo: 0 },
            ],
          }),
        };
      }
      if (url.includes('/asignaciones/')) {
        const body = JSON.parse(String(init?.body)) as { delegacionId: string };
        assignments = [{ lead_id: 'a', delegacion_id: body.delegacionId }];
        return { ok: true, json: async () => ({ ok: true }) };
      }
      if (url === '/api/canaco/delegaciones' && init?.method === 'POST') {
        return { ok: true, json: async () => ({ id: 'new', nombre: 'Motul' }) };
      }
      if (url === '/api/canaco/delegaciones') {
        return {
          ok: true,
          json: async () => ({
            delegaciones: [
              {
                id: 'progreso',
                nombre: 'Progreso',
                registros: assignments.length,
                socios_activos: 0,
                con_contacto: 0,
              },
            ],
            asignaciones: assignments,
            sinAsignar: 2 - assignments.length,
          }),
        };
      }
      return { ok: true, json: async () => ({ requests: [] }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CanacoAdminPadron />);

    await screen.findByText('Empresa A');
    await screen.findByRole('option', { name: 'Sin delegación (2)' });
    await user.selectOptions(screen.getByLabelText('Delegación de Empresa A'), 'progreso');
    await waitFor(() =>
      expect(screen.getByLabelText('Delegación de Empresa A')).toHaveValue('progreso')
    );
    await user.selectOptions(screen.getByLabelText('Filtrar por delegación'), 'progreso');
    expect(screen.getByText('Empresa A')).toBeInTheDocument();
    expect(screen.queryByText('Empresa B')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sincronizar registros' })).toBeDisabled();
    expect(screen.getByLabelText('Registros por etapa del ciclo de vida')).toHaveTextContent(
      'prospecto: 1'
    );

    await user.type(screen.getByLabelText('Nombre de la delegación'), 'Motul');
    await user.click(screen.getByRole('button', { name: 'Crear delegación' }));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/canaco/delegaciones',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ nombre: 'Motul' }) })
    );
  }, 15000);

  it('carga páginas adicionales del padrón cuando las delegaciones están habilitadas', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/admin/leads')) {
        return {
          ok: true,
          json: async () => ({
            leads: url.includes('offset=0')
              ? Array.from({ length: 100 }, (_, index) => ({
                  id: `demo-${index}`,
                  web: `Demo ${index}`,
                  is_demo: 1,
                }))
              : [{ id: 'real', web: 'Empresa de segunda página', is_demo: 0 }],
          }),
        };
      }
      if (url === '/api/canaco/delegaciones') {
        return {
          ok: true,
          json: async () => ({ delegaciones: [], asignaciones: [], sinAsignar: 1 }),
        };
      }
      return { ok: true, json: async () => ({ requests: [] }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<CanacoAdminPadron />);

    expect(await screen.findByText('Empresa de segunda página')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/leads?tenant=canaco_merida&limit=100&offset=100'
    );
  });
});
