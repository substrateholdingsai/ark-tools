/**
 * ARK TOOLS — Test de Integración y UI del Balance General Comparativo
 *
 * Cubre el flujo completo de la Herramienta #15: ingesta de balanza CSV,
 * ecuación contable A=P+C, tabla analítica con AH/AV y exportación CSV con BOM.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { CalculadoraBalance } from './CalculadoraBalance';

const CABECERA = 'codigo,nombre,naturaleza,montoActual,montoAnterior,rubro';

/** Balanza que CUADRA: Activo 100,000 = Pasivo 60,000 + Patrimonio 40,000. */
const BALANZA_CUADRADA = [
  CABECERA,
  '1121,Caja,Deudora,50000,40000,Activo Corriente',
  '1122,Cuentas por Cobrar,Deudora,50000,30000,Activo Corriente',
  '2101,Proveedores,Acreedora,60000,40000,Pasivo Corriente',
  '3101,Capital Social,Acreedora,40000,30000,Patrimonio',
].join('\n');

/** Misma balanza con el capital recortado: Activo 100,000 vs P+P 90,000. */
const BALANZA_DESCUADRADA = [
  CABECERA,
  '1121,Caja,Deudora,50000,40000,Activo Corriente',
  '1122,Cuentas por Cobrar,Deudora,50000,30000,Activo Corriente',
  '2101,Proveedores,Acreedora,60000,40000,Pasivo Corriente',
  '3101,Capital Social,Acreedora,30000,30000,Patrimonio',
].join('\n');

function archivoBalanza(contenido: string): File {
  return new File([contenido], 'balanza.csv', { type: 'text/csv' });
}

let createObjectURLMock: ReturnType<typeof vi.fn>;
let anclasDescargadas: HTMLAnchorElement[];

beforeEach(() => {
  createObjectURLMock = vi.fn(() => 'blob:mock-url');
  (URL as unknown as Record<string, unknown>).createObjectURL = createObjectURLMock;
  (URL as unknown as Record<string, unknown>).revokeObjectURL = vi.fn();

  // Se intercepta el clic del ancla de descarga para evitar la navegación de jsdom
  // y, de paso, poder verificar el nombre del archivo generado.
  anclasDescargadas = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    anclasDescargadas.push(this);
  });
});

afterEach(() => {
  delete (URL as unknown as Record<string, unknown>).createObjectURL;
  delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
});

/** Simula la selección del archivo de balanza en el input[type=file]. */
async function cargarBalanza(contenido: string) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).not.toBeNull();
  fireEvent.change(input, { target: { files: [archivoBalanza(contenido)] } });
}

function filaDe(nombreCuenta: string): HTMLElement {
  return screen.getByText(nombreCuenta).closest('tr') as HTMLElement;
}

describe('CalculadoraBalance (src/tools/balance-general/CalculadoraBalance.tsx)', () => {
  it('renderiza el encabezado, el badge de Herramienta #15 y el banner de modo libre', () => {
    render(<CalculadoraBalance />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Balance General · Análisis Horizontal\/Vertical/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/Herramienta #15 · Blindaje Patrimonial/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingesta masiva CSV\/Excel, validación A=P\+C/i)).toBeInTheDocument();

    // Sin expediente activo el banner opera en modo libre
    expect(screen.getByText(/Modo libre:/i)).toBeInTheDocument();

    // Antes de cargar un archivo no hay resultados ni botones de exportación
    expect(screen.queryByText('Ecuación Contable')).toBeNull();
    expect(screen.queryByRole('button', { name: /CSV con BOM UTF-8/i })).toBeNull();
  });

  it('ejecuta onBack al hacer clic en el botón de regreso', () => {
    const handleBack = vi.fn();
    render(<CalculadoraBalance onBack={handleBack} />);

    fireEvent.click(screen.getByRole('button', { name: /Volver al dashboard/i }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('permite modificar los ejercicios actual y anterior', () => {
    render(<CalculadoraBalance />);

    const actual = screen.getByPlaceholderText('Ejercicio Actual (ej. 2026)');
    const anterior = screen.getByPlaceholderText('Ejercicio Anterior (ej. 2025)');

    expect(actual).toHaveValue('2026');
    expect(anterior).toHaveValue('2025');

    fireEvent.change(actual, { target: { value: '2027' } });
    expect(screen.getByPlaceholderText('Ejercicio Actual (ej. 2026)')).toHaveValue('2027');
    expect(screen.getByPlaceholderText('Ejercicio Anterior (ej. 2025)')).toHaveValue('2025');
  });

  it('procesa la balanza y valida la ecuación contable A=P+C como CUADRADO', async () => {
    render(<CalculadoraBalance />);
    await cargarBalanza(BALANZA_CUADRADA);

    await waitFor(() => {
      expect(screen.getByText('Ecuación Contable')).toBeInTheDocument();
    });

    expect(screen.getByText('Activo = Pasivo + Patrimonio')).toBeInTheDocument();
    expect(screen.getByText('CUADRADO')).toBeInTheDocument();
    expect(screen.queryByText('NO CUADRADO')).toBeNull();

    // Totales: Activo 100,000 · Pasivo 60,000 · Patrimonio 40,000 · P+P 100,000 · Dif 0.00
    // (el resumen se compone de varios nodos de texto, por eso se inspecciona el textContent)
    expect(document.body.textContent).toContain('A=$100000.00 · P+P=$100000.00 · Dif=$0.00');
    expect(screen.getAllByText('$100,000.00')).toHaveLength(2);
  });

  it('marca NO CUADRADO cuando la ecuación contable no se cumple', async () => {
    render(<CalculadoraBalance />);
    await cargarBalanza(BALANZA_DESCUADRADA);

    await waitFor(() => {
      expect(screen.getByText('Ecuación Contable')).toBeInTheDocument();
    });

    expect(screen.getByText('NO CUADRADO')).toBeInTheDocument();
    expect(screen.queryByText('CUADRADO')).toBeNull();
    expect(document.body.textContent).toContain('Dif=$10000.00');
  });

  it('renderiza la tabla analítica con AH % y AV % por cuenta', async () => {
    render(<CalculadoraBalance />);
    await cargarBalanza(BALANZA_CUADRADA);

    await waitFor(() => {
      expect(screen.getByText('Cuentas por Cobrar')).toBeInTheDocument();
    });

    expect(screen.getByText('Código')).toBeInTheDocument();
    expect(screen.getByText('Monto BG (Actual)')).toBeInTheDocument();
    expect(screen.getByText('Monto LY (Anterior)')).toBeInTheDocument();
    expect(screen.getByText('AH %')).toBeInTheDocument();
    expect(screen.getByText('AV % (Actual)')).toBeInTheDocument();

    // Caja: 50,000 vs 40,000 → AH 25.00% · AV actual 50.00% · AV anterior 40.00%
    const caja = filaDe('Caja');
    expect(within(caja).getByText('25.00%')).toBeInTheDocument();
    expect(within(caja).getByText('50.00%')).toBeInTheDocument();
    expect(within(caja).getByText('40.00%')).toBeInTheDocument();

    // Cuentas por Cobrar: 50,000 vs 30,000 → AH 66.67% · AV actual 50.00%
    const cuentas = filaDe('Cuentas por Cobrar');
    expect(within(cuentas).getByText('66.67%')).toBeInTheDocument();

    // Proveedores: 60,000 vs 40,000 → AH 50.00% · AV 60.00%
    const proveedores = filaDe('Proveedores');
    expect(within(proveedores).getByText('60.00%')).toBeInTheDocument();

    // Composición patrimonial
    expect(screen.getByText('Composición Patrimonial')).toBeInTheDocument();
    expect(screen.getByText('Activo Corriente')).toBeInTheDocument();
    expect(screen.getByText('Activo No Corriente')).toBeInTheDocument();
    expect(screen.getAllByText('Patrimonio').length).toBeGreaterThan(0);
  });

  it('exporta el análisis a CSV con BOM UTF-8 y encabezados de AH/AV', async () => {
    render(<CalculadoraBalance />);
    await cargarBalanza(BALANZA_CUADRADA);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /CSV con BOM UTF-8/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /CSV con BOM UTF-8/i }));

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blob = createObjectURLMock.mock.calls[0]?.[0] as Blob;
    expect(blob).toBeInstanceOf(Blob);

    // `Blob.text()` elimina el BOM por especificación, por eso se leen los bytes crudos
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);

    const contenido = new TextDecoder('utf-8').decode(bytes);
    expect(contenido).toContain(
      'codigo,nombre,montoActual,montoAnterior,variacionAbsoluta,variacionPorcentual,avActual,avAnterior'
    );
    expect(contenido).toContain('"Cuentas por Cobrar"');
    expect(contenido).toContain('66.67');

    // El archivo se descarga con el nombre conventionado por ejercicios
    expect(anclasDescargadas).toHaveLength(1);
    expect(anclasDescargadas[0]!.download).toBe('balance_general_2026_vs_2025.csv');
  });
});
