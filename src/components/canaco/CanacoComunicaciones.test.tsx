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
    sales_share_consent: 1,
    sales_consent_accepted_at: '2026-01-01',
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
    sales_share_consent: 1,
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
  {
    id: 'legacy-arkangel-only',
    web: 'Empresa anterior',
    whatsapp: '9991234569',
    email: 'legacy@example.invalid',
    especialidad: 'comercio',
    is_demo: 0,
    consent_accepted_at: '2026-01-01',
    arkangel_share_consent: 1,
    sales_share_consent: 0,
    contacto_nombre: 'Anterior',
    notas: null,
  },
  {
    id: 'missing-sales-timestamp',
    web: 'Empresa sin constancia Sales',
    whatsapp: '9991234570',
    email: 'sin-fecha@example.invalid',
    especialidad: 'comercio',
    is_demo: 0,
    consent_accepted_at: '2026-01-01',
    arkangel_share_consent: 1,
    sales_share_consent: 1,
    sales_consent_accepted_at: null,
    contacto_nombre: 'Sin fecha',
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
        preview_revision: 'rev-1',
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
  it('filtra el historial al lead inicial y muestra su estado Sales', async () => {
    fetchMock = vi.fn(async (url: any) => {
      if (typeof url === 'string' && url === '/api/comms/jobs') {
        return {
          ok: true,
          json: async () => ({
            jobs: [
              {
                job_id: 'job-matched',
                channel: 'whatsapp',
                audience_size: 1,
                status: 'approved',
                cost_estimate: null,
                preview: null,
                detail: null,
                receipt: null,
                ledger_contact_ids: ['eligible'],
                created_at: '2026-11-18T10:00:00.000Z',
              },
              {
                job_id: 'job-other',
                channel: 'email',
                audience_size: 1,
                status: 'pending',
                cost_estimate: null,
                preview: null,
                detail: null,
                receipt: null,
                ledger_contact_ids: ['legacy-arkangel-only'],
                created_at: '2026-11-18T09:00:00.000Z',
              },
            ],
          }),
        };
      }
      if (typeof url === 'string' && url.includes('/templates')) {
        return { ok: true, json: async () => ({ templates: [] }) };
      }
      return { ok: true, json: async () => ({ jobs: [] }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <CanacoComunicaciones
        leads={leads}
        delegaciones={[]}
        asignaciones={[]}
        canManage
        onBack={vi.fn()}
        initialLeadId="eligible"
      />
    );

    expect(await screen.findByText(/Historial de comunicaciones:/i)).toBeInTheDocument();
    expect(await screen.findByText('job-matched')).toBeInTheDocument();
    expect(screen.queryByText('job-other')).not.toBeInTheDocument();
  });

  it('muestra sin autorización cuando falta la fecha del consentimiento Sales', async () => {
    fetchMock = vi.fn(async (url: any) => {
      if (typeof url === 'string' && url === '/api/comms/jobs') {
        return { ok: true, json: async () => ({ jobs: [] }) };
      }
      if (typeof url === 'string' && url.includes('/templates')) {
        return { ok: true, json: async () => ({ templates: [] }) };
      }
      return { ok: true, json: async () => ({ jobs: [] }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <CanacoComunicaciones
        leads={leads}
        delegaciones={[]}
        asignaciones={[]}
        canManage
        onBack={vi.fn()}
        initialLeadId="missing-sales-timestamp"
      />
    );

    expect(await screen.findByText(/· Sales: sin autorización/i)).toBeInTheDocument();
  });
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
    expect(screen.getByText(/Registros de demo y personas sin consentimiento/)).toBeInTheDocument();
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
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ preview_revision: 'rev-1' }),
        })
      );
    });

    expect(await screen.findByText(/job-1 · approved/)).toBeInTheDocument();
  });

  it('blocks email placeholders rather than showing a misleading sample', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Email/i }));
    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Aviso' } });
    fireEvent.change(screen.getByLabelText('Cuerpo'), { target: { value: 'Hola {{nombre}}' } });
    expect(screen.getByText('Hola {{nombre}}', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generar vista previa dry-run/i })).toBeDisabled();
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
