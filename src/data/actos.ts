// Datos de actos SAT/IMSS

export type Autoridad = 'SAT' | 'IMSS';

export type RiesgoActo =
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico';

export type IconoGuia =
  | 'mail'
  | 'file-search'
  | 'layers'
  | 'clipboard-check'
  | 'target'
  | 'send'
  | 'eye'
  | 'gavel'
  | 'building'
  | 'file-text';

export interface PasoGuia {
  id: number;
  titulo: string;
  corto: string;
  descripcion: string;
  canales: string[];
  checklist: string[];
  tip: string;
  fundamento: string;
  icono: IconoGuia;
}

export interface ActoFiscal {
  autoridad: Autoridad;
  codigo: string;
  titulo: string;
  descripcion: string;
  riesgo: RiesgoActo;
  fundamento: string;
  accion: string;
  icono: IconoGuia;
}

export interface PlazoClave {
  id: string;
  autoridad: Autoridad;
  concepto: string;
  fundamento: string;
  cantidad: number;
  prefijo?: string;
  unidad: string;
  destacado?: boolean;
}

export const GUIA_PASOS: PasoGuia[] = [
  {
    id: 1,
    titulo: 'Recibes la notificación',
    corto: 'Notificación',
    descripcion:
      'Identifica el canal y registra el momento exacto de recepción. Todo plazo corre desde aquí.',
    canales: [
      'Buzón Tributario',
      'Escrito IMSS',
      'Notificación personal',
      'Correo certificado',
    ],
    checklist: [
      'Captura fecha y hora de notificación',
      'Guarda acuse / sello / constancia del Buzón Tributario',
      'Verifica destinatario y RFC / Registro Patronal',
      'Fotografía / PDF del sobre y documento completo',
    ],
    tip: 'Si llegó por Buzón Tributario, el plazo inicia al tercer día siguiente a la disponibilidad. Documenta todo.',
    fundamento: 'CFF Art. 134 | Reglamento Buzón Tributario',
    icono: 'mail',
  },
  {
    id: 2,
    titulo: 'Revisa su validez',
    corto: 'Validez',
    descripcion:
      'Antes de contestar, audita forma y fondo. Un vicio formal puede anular todo el acto.',
    canales: [
      'Autoridad emisora',
      'Firma electrónica',
      'Competencia territorial',
    ],
    checklist: [
      '¿Autoridad competente y facultada?',
      '¿Fecha de emisión, folio y sello?',
      '¿Fundamento legal específico (CFF / LSS)?',
      '¿Periodo, obligación y plazo claramente señalados?',
      '¿Forma de notificación válida?',
      '¿Plazo otorgado es correcto?',
    ],
    tip: 'Crea tabla de validación: Autoridad / Fecha / Fundamento / Periodo / Obligación / Plazo / Forma. Si falta uno, es impugnable.',
    fundamento: 'CFF Art. 38, 134 | LSS Art. 251',
    icono: 'file-search',
  },
  {
    id: 3,
    titulo: 'Clasifica el acto',
    corto: 'Clasificación',
    descripcion:
      'No todo es requerimiento. Clasificar mal te hace contestar de más o de menos.',
    canales: ['SAT', 'IMSS', 'Mixto'],
    checklist: [
      'Identifica tipo según catálogo SAT / IMSS',
      'Define si es exhorto (no vinculante) o requerimiento (obligatorio)',
      'Revisa si implica inicio de facultades',
      'Valida si hay crédito fiscal ya determinado',
    ],
    tip: 'Una carta invitación no se contesta como requerimiento. Exhorto IMSS = invita a corregir, no sanciona aún.',
    fundamento: 'CFF 33, 41, 42 | LSS 178-180',
    icono: 'layers',
  },
  {
    id: 4,
    titulo: 'Analiza y concilia información',
    corto: 'Conciliación',
    descripcion:
      'Cruza lo que dice la autoridad con tu realidad contable, fiscal y de seguridad social.',
    canales: ['Contabilidad', 'Nómina', 'SUA'],
    checklist: [
      'Declaraciones vs CFDI emitidos / recibidos',
      'Nóminas timbradas vs SUA vs SIPARE pagado',
      'DIOT, contabilidad electrónica, contratos',
      'Identifica diferencias y su origen',
      'Genera papeles de trabajo de soporte',
    ],
    tip: 'El 73% de los créditos IMSS vienen de diferencias SUA vs Nómina. Concilia antes de responder.',
    fundamento: 'Papeles de trabajo = tu prueba reina',
    icono: 'clipboard-check',
  },
  {
    id: 5,
    titulo: 'Define estrategia',
    corto: 'Estrategia',
    descripcion:
      'Elige el camino con menor riesgo fiscal y de seguridad social. No todo se corrige pagando.',
    canales: ['Aclarar', 'Desvirtuar', 'Corregir', 'No reconocer'],
    checklist: [
      '¿Hay error de autoridad? -> Aclarar / Desvirtuar',
      '¿Hay omisión real? -> Corregir con pago / complementaria',
      '¿Información inexistente? -> No reconocer con fundamento',
      'Valida costo-beneficio y precedentes',
      'Define narrativa y pruebas clave',
    ],
    tip: 'Estrategia Ark: Aclarar si es forma, Desvirtuar si es fondo, Corregir si es omisión, Silencio estratégico solo si es invitación.',
    fundamento: 'Criterio de materialidad y riesgo',
    icono: 'target',
  },
  {
    id: 6,
    titulo: 'Contesta en tiempo y forma',
    corto: 'Respuesta',
    descripcion:
      'La respuesta perfecta es exacta, probada y en el canal oficial. Nada de escritos genéricos.',
    canales: ['Buzón Tributario', 'Escrito libre', 'Oficialía'],
    checklist: [
      'Atiende PUNTO por PUNTO lo requerido',
      'Anexa pruebas pertinentes, no todo tu archivo',
      'Usa medio oficial (Buzón / Oficialía IMSS)',
      'Conserva acuse con sello digital / fecha',
      'Folio y control de expediente',
    ],
    tip: 'Regla 3E: Exacto, Eficiente, Evidenciado. Contestar de más abre facultades.',
    fundamento: 'CFF Art. 42, 53 | Reglas SAT',
    icono: 'send',
  },
  {
    id: 7,
    titulo: 'Da seguimiento',
    corto: 'Seguimiento',
    descripcion:
      'Contestar no termina el caso. El seguimiento evita que se convierta en crédito.',
    canales: ['Expediente', 'Citas', 'Oficios'],
    checklist: [
      'Verifica respuesta de autoridad (3-15 días)',
      'Si requieren más info, responde en plazo nuevo',
      'Agenda cita aclaratoria si aplica',
      'Integra expediente completo foliado',
      'Alerta de vencimientos futuros',
    ],
    tip: 'Crea expediente único: Notificación + Validación + Análisis + Escrito + Acuse + Seguimiento. Todo en un PDF.',
    fundamento: 'Control de gestión tributaria',
    icono: 'eye',
  },
  {
    id: 8,
    titulo: 'Si no estás de acuerdo',
    corto: 'Defensa',
    descripcion:
      'Cuando la autoridad insiste, tienes 5 vías de defensa según acto y plazo.',
    canales: ['SAT', 'IMSS', 'TFJA'],
    checklist: [
      'Aclaración (Buzón / 6 días)',
      'Recurso de Revocación (30 días)',
      'Recurso de Inconformidad IMSS (15 días hábiles)',
      'Juicio de Nulidad (30 días TFJA)',
      'Amparo (15 días - violación derechos)',
      'Elige la vía menos costosa y más rápida',
    ],
    tip: 'No saltes a nulidad sin agotar aclaración. Muchas resoluciones se caen en revocación por falta de motivación.',
    fundamento: 'CFF 117-133 | LSS 294 | LFPCA | Ley Amparo',
    icono: 'gavel',
  },
];

export const ACTOS_SAT: ActoFiscal[] = [
  {
    autoridad: 'SAT',
    codigo: 'SAT-CI-01',
    titulo: 'Carta Invitación',
    descripcion:
      'Vigilancia profunda. Detecta inconsistencias CFDI vs Declaraciones.',
    riesgo: 'Bajo',
    fundamento: 'CFF Art. 33',
    accion: 'Aclarar sin ampliar facultades',
    icono: 'mail',
  },
  {
    autoridad: 'SAT',
    codigo: 'SAT-RO-02',
    titulo: 'Req. Obligaciones Omitidas',
    descripcion:
      'No presentaste declaración. Requiere cumplimiento en 15 días.',
    riesgo: 'Medio',
    fundamento: 'CFF Art. 41',
    accion: 'Presentar + pago + prueba',
    icono: 'file-search',
  },
  {
    autoridad: 'SAT',
    codigo: 'SAT-RI-03',
    titulo: 'Req. de Información',
    descripcion:
      'Solicita contabilidad, contratos, papeles. Previo a facultades.',
    riesgo: 'Alto',
    fundamento: 'CFF Art. 42, 53',
    accion: 'Entregar exacto, no de más',
    icono: 'clipboard-check',
  },
  {
    autoridad: 'SAT',
    codigo: 'SAT-FC-04',
    titulo: 'Facultades de Comprobación',
    descripcion:
      'Revisión, auditoría, visita domiciliaria. Inicio formal.',
    riesgo: 'Crítico',
    fundamento: 'CFF Art. 42 Frac II, III, V',
    accion: 'Estrategia defensiva + pericial',
    icono: 'layers',
  },
];

export const ACTOS_IMSS: ActoFiscal[] = [
  {
    autoridad: 'IMSS',
    codigo: 'IMSS-EX-01',
    titulo: 'Exhorto / Invitación',
    descripcion:
      'Invita a corregir diferencias SUA, prima de riesgo, bajas.',
    riesgo: 'Bajo',
    fundamento: 'LSS Art. 251',
    accion: 'Analizar y autocorregir si aplica',
    icono: 'building',
  },
  {
    autoridad: 'IMSS',
    codigo: 'IMSS-RI-02',
    titulo: 'Req. Información Patronal',
    descripcion:
      'Solicita nóminas, listas, contratos, determinaciones.',
    riesgo: 'Medio',
    fundamento: 'LSS Art. 15, 251 Frac XVI',
    accion: 'Entregar con cédula de integración',
    icono: 'file-text',
  },
  {
    autoridad: 'IMSS',
    codigo: 'IMSS-CP-03',
    titulo: 'Corrección Patronal',
    descripcion:
      'Procedimiento para regularizar diferencias detectadas.',
    riesgo: 'Alto',
    fundamento: 'LSS Art. 178-180, RACERF',
    accion: 'Corrección + pago + no sanción si espontánea',
    icono: 'target',
  },
  {
    autoridad: 'IMSS',
    codigo: 'IMSS-CF-04',
    titulo: 'Crédito Fiscal Autorizado',
    descripcion:
      'Liquidación de cuotas, multas, capitales constitutivos.',
    riesgo: 'Crítico',
    fundamento: 'LSS Art. 287-291, CFF 4',
    accion: 'Inconformidad o nulidad inmediata',
    icono: 'gavel',
  },
];

export const ACTOS_FISCALES: ActoFiscal[] = [
  ...ACTOS_SAT,
  ...ACTOS_IMSS,
];

export const PLAZOS_CLAVE: PlazoClave[] = [
  {
    id: 'sat-respuesta',
    autoridad: 'SAT',
    concepto: 'Respuesta',
    fundamento: 'CFF Art. 41, 42, 53',
    cantidad: 15,
    unidad: 'DÍAS',
  },
  {
    id: 'imss-requerimiento',
    autoridad: 'IMSS',
    concepto: 'Requerimiento',
    fundamento: 'LSS + RACERF',
    cantidad: 40,
    unidad: 'DÍAS HÁBILES',
  },
  {
    id: 'imss-prorroga',
    autoridad: 'IMSS',
    concepto: 'Prórroga IMSS',
    fundamento: 'Solicitable 1 vez',
    cantidad: 10,
    prefijo: '+',
    unidad: 'DÍAS',
    destacado: true,
  },
];

export const NOTAS_PLAZOS: string[] = [
  'Buzón Tributario: 3 días para darse por notificado + plazo del acto.',
  'IMSS: días hábiles, no cuentan sáb/dom/festivos.',
];

// Legacy export for backwards compatibility
export interface Acto {
  id: string;
  autoridad: "SAT" | "IMSS";
  descripcion: string;
}

export const actos: Acto[] = [];

export default actos;