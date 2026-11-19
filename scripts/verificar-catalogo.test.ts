import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ESTADOS } from '../src/tools/isn/data/estados';
import {
  escaneearHardcodesIsn,
  validarIsnYucatan,
  validarRecargosYucatan2026,
} from '../verificar-catalogo';

const archivosCreados: string[] = [];

afterEach(() => {
  for (const dir of archivosCreados) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignorar
    }
  }
  archivosCreados.length = 0;
});

describe('verify:catalogo — validación ISN Yucatán', () => {
  it('estados.ts declara las tasas ISN Yucatán esperadas (sin errores)', () => {
    const errores = validarIsnYucatan(ESTADOS);
    expect(errores).toEqual([]);
  });

  it('recargos Yucatán conservan tasa 2.07% y fuente oficial del Artículo 56', () => {
    expect(validarRecargosYucatan2026()).toEqual([]);
  });
});

describe('verify:catalogo — detección de hardcodes ISN', () => {
  it('no encuentra hardcodes ISN en src/tools del estado actual (post-Fase 1)', () => {
    const matches = escaneearHardcodesIsn(path.resolve(process.cwd(), 'src/tools'));
    expect(matches).toEqual([]);
  });

  it('detecta un literal 3.75 inyectado en un archivo de prueba (fixture)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-catalogo-fixture-'));
    archivosCreados.push(dir);
    fs.writeFileSync(path.join(dir, 'hardcode.ts'), `export const TASA = 3.75;\n`);
    const matches = escaneearHardcodesIsn(dir);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]!.coincidencia).toBe('3.75');
    expect(matches[0]!.archivo).toContain('hardcode.ts');
    expect(matches[0]!.linea).toBe(1);
  });

  it('no encuentra hardcodes en un directorio limpio (fixture sin hardcode)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-catalogo-clean-'));
    archivosCreados.push(dir);
    fs.writeFileSync(path.join(dir, 'limpio.ts'), `export const TASA = 2.0;\n`);
    const matches = escaneearHardcodesIsn(dir);
    expect(matches).toEqual([]);
  });

  it('detecta un hardcode de tasa ISN inyectado en un archivo estados.ts (fixture)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-catalogo-estados-'));
    archivosCreados.push(dir);
    fs.writeFileSync(
      path.join(dir, 'estados.ts'),
      "export const YUC = { id: 'YUC', tasa: 3.75, tasasPorEjercicio: { 2026: { general: { tasaBruta: 3.75 } } } };\n"
    );
    const matches = escaneearHardcodesIsn(dir);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m) => m.coincidencia === '3.75')).toBe(true);
    expect(matches.some((m) => m.archivo.endsWith('estados.ts'))).toBe(true);
  });
});
