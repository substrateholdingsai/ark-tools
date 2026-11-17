import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CanacoComunicaciones } from './CanacoComunicaciones';

const leads = [
  {
    id: 'eligible',
    web: 'Empresa Consentida',
    whatsapp: '9991234567',
    email: 'contacto@empresa.mx',
    especialidad: 'comercio',
    is_demo: 0,
    consent_accepted_at: '2026-01-01',
    arkangel_share_consent: 1,
    verified_payment_num_empleados: 8,
    verified_payment_sector: 'comercio',
    contacto_nombre: 'Ana',
    notas: null,
  },
  {
    id: 'demo',
    web: 'Empresa Demo',
    whatsapp: '9991234568',
    email: 'demo@example.invalid',
    especialidad: 'comercio',
    is_demo: 1,
    consent_accepted_at: '2026-01-01',
    arkangel_share_consent: 1,
    contacto_nombre: 'Demo',
    notas: null,
  },
  {
    id: 'no-consent',
    web: 'Empresa sin autorización',
    whatsapp: '9991234569',
    email: 'no@example.invalid',
    especialidad: 'comercio',
    is_demo: 0,
    consent_accepted_at: null,
    arkangel_share_consent: 0,
    contacto_nombre: 'Sin autorización',
    notas: null,
  },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === '/api/comms/templates') {
      return Response.json({
        templates: [
          {
            id: 'approved-template',
            template_name: 'Aviso CANACO',
            language_code: 'es_MX',
            status: 'approved',
            variables_json: '["nombre"]',
            components_json: '[{"type":"BODY","text":"Hola {{nombre}}"}]',
          },
          {
            id: 'unapproved-template',
            name: 'No aprobada',
            language: 'es_MX',
            status: 'pending',
            variables: [],
          },
        ],
      });
    }
    if (url === '/api/comms/jobs' && init?.method === 'POST') {
      return Response.json({
        job_id: 'job-1',
        status: 'pending_approval',
        would_send: 4,
        excluded_by_rule: { no_consent: 2, dnc: 1, repep: 0, cap_reached: 1 },
        deferred: 3,
        cost_estimate: { total: '12.50 MXN' },
        preview_ttl: 600,
      });
    }
    if (url === '/api/comms/jobs/job-1/approve') {
      return Response.json({ job_id: 'job-1', status: 'approved' });
    }
    return Response.json({ jobs: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CANACO Comunicaciones', () => {
  it('excludes demo and non-consented contacts, previews worker values, and gates approval', async () => {
    render(
      <CanacoComunicaciones
        leads={leads}
        delegaciones={[]}
        asignaciones={[]}
        canManage
        onBack={vi.fn()}
      />
    );
    await screen.findByText('No hay trabajos registrados en el CRM.');
    fireEvent.click(screen.getByRole('button', { name: /Nuevo trabajo/i }));

    expect(screen.getByText('1 contactos elegibles seleccionados')).toBeInTheDocument();
    const templateSelect = screen.getByLabelText('Plantilla HSM aprobada');
    expect(templateSelect).toHaveValue('');
    expect(screen.getByRole('option', { name: /Aviso CANACO · es_MX/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /No aprobada/i })).not.toBeInTheDocument();
    fireEvent.change(templateSelect, { target: { value: 'approved-template' } });
    expect(screen.getByText(/Hola Ana/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voice AI · No disponible/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Generar vista previa dry-run/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Variable · nombre'), { target: { value: 'Ana' } });

    fireEvent.click(screen.getByRole('button', { name: /Generar vista previa dry-run/i }));
    await screen.findByText('3. Vista previa dry-run');
    expect(screen.getByText('4', { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/no_consent/)).toBeInTheDocument();

    const dispatch = fetchMock.mock.calls.find(
      ([url, init]) => String(url) === '/api/comms/jobs' && init?.method === 'POST'
    );
    const requestBody = JSON.parse(String(dispatch?.[1]?.body)) as { contact_ids: string[] };
    expect(requestBody.contact_ids).toEqual(['eligible']);
    const reviewApproval = screen.getByRole('button', { name: /Revisar aprobación/i });
    expect(reviewApproval).toBeEnabled();
    fireEvent.click(reviewApproval);
    await screen.findByText('4. Aprobación humana requerida');
    fireEvent.click(screen.getByRole('button', { name: /Aprobar y autorizar envío/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/comms/jobs/job-1/approve',
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(await screen.findByText(/job-1 · approved/)).toBeInTheDocument();
  });

  it('does not allow approval when the preview TTL is zero', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/comms/templates') {
        return Response.json({
          templates: [
            { id: 'approved-template', name: 'Aviso', status: 'approved', variables: [] },
          ],
        });
      }
      if (String(input) === '/api/comms/jobs' && init?.method === 'POST') {
        return Response.json({
          job_id: 'job-1',
          status: 'pending_approval',
          would_send: 1,
          excluded_by_rule: {},
          deferred: 0,
          cost_estimate: 0,
          preview_ttl: 0,
        });
      }
      return Response.json({ jobs: [] });
    });
    render(
      <CanacoComunicaciones
        leads={leads}
        delegaciones={[]}
        asignaciones={[]}
        canManage
        onBack={vi.fn()}
      />
    );
    await screen.findByText('No hay trabajos registrados en el CRM.');
    fireEvent.click(screen.getByRole('button', { name: /Nuevo trabajo/i }));
    fireEvent.change(screen.getByLabelText('Plantilla HSM aprobada'), {
      target: { value: 'approved-template' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Generar vista previa dry-run/i }));
    await screen.findByText('3. Vista previa dry-run');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Revisar aprobación/i })).toBeDisabled();
    });
  });

  it('keeps pause available when the receipt cannot be retrieved', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/comms/templates') return Response.json({ templates: [] });
      if (url === '/api/comms/jobs/job-1/pause' && init?.method === 'POST') {
        return Response.json({ job_id: 'job-1', status: 'paused' });
      }
      if (url === '/api/comms/jobs/job-1') {
        return Response.json({
          job_id: 'job-1',
          status: 'running',
          receipt_error: 'No se pudo consultar el recibo de Sales.',
        });
      }
      return Response.json({
        jobs: [
          {
            job_id: 'job-1',
            channel: 'email',
            audience_size: 1,
            status: 'running',
            receipt: { stale: 'no mostrar' },
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
      });
    });
    render(
      <CanacoComunicaciones
        leads={leads}
        delegaciones={[]}
        asignaciones={[]}
        canManage
        onBack={vi.fn()}
      />
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Detalle' }));
    expect(await screen.findByText('No se pudo consultar el recibo de Sales.')).toBeInTheDocument();
    expect(screen.queryByText(/no mostrar/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(await screen.findByRole('button', { name: 'Reanudar' })).toBeEnabled();
  });
});
