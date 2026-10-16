/**
 * Origen oficial de un valor fiscal.
 * Permite trazabilidad y auditoría.
 */
export type OrganismoOficial =
  | 'INEGI'
  | 'CONASAMI'
  | 'IMSS'
  | 'SAT'
  | 'CONGRESO_ESTATAL';

/**
 * Unidad de medida del valor fiscal.
 */
export type UnidadFiscal =
  | 'MXN'
  | 'MXN_DIARIO'
  | 'MXN_MENSUAL'
  | 'PORCENTAJE';

/**
 * Nivel de criticidad si el valor caduca.
 * - `ALTA`: el producto da resultados INCORRECTOS.
 * - `MEDIA`: resultados desactualizados pero no erróneos.
 * - `BAJA`: solo informativo/cosmético.
 */
export type Criticidad = 'ALTA' | 'MEDIA' | 'BAJA';

/**
 * Información de la fuente oficial con trazabilidad completa.
 */
export interface FuenteOficial {
  readonly organismo: OrganismoOficial;
  readonly publicacion: string;    // Ej: "DOF 09/12/2025"
  readonly urlDOF: string;         // Link directo al documento oficial en DOF
  readonly referencia: string;     // Referencia legal: "Art. 26 Apartado B Constitucional" / "Art. 96 LISR"
}

/**
 * Periodo de vigencia del valor.
 */
export interface Vigencia {
  readonly inicio: string;         // ISO date "2026-01-01"
  readonly fin: string | null;     // null = vigente indefinidamente
}

/**
 * Un valor fiscal individual con metadatos completos de vigencia y trazabilidad.
 */
export interface ValorFiscal {
  readonly id: string;
  readonly nombre: string;
  readonly valor: unknown;
  readonly unidad: UnidadFiscal;
  readonly vigencia: Vigencia;
  readonly fuente: FuenteOficial;
  readonly esProyeccion: false;           // Forzar verificación: no hay false por defecto
  readonly verificadoPor: string;         // "Pavel M. — 2026-01-15"
  readonly criticidad: Criticidad;
}

/**
 * Resultado de evaluar la vigencia de un valor en una fecha dada.
 */
export interface ResultadoVigencia {
  readonly estado: 'vigente' | 'proximo-vencer' | 'vencido' | 'historico';
  readonly diasRestantes: number | null;
  readonly mensaje: string;
  readonly requiereAtencion: boolean;
}

/**
 * Configuración global del sistema de vigencias.
 */
export interface ConfigVigencia {
  readonly diasAlerta: number;
  readonly fechaReferencia: Date;
  readonly infinitosSiSinFecha: boolean;
}