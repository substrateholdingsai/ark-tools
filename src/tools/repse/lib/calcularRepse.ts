/**
 * ARK LEDGER — Tool 23: REPSE Tracker — Lógica de Negocio
 * Cálculo de riesgo, validación RFC, alertas de vigencia
 */

import {
  ProveedorRepse,
  ProveedorFormData,
  AlertaVigencia,
  NivelRiesgo,
  EstatusRepse,
  RFC_REGEX,
  RFC_GENERICOS,
} from '../types';

/**
 * Calcula el nivel de riesgo derivado del estatus y la vigencia.
 * Reglas (documentadas en la herramienta):
 * - Suspendido o Vencido = Crítico
 * - En Renovación = Alto
 * - Vigencia dentro de 30 días = Alto
 * - Vigencia dentro de 90 días = Medio
 * - En otro caso = Bajo
 */
export function calcularNivelRiesgo(estatus: EstatusRepse, vigencia: string): NivelRiesgo {
  if (estatus === 'suspendido' || estatus === 'vencido') {
    return 'critico';
  }
  if (estatus === 'en_renovacion') {
    return 'alto';
  }
  const hoy = new Date();
  // Use UTC midnight for date-only comparison to avoid timezone issues
  const hoyMidnight = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const [yearStr, monthStr, dayStr] = vigencia.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const vig = Date.UTC(year, month - 1, day);
  const diffMs = vig - hoyMidnight;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias <= 30) {
    return 'alto';
  }
  if (diffDias <= 90) {
    return 'medio';
  }
  return 'bajo';
}

/**
 * Deriva el estatus a partir de la vigencia y el estatus actual.
 * Si la vigencia ya pasó y el estatus no es suspendido/vencido, pasa a vencido.
 */
export function derivarEstatus(estatusActual: EstatusRepse, vigencia: string): EstatusRepse {
  if (estatusActual === 'suspendido' || estatusActual === 'vencido') {
    return estatusActual;
  }
  const hoy = new Date();
  const hoyMidnight = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const [yearStr, monthStr, dayStr] = vigencia.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const vig = Date.UTC(year, month - 1, day);
  if (vig < hoyMidnight) {
    return 'vencido';
  }
  return estatusActual;
}

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
 * Normaliza RFC a mayúsculas y sin espacios.
 */
export function normalizarRfc(rfc: string): string {
  return rfc.trim().toUpperCase();
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

/**
 * Convierte datos de formulario a ProveedorRepse con riesgo calculado.
 */
export function formDataToProveedor(data: ProveedorFormData): ProveedorRepse {
  const estatus = derivarEstatus(data.estatusRepse, data.vigenciaRepse);
  return {
    rfc: normalizarRfc(data.rfc),
    razonSocial: data.razonSocial.trim(),
    actividadRepse: data.actividadRepse.trim(),
    folioRepse: data.folioRepse.trim().toUpperCase(),
    vigenciaRepse: data.vigenciaRepse,
    estatusRepse: estatus,
    nivelRiesgo: calcularNivelRiesgo(estatus, data.vigenciaRepse),
    ultimaVerificacion: data.ultimaVerificacion,
  };
}

/**
 * Genera alertas de vigencia para el resumen superior.
 */
export function generarAlertas(proveedores: ProveedorRepse[]): AlertaVigencia {
  const hoy = new Date();
  const hoyMidnight = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const alertas: AlertaVigencia = {
    total: proveedores.length,
    activos: 0,
    enRenovacion: 0,
    suspendidos: 0,
    vencidos: 0,
    expiran30Dias: 0,
    expiran60Dias: 0,
    expiran90Dias: 0,
  };

  for (const p of proveedores) {
    switch (p.estatusRepse) {
      case 'activo':
        alertas.activos++;
        break;
      case 'en_renovacion':
        alertas.enRenovacion++;
        break;
      case 'suspendido':
        alertas.suspendidos++;
        break;
      case 'vencido':
        alertas.vencidos++;
        break;
    }

    const [yearStr, monthStr, dayStr] = p.vigenciaRepse.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const vig = Date.UTC(year, month - 1, day);
    const diffMs = vig - hoyMidnight;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias <= 30 && diffDias >= 0) alertas.expiran30Dias++;
    if (diffDias <= 60 && diffDias >= 0) alertas.expiran60Dias++;
    if (diffDias <= 90 && diffDias >= 0) alertas.expiran90Dias++;
  }

  return alertas;
}

/**
 * Exporta a CSV con BOM UTF-8 para compatibilidad con Excel.
 */
export function exportarCsv(proveedores: ProveedorRepse[]): string {
  const BOM = '\uFEFF';
  const headers = [
    'RFC',
    'Razón Social',
    'Actividad REPSE Registrada',
    'Folio REPSE',
    'Vigencia REPSE',
    'Estatus REPSE',
    'Nivel de Riesgo',
    'Última Verificación',
    'Es Ejemplo',
  ];

  const rows = proveedores.map((p) => [
    p.rfc,
    p.razonSocial,
    p.actividadRepse,
    p.folioRepse,
    p.vigenciaRepse,
    p.estatusRepse.toUpperCase(),
    p.nivelRiesgo.toUpperCase(),
    p.ultimaVerificacion,
    p.esEjemplo ? 'SÍ' : 'NO',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');

  return BOM + csvContent;
}

/**
 * Dispara la descarga de un archivo en el navegador.
 */
export function descargarArchivo(
  contenido: string,
  nombreArchivo: string,
  mimeType = 'text/csv;charset=utf-8;'
): void {
  const blob = new Blob([contenido], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta a Excel (.xlsx) usando SheetJS.
 */
export async function exportarExcel(proveedores: ProveedorRepse[]): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const data = proveedores.map((p) => ({
    RFC: p.rfc,
    'Razón Social': p.razonSocial,
    'Actividad REPSE Registrada': p.actividadRepse,
    'Folio REPSE': p.folioRepse,
    'Vigencia REPSE': p.vigenciaRepse,
    'Estatus REPSE': p.estatusRepse.toUpperCase(),
    'Nivel de Riesgo': p.nivelRiesgo.toUpperCase(),
    'Última Verificación': p.ultimaVerificacion,
    'Es Ejemplo': p.esEjemplo ? 'SÍ' : 'NO',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Proveedores REPSE');

  const fileName = `REPSE_Proveedores_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Genera el bloque de cita legal para la herramienta.
 */
export const CITA_LEGAL_REPSE = `
Fundamento legal:
• Ley Federal del Trabajo (LFT), Arts. 13 y 15 — Reforma en materia de subcontratación (DOF 23/04/2021).
• Acuerdo por el que se dan a conocer las disposiciones de carácter general para el registro de personas físicas o morales que presten servicios especializados o ejecuten obras especializadas (DOF 24/05/2021, mod. DOF 21/02/2024): Arts. 13 (vigencia 3 años), 16 (renovación 3 meses antes), 18 (contratos deben incluir folio y vigencia).
• LFT Art. 1004-C — Multa de 2,000 a 50,000 UMAs por subcontratar sin registro REPSE.
• CFF Art. 29, fracc. IV — Requisito de comprobantes fiscales para deducibilidad; pagos a contratistas sin REPSE vigente ponen en riesgo la deducción (Art. 27 LISR).
`.trim();
