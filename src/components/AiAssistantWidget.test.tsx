import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiAssistantWidget } from './AiAssistantWidget';

// Mock de useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    tenantId: 'tenant_test_123',
    tenantName: 'Despacho Contable Águila',
  }),
}));

// Mock de apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    ai: {
      chat: vi.fn(),
      getQuota: vi.fn().mockResolvedValue({
        allowed: true,
        used: 2,
        limit: 10,
        is_pro: false,
        payment_url: 'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65',
      }),
    },
  },
}));

import { apiClient } from '@/lib/apiClient';

describe('AiAssistantWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView para jsdom
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renderiza inicialmente el botón flotante minimizado', () => {
    render(<AiAssistantWidget />);
    expect(screen.getByTitle('Abrir Asistente ARK AI')).toBeInTheDocument();
    expect(screen.getByText('ARK AI')).toBeInTheDocument();
    expect(screen.getByText(/Llama 3.3/)).toBeInTheDocument();
  });

  it('abre la ventana de chat al hacer clic en el botón flotante', () => {
    render(<AiAssistantWidget />);
    const openBtn = screen.getByTitle('Abrir Asistente ARK AI');
    fireEvent.click(openBtn);

    expect(screen.getByText('Despacho Contable Águila', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('ARK Contable AI')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe tu consulta/i)).toBeInTheDocument();
  });

  it('permite minimizar y cerrar la ventana de chat', () => {
    render(<AiAssistantWidget />);
    fireEvent.click(screen.getByTitle('Abrir Asistente ARK AI'));

    const minimizeBtn = screen.getByTitle('Minimizar');
    fireEvent.click(minimizeBtn);
    // En modo minimizado, el input no se muestra
    expect(screen.queryByPlaceholderText(/Escribe tu consulta/i)).not.toBeInTheDocument();

    const closeBtn = screen.getByTitle('Cerrar');
    fireEvent.click(closeBtn);
    // Vuelve a estar cerrado
    expect(screen.getByTitle('Abrir Asistente ARK AI')).toBeInTheDocument();
  });

  it('envía un mensaje y muestra la respuesta con las herramientas ejecutadas', async () => {
    vi.mocked(apiClient.ai.chat).mockResolvedValue({
      model: '@cf/meta/llama-3.3-70b-instruct',
      tenant_id: 'tenant_test_123',
      tools_executed: ['consultar_progreso_guia'],
      result: 'El despacho lleva 3 de los 8 pasos completados en la Guía SAT/IMSS.',
    });

    render(<AiAssistantWidget />);
    fireEvent.click(screen.getByTitle('Abrir Asistente ARK AI'));

    const input = screen.getByPlaceholderText(/Escribe tu consulta/i);
    fireEvent.change(input, { target: { value: '¿Cómo va la guía?' } });

    const sendBtn = screen.getByTitle('Enviar mensaje');
    fireEvent.click(sendBtn);

    // Debe mostrar el mensaje del usuario de inmediato
    expect(screen.getByText('¿Cómo va la guía?')).toBeInTheDocument();

    // Esperar respuesta del asistente (considerando simulateTyping)
    await waitFor(
      () => {
        expect(
          screen.getByText(/El despacho lleva 3 de los 8 pasos completados/i)
        ).toBeInTheDocument();
      },
      { timeout: 3500 }
    );

    // Debe mostrar la herramienta ejecutada
    expect(screen.getByText('consultar_progreso_guia')).toBeInTheDocument();
    expect(apiClient.ai.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant_test_123',
      })
    );
  });

  it('muestra la tarjeta de Paywall y enlace a Clip cuando la cuota mensual se agota', async () => {
    vi.mocked(apiClient.ai.chat).mockResolvedValueOnce({
      quota_exceeded: true,
      result: 'Has alcanzado el límite de 10 consultas gratuitas de este mes.',
      payment_url: 'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65',
      quota: { used: 10, limit: 10, is_pro: false },
    });

    render(<AiAssistantWidget />);
    fireEvent.click(screen.getByTitle('Abrir Asistente ARK AI'));

    const input = screen.getByPlaceholderText(/Escribe tu consulta/i);
    fireEvent.change(input, { target: { value: 'Pregunta número 11' } });
    fireEvent.click(screen.getByTitle('Enviar mensaje'));

    await waitFor(() => {
      expect(screen.getByText(/ACTIVAR PRO — \$399 MXN \/ MES/i)).toBeInTheDocument();
      expect(screen.getByText(/Desbloquear ARK TOOLS Pro/i)).toBeInTheDocument();
    });
  });
});
