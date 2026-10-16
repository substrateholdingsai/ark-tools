import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiAssistantWidget } from './AiAssistantWidget';

// Mock de useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    tenantId: 'tenant_test_123',
    tenantName: 'Despacho Contable Águila',
    getToken: vi.fn().mockResolvedValue('mock_token'),
  }),
}));

// Mock de apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    ai: {
      chat: vi.fn(),
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

    // Esperar respuesta del asistente
    await waitFor(() => {
      expect(
        screen.getByText(/El despacho lleva 3 de los 8 pasos completados/i)
      ).toBeInTheDocument();
    });

    // Debe mostrar la herramienta ejecutada
    expect(screen.getByText('consultar_progreso_guia')).toBeInTheDocument();
    expect(apiClient.ai.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant_test_123',
      }),
      'mock_token'
    );
  });
});
