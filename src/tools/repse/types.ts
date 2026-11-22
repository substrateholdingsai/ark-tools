/**
 * ARK LEDGER — Tool 23: REPSE Tracker
 * Registro Público de Contratistas de Servicios Especializados u Obras Especializadas
 * LFT Arts. 13, 15; Acuerdo DOF 24/05/2021 (mod. 21/02/2024); Art. 1004-C LFT
 */

export type EstatusRepse = 'activo' | 'en_renovacion' | 'suspendido' | 'vencido';
export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'critico';

export interface ProveedorRepse {
  rfc: string;
  razonSocial: string;
  actividadRepse: string;
  folioRepse: string;
  vigenciaRepse: string; // YYYY-MM-DD
  estatusRepse: EstatusRepse;
  nivelRiesgo: NivelRiesgo;
  ultimaVerificacion: string; // YYYY-MM-DD
  esEjemplo?: boolean;
}

export interface AlertaVigencia {
  total: number;
  activos: number;
  enRenovacion: number;
  suspendidos: number;
  vencidos: number;
  expiran30Dias: number;
  expiran60Dias: number;
  expiran90Dias: number;
}

export interface ProveedorFormData {
  rfc: string;
  razonSocial: string;
  actividadRepse: string;
  folioRepse: string;
  vigenciaRepse: string;
  estatusRepse: EstatusRepse;
  ultimaVerificacion: string;
}

export const ESTATUS_REPSE_OPTIONS: { value: EstatusRepse; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'en_renovacion', label: 'En Renovación' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'vencido', label: 'Vencido' },
];

export const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/;
export const RFC_GENERICOS = ['XAXX010101000', 'XEXX010101000'];

export const SEED_PROVEEDORES: ProveedorRepse[] = [
  {
    rfc: 'LTC200101AB1',
    razonSocial: 'Logística y Transporte del Centro S.A. de C.V.',
    actividadRepse: 'Transporte de carga y logística de distribución',
    folioRepse: 'REPSE-2021-001234',
    vigenciaRepse: '2027-03-15',
    estatusRepse: 'activo',
    nivelRiesgo: 'bajo',
    ultimaVerificacion: '2026-01-10',
    esEjemplo: true,
  },
  {
    rfc: 'SPV200202CD2',
    razonSocial: 'Seguridad Privada e Industrial Vanguardia S.A. de C.V.',
    actividadRepse: 'Servicios de seguridad y vigilancia privada',
    folioRepse: 'REPSE-2021-002345',
    vigenciaRepse: '2026-12-20',
    estatusRepse: 'en_renovacion',
    nivelRiesgo: 'alto',
    ultimaVerificacion: '2026-10-05',
    esEjemplo: true,
  },
  {
    rfc: 'SIL200303EF3',
    razonSocial: 'Servicios Integrales de Limpieza S.A. de C.V.',
    actividadRepse: 'Limpieza y mantenimiento de instalaciones',
    folioRepse: 'REPSE-2022-003456',
    vigenciaRepse: '2026-08-30',
    estatusRepse: 'vencido',
    nivelRiesgo: 'critico',
    ultimaVerificacion: '2026-07-01',
    esEjemplo: true,
  },
  {
    rfc: 'TSO200404GH4',
    razonSocial: 'Tecnología y Soporte Operativo TI S.A. de C.V.',
    actividadRepse: 'Soporte técnico y administración de infraestructura TI',
    folioRepse: 'REPSE-2022-004567',
    vigenciaRepse: '2027-06-10',
    estatusRepse: 'activo',
    nivelRiesgo: 'bajo',
    ultimaVerificacion: '2026-02-15',
    esEjemplo: true,
  },
  {
    rfc: 'MEN200505IJ5',
    razonSocial: 'Mantenimiento Electromecánico del Norte S.A. de C.V.',
    actividadRepse: 'Mantenimiento industrial electromecánico',
    folioRepse: 'REPSE-2021-005678',
    vigenciaRepse: '2026-11-05',
    estatusRepse: 'suspendido',
    nivelRiesgo: 'critico',
    ultimaVerificacion: '2026-09-20',
    esEjemplo: true,
  },
  {
    rfc: 'CIS200606KL6',
    razonSocial: 'Consultores en Ingeniería y Supervisión de Obra S.A. de C.V.',
    actividadRepse: 'Supervisión y consultoría de obra civil',
    folioRepse: 'REPSE-2023-006789',
    vigenciaRepse: '2026-12-01',
    estatusRepse: 'en_renovacion',
    nivelRiesgo: 'alto',
    ultimaVerificacion: '2026-10-15',
    esEjemplo: true,
  },
];

/**
 * Valida formato RFC (persona física o moral).
 * Acepta RFC genéricos XAXX010101000 y XEXX010101000.
 */
export function validarRfc(rfc: string): boolean {
  const rfcUpper = rfc.trim().toUpperCase();
  if (RFC_GENERICOS.includes(rfcUpper)) return true;
  return RFC_REGEX.test(rfcUpper);
}

/**
 * Valida fecha en formato YYYY-MM-DD.
 */
export function validarFecha(fecha: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) return false;
  const date = new Date(fecha + 'T00:00:00');
  return !isNaN(date.getTime());
}
