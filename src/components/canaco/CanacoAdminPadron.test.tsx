import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanacoAdminPadron } from './CanacoAdminPadron';

const MOCK_LEADS = [
  {
    id: 'lead-can-1',
    web: 'Abarrotes y Comercializadora Mayab S.A. de C.V.',
    whatsapp: '9999123456',
    email: 'contacto@mayab.mx',
    ciudad: 'Mérida',
    especialidad: 'comercio',
    status: 'Socio Activo',
    last_contact: '2026-10-25',
    contacto_nombre: 'Lic. Fernando Pech',
    notas:
      'Folio SIEM: SIEM-MID-2026-AMA2-MIC-4819 | Estrato: MICRO (4 emp.) | Cuota: $2,000 MXN | CFDI: Requerido | Sello: SHA256:CANACO-MID-4819-2026',
  },
  {
    id: 'lead-can-2',
    web: 'Restaurante y Mariscos Montejo',
    whatsapp: '9999887766',
    email: 'admon@montejo.com',
    ciudad: 'Mérida',
    especialidad: 'turismo',
    status: 'Nuevo / Pendiente',
    last_contact: '2026-10-27',
    contacto_nombre: 'Chef Roberto Sosa',
    notas:
      'Folio SIEM: SIEM-MID-2026-RMM1-PEQ-7291 | Estrato: PEQUEÑA (18 emp.) | Cuota: $3,700 MXN | CFDI: Requerido',
  },
  {
    id: 'lead-can-3',
    web: 'Servicios Logísticos y Portuarios de Progreso',
    whatsapp: '9699341200',
    email: 'operaciones@puertoprogreso.mx',
    ciudad: 'Progreso',
    especialidad: 'servicios',
    status: 'Socio Activo',
    last_contact: '2026-10-20',
    contacto_nombre: 'Ing. Alejandro Solís',
    notas:
      'Folio SIEM: SIEM-MID-2026-SLP0-MED-1845 | Estrato: MEDIANA (45 emp.) | Cuota: $6,500 MXN | Sello: SHA256:CANACO-MID-1845-2026',
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
    expect(screen.getByText(/Abarrotes y Comercializadora Mayab/i)).toBeInTheDocument();
  });
}

describe('CANACO SERVYTUR Mérida — Consola de Afiliaciones & Padrón SIEM', () => {
  it('renderiza la cabecera institucional y el badge oficial de horus.i2d@gmail.com', async () => {
    await renderAdmin();

    expect(screen.getByText(/Padrón de Afiliados & Control SIEM/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin: horus\.i2d@gmail\.com/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Padrón Oficial ante Secretaría de Economía 2026/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar Excel \(SIEM\)/i })).toBeInTheDocument();
  });

  it('muestra los 4 KPIs del padrón cameral', async () => {
    await renderAdmin();

    expect(screen.getByText('Total en Padrón')).toBeInTheDocument();
    expect(screen.getByText('Socios Activos')).toBeInTheDocument();
    expect(screen.getByText('Por Liquidar')).toBeInTheDocument();
    expect(screen.getByText('Recaudación Anual')).toBeInTheDocument();
  });

  it('permite filtrar el padrón de socios por término de búsqueda', async () => {
    await renderAdmin();

    const inputBusqueda = screen.getByPlaceholderText(
      /Buscar por comercio, RFC, contacto o WhatsApp\.\.\./i
    );
    fireEvent.change(inputBusqueda, { target: { value: 'Progreso' } });

    expect(screen.getByText(/Servicios Logísticos y Portuarios de Progreso/i)).toBeInTheDocument();
    expect(screen.queryByText(/Abarrotes y Comercializadora Mayab/i)).not.toBeInTheDocument();
  });

  it('permite filtrar por estatus (sólo pendientes de pago)', async () => {
    await renderAdmin();

    const selectEstatus = screen.getByDisplayValue('Todos los Estatus');
    fireEvent.change(selectEstatus, { target: { value: 'pendientes' } });

    expect(screen.getByText(/Restaurante y Mariscos Montejo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Abarrotes y Comercializadora Mayab/i)).not.toBeInTheDocument();
  });

  it('abre la Cédula Oficial con QR al hacer clic en el botón de acción', async () => {
    await renderAdmin();

    const botonesCedula = screen.getAllByRole('button', { name: /Cédula/i });
    expect(botonesCedula.length).toBeGreaterThan(0);
    const primerBotonCedula = botonesCedula[0];
    if (primerBotonCedula) {
      fireEvent.click(primerBotonCedula);
    }

    await waitFor(() => {
      expect(screen.getByText(/Constancia Oficial de Afiliación Comercial/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Padrón Oficial SIEM/i)).toBeInTheDocument();
  });

  it('dispara la sincronización con Arkangel al pulsar el botón del Call Center', async () => {
    await renderAdmin();

    const botonSync = screen.getByRole('button', { name: /Sincronizar Call Center/i });
    expect(botonSync).toBeInTheDocument();
    fireEvent.click(botonSync);

    await waitFor(() => {
      expect(screen.getByText(/Lote sincronizado con Arkangel Call Center/i)).toBeInTheDocument();
    });
  });
});
