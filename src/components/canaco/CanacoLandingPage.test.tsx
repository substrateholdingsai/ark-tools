import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/context/AuthContext';
import { CanacoLandingPage } from './CanacoLandingPage';

let fetchMock: ReturnType<typeof vi.fn>;

function renderLanding() {
  return render(
    <AuthProvider>
      <CanacoLandingPage />
    </AuthProvider>
  );
}

beforeEach(() => {
  fetchMock = vi.fn(async (url: any) => {
    if (typeof url === 'string' && url.includes('/api/auth/session')) {
      return {
        ok: true,
        json: async () => ({ user: null, activeTenant: null, tenants: [] }),
      };
    }
    if (typeof url === 'string' && url.includes('/api/afiliaciones/consulta')) {
      return {
        ok: true,
        json: async () => ({
          encontrado: true,
          estatus: 'Socio Activo',
          socio: {
            folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
            razonSocial: 'Comercializadora del Mayab',
            nombreComercial: 'Comercializadora del Mayab',
            rfc: 'CPM2106158A1',
            sector: 'comercio',
            estrato: 'pequena',
            numEmpleados: 15,
            direccion: {
              calle: 'Domicilio de prueba',
              colonia: 'Centro',
              codigoPostal: '00000',
              municipio: 'Mérida',
              ciudad: 'Mérida, Yucatán',
            },
            contacto: {
              nombre: 'Fernando Pech',
              email: 'demo@example.invalid',
              telefono: '0000000000',
            },
            fechaAfiliacion: '2026-11-16',
            fechaVigencia: '2027-11-16',
            estatus: 'activo',
            pagoConfirmado: true,
            montoPagado: 3700,
            metodoPago: 'tarjeta',
            cfdiRequerido: true,
            folioIntegridad: 'CANACO-FI-SIEM-MID-2026-CPM2-PEQ-4242',
          },
        }),
      };
    }
    return {
      ok: true,
      json: async () => ({}),
    };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CANACO SERVYTUR Mérida — Landing Page Institucional (HENEQUÉN)', () => {
  it('renderiza el encabezado institucional, 120 años de historia y los botones de acción', async () => {
    renderLanding();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Cámara Nacional de Comercio, Servicios y Turismo de Mérida/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/120 Años de Trayectoria Empresarial/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1,200/i)).toBeInTheDocument();
    expect(screen.getByText(/Socios Agremiados/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Afiliarme \/ Renovar Registro SIEM 2026/i })
    ).toBeInTheDocument();
  });

  it('renderiza la cuadrícula de los 6 servicios gremiales oficiales', async () => {
    renderLanding();

    expect(screen.getByRole('heading', { level: 3, name: 'Afíliate' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Salones y Stands' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Jurídico & Compliance' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Capacitación Empresarial' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Representatividad' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Networking y Vinculación' })
    ).toBeInTheDocument();
  });

  it('permite consultar un socio por RFC y muestra el resultado con acceso a Cédula', async () => {
    renderLanding();

    const inputRfc = screen.getByPlaceholderText(/Ej\. AMA200101XYZ o RFC/i);
    fireEvent.change(inputRfc, { target: { value: 'CPM2106158A1' } });

    const botonConsultar = screen.getByRole('button', { name: /Consultar Padrón/i });
    fireEvent.click(botonConsultar);

    await waitFor(() => {
      expect(screen.getByText(/Comercializadora del Mayab/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/SIEM-MID-2026-CPM2-PEQ-4242/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver resumen de pago/i })).toBeInTheDocument();
    expect(screen.queryByText(/Cédula Oficial/i)).not.toBeInTheDocument();
  });

  it('abre el modal de la Ventanilla Digital de Afiliación al pulsar el botón principal', async () => {
    renderLanding();

    const botonAfiliar = screen.getByRole('button', {
      name: /Afiliarme \/ Renovar Registro SIEM 2026/i,
    });
    fireEvent.click(botonAfiliar);

    await waitFor(() => {
      expect(screen.getByText('Ventanilla Digital de Afiliación')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cerrar ventanilla/i })).toBeInTheDocument();
    });
  });

  it('abre el modal de Acceso Directivo para horus.i2d@gmail.com', async () => {
    renderLanding();

    const botonAdmin = screen.getByRole('button', { name: /Directorio & Admin/i });
    fireEvent.click(botonAdmin);

    await waitFor(() => {
      expect(screen.getByText(/Acceso Directivo & Padrón/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/ej\. horus\.i2d@gmail\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar al Padrón SIEM/i })).toBeInTheDocument();
  });

  it('renderiza la distinción de Portal de Servicios al Socio y el pie de página de Ark Systems', () => {
    renderLanding();

    expect(screen.getByText(/Servicios CANACO para negocios/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ventanilla Digital y Suite de Servicios al Afiliado/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Desarrollado con tecnología de Ark Systems/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/pavel@arksystems\.site/i)).toBeInTheDocument();
  });

  it('muestra la Guía Visual de 3 pasos y permite abrir el Buzón Digital directamente', async () => {
    renderLanding();

    expect(
      screen.getByRole('heading', {
        name: /Tu Recorrido en 3 Pasos dentro del Portal CANACO/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/Ubicación actual: Portal Público del Afiliado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ir al Paso 2: Abrir Buzón Digital/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Buzón Documental CANACO/i })).toBeInTheDocument();
    });
  });
});
