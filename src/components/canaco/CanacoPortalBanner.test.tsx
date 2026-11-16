import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanacoPortalBanner } from './CanacoPortalBanner';
import { VentanillaAfiliacionModal } from './VentanillaAfiliacionModal';

describe('CANACO SERVYTUR Mérida — Componentes de Ventanilla & Banner HENEQUÉN', () => {
  it('renderiza el banner institucional del socio con textos HENEQUÉN', () => {
    render(<CanacoPortalBanner />);
    expect(screen.getByText(/Portal del Afiliado · HENEQUÉN/i)).toBeInTheDocument();
    expect(screen.getByText(/CANACO SERVYTUR Mérida · Ventanilla digital/i)).toBeInTheDocument();
    expect(screen.queryByText(/120 Años de Trayectoria Empresarial/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Impulsa tu Negocio con el Respaldo de CANACO SERVYTUR Mérida/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Solicitar seguimiento de afiliación/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Tu Ruta de Cumplimiento Cameral y Fiscal/i)).toBeInTheDocument();
    expect(screen.getByText('1. Solicitud')).toBeInTheDocument();
    expect(screen.getByText('2. Buzón documental')).toBeInTheDocument();
    expect(screen.getByText('3. Resumen interno')).toBeInTheDocument();
    expect(screen.getByText('4. Suite Fiscal')).toBeInTheDocument();
  });

  it('abre la Ventanilla Digital de Afiliación al pulsar el botón principal', () => {
    render(<CanacoPortalBanner />);
    const btnAfiliarse = screen.getByRole('button', {
      name: /Solicitar seguimiento de afiliación/i,
    });
    fireEvent.click(btnAfiliarse);

    expect(screen.getByText('Ventanilla Digital de Afiliación')).toBeInTheDocument();
    expect(screen.getByText(/SOLICITUD DE SEGUIMIENTO SIEM 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Datos del Negocio')).toBeInTheDocument();
  });

  it('mantiene accesible el aviso de privacidad desde la captura de datos', () => {
    render(<CanacoPortalBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Solicitar seguimiento de afiliación/i }));
    fireEvent.click(screen.getByRole('button', { name: /Consultar Aviso de Privacidad/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Aviso de Privacidad/i })).toBeInTheDocument();
  });

  it('muestra la cotización de referencia y aclara que no es una tarifa oficial', async () => {
    render(<CanacoPortalBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Solicitar seguimiento de afiliación/i }));

    const inputRazon = screen.getByPlaceholderText(/Ej. Comercializadora del Mayab S.A. de C.V./i);
    fireEvent.change(inputRazon, { target: { value: 'Comercializadora del Mayab' } });
    fireEvent.change(screen.getByLabelText(/RFC/i), { target: { value: 'CPM2106158A1' } });
    fireEvent.change(screen.getByLabelText(/Nombre de Contacto/i), {
      target: { value: 'Fernando Pech' },
    });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
      target: { value: 'demo@example.invalid' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono \/ WhatsApp/i), {
      target: { value: '0000000000' },
    });
    fireEvent.click(screen.getAllByRole('checkbox')[0]!);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          leadId: 'lead-demo-1',
          socio: {
            folioSiem: 'SIEM-MID-2026-CPM2-MIC-4242',
            razonSocial: 'COMERCIALIZADORA DEL MAYAB',
            rfc: 'CPM2106158A1',
            estatus: 'pendiente_pago',
            pagoConfirmado: false,
            folioIntegridad: 'CANACO-FI-DEMO',
          },
        }),
        { status: 201 }
      )
    );

    const btnContinuar = screen.getByRole('button', { name: /Calcular Cuota y Ver Beneficios/i });
    fireEvent.click(btnContinuar);

    await waitFor(() => {
      expect(screen.getByText(/Estrato de referencia/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Empresa micro \(5 colaboradores\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\$2,000 MXN/i)).toBeInTheDocument();
    expect(screen.getByText(/no son una tarifa oficial/i)).toBeInTheDocument();
  });

  it('la simulación de pago deja el registro pendiente y no intenta migrarlo a Ledger', async () => {
    window.history.replaceState({}, '', '/?brand=canaco&demo=1');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<VentanillaAfiliacionModal isOpen={true} onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Ir directo a Pago \(Paso 3\)/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /Simular recorrido \(sin pago\)/i })[0]!);

    expect(screen.getByText(/Registro pendiente de pago/i)).toBeInTheDocument();
    expect(screen.getByText(/No se ha emitido una Cédula/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Importar Empresa y Abrir Nómina/i })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
