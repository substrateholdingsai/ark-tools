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
            folioSiem: 'SIEM-MID-2026-FPE1-MIC-9988',
            razonSocial: 'Ferretería La Peninsular S.A. de C.V.',
            nombreComercial: 'Ferretería Peninsular',
            rfc: 'FPE980415XYZ',
            sector: 'comercio',
            estrato: 'micro',
            numEmpleados: 4,
            direccion: {
              calle: 'Calle 60 #450',
              colonia: 'Centro',
              codigoPostal: '97000',
              municipio: 'Mérida',
              ciudad: 'Mérida, Yucatán',
            },
            contacto: {
              nombre: 'Lic. Fernando Pech',
              email: 'pagos@ferre.mx',
              telefono: '+52 999 912 3456',
            },
            fechaAfiliacion: '2026-10-25',
            fechaVigencia: '2027-10-25',
            estatus: 'activo',
            montoPagado: 2150,
            metodoPago: 'tarjeta',
            cfdiRequerido: true,
            selloDigitalSha256: 'SHA256:CANACO-MID-9988-2026-OFICIAL',
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
    expect(screen.getByText(/\+1,200 afiliados formales/i)).toBeInTheDocument();
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
    fireEvent.change(inputRfc, { target: { value: 'FPE980415XYZ' } });

    const botonConsultar = screen.getByRole('button', { name: /Consultar Padrón/i });
    fireEvent.click(botonConsultar);

    await waitFor(() => {
      expect(screen.getByText(/Ferretería La Peninsular S\.A\. de C\.V\./i)).toBeInTheDocument();
    });

    expect(screen.getByText(/SIEM-MID-2026-FPE1-MIC-9988/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver Cédula Oficial Carta/i })).toBeInTheDocument();
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
});
