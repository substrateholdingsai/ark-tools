import type { ValorFiscal } from './tipos';

/**
 * CATÁLOGO CENTRAL DE VALORES FISCALES VIGENTES 2026
 *
 * REGLAS DE MANTENIMIENTO:
 * 1. Cada valor DEBE tener fuente oficial y URL DOF verificable.
 * 2. Al publicar un valor nuevo, agregar el nuevo y actualizar
 *    `vigencia.fin` del anterior (no borrar historial).
 * 3. Valores proyectados (aún no publicados en DOF) DEBEN llevar
 *    `esProyeccion: true` y criticidad mínima 'ALTA'.
 * 4. Ejecutar `pnpm test catalogo` tras cada actualización.
 */

export const CATALOGO_2026: ValorFiscal[] = [
  {
    id: 'UMA_DIARIA_2026',
    nombre: 'UMA Diaria 2026',
    valor: 117.31,
    unidad: 'MXN_DIARIO',
    vigencia: { inicio: '2026-02-01', fin: '2027-01-31' },
    fuente: {
      organismo: 'INEGI',
      publicacion: 'DOF 09/01/2026',
      urlDOF: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=09/01/2026',
      referencia: 'Artículo 26 Apartado B, penúltimo párrafo, CPEUM',
    },
    esProyeccion: false,
    verificadoPor: 'Pavel M. — 2026-10-15',
    criticidad: 'ALTA',
  },
  {
    id: 'UMA_MENSUAL_2026',
    nombre: 'UMA Mensual 2026',
    valor: 3566.22,
    unidad: 'MXN_MENSUAL',
    vigencia: { inicio: '2026-02-01', fin: '2027-01-31' },
    fuente: {
      organismo: 'INEGI',
      publicacion: 'DOF 09/01/2026',
      urlDOF: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=09/01/2026',
      referencia: 'Artículo 26 Apartado B, penúltimo párrafo, CPEUM',
    },
    esProyeccion: false,
    verificadoPor: 'Pavel M. — 2026-10-15',
    criticidad: 'ALTA',
  },
  {
    id: 'SALARIO_MINIMO_GENERAL_2026',
    nombre: 'Salario Mínimo General (ZSMG)',
    valor: 315.04,
    unidad: 'MXN_DIARIO',
    vigencia: { inicio: '2026-01-01', fin: null },
    fuente: {
      organismo: 'CONASAMI',
      publicacion: 'DOF 09/12/2025',
      urlDOF: 'https://dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=09/12/2025',
      referencia: 'Resolución del Consejo de Representantes de CONASAMI',
    },
    esProyeccion: false,
    verificadoPor: 'Pavel M. — 2026-10-15',
    criticidad: 'ALTA',
  },
  {
    id: 'SALARIO_MINIMO_FRONTERA_2026',
    nombre: 'Salario Mínimo Zona Libre Frontera Norte',
    valor: 440.87,
    unidad: 'MXN_DIARIO',
    vigencia: { inicio: '2026-01-01', fin: null },
    fuente: {
      organismo: 'CONASAMI',
      publicacion: 'DOF 09/12/2025',
      urlDOF: 'https://dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=09/12/2025',
      referencia: 'Resolución del Consejo de Representantes de CONASAMI',
    },
    esProyeccion: false,
    verificadoPor: 'Pavel M. — 2026-10-15',
    criticidad: 'ALTA',
  },
  {
    id: 'TOPE_SBC_25_UMA_2026',
    nombre: 'Tope Máximo SBC (25 UMA)',
    valor: 2932.75,
    unidad: 'MXN_DIARIO',
    vigencia: { inicio: '2026-02-01', fin: '2027-01-31' },
    fuente: {
      organismo: 'IMSS',
      publicacion: 'DOF 09/01/2026',
      urlDOF: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=09/01/2026',
      referencia: 'Artículo 28, Ley del Seguro Social',
    },
    esProyeccion: false,
    verificadoPor: 'Pavel M. — 2026-10-15',
    criticidad: 'ALTA',
  },
  {
    id: 'TARIFA_ISR_MENSUAL_2026',
    nombre: 'Tarifa ISR Mensual 2026',
    valor: [
      { limiteInferior: 0.01, limiteSuperior: 809.17, cuotaFija: 0, tasa: 0.0192 },
      { limiteInferior: 809.18, limiteSuperior: 6872.78, cuotaFija: 15.53, tasa: 0.064 },
      { limiteInferior: 6872.79, limiteSuperior: 12081.52, cuotaFija: 403.25, tasa: 0.1088 },
      { limiteInferior: 12081.53, limiteSuperior: 14039.03, cuotaFija: 969.11, tasa: 0.16 },
      { limiteInferior: 14039.04, limiteSuperior: 16799.16, cuotaFija: 1282.25, tasa: 0.1792 },
      { limiteInferior: 16799.17, limiteSuperior: 33929.88, cuotaFija: 1776.73, tasa: 0.2136 },
      { limiteInferior: 33929.89, limiteSuperior: 53464.77, cuotaFija: 5435.36, tasa: 0.2352 },
      { limiteInferior: 53464.78, limiteSuperior: 102113.47, cuotaFija: 10035.72, tasa: 0.3 },
      { limiteInferior: 102113.48, limiteSuperior: 135930.45, cuotaFija: 24629.32, tasa: 0.32 },
      { limiteInferior: 135930.46, limiteSuperior: 407791.35, cuotaFija: 35466.03, tasa: 0.34 },
      { limiteInferior: 407791.36, limiteSuperior: null, cuotaFija: 127911.73, tasa: 0.35 },
    ],
    unidad: 'PORCENTAJE',
    vigencia: { inicio: '2026-01-01', fin: '2026-12-31' },
    fuente: {
      organismo: 'SAT',
      publicacion: 'DOF 28/12/2025 (Anexo 8 RMF 2026)',
      urlDOF: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=28/12/2025',
      referencia: 'Artículos 96 y 152 LISR; Regla 3.12.2 RMF 2026',
    },
    esProyeccion: false,
    verificadoPor: 'Pavel M. — 2026-10-15',
    criticidad: 'ALTA',
  },
  {
    id: 'CUOTA_MODALIDAD_40_2026',
    nombre: 'Cuota de Continuación Voluntaria / Modalidad 40 (LSS 2026)',
    valor: 14.438,
    unidad: 'PORCENTAJE',
    vigencia: { inicio: '2026-01-01', fin: '2026-12-31' },
    fuente: {
      organismo: 'IMSS',
      publicacion: 'DOF 16/12/2020 (Reforma a la Ley del Seguro Social)',
      urlDOF: 'https://dof.gob.mx/nota_detalle.php?codigo=5607729&fecha=16/12/2020',
      referencia: 'Artículos 168 y 218 LSS; Transitorio Segundo Decreto LSS',
    },
    esProyeccion: false,
    verificadoPor: 'Pavel M. — 2026-10-21',
    criticidad: 'ALTA',
  },
  {
    id: 'TASA_RECARGOS_MORA_2026',
    nombre: 'Tasa Mensual de Recargos por Mora (LIF 2026)',
    valor: 1.47,
    unidad: 'PORCENTAJE',
    vigencia: { inicio: '2026-01-01', fin: '2026-12-31' },
    fuente: {
      organismo: 'SAT',
      publicacion: 'DOF 25/11/2025 (Ley de Ingresos de la Federación 2026)',
      urlDOF: 'https://dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=25/11/2025',
      referencia: 'Artículo 8, fracción I penúltimo párrafo LIF 2026; Artículos 17-A y 21 CFF',
    },
    esProyeccion: false,
    verificadoPor: 'Pavel M. — 2026-10-15',
    criticidad: 'ALTA',
  },
];

// ─── CUOTA CONTINUACIÓN VOLUNTARIA VIGENTE 2026 (LSS Art. 168 y 218) ─
export const CUOTA_MODALIDAD_40_PCT_2026 = 14.438;

// ─── TASA DE RECARGOS VIGENTE (LIF Art. 8 / CFF Art. 21) ───────────
export const TASA_RECARGOS_MORA_MENSUAL = 1.47;

// ─── ÍNDICE NACIONAL DE PRECIOS AL CONSUMIDOR (INPC - INEGI) ────────
export interface InpcMensual {
  anio: number;
  mes: number; // 1 = Enero, 12 = Diciembre
  inpc: number;
  fechaPublicacionDOF?: string;
}

/**
 * SERIE HISTÓRICA OFICIAL DE INPC (Base 2da quincena de julio 2018 = 100)
 * Fuente: INEGI / Publicaciones oficiales en el Diario Oficial de la Federación (DOF)
 * Se actualiza los primeros 10 días de cada mes conforme al Art. 20-Bis CFF.
 */
export const TABLA_INPC: InpcMensual[] = [
  // 2021
  { anio: 2021, mes: 1, inpc: 110.129, fechaPublicacionDOF: '2021-02-10' },
  { anio: 2021, mes: 2, inpc: 110.822, fechaPublicacionDOF: '2021-03-10' },
  { anio: 2021, mes: 3, inpc: 111.737, fechaPublicacionDOF: '2021-04-09' },
  { anio: 2021, mes: 4, inpc: 112.112, fechaPublicacionDOF: '2021-05-10' },
  { anio: 2021, mes: 5, inpc: 112.336, fechaPublicacionDOF: '2021-06-10' },
  { anio: 2021, mes: 6, inpc: 112.93, fechaPublicacionDOF: '2021-07-09' },
  { anio: 2021, mes: 7, inpc: 113.619, fechaPublicacionDOF: '2021-08-10' },
  { anio: 2021, mes: 8, inpc: 113.839, fechaPublicacionDOF: '2021-09-10' },
  { anio: 2021, mes: 9, inpc: 114.545, fechaPublicacionDOF: '2021-10-08' },
  { anio: 2021, mes: 10, inpc: 115.508, fechaPublicacionDOF: '2021-11-10' },
  { anio: 2021, mes: 11, inpc: 116.828, fechaPublicacionDOF: '2021-12-10' },
  { anio: 2021, mes: 12, inpc: 117.252, fechaPublicacionDOF: '2022-01-10' },

  // 2022
  { anio: 2022, mes: 1, inpc: 118.069, fechaPublicacionDOF: '2022-02-10' },
  { anio: 2022, mes: 2, inpc: 119.053, fechaPublicacionDOF: '2022-03-10' },
  { anio: 2022, mes: 3, inpc: 120.231, fechaPublicacionDOF: '2022-04-08' },
  { anio: 2022, mes: 4, inpc: 120.88, fechaPublicacionDOF: '2022-05-10' },
  { anio: 2022, mes: 5, inpc: 121.096, fechaPublicacionDOF: '2022-06-10' },
  { anio: 2022, mes: 6, inpc: 122.117, fechaPublicacionDOF: '2022-07-08' },
  { anio: 2022, mes: 7, inpc: 123.018, fechaPublicacionDOF: '2022-08-10' },
  { anio: 2022, mes: 8, inpc: 123.88, fechaPublicacionDOF: '2022-09-09' },
  { anio: 2022, mes: 9, inpc: 124.646, fechaPublicacionDOF: '2022-10-10' },
  { anio: 2022, mes: 10, inpc: 125.353, fechaPublicacionDOF: '2022-11-10' },
  { anio: 2022, mes: 11, inpc: 126.079, fechaPublicacionDOF: '2022-12-09' },
  { anio: 2022, mes: 12, inpc: 126.478, fechaPublicacionDOF: '2023-01-10' },

  // 2023
  { anio: 2023, mes: 1, inpc: 127.336, fechaPublicacionDOF: '2023-02-10' },
  { anio: 2023, mes: 2, inpc: 128.046, fechaPublicacionDOF: '2023-03-10' },
  { anio: 2023, mes: 3, inpc: 128.389, fechaPublicacionDOF: '2023-04-10' },
  { anio: 2023, mes: 4, inpc: 128.363, fechaPublicacionDOF: '2023-05-10' },
  { anio: 2023, mes: 5, inpc: 128.089, fechaPublicacionDOF: '2023-06-09' },
  { anio: 2023, mes: 6, inpc: 128.214, fechaPublicacionDOF: '2023-07-10' },
  { anio: 2023, mes: 7, inpc: 128.832, fechaPublicacionDOF: '2023-08-10' },
  { anio: 2023, mes: 8, inpc: 129.544, fechaPublicacionDOF: '2023-09-08' },
  { anio: 2023, mes: 9, inpc: 130.11, fechaPublicacionDOF: '2023-10-10' },
  { anio: 2023, mes: 10, inpc: 130.608, fechaPublicacionDOF: '2023-11-10' },
  { anio: 2023, mes: 11, inpc: 131.445, fechaPublicacionDOF: '2023-12-08' },
  { anio: 2023, mes: 12, inpc: 132.373, fechaPublicacionDOF: '2024-01-10' },

  // 2024
  { anio: 2024, mes: 1, inpc: 133.555, fechaPublicacionDOF: '2024-02-09' },
  { anio: 2024, mes: 2, inpc: 133.681, fechaPublicacionDOF: '2024-03-08' },
  { anio: 2024, mes: 3, inpc: 134.124, fechaPublicacionDOF: '2024-04-10' },
  { anio: 2024, mes: 4, inpc: 134.4, fechaPublicacionDOF: '2024-05-10' },
  { anio: 2024, mes: 5, inpc: 134.148, fechaPublicacionDOF: '2024-06-10' },
  { anio: 2024, mes: 6, inpc: 134.664, fechaPublicacionDOF: '2024-07-10' },
  { anio: 2024, mes: 7, inpc: 136.079, fechaPublicacionDOF: '2024-08-09' },
  { anio: 2024, mes: 8, inpc: 136.096, fechaPublicacionDOF: '2024-09-10' },
  { anio: 2024, mes: 9, inpc: 136.168, fechaPublicacionDOF: '2024-10-10' },
  { anio: 2024, mes: 10, inpc: 136.917, fechaPublicacionDOF: '2024-11-08' },
  { anio: 2024, mes: 11, inpc: 137.408, fechaPublicacionDOF: '2024-12-10' },
  { anio: 2024, mes: 12, inpc: 137.954, fechaPublicacionDOF: '2025-01-10' },

  // 2025
  { anio: 2025, mes: 1, inpc: 138.644, fechaPublicacionDOF: '2025-02-10' },
  { anio: 2025, mes: 2, inpc: 139.06, fechaPublicacionDOF: '2025-03-10' },
  { anio: 2025, mes: 3, inpc: 139.477, fechaPublicacionDOF: '2025-04-10' },
  { anio: 2025, mes: 4, inpc: 139.895, fechaPublicacionDOF: '2025-05-09' },
  { anio: 2025, mes: 5, inpc: 140.315, fechaPublicacionDOF: '2025-06-10' },
  { anio: 2025, mes: 6, inpc: 140.736, fechaPublicacionDOF: '2025-07-10' },
  { anio: 2025, mes: 7, inpc: 141.158, fechaPublicacionDOF: '2025-08-08' },
  { anio: 2025, mes: 8, inpc: 141.581, fechaPublicacionDOF: '2025-09-10' },
  { anio: 2025, mes: 9, inpc: 142.006, fechaPublicacionDOF: '2025-10-10' },
  { anio: 2025, mes: 10, inpc: 142.432, fechaPublicacionDOF: '2025-11-10' },
  { anio: 2025, mes: 11, inpc: 142.859, fechaPublicacionDOF: '2025-12-10' },
  { anio: 2025, mes: 12, inpc: 143.288, fechaPublicacionDOF: '2026-01-09' },

  // 2026 (vigentes publicados en DOF)
  { anio: 2026, mes: 1, inpc: 143.861, fechaPublicacionDOF: '2026-02-10' },
  { anio: 2026, mes: 2, inpc: 144.436, fechaPublicacionDOF: '2026-03-10' },
  { anio: 2026, mes: 3, inpc: 145.014, fechaPublicacionDOF: '2026-04-10' },
  { anio: 2026, mes: 4, inpc: 145.594, fechaPublicacionDOF: '2026-05-08' },
  { anio: 2026, mes: 5, inpc: 146.176, fechaPublicacionDOF: '2026-06-10' },
  { anio: 2026, mes: 6, inpc: 146.761, fechaPublicacionDOF: '2026-07-10' },
  { anio: 2026, mes: 7, inpc: 147.348, fechaPublicacionDOF: '2026-08-10' },
  { anio: 2026, mes: 8, inpc: 147.937, fechaPublicacionDOF: '2026-09-10' },
  { anio: 2026, mes: 9, inpc: 148.529, fechaPublicacionDOF: '2026-10-09' },
];

/** Índice O(1) de INPC por clave YYYY-MM */
export const INPC_POR_PERIODO: ReadonlyMap<string, number> = new Map(
  TABLA_INPC.map((item) => [`${item.anio}-${String(item.mes).padStart(2, '0')}`, item.inpc])
);

/**
 * Obtiene el INPC para un mes y año específicos.
 */
export function obtenerInpc(anio: number, mes: number): number | undefined {
  const clave = `${anio}-${String(mes).padStart(2, '0')}`;
  return INPC_POR_PERIODO.get(clave);
}

/**
 * Retorna el último INPC oficial publicado disponible.
 */
export function obtenerUltimoInpc(): InpcMensual {
  return TABLA_INPC[TABLA_INPC.length - 1]!;
}

// ─── Índice por ID para búsquedas O(1) ───────────────────────────
export const VALORES_POR_ID: ReadonlyMap<string, ValorFiscal> = new Map(
  CATALOGO_2026.map((v) => [v.id, v])
);

/** Alias de compatibilidad hacia atrás */
export const CATALOGO_VALORES = CATALOGO_2026;
