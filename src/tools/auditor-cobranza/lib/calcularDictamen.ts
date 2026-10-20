// src/tools/auditor-cobranza/lib/calcularDictamen.ts

import { CONDUCTAS_COBRANZA } from '@/data/conductas-cobranza';
import { COMPARADORES_CONTRATO_CRM } from '@/data/comparadores-contrato-crm';

// =====================================================
// Tipos base
// =====================================================

export const ESTADOS_DICTAMEN = [
  'COINCIDE',
  'DIFIERE',
  'PARCIAL',
  'NO_VERIFICABLE',
  'SIN_DATO',
] as const;

export type EstadoDictamen = (typeof ESTADOS_DICTAMEN)[number];

export type RiesgoCobranza = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type NivelRiesgoDictamen =
  'SIN_EVALUAR' | 'SIN_HALLAZGOS' | 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type CategoriaDetalle = 'hallazgo' | 'observacion';

export type TipoDetalle = 'comparador' | 'conducta';

export interface RespuestaComparador {
  id: string;
  estado: EstadoDictamen;
  nota?: string;
}

export interface RespuestaComparadorObjeto {
  estado: EstadoDictamen;
  nota?: string;
}

export type RespuestasComparadores =
  RespuestaComparador[] | Record<string, EstadoDictamen | RespuestaComparadorObjeto>;

export interface EntradaDictamen {
  cliente?: string;
  revisor?: string;
  fecha?: string;
  respuestasComparadores?: RespuestasComparadores;
  conductasDetectadas?: string[];
  incluirComparadores?: boolean;
  incluirConductas?: boolean;
  notas?: string;
}

export interface DetalleDictamen {
  tipo: TipoDetalle;
  categoria: CategoriaDetalle;
  id: string;
  codigo?: string;
  titulo: string;
  estado?: EstadoDictamen;
  riesgo: RiesgoCobranza;
  puntos: number;
  fundamento?: string;
  impactoContable?: string;
  recomendacion?: string;
  nota?: string;
}

export interface ResumenDictamen {
  hallazgos: number;
  observaciones: number;
  criticos: number;
  altos: number;
  medios: number;
  bajos: number;
  puntosRiesgo: number;
  puntosMaximos: number;
  score: number;
  nivel: NivelRiesgoDictamen;
}

export interface AlcanceDictamen {
  incluirComparadores: boolean;
  incluirConductas: boolean;
  totalComparadoresEvaluados: number;
  totalConductasEvaluadas: number;
}

export interface DictamenCobranza {
  generadoEl: string;
  cliente?: string;
  revisor?: string;
  notas?: string;
  alcance: AlcanceDictamen;
  resumen: ResumenDictamen;
  detalles: DetalleDictamen[];
  recomendaciones: string[];
  advertencias: string[];
}

// =====================================================
// Fuentes de datos normalizadas
// =====================================================

interface ComparadorFuente {
  id: string;
  codigo?: string;
  campo: string;
  riesgo: string;
  fundamento?: string;
  impactoContable?: string;
  recomendacion?: string;
}

interface ConductaFuente {
  id: string;
  titulo: string;
  riesgo: string;
  fundamento?: string;
  impactoContable?: string;
  recomendacion?: string;
}

const comparadores = COMPARADORES_CONTRATO_CRM as readonly ComparadorFuente[];

const conductas = CONDUCTAS_COBRANZA as readonly ConductaFuente[];

// =====================================================
// Pesos y factores
// =====================================================

export const PESO_RIESGO: Record<RiesgoCobranza, number> = {
  BAJO: 1,
  MEDIO: 3,
  ALTO: 5,
  CRITICO: 10,
};

export const FACTOR_ESTADO: Record<EstadoDictamen, number> = {
  COINCIDE: 0,
  DIFIERE: 1,
  PARCIAL: 0.5,
  NO_VERIFICABLE: 0.6,
  SIN_DATO: 0.25,
};

// =====================================================
// Utilidades
// =====================================================

function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function esEstadoDictamen(valor: unknown): valor is EstadoDictamen {
  return (
    typeof valor === 'string' &&
    (ESTADOS_DICTAMEN as readonly string[]).includes(valor.toUpperCase() as EstadoDictamen)
  );
}

function normalizarEstado(valor: unknown): EstadoDictamen | null {
  if (typeof valor !== 'string') return null;

  const upper = valor.toUpperCase();

  return esEstadoDictamen(upper) ? upper : null;
}

export function normalizarRiesgo(valor: unknown): RiesgoCobranza {
  if (typeof valor === 'string') {
    const upper = valor.toUpperCase();

    if (upper === 'BAJO' || upper === 'MEDIO' || upper === 'ALTO' || upper === 'CRITICO') {
      return upper;
    }
  }

  return 'MEDIO';
}

// =====================================================
// Normalización de respuestas
// =====================================================

interface RespuestaNormalizada {
  estado: EstadoDictamen;
  nota?: string;
}

function normalizarRespuestas(respuestas: RespuestasComparadores | undefined): {
  mapa: Map<string, RespuestaNormalizada>;
  advertencias: string[];
} {
  const mapa = new Map<string, RespuestaNormalizada>();
  const advertencias: string[] = [];

  if (!respuestas) {
    return { mapa, advertencias };
  }

  const idsValidos = new Set(comparadores.map((comparador) => comparador.id));

  const registrar = (id: string, valor: unknown) => {
    if (!idsValidos.has(id)) {
      advertencias.push(`Comparador desconocido: ${id}.`);
      return;
    }

    let estado: EstadoDictamen | null = null;
    let nota: string | undefined;

    if (typeof valor === 'string') {
      estado = normalizarEstado(valor);
    } else if (typeof valor === 'object' && valor !== null) {
      const objeto = valor as {
        estado?: unknown;
        nota?: unknown;
      };

      estado = normalizarEstado(objeto.estado);

      if (typeof objeto.nota === 'string' && objeto.nota.trim().length > 0) {
        nota = objeto.nota;
      }
    }

    if (!estado) {
      advertencias.push(
        `Estado inválido en comparador ${id}. Se esperaba uno de: ${ESTADOS_DICTAMEN.join(', ')}.`
      );
      return;
    }

    mapa.set(id, { estado, nota });
  };

  if (Array.isArray(respuestas)) {
    respuestas.forEach((respuesta, index) => {
      if (typeof respuesta !== 'object' || respuesta === null) {
        advertencias.push(`Respuesta de comparador en posición ${index} inválida.`);
        return;
      }

      const item = respuesta as Partial<RespuestaComparador>;

      if (typeof item.id !== 'string' || item.id.trim().length === 0) {
        advertencias.push(`Respuesta de comparador en posición ${index} sin id.`);
        return;
      }

      registrar(item.id, {
        estado: item.estado,
        nota: item.nota,
      });
    });
  } else {
    for (const [id, valor] of Object.entries(respuestas)) {
      registrar(id, valor);
    }
  }

  return { mapa, advertencias };
}

// =====================================================
// Resumen y nivel
// =====================================================

function determinarNivel(params: {
  puntosMaximos: number;
  score: number;
  criticos: number;
  altos: number;
  medios: number;
  bajos: number;
}): NivelRiesgoDictamen {
  const { puntosMaximos, score, criticos, altos, medios, bajos } = params;

  if (puntosMaximos === 0) {
    return 'SIN_EVALUAR';
  }

  if (score === 0) {
    return 'SIN_HALLAZGOS';
  }

  if (criticos > 0) {
    return 'CRITICO';
  }

  if (altos > 0) {
    return 'ALTO';
  }

  if (medios > 0) {
    return 'MEDIO';
  }

  if (bajos > 0) {
    return 'BAJO';
  }

  return 'BAJO';
}

function construirResumen(
  detalles: DetalleDictamen[],
  puntosRiesgo: number,
  puntosMaximos: number
): ResumenDictamen {
  const hallazgos = detalles.filter((detalle) => detalle.categoria === 'hallazgo').length;

  const observaciones = detalles.filter((detalle) => detalle.categoria === 'observacion').length;

  const criticos = detalles.filter((detalle) => detalle.riesgo === 'CRITICO').length;

  const altos = detalles.filter((detalle) => detalle.riesgo === 'ALTO').length;

  const medios = detalles.filter((detalle) => detalle.riesgo === 'MEDIO').length;

  const bajos = detalles.filter((detalle) => detalle.riesgo === 'BAJO').length;

  const score =
    puntosMaximos === 0 ? 0 : Math.min(100, Math.round((puntosRiesgo / puntosMaximos) * 100));

  const nivel = determinarNivel({
    puntosMaximos,
    score,
    criticos,
    altos,
    medios,
    bajos,
  });

  return {
    hallazgos,
    observaciones,
    criticos,
    altos,
    medios,
    bajos,
    puntosRiesgo: redondear2(puntosRiesgo),
    puntosMaximos: redondear2(puntosMaximos),
    score,
    nivel,
  };
}

// =====================================================
// Recomendaciones
// =====================================================

function construirRecomendaciones(resumen: ResumenDictamen, detalles: DetalleDictamen[]): string[] {
  const set = new Set<string>();
  const recomendaciones: string[] = [];

  const agregar = (texto?: string) => {
    const limpio = texto?.trim();

    if (!limpio || set.has(limpio)) return;

    set.add(limpio);
    recomendaciones.push(limpio);
  };

  if (resumen.nivel === 'SIN_EVALUAR') {
    agregar(
      'Define el alcance del dictamen: comparadores Contrato vs CRM y/o conductas detectadas.'
    );

    return recomendaciones;
  }

  if (resumen.nivel === 'SIN_HALLAZGOS') {
    agregar(
      'Conserva la evidencia y vuelve a auditar si cambia el contrato, el CRM o el flujo de cobro.'
    );
  }

  if (resumen.nivel === 'CRITICO') {
    agregar(
      'Conciliar de inmediato contrato vs CRM antes de continuar cualquier gestión, respuesta o cobro.'
    );

    agregar(
      'Documentar evidencia del hallazgo crítico y evaluar comunicación al área legal o cumplimiento.'
    );
  }

  if (resumen.nivel === 'ALTO') {
    agregar(
      'Integrar papeles de trabajo con la conciliación entre contrato, CRM, pagos y facturación.'
    );
  }

  if (resumen.observaciones > 0) {
    agregar('Completar evidencia faltante o no verificable antes de emitir una conclusión final.');
  }

  for (const detalle of detalles) {
    if (detalle.recomendacion) {
      agregar(detalle.recomendacion);
    } else if (detalle.categoria === 'hallazgo') {
      agregar(`Revisar ${detalle.titulo} y documentar evidencia suficiente.`);
    }
  }

  if (recomendaciones.length === 0) {
    agregar('Documentar la revisión y conservar evidencia para auditoría.');
  }

  return recomendaciones.slice(0, 12);
}

// =====================================================
// Cálculo principal
// =====================================================

export function calcularDictamenCobranza(entrada: EntradaDictamen): DictamenCobranza {
  const fecha = entrada.fecha ?? new Date().toISOString();
  const advertencias: string[] = [];

  const { mapa: respuestas, advertencias: advertenciasRespuestas } = normalizarRespuestas(
    entrada.respuestasComparadores
  );

  advertencias.push(...advertenciasRespuestas);

  const incluirComparadores =
    entrada.incluirComparadores ?? entrada.respuestasComparadores !== undefined;

  const incluirConductas = entrada.incluirConductas ?? Array.isArray(entrada.conductasDetectadas);

  const detalles: DetalleDictamen[] = [];

  let puntosRiesgo = 0;
  let puntosMaximos = 0;

  // ---------------------------------------------------
  // Evaluación de comparadores Contrato vs CRM
  // ---------------------------------------------------

  if (incluirComparadores) {
    const faltantes = comparadores.filter((comparador) => !respuestas.has(comparador.id)).length;

    if (faltantes > 0) {
      advertencias.push(`${faltantes} comparador(es) sin respuesta se marcaron como SIN_DATO.`);
    }

    for (const comparador of comparadores) {
      const riesgo = normalizarRiesgo(comparador.riesgo);
      const peso = PESO_RIESGO[riesgo];

      puntosMaximos += peso;

      const respuesta = respuestas.get(comparador.id);
      const estado: EstadoDictamen = respuesta?.estado ?? 'SIN_DATO';

      if (estado === 'COINCIDE') {
        continue;
      }

      const factor = FACTOR_ESTADO[estado];
      const puntos = redondear2(peso * factor);

      puntosRiesgo += puntos;

      const categoria: CategoriaDetalle =
        estado === 'DIFIERE' || estado === 'PARCIAL' ? 'hallazgo' : 'observacion';

      detalles.push({
        tipo: 'comparador',
        categoria,
        id: comparador.id,
        codigo: comparador.codigo,
        titulo: comparador.campo,
        estado,
        riesgo,
        puntos,
        fundamento: comparador.fundamento,
        impactoContable: comparador.impactoContable,
        recomendacion: comparador.recomendacion,
        nota: respuesta?.nota,
      });
    }
  }

  // ---------------------------------------------------
  // Evaluación de conductas detectadas
  // ---------------------------------------------------

  if (incluirConductas) {
    const idsValidosConductas = new Set(conductas.map((conducta) => conducta.id));

    const detectadas = new Set(
      (entrada.conductasDetectadas ?? []).map((id) => String(id).trim()).filter(Boolean)
    );

    for (const idDetectada of detectadas) {
      if (!idsValidosConductas.has(idDetectada)) {
        advertencias.push(`Conducta desconocida: ${idDetectada}.`);
      }
    }

    for (const conducta of conductas) {
      const riesgo = normalizarRiesgo(conducta.riesgo);
      const peso = PESO_RIESGO[riesgo];

      puntosMaximos += peso;

      const detectada = detectadas.has(conducta.id);

      if (!detectada) {
        continue;
      }

      const puntos = peso;

      puntosRiesgo += puntos;

      detalles.push({
        tipo: 'conducta',
        categoria: 'hallazgo',
        id: conducta.id,
        titulo: conducta.titulo,
        riesgo,
        puntos,
        fundamento: conducta.fundamento,
        impactoContable: conducta.impactoContable,
        recomendacion: conducta.recomendacion,
      });
    }
  }

  // ---------------------------------------------------
  // Orden, resumen y recomendaciones
  // ---------------------------------------------------

  detalles.sort((a, b) => {
    if (b.puntos !== a.puntos) {
      return b.puntos - a.puntos;
    }

    return a.titulo.localeCompare(b.titulo);
  });

  const resumen = construirResumen(detalles, puntosRiesgo, puntosMaximos);

  const recomendaciones = construirRecomendaciones(resumen, detalles);

  return {
    generadoEl: fecha,
    cliente: entrada.cliente,
    revisor: entrada.revisor,
    notas: entrada.notas,
    alcance: {
      incluirComparadores,
      incluirConductas,
      totalComparadoresEvaluados: incluirComparadores ? comparadores.length : 0,
      totalConductasEvaluadas: incluirConductas ? conductas.length : 0,
    },
    resumen,
    detalles,
    recomendaciones,
    advertencias,
  };
}
