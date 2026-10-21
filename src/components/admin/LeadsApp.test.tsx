/**
 * ARK TOOLS — Test de Integración y UI del CRM de Prospectos (LeadsApp)
 *
 * Cubre el flujo comercial completo del Super Admin: KPIs de embudo, filtros,
 * actualización inline de estatus, alta, baja y envío de propuesta vía Resend.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import LeadsApp from './LeadsApp';

interface LeadFixture {
  id: string;
  web: string | null;
  whatsapp: string | null;
  email: string | null;
  ciudad: string | null;
  especialidad: string | null;
  status: string | null;
  last_contact: string | null;
  contacto_nombre: string | null;
  notas: string | null;
}

function lead(overrides: Partial<LeadFixture> = {}): LeadFixture {
  return {
    id: 'lead-1',
    web: 'despacho.mx',
    whatsapp: '5219991234567',
    email: 'contacto@despacho.mx',
    ciudad: 'Merida',
    especialidad: 'General',
    status: 'Nuevo',
    last_contact: null,
    contacto_nombre: 'Despacho Pérez & Asociados',
    notas: null,
    ...overrides,
  };
}

const LEADS: LeadFixture[] = [
  lead(),
  lead({
    id: 'lead-2',
    contacto_nombre: 'Bufete Ramírez',
    email: 'contacto@ramirez.mx',
    whatsapp: '5219988887777',
    status: 'Respondio_2_whats',
    ciudad: 'Durango',
    especialidad: 'Crypto',
    last_contact: '2026-10-12',
  }),
  lead({
    id: 'lead-3',
    contacto_nombre: 'Despacho Bloqueado',
    email: null,
    whatsapp: '5219977776666',
    status: 'Bloqueado',
    ciudad: 'Metropolitana',
    especialidad: 'Cobranza',
  }),
];

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;
let createObjectURLMock: ReturnType<typeof vi.fn>;
let anclasDescargadas: HTMLAnchorElement[];

beforeEach(() => {
  fetchMock = vi.fn(async () => jsonResponse({ leads: LEADS }));
  vi.stubGlobal('fetch', fetchMock);

  createObjectURLMock = vi.fn(() => 'blob:mock-url');
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: createObjectURLMock,
    revokeObjectURL: vi.fn(),
  });

  // Se intercepta el clic del ancla de descarga para evitar la navegación de jsdom
  // y, de paso, poder verificar el nombre del archivo generado.
  anclasDescargadas = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    anclasDescargadas.push(this);
  });

  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function renderApp() {
  render(<LeadsApp />);
  await waitFor(() => expect(screen.getByText(/Directorio de Prospectos/)).toBeInTheDocument());
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
}

function urlDeListado(): string {
  const llamadas = fetchMock.mock.calls.filter(
    (c) => typeof c[0] === 'string' && c[0].startsWith('/api/admin/leads?')
  );
  return String(llamadas[llamadas.length - 1]?.[0] ?? '');
}

describe('LeadsApp (src/components/admin/LeadsApp.tsx)', () => {
  it('renderiza el encabezado institucional, los 5 KPIs y el directorio', async () => {
    await renderApp();

    expect(screen.getByRole('heading', { name: /CRM Prospectos Contables/i })).toBeInTheDocument();
    expect(screen.getByText(/Embudo pericial de prospección/i)).toBeInTheDocument();

    // KPIs del embudo
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('Nuevos')).toBeInTheDocument();
    expect(screen.getByText('Contactados')).toBeInTheDocument();
    expect(screen.getByText('Respondieron')).toBeInTheDocument();
    expect(screen.getByText('Bajas / Spam')).toBeInTheDocument();

    expect(screen.getByText('Directorio de Prospectos (3)')).toBeInTheDocument();
    expect(screen.getByText('Despacho Pérez & Asociados')).toBeInTheDocument();
    expect(screen.getByText('Bufete Ramírez')).toBeInTheDocument();
    expect(screen.getByText('Despacho Bloqueado')).toBeInTheDocument();
  });

  it('calcula los KPIs del embudo a partir de los estatus', async () => {
    await renderApp();

    // Total = 3 | Nuevos = 1 | Contactados = 1 | Respondieron = 1 | Bajas/Spam = 1
    const tarjetaTotal = screen.getByText('Total Leads').closest('div')?.parentElement;
    expect(tarjetaTotal).toHaveTextContent('3');

    const tarjetaNuevos = screen.getByText('Nuevos').closest('div')?.parentElement;
    expect(tarjetaNuevos).toHaveTextContent('1');

    const tarjetaContactados = screen.getByText('Contactados').closest('div')?.parentElement;
    expect(tarjetaContactados).toHaveTextContent('1');

    const tarjetaRespondieron = screen.getByText('Respondieron').closest('div')?.parentElement;
    expect(tarjetaRespondieron).toHaveTextContent('1');
  });

  it('muestra los canales directos con enlaces de WhatsApp y correo', async () => {
    await renderApp();

    const whatsapp = screen.getByRole('link', { name: /5219991234567/i });
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/5219991234567');

    const mail = screen.getByRole('link', { name: /contacto@despacho.mx/i });
    expect(mail).toHaveAttribute('href', 'mailto:contacto@despacho.mx');

    // El prospecto sin correo no ofrece envío de propuesta
    const filaSinEmail = screen.getByText('Despacho Bloqueado').closest('tr') as HTMLElement;
    expect(within(filaSinEmail).queryByRole('button', { name: /Enviar Propuesta/i })).toBeNull();
    expect(within(filaSinEmail).getByText('Sin email')).toBeInTheDocument();
  });

  it('reenvía la consulta con los filtros de ciudad, especialidad y estatus', async () => {
    await renderApp();
    fetchMock.mockClear();

    const combos = screen.getAllByRole('combobox');
    fireEvent.change(combos[0]!, { target: { value: 'Durango' } });
    fireEvent.change(combos[1]!, { target: { value: 'Crypto' } });
    fireEvent.change(combos[2]!, { target: { value: 'Respondio_2_whats' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const url = urlDeListado();
    expect(url).toContain('ciudad=Durango');
    expect(url).toContain('especialidad=Crypto');
    expect(url).toContain('status=Respondio_2_whats');
  });

  it('busca por texto y recarga la lista al pulsar Enter', async () => {
    await renderApp();
    fetchMock.mockClear();

    const buscador = screen.getByPlaceholderText(/Buscar por despacho, web, email/i);
    fireEvent.change(buscador, { target: { value: 'Ramírez' } });
    fireEvent.keyDown(buscador, { key: 'Enter' });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(urlDeListado()).toContain('q=Ram%C3%ADrez');
  });

  it('permite limpiar los filtros activos', async () => {
    await renderApp();

    const ciudad = screen.getAllByRole('combobox')[0]!;
    fireEvent.change(ciudad, { target: { value: 'Durango' } });

    const botonLimpiar = await screen.findByRole('button', { name: /Limpiar/i });
    fireEvent.click(botonLimpiar);

    await waitFor(() => expect(screen.getAllByRole('combobox')[0]).toHaveValue(''));
  });

  it('actualiza el estatus inline con PATCH y refleja el cambio en la fila', async () => {
    await renderApp();
    fetchMock.mockClear();

    const fila = screen.getByText('Despacho Pérez & Asociados').closest('tr') as HTMLElement;
    const selectorEstatus = within(fila).getByRole('combobox');

    fireEvent.change(selectorEstatus, { target: { value: 'WhatsApp_enviado' } });

    await waitFor(() => {
      const llamada = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH');
      expect(llamada).toBeDefined();
      expect(String(llamada?.[0])).toBe('/api/admin/leads/lead-1');
      expect(JSON.parse(String(llamada?.[1]?.body))).toMatchObject({
        status: 'WhatsApp_enviado',
      });
    });

    await waitFor(() => {
      expect(
        within(
          screen.getByText('Despacho Pérez & Asociados').closest('tr') as HTMLElement
        ).getByRole('combobox')
      ).toHaveValue('WhatsApp_enviado');
    });
  });

  it('muestra estado vacío cuando el backend no devuelve prospectos', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ leads: [] }));
    render(<LeadsApp />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron prospectos')).toBeInTheDocument();
    });
    expect(screen.getByText('Directorio de Prospectos (0)')).toBeInTheDocument();
  });

  it('muestra el error de carga cuando el backend responde con fallo', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 500));
    render(<LeadsApp />);

    await waitFor(() => {
      expect(screen.getByText('HTTP 500')).toBeInTheDocument();
    });
  });

  it('crea un prospecto desde el modal de alta y lo agrega al directorio', async () => {
    await renderApp();
    fetchMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Prospecto/i }));
    expect(screen.getByRole('heading', { name: /Añadir Nuevo Prospecto/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Despacho Pérez & Asociados/), {
      target: { value: 'Despacho Nuevo' },
    });
    fireEvent.change(screen.getByPlaceholderText('contacto@despacho.mx'), {
      target: { value: 'nuevo@despacho.mx' },
    });
    fireEvent.change(screen.getByPlaceholderText(/5219991234567/), {
      target: { value: '5219990000000' },
    });

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        lead: lead({
          id: 'lead-99',
          contacto_nombre: 'Despacho Nuevo',
          email: 'nuevo@despacho.mx',
        }),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /Guardar Prospecto/i }));

    await waitFor(() => {
      const llamada = fetchMock.mock.calls.find((c) => c[1]?.method === 'POST');
      expect(llamada).toBeDefined();
      expect(String(llamada?.[0])).toBe('/api/admin/leads');
      expect(JSON.parse(String(llamada?.[1]?.body))).toMatchObject({
        contacto_nombre: 'Despacho Nuevo',
        email: 'nuevo@despacho.mx',
        whatsapp: '5219990000000',
        status: 'Nuevo',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Despacho Nuevo')).toBeInTheDocument();
      expect(screen.getByText('Directorio de Prospectos (4)')).toBeInTheDocument();
    });
  });

  it('elimina un prospecto solo tras la confirmación explícita', async () => {
    await renderApp();
    fetchMock.mockClear();

    const fila = screen.getByText('Bufete Ramírez').closest('tr') as HTMLElement;
    fireEvent.click(within(fila).getByTitle('Eliminar prospecto'));

    // Modal de confirmación con el nombre del prospecto
    expect(screen.getByRole('heading', { name: /¿Eliminar Prospecto\?/i })).toBeInTheDocument();
    const modalEliminar = screen
      .getByRole('heading', { name: /¿Eliminar Prospecto\?/i })
      .closest('div')?.parentElement?.parentElement?.parentElement as HTMLElement;
    expect(within(modalEliminar).getByText('Bufete Ramírez')).toBeInTheDocument();

    // Cancelar no elimina
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    fireEvent.click(screen.getByRole('button', { name: /^Cancelar$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /¿Eliminar Prospecto\?/i })).toBeNull();
    });
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === 'DELETE')).toBe(false);
    expect(screen.getByText('Bufete Ramírez')).toBeInTheDocument();

    // Confirmar sí elimina
    const fila2 = screen.getByText('Bufete Ramírez').closest('tr') as HTMLElement;
    fireEvent.click(within(fila2).getByTitle('Eliminar prospecto'));
    fireEvent.click(screen.getByRole('button', { name: /Eliminar Definitivamente/i }));

    await waitFor(() => {
      const llamada = fetchMock.mock.calls.find((c) => c[1]?.method === 'DELETE');
      expect(llamada).toBeDefined();
      expect(String(llamada?.[0])).toBe('/api/admin/leads/lead-2');
    });

    await waitFor(() => {
      expect(screen.queryByText('Bufete Ramírez')).toBeNull();
      expect(screen.getByText('Directorio de Prospectos (2)')).toBeInTheDocument();
    });
  }, 15000);

  it('abre el modal de propuesta con vista previa y entrega el correo vía Resend', async () => {
    await renderApp();
    fetchMock.mockClear();

    const fila = screen.getByText('Despacho Pérez & Asociados').closest('tr') as HTMLElement;
    fireEvent.click(within(fila).getByRole('button', { name: /Enviar Propuesta/i }));

    expect(
      screen.getByRole('heading', { name: /Enviar Propuesta Institucional/i })
    ).toBeInTheDocument();
    const modalPropuesta = screen
      .getByRole('heading', { name: /Enviar Propuesta Institucional/i })
      .closest('div')?.parentElement?.parentElement?.parentElement as HTMLElement;
    expect(within(modalPropuesta).getByText('contacto@despacho.mx')).toBeInTheDocument();

    // La vista previa está oculta hasta que se solicita explícitamente
    expect(screen.queryByText(/Plan Corporate Firm/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ver Vista Previa/i }));
    expect(screen.getByText(/Plan Corporate Firm/i)).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ ok: true, message: 'Correo entregado exitosamente a Resend.' })
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Enviar al Prospecto/i }));

    await waitFor(() => {
      const llamada = fetchMock.mock.calls.find((c) => String(c[0]).includes('/send-email'));
      expect(llamada).toBeDefined();
      expect(String(llamada?.[0])).toBe('/api/admin/leads/lead-1/send-email');
      expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({
        recipient_name: 'Despacho Pérez & Asociados',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Correo entregado exitosamente a Resend.')).toBeInTheDocument();
    });
  });

  it('el envío de prueba no modifica el estatus del prospecto en base de datos', async () => {
    await renderApp();
    fetchMock.mockClear();

    const fila = screen.getByText('Despacho Pérez & Asociados').closest('tr') as HTMLElement;
    fireEvent.click(within(fila).getByRole('button', { name: /Enviar Propuesta/i }));

    const destinoPrueba = screen.getByPlaceholderText(/tu-correo@ejemplo\.com/);
    fireEvent.change(destinoPrueba, { target: { value: 'qa@arksystems.site' } });

    // El backend responde con el lead actualizado, pero por ser envío de prueba no debe aplicarse
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ok: true,
        message: 'Correo de prueba entregado.',
        lead: lead({ id: 'lead-1', status: 'Mail_enviado_191026' }),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /Enviar Correo de Prueba/i }));

    await waitFor(() => {
      const llamada = fetchMock.mock.calls.find((c) => String(c[0]).includes('/send-email'));
      expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({
        recipient_name: 'Despacho Pérez & Asociados',
        test_email: 'qa@arksystems.site',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Correo de prueba entregado.')).toBeInTheDocument();
    });

    // El estatus original se conserva en el directorio
    const selector = within(
      screen.getByText('Despacho Pérez & Asociados').closest('tr') as HTMLElement
    ).getByRole('combobox');
    expect(selector).toHaveValue('Nuevo');
  });

  it('muestra el error cuando Resend rechaza el envío', async () => {
    await renderApp();
    fetchMock.mockClear();

    const fila = screen.getByText('Despacho Pérez & Asociados').closest('tr') as HTMLElement;
    fireEvent.click(within(fila).getByRole('button', { name: /Enviar Propuesta/i }));

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ ok: false, error: 'Resend API key inválida' }, false, 502)
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Enviar al Prospecto/i }));

    await waitFor(() => {
      expect(screen.getByText('Resend API key inválida')).toBeInTheDocument();
    });
  });

  it('exporta el directorio a CSV con BOM UTF-8', async () => {
    await renderApp();

    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blob = createObjectURLMock.mock.calls[0]?.[0] as Blob;
    expect(blob).toBeInstanceOf(Blob);

    // `Blob.text()` elimina el BOM por especificación, por eso se leen los bytes crudos
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);

    const contenido = new TextDecoder('utf-8').decode(bytes);
    expect(contenido).toContain('"ID","Web","WhatsApp","Email","Contacto"');
    expect(contenido).toContain('"Despacho Pérez & Asociados"');
    expect(contenido).toContain('"5219991234567"');

    // El archivo se descarga con el nombre conventionado por fecha
    expect(anclasDescargadas).toHaveLength(1);
    expect(anclasDescargadas[0]!.download).toMatch(/^leads-ark-tools-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
