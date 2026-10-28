/**
 * CANACO SERVYTUR MÉRIDA — Motor Determinista de Cuotas de Afiliación & SIEM
 *
 * Determina el estrato comercial conforme a la Ley de Cámaras Empresariales
 * y calcula el desglose anual oficial (Registro SIEM + Cuota Institucional).
 */

import type { EstratoEmpresa, SectorEconomico, CotizacionAfiliacion } from './types';

/**
 * Determina el estrato conforme a la estratificación oficial de la Secretaría de Economía.
 */
export function determinarEstrato(numEmpleados: number): EstratoEmpresa {
  if (numEmpleados <= 10) return 'micro';
  if (numEmpleados <= 30) return 'pequena';
  if (numEmpleados <= 100) return 'mediana';
  return 'grande';
}

/**
 * Calcula la cuota anual oficial de SIEM y membresía institucional.
 */
export function calcularCuotaAfiliacion(
  numEmpleados: number,
  sector: SectorEconomico = 'comercio'
): CotizacionAfiliacion {
  const estrato = determinarEstrato(numEmpleados);

  let cuotaSiem = 200;
  let cuotaMembresia = 1800;

  switch (estrato) {
    case 'micro':
      cuotaSiem = 200;
      cuotaMembresia = 1800;
      break;
    case 'pequena':
      cuotaSiem = 500;
      cuotaMembresia = 3200;
      break;
    case 'mediana':
      cuotaSiem = 1000;
      cuotaMembresia = 5500;
      break;
    case 'grande':
      cuotaSiem = 2200;
      cuotaMembresia = 9800;
      break;
  }

  const totalAnual = cuotaSiem + cuotaMembresia;

  const beneficios = [
    'Registro oficial en el padrón nacional SIEM ante Secretaría de Economía',
    'Acceso sin límite a la Suite Fiscal HENEQUÉN (RESICO, Nómina, Finiquitos, ISN)',
    'Constancia Digital de Afiliación con Código QR y Sello Criptográfico',
    'Asesoría y representación institucional ante autoridades federales y estatales',
    'Ventanilla de gestión de quejas y mediación mercantil',
    'Presencia en el Directorio Comercial Oficial de CANACO SERVYTUR Mérida',
  ];

  if (estrato === 'mediana' || estrato === 'grande') {
    beneficios.push(
      'Ventanilla prioritaria en trámites municipales de licencias de funcionamiento'
    );
    beneficios.push('Voto activo en asambleas generales y comisiones sectoriales');
  }

  return {
    estrato,
    sector,
    numEmpleados,
    cuotaSiem,
    cuotaMembresia,
    totalAnual,
    beneficios,
  };
}

/**
 * Genera un Folio Institucional SIEM para el socio.
 */
export function generarFolioSiem(rfc: string, estrato: EstratoEmpresa): string {
  const rfcClean = (rfc || 'GEN010101XYZ').trim().toUpperCase().slice(0, 4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const estratoCode = estrato.slice(0, 3).toUpperCase();
  return `SIEM-MID-2026-${rfcClean}-${estratoCode}-${randomSuffix}`;
}
