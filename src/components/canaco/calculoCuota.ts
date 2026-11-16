/**
 * CANACO SERVYTUR MÉRIDA — Motor Determinista de Cuotas de Afiliación & SIEM
 *
 * Determina el estrato comercial usado por el prototipo y calcula sus importes de referencia.
 */

import type { EstratoEmpresa, SectorEconomico, CotizacionAfiliacion } from './types';

/**
 * Determina el estrato usando los rangos que utiliza esta cotización.
 */
export function determinarEstrato(numEmpleados: number): EstratoEmpresa {
  if (numEmpleados <= 10) return 'micro';
  if (numEmpleados <= 30) return 'pequena';
  if (numEmpleados <= 100) return 'mediana';
  return 'grande';
}

/**
 * Calcula los importes de referencia del prototipo para SIEM y membresía.
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
    'Importes de referencia sujetos a confirmación por CANACO',
    'Acceso al portal y sus herramientas sujeto a las condiciones aplicables',
    'Folio de Integridad para referencia interna; no es una constancia NOM-151',
    'Contacto con CANACO para confirmar los requisitos y beneficios vigentes',
  ];

  if (estrato === 'mediana' || estrato === 'grande') {
    beneficios.push('Consulta con CANACO si hay servicios adicionales disponibles para tu estrato');
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

export function generarFolioIntegridad(folioSiem: string): string {
  return `CANACO-FI-${folioSiem}`;
}

export function extraerNumEmpleados(notas: string | null | undefined): number {
  const match =
    notas?.match(/Empleados:\s*(\d+)/i) ?? notas?.match(/Estrato:\s*[A-Z]+\s*\((\d+)\s*emp\.?\)/i);
  const numEmpleados = match?.[1] ? Number(match[1]) : 0;
  return Number.isInteger(numEmpleados) && numEmpleados > 0 ? numEmpleados : 0;
}
