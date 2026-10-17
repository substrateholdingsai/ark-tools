import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimbradoFacturas } from './TimbradoFacturas';

// Mock de useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    tenantId: 'tenant-123',
    tenantName: 'Despacho Contable Águila',
    orgRole: 'owner',
    platformRole: 'user',
    isSignedIn: true,
    user: { id: 'user-owner', email: 'owner@aguila.com', fullName: 'Lic. Águila' },
  }),
}));

// Mock de apiClient
vi.mock('@/lib/apiClient', () => ({
  default: {
    alegra: {
      getAccounts: vi.fn().mockResolvedValue([]),
      connectAccount: vi.fn(),
      getAccountStatus: vi.fn(),
      setDefaultAccount: vi.fn(),
      disconnectAccount: vi.fn(),
      createInvoice: vi.fn(),
      getInvoices: vi.fn().mockResolvedValue([]),
    },
    clients: {
      list: vi.fn().mockResolvedValue([]),
    },
  },
}));

import apiClient from '@/lib/apiClient';

describe('TimbradoFacturas Component (Cobros CFDI 4.0)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra la pantalla de onboarding y ruta alternativa cuando no hay cuentas conectadas', async () => {
    vi.mocked(apiClient.alegra.getAccounts).mockResolvedValueOnce([]);
    vi.mocked(apiClient.alegra.getInvoices).mockResolvedValue([]);

    const onNavigateToValidador = vi.fn();
    render(<TimbradoFacturas onNavigateToValidador={onNavigateToValidador} />);

    await waitFor(() => {
      expect(
        screen.getByText('Emite Facturas CFDI 4.0 directamente desde tu despacho')
      ).toBeInTheDocument();
    });

    // Verifica que se muestre la ruta alternativa no bloqueante
    expect(screen.getByText('¿Prefieres utilizar otro PAC?')).toBeInTheDocument();
    const validadorBtn = screen.getByRole('button', { name: /Ir al Validador XML CFDI/i });
    expect(validadorBtn).toBeInTheDocument();

    fireEvent.click(validadorBtn);
    expect(onNavigateToValidador).toHaveBeenCalled();
  });

  it('renderiza el formulario de emisión y la cuenta conectada cuando existen cuentas activas', async () => {
    vi.mocked(apiClient.alegra.getAccounts).mockResolvedValue([
      {
        tenant_id: 'tenant-123',
        alegra_account_id: 'acc-1',
        alegra_email: 'contable@empresa.com',
        alegra_company_name: 'Despacho Águila SC',
        alegra_company_id: '8877',
        alegra_rfc: 'DAG010101ABC',
        csd_configured: true,
        is_default: true,
        status: 'active',
        last_checked_at: 1792000000,
        last_error: null,
        created_at: 1792000000,
        updated_at: 1792000000,
      },
    ]);
    vi.mocked(apiClient.alegra.getInvoices).mockResolvedValue([]);

    render(<TimbradoFacturas onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Datos Fiscales del Receptor/i)).toBeInTheDocument();
      expect(screen.getAllByText('Despacho Águila SC').length).toBeGreaterThanOrEqual(1);
    });

    // Pestañas disponibles
    expect(screen.getByRole('button', { name: /Nueva Factura/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Historial Emitido/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cuentas Conectadas/i })).toBeInTheDocument();
  });

  it('permite emitir y timbrar una factura CFDI 4.0 mostrando el Folio Fiscal UUID', async () => {
    vi.mocked(apiClient.alegra.getAccounts).mockResolvedValue([
      {
        tenant_id: 'tenant-123',
        alegra_account_id: 'acc-1',
        alegra_email: 'contable@empresa.com',
        alegra_company_name: 'Despacho Águila SC',
        alegra_company_id: '8877',
        alegra_rfc: 'DAG010101ABC',
        csd_configured: true,
        is_default: true,
        status: 'active',
        last_checked_at: 1792000000,
        last_error: null,
        created_at: 1792000000,
        updated_at: 1792000000,
      },
    ]);
    vi.mocked(apiClient.alegra.getInvoices).mockResolvedValue([]);
    vi.mocked(apiClient.alegra.createInvoice).mockResolvedValueOnce({
      ok: true,
      invoice: {
        id: 'rec-123',
        alegra_invoice_id: '501',
        uuid: '4A12B345-6789-ABCD-EF01-234567890ABC',
        folio: 'FAC-501',
        total: 4060,
        currency: 'MXN',
        status: 'open',
        pdf_url: 'https://alegra.com/pdf/501',
        xml_url: 'https://alegra.com/xml/501',
      },
    });

    render(<TimbradoFacturas />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ej. CLIENTE EJEMPLO SA DE CV')).toBeInTheDocument();
    });

    // Llenar campos requeridos
    fireEvent.change(screen.getByPlaceholderText('Ej. CLIENTE EJEMPLO SA DE CV'), {
      target: { value: 'CLIENTE PRUEBA SA DE CV' },
    });
    fireEvent.change(screen.getByPlaceholderText('XAXX010101000'), {
      target: { value: 'CPR010101XYZ' },
    });
    fireEvent.change(screen.getByPlaceholderText('06600'), {
      target: { value: '06600' },
    });

    // Enviar formulario
    const submitBtn = screen.getByRole('button', { name: /Emitir y Timbrar CFDI 4.0/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/¡Factura Timbrada con Éxito ante el SAT!/i)).toBeInTheDocument();
      expect(screen.getByText('4A12B345-6789-ABCD-EF01-234567890ABC')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Descargar XML Fiscal/i })).toHaveAttribute(
      'href',
      'https://alegra.com/xml/501'
    );
    expect(screen.getByRole('link', { name: /Descargar Representación PDF/i })).toHaveAttribute(
      'href',
      'https://alegra.com/pdf/501'
    );
  });
});
