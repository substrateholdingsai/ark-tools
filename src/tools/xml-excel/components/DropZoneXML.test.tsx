import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DropZoneXML } from './DropZoneXML';

function seleccionarArchivos(container: HTMLElement, archivos: File[]): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('No se encontró el selector de archivos XML');
  }
  Object.defineProperty(input, 'files', { configurable: true, value: archivos });
  fireEvent.change(input);
  return input;
}

describe('DropZoneXML size limits', () => {
  it('omits oversized XMLs while processing the remaining files', () => {
    const onFilesSelected = vi.fn();
    const onFilesRejected = vi.fn();
    const { container, getByText } = render(
      <DropZoneXML
        onFilesSelected={onFilesSelected}
        onFilesRejected={onFilesRejected}
        totalCargados={0}
        maxFileSizeBytes={5}
        maxFileSizeLabel="5 bytes"
      />
    );
    const accepted = new File(['12345'], 'limite.xml', { type: 'text/xml' });
    const rejected = new File(['123456'], 'grande.xml', { type: 'text/xml' });

    seleccionarArchivos(container, [accepted, rejected]);

    expect(onFilesSelected).toHaveBeenCalledWith([accepted]);
    expect(onFilesRejected).toHaveBeenCalledWith([rejected]);
    expect(getByText(/Archivo mayor a 5 bytes: grande\.xml/)).toBeTruthy();
  });

  it('preserves the shared-component behavior when no per-file limit is provided', () => {
    const onFilesSelected = vi.fn();
    const onFilesRejected = vi.fn();
    const { container } = render(
      <DropZoneXML
        onFilesSelected={onFilesSelected}
        onFilesRejected={onFilesRejected}
        totalCargados={0}
      />
    );
    const largeFile = new File(['123456'], 'grande.xml', { type: 'text/xml' });

    seleccionarArchivos(container, [largeFile]);

    expect(onFilesSelected).toHaveBeenCalledWith([largeFile]);
    expect(onFilesRejected).not.toHaveBeenCalled();
  });

  it('enforces the existing 200-file cap', () => {
    const onFilesSelected = vi.fn();
    const { container, getByText } = render(
      <DropZoneXML onFilesSelected={onFilesSelected} totalCargados={0} />
    );
    const archivos = Array.from(
      { length: 201 },
      (_value, index) => new File(['<cfdi/>'], `archivo-${index}.xml`, { type: 'text/xml' })
    );

    seleccionarArchivos(container, archivos);

    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(getByText(/Límite superado: puedes cargar hasta 200 archivos/)).toBeTruthy();
  });
});
