import type { ValorFiscal } from './tipos';

/**
 * CATÁLOGO CENTRAL DE VALORES FISCALES VIGENTES
 *
 * REGLAS DE MANTENIMIENTO:
 * 1. Cada valor DEBE tener fuente oficial y referencia verificable.
 * 2. Al publicar un valor nuevo, agregar el nuevo y actualizar
 *    `vigenteHasta` del anterior (no borrar historial).
 * 3. Valores proyectados (aún no publicados en DOF) DEBEN llevar
 *    `esProyeccion: true` y criticidad mínima 'alto'.
 * 4. Ejecutar `pnpm test catalogo` tras cada actualización.
 */

// ─── UMA (INEGI) ─────────────────────────────────────────────────
export const UMA = {
  diaria2026: {
    id: 'uma.diaria.2026',
    etiqueta: 'UMA diaria 2026',
    valor: 113.14,
    fuente: 'INEGI',
    referencia: 'https://www.inegi.org.mx/temas/uma/',
    fechaPublicacion: '2026-01-10',
    vigenteDesde: '2026-02-01',
    vigenteHasta: '2027-01-31',
    criticidad: 'critico',
    esProyeccion: true,
    notas: 'Verificar publicación en DOF a inicios de febrero. Valor 2025: 113.14.',
  } satisfies ValorFiscal,

  mensual2026: {
    id: 'uma.mensual.2026',
    etiqueta: 'UMA mensual 2026',
    valor: 113.14 * 30.4,
    fuente: 'INEGI',
    referencia: 'https://www.inegi.org.mx/temas/uma/',
    fechaPublicacion: '2026-01-10',
    vigenteDesde: '2026-02-01',
    vigenteHasta: '2027-01-31',
    criticidad: 'critico',
    esProyeccion: true,
  } satisfies ValorFiscal,
} as const;

// ─── Salarios mínimos (CONASAMI) ─────────────────────────────────
export const SALARIO_MINIMO = {
  general2026: {
    id: 'salario.minimo.general.2026',
    etiqueta: 'Salario mínimo general 2026',
    valor: 278.80,
    fuente: 'CONASAMI',
    referencia: 'https://www.gob.mx/conasami',
    fechaPublicacion: '2025-12-20',
    vigenteDesde: '2026-01-01',
    vigenteHasta: '2026-12-31',
    criticidad: 'critico',
    esProyeccion: true,
    notas: 'Valor 2025. Verificar publicación oficial 2026 en DOF.',
  } satisfies ValorFiscal,

  frontera2026: {
    id: 'salario.minimo.frontera.2026',
    etiqueta: 'Salario mínimo frontera norte 2026',
    valor: 419.88,
    fuente: 'CONASAMI',
    referencia: 'https://www.gob.mx/conasami',
    fechaPublicacion: '2025-12-20',
    vigenteDesde: '2026-01-01',
    vigenteHasta: '2026-12-31',
    criticidad: 'critico',
    esProyeccion: true,
    notas: 'Valor 2025. Verificar publicación oficial 2026 en DOF.',
  } satisfies ValorFiscal,
} as const;

// ─── Topes LSS (IMSS) ────────────────────────────────────────────
export const TOPES_LSS = {
  tope25UMA2026: {
    id: 'lss.tope.25uma.2026',
    etiqueta: 'Tope 25 UMA (LSS) 2026',
    valor: 113.14 * 25,
    fuente: 'IMSS',
    referencia: 'https://www.imss.gob.mx/',
    fechaPublicacion: '2026-01-10',
    vigenteDesde: '2026-02-01',
    vigenteHasta: '2027-01-31',
    criticidad: 'critico',
    esProyeccion: true,
    notas: 'Derivado de UMA 2025 (113.14). Actualizar cuando UMA 2026 sea oficial.',
  } satisfies ValorFiscal,
} as const;

// ─── Tarifas ISR (SAT) ───────────────────────────────────────────
export const TARIFA_ISR = {
  mensual2026: {
    id: 'isr.tarifa.mensual.2026',
    etiqueta: 'Tarifa ISR mensual 2026',
    valor: [
      { limiteInferior: 0.01,       limiteSuperior: 746.04,    cuotaFija: 0,         tasa: 0.0192 },
      { limiteInferior: 746.05,     limiteSuperior: 6332.05,   cuotaFija: 14.32,     tasa: 0.0640 },
      { limiteInferior: 6332.06,    limiteSuperior: 11128.01,  cuotaFija: 371.83,    tasa: 0.1088 },
      { limiteInferior: 11128.02,   limiteSuperior: 12935.82,  cuotaFija: 893.63,    tasa: 0.1600 },
      { limiteInferior: 12935.83,   limiteSuperior: 15487.71,  cuotaFija: 1182.88,   tasa: 0.1792 },
      { limiteInferior: 15487.72,   limiteSuperior: 31236.49,  cuotaFija: 1640.18,   tasa: 0.2136 },
      { limiteInferior: 31236.50,   limiteSuperior: 49233.00,  cuotaFija: 5004.12,   tasa: 0.2352 },
      { limiteInferior: 49233.01,   limiteSuperior: 93993.90,  cuotaFija: 9236.89,   tasa: 0.3000 },
      { limiteInferior: 93993.91,   limiteSuperior: 125325.20, cuotaFija: 22665.17,  tasa: 0.3200 },
      { limiteInferior: 125325.21,  limiteSuperior: 375975.61, cuotaFija: 32691.18,  tasa: 0.3400 },
      { limiteInferior: 375975.62,  limiteSuperior: null,      cuotaFija: 117912.32, tasa: 0.3500 },
    ],
    fuente: 'SAT',
    referencia: 'https://www.sat.gob.mx/consultas/retensiones/conoce-las-tarifas-de-isr',
    fechaPublicacion: '2025-12-28',
    vigenteDesde: '2026-01-01',
    vigenteHasta: '2026-12-31',
    criticidad: 'critico',
    esProyeccion: true,
    notas: 'Tarifa 2025 (Anexo 8 RMF 2025). Verificar Anexo 8 RMF 2026 cuando se publique.',
  } satisfies ValorFiscal,
} as const;

// ─── ISN (varía por entidad) ─────────────────────────────────────
// NOTA: las 32 tasas ISN viven en src/tools/isn/data/estados.ts.
// Aquí solo agregamos un centinela para el motor de vigencias.
export const ISN_META = {
  tasas2026: {
    id: 'isn.tasas.2026',
    etiqueta: 'Tasas ISN por entidad 2026',
    valor: 32, // conteo de entidades cubiertas
    fuente: 'ENTIDAD',
    referencia: 'https://www.gob.mx/indetec',
    fechaPublicacion: '2026-01-05',
    vigenteDesde: '2026-01-01',
    vigenteHasta: '2026-12-31',
    criticidad: 'critico',
    esProyeccion: true,
    notas: 'Verificar reformas fiscales estatales en el DOF y periódicos oficiales. Tasas 2025 usadas como base.',
  } satisfies ValorFiscal,
} as const;

// ─── Registro completo para iteración ────────────────────────────
export const CATALOGO_VALORES: readonly ValorFiscal[] = [
  UMA.diaria2026,
  UMA.mensual2026,
  SALARIO_MINIMO.general2026,
  SALARIO_MINIMO.frontera2026,
  TOPES_LSS.tope25UMA2026,
  TARIFA_ISR.mensual2026,
  ISN_META.tasas2026,
];

// ─── Índice por ID para búsquedas O(1) ───────────────────────────
export const VALORES_POR_ID: ReadonlyMap<string, ValorFiscal> =
  new Map(CATALOGO_VALORES.map(v => [v.id, v]));