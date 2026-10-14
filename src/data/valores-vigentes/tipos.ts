/**
 * Origen oficial de un valor fiscal.
 * Permite trazabilidad y auditoría.
 */
export type FuenteOficial =
  | 'DOF'           // Diario Oficial de la Federación
  | 'INEGI'         // Instituto Nacional de Estadística y Geografía
  | 'SAT'           // Servicio de Administración Tributaria
  | 'IMSS'          // Instituto Mexicano del Seguro Social
  | 'CONASAMI'      // Comisión Nacional de Salarios Mínimos
  | 'SHCP'          // Secretaría de Hacienda y Crédito Público
  | 'CONGRESO'      // Congreso de la Unión (leyes)
  | 'ENTIDAD';      // Gobierno estatal (ISN, etc.)

/**
 * Ciclo de vida de un valor.
 * - `vigente`: activo, dentro de su periodo válido.
 * - `proximo-vencer`: dentro de la ventana de alerta (default 60 días).
 * - `vencido`: superó su fecha de fin sin reemplazo.
 * - `historico`: ya fue reemplazado, se conserva para referencia.
 */
export type EstadoVigencia =
  | 'vigente'
  | 'proximo-vencer'
  | 'vencido'
  | 'historico';

/**
 * Nivel de criticidad si el valor caduca.
 * - `critico`: el producto da resultados INCORRECTOS.
 * - `alto`: resultados desactualizados pero no erróneos.
 * - `medio`: solo informativo.
 * - `bajo`: cosmético.
 */
export type CriticidadCaducidad = 'critico' | 'alto' | 'medio' | 'bajo';

/**
 * Un valor fiscal individual con metadatos de vigencia.
 */
export interface ValorFiscal<T = unknown> {
  /** Identificador único en el catálogo. Ej: 'uma.diaria.2026' */
  readonly id: string;

  /** Etiqueta legible para UI. Ej: 'UMA diaria 2026' */
  readonly etiqueta: string;

  /** Valor numérico o estructura de valores. */
  readonly valor: T;

  /** Fuente oficial que publica el valor. */
  readonly fuente: FuenteOficial;

  /** URL o referencia documental de la fuente. */
  readonly referencia: string;

  /** Fecha ISO de publicación oficial (YYYY-MM-DD). */
  readonly fechaPublicacion: string;

  /** Fecha ISO de inicio de vigencia (YYYY-MM-DD). */
  readonly vigenteDesde: string;

  /**
   * Fecha ISO de fin de vigencia (YYYY-MM-DD).
   * `null` = sin fecha de fin conocida (ej. leyes sin reforma programada).
   */
  readonly vigenteHasta: string | null;

  /** Criticidad si este valor caduca sin reemplazo. */
  readonly criticidad: CriticidadCaducidad;

  /** Notas opcionales para mantenimiento. */
  readonly notas?: string;

  /** ¿Este valor es una proyección/estimación no publicada aún? */
  readonly esProyeccion?: boolean;
}

/**
 * Resultado de evaluar la vigencia de un valor en una fecha dada.
 */
export interface ResultadoVigencia {
  readonly estado: EstadoVigencia;
  readonly diasRestantes: number | null;
  readonly mensaje: string;
  readonly requiereAtencion: boolean;
}

/**
 * Configuración global del sistema de vigencias.
 */
export interface ConfigVigencia {
  /** Días de anticipación para alertar "próximo a vencer". Default: 60. */
  readonly diasAlerta: number;

  /** Fecha de referencia para evaluar. Default: hoy. */
  readonly fechaReferencia: Date;

  /** Si `true`, valores sin `vigenteHasta` nunca caducan. Default: true. */
  readonly infinitosSiSinFecha: boolean;
}