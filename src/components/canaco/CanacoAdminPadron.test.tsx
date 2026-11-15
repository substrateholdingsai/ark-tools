import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanacoAdminPadron } from './CanacoAdminPadron';

const MOCK_LEADS = [
  {
    id: 'lead-can-1',
    web: 'Comercializadora del Mayab',
    whatsapp: '0000000000',
    email: 'demo@example.invalid',
    ciudad: 'Mérida',
    especialidad: 'comercio',
    status: 'Socio Activo',
    last_contact: '2026-10-25',
    contacto_nombre: 'Fernando Pech',
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
    last_contact: '2026-10-20',
    contacto_nombre: 'Contacto de prueba',
    notas:
      'Razón Social: SERVICIOS DEMO DE PROGRESO | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-MED-6060 | Estrato: MEDIANA (60 emp.) | Empleados: 60 | Cuota: $6,500 MXN | Pago Confirmado Call Center: SPEI-DEMO-6060 ($6,500 MXN)',
  },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
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

  it('permite filtrar el padrón de socios por término de búsqueda', async () => {
    await renderAdmin();

    const inputBusqueda = screen.getByPlaceholderText(
      /Buscar por comercio, RFC, contacto o WhatsApp\.\.\./i
    );
    fireEvent.change(inputBusqueda, { target: { value: 'Servicios Demo' } });

    expect(screen.getByText(/Servicios Demo de Progreso/i)).toBeInTheDocument();
    expect(screen.queryByText(/Comercializadora del Mayab/i)).not.toBeInTheDocument();
  });

  it('permite filtrar por estatus (sólo pendientes de pago)', async () => {
    await renderAdmin();

    const selectEstatus = screen.getByDisplayValue('Todos los Estatus');
    fireEvent.change(selectEstatus, { target: { value: 'pendientes' } });

    expect(screen.getByText(/Comercio Demo Pendiente/i)).toBeInTheDocument();
    expect(screen.queryByText(/Comercializadora del Mayab/i)).not.toBeInTheDocument();
  });

  it('abre el resumen interno de pago, no una Cédula oficial', async () => {
    await renderAdmin();

    fireEvent.click(screen.getAllByRole('button', { name: /Resumen/i })[0]!);

    await waitFor(() => {
      expect(screen.getByText(/Resumen de registro y pago/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/No es una constancia oficial SIEM/i)).toBeInTheDocument();
  });

  it('dispara la sincronización con Arkangel al confirmar en el modal de Recordatorio Masivo', async () => {
    await renderAdmin();

    const botonSync = screen.getByRole('button', { name: /Sincronizar registros/i });
    expect(botonSync).toBeInTheDocument();
    fireEvent.click(botonSync);

    // Modal de confirmación "Modo Sarita"
    expect(await screen.findByText(/Confirmar sincronización de registros/i)).toBeInTheDocument();
    const botonConfirmar = screen.getByRole('button', { name: /Enviar lote al proveedor/i });
    fireEvent.click(botonConfirmar);

    await waitFor(() => {
      expect(screen.getByText(/Lote enviado al proveedor Arkangel/i)).toBeInTheDocument();
    });
  });

  it('no simula un envío de recordatorio individual no conectado', async () => {
    await renderAdmin();

    const botonIndividual = screen.getByRole('button', { name: /Recordatorio no conectado/i });
    expect(botonIndividual).toBeInTheDocument();
    expect(botonIndividual).toBeDisabled();
    expect(botonIndividual).toHaveAttribute('title', expect.stringContaining('no está conectado'));
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
