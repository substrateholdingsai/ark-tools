export const URL_ACUERDO_MODALIDAD40 = 'https://sidof.segob.gob.mx/notas/docFuente/5801708';

export const CITACION_ACUERDO_MODALIDAD40 =
  'Acuerdo ACDO.AS2.HCT.101026/302.P.DG, Consejo Técnico del IMSS, aprobado 10/10/2026, publicado DOF 21/10/2026, en vigor 22/10/2026, medida temporal.';

export const ALCANCE_ACUERDO_MODALIDAD40 =
  'Punto Cuarto: conserva las condiciones contratadas por las personas ya inscritas hasta concluir su periodo; para nuevas incorporaciones permite el último SBC o hasta el último SBC más 1 UMA, nunca menos de 1 SMG general; el aseguramiento inicia en la fecha de solicitud, sin retroactividad. Las personas incorporadas como trabajadoras independientes conforme al Art. 13-I no pueden contratar Continuación Voluntaria.';

export const NOTA_ALCANCE_ACUERDO_MODALIDAD40 =
  'Medida temporal del Consejo Técnico, en vigor; su alcance frente a los Arts. 218 LSS y 65–66 del Reglamento es materia de discusión jurídica — no presentarlo como derecho settled.';

export const NOTA_FOLIO_INTEGRIDAD_MODALIDAD40 =
  'Folio de Integridad (token determinista del cálculo, no constituye sellado fiscal ni certificación del IMSS; un preview no archivado no es verificable por QR).';

export const PRESENTACION_BOVEDA_MODALIDAD40 = {
  integrityLabel: 'Folio de Integridad (hash determinista)',
  integrityDescription: NOTA_FOLIO_INTEGRIDAD_MODALIDAD40,
  jsonHashField: 'folio_integridad',
  manifestHashLabel: 'Folio de Integridad',
  manifestScope: 'Alcance: paquete de proyección; no acredita cumplimiento ni certificación fiscal',
  legalHeading: 'Alcance informativo',
  legalText:
    'Proyección generada por ARK LEDGER. No constituye resolución oficial del IMSS ni asesoría jurídica individual.',
  qrCaption:
    'Referencia al sitio del simulador; este QR no verifica el cálculo ni acredita un expediente archivado.',
  verifierMode: 'reference_only',
} as const;

export const ADVERTENCIAS_MODALIDAD40 = [
  NOTA_ALCANCE_ACUERDO_MODALIDAD40,
  'Proyección nominal con valores 2026: la cuota (14.438%) y la UMA se actualizan cada año; el cronograma no es un calendario de cobros reales del IMSS.',
  'El salario promedio se estima con el último SBC y el SBC efectivo sobre las últimas 250 semanas; no sustituye el historial real de salarios del IMSS.',
  'El incremento del 11% (Decreto Fox) se aplica según la regla actual de la herramienta; su elegibilidad y vigencia en 2026 deben confirmarse antes de presentarlo como derecho.',
  'La pensión es una proyección del simulador, no una cotización ni una resolución del IMSS.',
];

export const VECTOR_REFERENCIA_MODALIDAD40 = {
  ultimoSbc: 600,
  sbcDeseado: 2932.75,
  semanasPrevias: 1250,
  mesesAportacion: 24,
  edadJubilacion: 65,
  asignacionFamiliar: true,
} as const;

export function advertenciaSemanasMinimasModalidad40(semanasTotales: number): string {
  return `El resultado es una proyección condicionada: ${semanasTotales} semanas totales son menos de las 500 semanas mínimas para pensión del Régimen 1973. Confirme la elegibilidad con el IMSS.`;
}
