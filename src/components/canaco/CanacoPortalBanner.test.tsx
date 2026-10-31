import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanacoPortalBanner } from './CanacoPortalBanner';
import { VentanillaAfiliacionModal } from './VentanillaAfiliacionModal';

describe('CANACO SERVYTUR Mérida — Componentes de Ventanilla & Banner HENEQUÉN', () => {
  it('renderiza el banner institucional del socio con textos HENEQUÉN', () => {
    render(<CanacoPortalBanner />);
    expect(screen.getByText(/Portal del Afiliado · HENEQUÉN/i)).toBeInTheDocument();
    expect(screen.getByText(/120 Años de Autoridad Comercial \(1906–2026\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Impulsa tu Negocio con el Respaldo de CANACO SERVYTUR Mérida/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Afiliarse \/ Refrendo SIEM/i })).toBeInTheDocument();
  });

  it('abre la Ventanilla Digital de Afiliación al pulsar el botón principal', () => {
    render(<CanacoPortalBanner />);
    const btnAfiliarse = screen.getByRole('button', { name: /Afiliarse \/ Refrendo SIEM/i });
    fireEvent.click(btnAfiliarse);

    expect(screen.getByText('Ventanilla Digital de Afiliación')).toBeInTheDocument();
    expect(screen.getByText(/REGISTRO SIEM 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Datos del Negocio')).toBeInTheDocument();
  });

  it('avanza al paso de cotización y muestra el cálculo de cuotas desglosado', () => {
    render(<CanacoPortalBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Afiliarse \/ Refrendo SIEM/i }));

    // Llenar campos requeridos mínimos
    const inputRazon = screen.getByPlaceholderText(/Ej. Comercializadora del Mayab S.A. de C.V./i);
    fireEvent.change(inputRazon, { target: { value: 'Abarrotes del Mayab S.A.' } });

    const btnContinuar = screen.getByRole('button', { name: /Calcular Cuota y Ver Beneficios/i });
    fireEvent.click(btnContinuar);

    // Debe mostrar la cotización del paso 2
    expect(screen.getByText(/Estrato Determinado/i)).toBeInTheDocument();
    expect(screen.getByText(/Empresa micro/i)).toBeInTheDocument();
    expect(screen.getByText(/\$2,000 MXN/i)).toBeInTheDocument();
    expect(screen.getByText(/Registro SIEM 2026 \(Ley Federal\)/i)).toBeInTheDocument();
  });

  it('muestra la tarjeta de Handoff a ARK LEDGER tras completar la afiliación y ejecuta la migración', async () => {
    const mockSocio = {
      folioSiem: 'SIEM-MID-2026-TEST-1234',
      razonSocial: 'COMERCIAL DEL SURESTE S.A.',
      rfc: 'CDS101010AB1',
      sector: 'comercio' as const,
      estrato: 'micro' as const,
      numEmpleados: 4,
      direccion: {
        calle: 'Calle 60',
        colonia: 'Centro',
        codigoPostal: '97000',
        municipio: 'Mérida',
        ciudad: 'Mérida, Yucatán',
      },
      contacto: {
        nombre: 'Lic. José Pech',
        email: 'jose@sureste.mx',
        telefono: '9991234567',
      },
      fechaAfiliacion: '2026-10-29',
      fechaVigencia: '2027-10-29',
      estatus: 'activo' as const,
      montoPagado: 2000,
      metodoPago: 'tarjeta' as const,
      cfdiRequerido: true,
      selloDigitalSha256: 'SHA256:CANACO-MID-TEST-2026',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/afiliaciones/registro')) {
        return Promise.resolve(new Response(JSON.stringify({ socio: mockSocio }), { status: 201 }));
      }
      if (url.includes('/api/afiliaciones/migrar-a-ledger')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              success: true,
              client: {
                id: 'client-migrado-001',
                nombre: 'COMERCIAL DEL SURESTE S.A.',
                rfc: 'CDS101010AB1',
              },
              tenantId: 'tenant-sureste',
              redirectTo: '/?tool=nomina&welcome=siem',
            }),
            { status: 200 }
          )
        );
      }
      return Promise.reject(new Error(`Unhandled URL ${url}`));
    });

    render(<VentanillaAfiliacionModal isOpen={true} onClose={() => {}} />);

    // Paso 1: Llenar datos y avanzar
    fireEvent.change(screen.getByPlaceholderText(/Ej. Comercializadora del Mayab S.A. de C.V./i), {
      target: { value: 'Comercial del Sureste S.A.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Calcular Cuota y Ver Beneficios/i }));

    // Paso 2: Avanzar a pago
    fireEvent.click(screen.getByRole('button', { name: /Proceder al Pago y Emisión/i }));

    // Paso 3: Confirmar pago
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pago y Activar Socio/i }));

    // Pantalla de éxito
    await waitFor(() => {
      expect(screen.getByText(/¡Afiliación Acreditada con Éxito!/i)).toBeInTheDocument();
      expect(screen.getByText(/¡Felicidades, tu registro SIEM está listo!/i)).toBeInTheDocument();
      expect(screen.getByText(/Beneficio Exclusivo Socio CANACO/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Importar Empresa y Abrir Nómina/i })
      ).toBeInTheDocument();
    });

    // Clic en importar
    const btnImportar = screen.getByRole('button', { name: /Importar Empresa y Abrir Nómina/i });
    fireEvent.click(btnImportar);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/afiliaciones/migrar-a-ledger',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    fetchSpy.mockRestore();
  });
});
