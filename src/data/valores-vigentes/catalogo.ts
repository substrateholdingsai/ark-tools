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
];

// ─── Índice por ID para búsquedas O(1) ───────────────────────────
export const VALORES_POR_ID: ReadonlyMap<string, ValorFiscal> = new Map(
  CATALOGO_2026.map((v) => [v.id, v])
);

/** Alias de compatibilidad hacia atrás */
export const CATALOGO_VALORES = CATALOGO_2026;
