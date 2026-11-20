import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanacoAdminPadron } from './CanacoAdminPadron';

const authState = vi.hoisted(() => ({
  email: 'horus.i2d@gmail.com',
  platformRole: 'member',
  role: 'admin',
}));

vi.mock('@/context/AuthContext', () => ({
  useOptionalAuth: () => ({
    platformRole: authState.platformRole,
    user: { email: authState.email },
    tenants: [{ id: 'canaco_merida', role: authState.role }],
  }),
}));

const MOCK_LEADS = [
  {
    id: 'lead-can-1',
    web: 'Comercializadora del Mayab',
    whatsapp: '0000000000',
    email: 'contacto@mayab.mx',
    ciudad: 'Mérida',
    especialidad: 'comercio',
    status: 'Socio Activo',
    lifecycle_stage: 'socio_activo',
    payment_environment: 'production',
    canonical_rfc: 'CPM2106158A1',
    verified_payment_amount_cents: 370000,
    verified_payment_channel: 'conekta_card',
    verified_payment_environment: 'production',
    verified_payment_rfc: 'CPM2106158A1',
    verified_payment_folio_siem: 'SIEM-MID-2026-CPM2-PEQ-4242',
    verified_payment_razon_social: 'COMERCIALIZADORA DEL MAYAB',
    verified_payment_num_empleados: 15,
    verified_payment_sector: 'comercio',
    last_contact: '2026-10-25',
    contacto_nombre: 'Fernando Pech',
    sales_share_consent: 0,
    sales_consent_accepted_at: null,
    notas:
      'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN | Pago Confirmado Conekta: ord_demo_1 ($3,700 MXN) | Folio de Integridad: CANACO-FI-SIEM-MID-2026-CPM2-PEQ-4242',
  },
  {
    id: 'lead-can-2',
    web: 'Comercio Demo Pendiente',
    whatsapp: '0000000000',
    email: 'demo@example.invalid',
    ciudad: 'Mérida',
    especialidad: 'turismo',
    status: 'Nuevo / Pendiente',
    lifecycle_stage: 'prospecto',
    is_demo: 1,
    last_contact: '2026-10-27',
    contacto_nombre: 'Contacto de prueba',
    notas:
      'Razón Social: COMERCIO DEMO PENDIENTE | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-MIC-2424 | Estrato: MICRO (5 emp.) | Empleados: 5 | Cuota: $2,000 MXN',
  },
  {
    id: 'lead-can-3',
    web: 'Servicios Demo de Progreso',
    whatsapp: '0000000000',
    email: 'demo@example.invalid',
    ciudad: 'Progreso',
    especialidad: 'servicios',
    status: 'Socio Activo',
    lifecycle_stage: 'socio_activo',
    is_demo: 1,
    last_contact: '2026-10-20',
    contacto_nombre: 'Contacto de prueba',
    notas:
      'Razón Social: SERVICIOS DEMO DE PROGRESO | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-MED-6060 | Estrato: MEDIANA (60 emp.) | Empleados: 60 | Cuota: $6,500 MXN | Pago Confirmado Call Center: SPEI-DEMO-6060 ($6,500 MXN)',
  },
  {
    id: 'lead-can-5',
    web: 'Prospecto con nota de pago no verificada',
    whatsapp: '9999123457',
    email: 'no-pago@example.invalid',
    ciudad: 'Mérida',
    especialidad: 'comercio',
    status: 'Pago Pendiente',
    lifecycle_stage: 'pago_pendiente',
    is_demo: 0,
    last_contact: '2026-10-29',
    contacto_nombre: 'Contacto de prueba',
    notas:
      'RFC: NPV2106158A1 | Folio SIEM: SIEM-NPV-TEST | Empleados: 15 | Cuota: $3,700 | Pago Confirmado Conekta: fabricated-test ($3,700 MXN)',
  },
  {
    id: 'lead-can-4',
    web: 'Prospecto Real Pendiente',
    whatsapp: '9999123456',
    email: 'contacto@prospecto.mx',
    ciudad: 'Mérida',
    especialidad: 'comercio',
    status: 'Pago Pendiente',
    lifecycle_stage: 'pago_pendiente',
    is_demo: 0,
    last_contact: '2026-10-28',
    contacto_nombre: 'Contacto real',
    notas:
      'Razón Social: PROSPECTO REAL PENDIENTE | RFC: PRP2106158A1 | Folio SIEM: SIEM-MID-2026-PRP2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN',
  },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  authState.email = 'horus.i2d@gmail.com';
  authState.platformRole = 'member';
  authState.role = 'admin';
  fetchMock = vi.fn(async (url: any) => {
    if (typeof url === 'string' && url.includes('/api/canaco/sync-arkangel')) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          socios_enviados: 1,
          monto_total_cartera: 3700,
          mensaje: 'Lote sincronizado con Arkangel Call Center.',
        }),
      };
    }
    return {
      ok: true,
      json: async () => ({ leads: MOCK_LEADS }),
    };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function renderAdmin() {
  render(<CanacoAdminPadron />);
  await waitFor(() => {
    expect(screen.getByText(/Comercializadora del Mayab/i)).toBeInTheDocument();
    expect(screen.getByText('Pago: production')).toBeInTheDocument();
  });
}

describe('CANACO SERVYTUR Mérida — Consola de Afiliaciones & Padrón SIEM', () => {
  it('renderiza la cabecera institucional y el badge oficial de horus.i2d@gmail.com', async () => {
    await renderAdmin();

    expect(screen.getByText(/Registros de afiliación CANACO/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin: horus\.i2d@gmail\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/CRM interno; no acredita el alta ante SIEM/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar CSV del CRM/i })).toBeInTheDocument();
  });

  it('muestra los 4 KPIs del padrón cameral', async () => {
    await renderAdmin();

    expect(screen.getByText('Registros en CRM')).toBeInTheDocument();
    expect(screen.getByText('Pagos confirmados')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
    expect(screen.getByText('Pagos marcados confirmados')).toBeInTheDocument();
  });

  it('muestra el conteo por etapa sin incluir registros de demo', async () => {
    await renderAdmin();

    const stageCounts = screen.getByLabelText('Registros por etapa del ciclo de vida');
    expect(stageCounts).toHaveTextContent('prospecto: 0');
    expect(stageCounts).toHaveTextContent('socio activo: 1');
    expect(stageCounts).toHaveTextContent('pago pendiente: 2');
  });

  it('no cuenta una nota con texto de pago como pago confirmado', async () => {
    await renderAdmin();

    const paymentCard = screen.getByText('Pagos confirmados').parentElement?.parentElement;
    expect(paymentCard).toHaveTextContent('1');
    expect(screen.getByText(/Prospecto con nota de pago no verificada/i)).toBeInTheDocument();
  });

  it('excluye registros de demo del padrón visible', async () => {
    await renderAdmin();

    expect(screen.queryByText(/Comercio Demo Pendiente/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Servicios Demo de Progreso/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Comercializadora del Mayab/i)).toBeInTheDocument();
  });

  it('autoriza y retira el consentimiento de Sales desde el padrón sin afectar demo', async () => {
    await renderAdmin();

    expect(
      screen.getAllByText(/Sales \/ Comunicaciones: sin autorización/i).length
    ).toBeGreaterThan(0);
    const authorize = screen.getByRole('button', {
      name: /Autorizar consentimiento de Sales de Comercializadora del Mayab/i,
    });
    fireEvent.click(authorize);

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes('/api/admin/leads/lead-can-1') && init?.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
    });

    const patchCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes('/api/admin/leads/lead-can-1') && init?.method === 'PATCH'
    );
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({ sales_share_consent: true });
  });

  it('muestra el estado Sales sin controles de consentimiento para miembros', async () => {
    authState.email = 'member@example.com';
    authState.role = 'member';
    await renderAdmin();

    expect(
      screen.getAllByText(/Sales \/ Comunicaciones: sin autorización/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', {
        name: /consentimiento de Sales de Comercializadora del Mayab/i,
      })
    ).not.toBeInTheDocument();
  });

  it('habilita controles de consentimiento y comunicaciones para super admins', async () => {
    authState.email = 'root@example.com';
    authState.platformRole = 'super_admin';
    authState.role = 'member';
    await renderAdmin();

    expect(
      screen.getByRole('button', {
        name: /Autorizar consentimiento de Sales de Comercializadora del Mayab/i,
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Comunicaciones$/i })).not.toHaveLength(0);
  });

  it('abre el historial filtrado de un socio desde su fila', async () => {
    fetchMock = vi.fn(async (url: any) => {
      if (typeof url === 'string' && url === '/api/comms/jobs') {
        return {
          ok: true,
          json: async () => ({
            jobs: [
              {
                job_id: 'job-mayab',
                channel: 'whatsapp',
                audience_size: 1,
                status: 'approved',
                cost_estimate: null,
                preview: null,
                detail: null,
                receipt: null,
                ledger_contact_ids: ['lead-can-1'],
                created_at: '2026-11-18T10:00:00.000Z',
              },
            ],
          }),
        };
      }
      if (typeof url === 'string' && url.includes('/api/canaco/sync-arkangel')) {
        return { ok: true, json: async () => ({ ok: true, rows: [] }) };
      }
      return { ok: true, json: async () => ({ leads: MOCK_LEADS }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    await renderAdmin();
    fireEvent.click(
      screen.getByRole('button', {
        name: /Ver comunicaciones de Comercializadora del Mayab/i,
      })
    );

    expect(await screen.findByText(/Historial de comunicaciones:/i)).toBeInTheDocument();
    expect(await screen.findByText('job-mayab')).toBeInTheDocument();
  });

  it('permite filtrar por estatus (sólo pendientes de pago)', async () => {
    await renderAdmin();

    const selectEstatus = screen.getByDisplayValue('Todos los Estatus');
    fireEvent.change(selectEstatus, { target: { value: 'pendientes' } });

    expect(screen.getByText(/Prospecto Real Pendiente/i)).toBeInTheDocument();
  });

  it('abre el resumen interno de pago, no una Cédula oficial', async () => {
    await renderAdmin();

    fireEvent.click(screen.getAllByRole('button', { name: /Resumen/i })[0]!);

    await waitFor(() => {
      expect(screen.getByText(/Resumen de registro y pago/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/No es una constancia oficial SIEM/i)).toBeInTheDocument();
  });

  it('no permite aprobar un envío a Arkangel sin la identidad de Pavel', async () => {
    await renderAdmin();

    const botonSync = screen.getByRole('button', { name: /Sincronizar registros/i });
    expect(botonSync).toBeInTheDocument();
    fireEvent.click(botonSync);

    // Modal de confirmación "Modo Sarita"
    expect(await screen.findByText(/Confirmar sincronización de registros/i)).toBeInTheDocument();
    const botonConfirmar = screen.getByRole('button', { name: /Generar vista previa/i });
    expect(botonConfirmar).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalledWith('/api/canaco/sync-arkangel', expect.anything());
  });

  it('no simula un envío de recordatorio individual no conectado', async () => {
    await renderAdmin();

    const botonesIndividuales = screen.getAllByRole('button', {
      name: /Recordatorio no conectado/i,
    });
    expect(botonesIndividuales).toHaveLength(2);
    for (const boton of botonesIndividuales) {
      expect(boton).toBeDisabled();
      expect(boton).toHaveAttribute('title', expect.stringContaining('no está conectado'));
    }
  });

  it('muestra la barra de ubicación cameral y la guía rápida de bienvenida ocultable', async () => {
    await renderAdmin();

    expect(screen.getByLabelText(/Ubicación en Consola CANACO/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Bienvenida a la Consola Cameral · ¿Qué puedes hacer en esta sección\?/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ocultar guía/i }));
    expect(
      screen.queryByText(/Bienvenida a la Consola Cameral · ¿Qué puedes hacer en esta sección\?/i)
    ).toBeNull();
  });
});
