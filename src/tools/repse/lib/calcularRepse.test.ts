import { describe, it, expect } from 'vitest';
import {
  calcularNivelRiesgo,
  derivarEstatus,
  validarRfc,
  normalizarRfc,
  validarFecha,
  formDataToProveedor,
  generarAlertas,
  exportarCsv,
} from './calcularRepse';
import type { ProveedorRepse, ProveedorFormData } from '../types';

describe('REPSE Tracker — Lógica de riesgo y validaciones', () => {
  describe('calcularNivelRiesgo', () => {
    it('Suspendido -> Crítico', () => {
      expect(calcularNivelRiesgo('suspendido', '2027-12-31')).toBe('critico');
    });

    it('Vencido -> Crítico', () => {
      expect(calcularNivelRiesgo('vencido', '2027-12-31')).toBe('critico');
    });

    it('En Renovación -> Alto', () => {
      expect(calcularNivelRiesgo('en_renovacion', '2027-12-31')).toBe('alto');
    });

    it('Vigencia dentro de 30 días -> Alto', () => {
      const hoy = new Date();
      const en15Dias = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      expect(calcularNivelRiesgo('activo', en15Dias)).toBe('alto');
    });

    it('Vigencia día 30 exacto -> Alto (límite inclusivo)', () => {
      const hoy = new Date();
      const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      expect(calcularNivelRiesgo('activo', en30Dias)).toBe('alto');
    });

    it('Vigencia día 31 -> Medio', () => {
      const hoy = new Date();
      const en31Dias = new Date(hoy.getTime() + 31 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      expect(calcularNivelRiesgo('activo', en31Dias)).toBe('medio');
    });

    it('Vigencia dentro de 90 días -> Medio', () => {
      const hoy = new Date();
      const en60Dias = new Date(hoy.getTime() + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      expect(calcularNivelRiesgo('activo', en60Dias)).toBe('medio');
    });

    it('Vigencia día 90 exacto -> Medio (límite inclusivo)', () => {
      const hoy = new Date();
      const en90Dias = new Date(hoy.getTime() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      expect(calcularNivelRiesgo('activo', en90Dias)).toBe('medio');
    });

    it('Vigencia día 91 -> Bajo', () => {
      const hoy = new Date();
      const en91Dias = new Date(hoy.getTime() + 91 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      expect(calcularNivelRiesgo('activo', en91Dias)).toBe('bajo');
    });

    it('Vigencia lejana -> Bajo', () => {
      expect(calcularNivelRiesgo('activo', '2030-12-31')).toBe('bajo');
    });
  });

  describe('derivarEstatus', () => {
    it('Mantiene suspendido aunque vigencia sea futura', () => {
      expect(derivarEstatus('suspendido', '2030-12-31')).toBe('suspendido');
    });

    it('Mantiene vencido aunque vigencia sea futura', () => {
      expect(derivarEstatus('vencido', '2030-12-31')).toBe('vencido');
    });

    it('Activo con vigencia pasada -> Vencido', () => {
      expect(derivarEstatus('activo', '2020-01-01')).toBe('vencido');
    });

    it('En renovación con vigencia pasada -> Vencido', () => {
      expect(derivarEstatus('en_renovacion', '2020-01-01')).toBe('vencido');
    });

    it('Activo con vigencia futura -> Activo', () => {
      expect(derivarEstatus('activo', '2030-12-31')).toBe('activo');
    });
  });

  describe('validarRfc', () => {
    it('RFC persona moral válido (12 chars)', () => {
      expect(validarRfc('ABC123456AB1')).toBe(true);
    });

    it('RFC persona física válido (13 chars)', () => {
      expect(validarRfc('PEPJ850412AB1')).toBe(true);
    });

    it('RFC genérico XAXX010101000 válido', () => {
      expect(validarRfc('XAXX010101000')).toBe(true);
    });

    it('RFC genérico XEXX010101000 válido', () => {
      expect(validarRfc('XEXX010101000')).toBe(true);
    });

    it('RFC en minúsculas válido (normaliza)', () => {
      expect(validarRfc('abc123456ab1')).toBe(true);
    });

    it('RFC con espacios válido', () => {
      expect(validarRfc(' ABC123456AB1 ')).toBe(true);
    });

    it('RFC muy corto inválido', () => {
      expect(validarRfc('ABC123')).toBe(false);
    });

    it('RFC con caracteres inválidos', () => {
      expect(validarRfc('ABC123456XY!')).toBe(false);
    });

    it('RFC vacío inválido', () => {
      expect(validarRfc('')).toBe(false);
    });
  });

  describe('normalizarRfc', () => {
    it('Convierte a mayúsculas y quita espacios', () => {
      expect(normalizarRfc(' abc123456ab1 ')).toBe('ABC123456AB1');
    });
  });

  describe('validarFecha', () => {
    it('Fecha válida YYYY-MM-DD', () => {
      expect(validarFecha('2026-12-31')).toBe(true);
    });

    it('Fecha inválida (mes 13)', () => {
      expect(validarFecha('2026-13-01')).toBe(false);
    });

    it('Fecha inválida (formato incorrecto)', () => {
      expect(validarFecha('31/12/2026')).toBe(false);
    });

    it('Fecha vacía inválida', () => {
      expect(validarFecha('')).toBe(false);
    });
  });

  describe('formDataToProveedor', () => {
    const baseForm: ProveedorFormData = {
      rfc: 'ABC123456XYZ',
      razonSocial: 'Empresa de Prueba S.A. de C.V.',
      actividadRepse: 'Servicios de prueba',
      folioRepse: 'REPSE-2024-001',
      vigenciaRepse: '2027-12-31',
      estatusRepse: 'activo',
      ultimaVerificacion: '2026-01-15',
    };

    it('Calcula riesgo correctamente al crear proveedor', () => {
      const p = formDataToProveedor(baseForm);
      expect(p.nivelRiesgo).toBe('bajo');
      expect(p.estatusRepse).toBe('activo');
      expect(p.rfc).toBe('ABC123456XYZ');
    });

    it('Deriva estatus vencido si vigencia pasada', () => {
      const p = formDataToProveedor({ ...baseForm, vigenciaRepse: '2020-01-01' });
      expect(p.estatusRepse).toBe('vencido');
      expect(p.nivelRiesgo).toBe('critico');
    });
  });

  describe('generarAlertas', () => {
    const hoy = new Date();
    const en15Dias = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const en45Dias = new Date(hoy.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const en75Dias = new Date(hoy.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const en120Dias = new Date(hoy.getTime() + 120 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const pasado = new Date(hoy.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const proveedores: ProveedorRepse[] = [
      {
        rfc: 'A',
        razonSocial: 'A',
        actividadRepse: 'A',
        folioRepse: 'A',
        vigenciaRepse: en120Dias,
        estatusRepse: 'activo',
        nivelRiesgo: 'bajo',
        ultimaVerificacion: '2026-01-01',
      },
      {
        rfc: 'B',
        razonSocial: 'B',
        actividadRepse: 'B',
        folioRepse: 'B',
        vigenciaRepse: en75Dias,
        estatusRepse: 'activo',
        nivelRiesgo: 'medio',
        ultimaVerificacion: '2026-01-01',
      },
      {
        rfc: 'C',
        razonSocial: 'C',
        actividadRepse: 'C',
        folioRepse: 'C',
        vigenciaRepse: en45Dias,
        estatusRepse: 'activo',
        nivelRiesgo: 'medio',
        ultimaVerificacion: '2026-01-01',
      },
      {
        rfc: 'D',
        razonSocial: 'D',
        actividadRepse: 'D',
        folioRepse: 'D',
        vigenciaRepse: en15Dias,
        estatusRepse: 'activo',
        nivelRiesgo: 'alto',
        ultimaVerificacion: '2026-01-01',
      },
      {
        rfc: 'E',
        razonSocial: 'E',
        actividadRepse: 'E',
        folioRepse: 'E',
        vigenciaRepse: pasado,
        estatusRepse: 'vencido',
        nivelRiesgo: 'critico',
        ultimaVerificacion: '2026-01-01',
      },
      {
        rfc: 'F',
        razonSocial: 'F',
        actividadRepse: 'F',
        folioRepse: 'F',
        vigenciaRepse: en120Dias,
        estatusRepse: 'suspendido',
        nivelRiesgo: 'critico',
        ultimaVerificacion: '2026-01-01',
      },
      {
        rfc: 'G',
        razonSocial: 'G',
        actividadRepse: 'G',
        folioRepse: 'G',
        vigenciaRepse: en120Dias,
        estatusRepse: 'en_renovacion',
        nivelRiesgo: 'alto',
        ultimaVerificacion: '2026-01-01',
      },
    ];

    it('Cuenta correctamente por estatus', () => {
      const a = generarAlertas(proveedores);
      expect(a.total).toBe(7);
      expect(a.activos).toBe(4);
      expect(a.vencidos).toBe(1);
      expect(a.suspendidos).toBe(1);
      expect(a.enRenovacion).toBe(1);
    });

    it('Cuenta correctamente por días de expiración', () => {
      const a = generarAlertas(proveedores);
      expect(a.expiran30Dias).toBe(1);
      expect(a.expiran60Dias).toBe(2);
      expect(a.expiran90Dias).toBe(3);
    });
  });

  describe('exportarCsv', () => {
    const proveedores: ProveedorRepse[] = [
      {
        rfc: 'ABC123456XYZ',
        razonSocial: 'Empresa, con "comas"',
        actividadRepse: 'Actividad',
        folioRepse: 'REPSE-001',
        vigenciaRepse: '2027-12-31',
        estatusRepse: 'activo',
        nivelRiesgo: 'bajo',
        ultimaVerificacion: '2026-01-15',
        esEjemplo: true,
      },
    ];

    it('Genera CSV con BOM y escapa comillas', () => {
      const csv = exportarCsv(proveedores);
      expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM
      expect(csv).toContain('RFC,Razón Social');
      expect(csv).toContain('"Empresa, con ""comas"""');
      expect(csv).toContain('"SÍ"');
    });
  });
});
