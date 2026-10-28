/**
 * CANACO SERVYTUR MÉRIDA — Tipos de la Ventanilla de Afiliación & Socios
 *
 * Contratos de datos para el cálculo de cuotas SIEM, membresía institucional
 * y emisión de constancias de acreditación comercial en Yucatán.
 */

export type EstratoEmpresa = 'micro' | 'pequena' | 'mediana' | 'grande';
export type SectorEconomico = 'comercio' | 'servicios' | 'turismo';

export interface CotizacionAfiliacion {
  estrato: EstratoEmpresa;
  sector: SectorEconomico;
  numEmpleados: number;
  /** Cuota obligatoria del Registro SIEM (Ley de Cámaras) */
  cuotaSiem: number;
  /** Cuota de Afiliación Anual a CANACO SERVYTUR Mérida */
  cuotaMembresia: number;
  /** Total a liquidar */
  totalAnual: number;
  /** Beneficios fiscales y comerciales incluidos */
  beneficios: string[];
}

export interface SocioCanacoRegistro {
  folioSiem: string;
  razonSocial: string;
  nombreComercial: string;
  rfc: string;
  sector: SectorEconomico;
  estrato: EstratoEmpresa;
  numEmpleados: number;
  direccion: {
    calle: string;
    colonia: string;
    codigoPostal: string;
    municipio: string;
    ciudad: string;
  };
  contacto: {
    nombre: string;
    email: string;
    telefono: string;
  };
  fechaAfiliacion: string;
  fechaVigencia: string;
  estatus: 'activo' | 'pendiente_pago' | 'renovacion';
  montoPagado: number;
  metodoPago: 'tarjeta' | 'spei' | 'clip';
  cfdiRequerido: boolean;
  selloDigitalSha256: string;
}
