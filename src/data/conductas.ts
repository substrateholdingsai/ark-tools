/**
 * ARK LEDGER — Mapa de Activos Virtuales
 *
 * Datos base para la herramienta de consulta legal sobre activos virtuales.
 *
 * Fuente de referencia:
 * - Ley Fintech
 * - LFPIORPI
 * - Código Penal Federal
 * - Código Fiscal de la Federación
 * - Iniciativa stablecoins 2026
 *
 * Nota:
 * El artifact original menciona 48 conductas, pero solo contiene 12 conductas
 * tipificadas. Para no inventar datos, este archivo inicia con las 12 reales
 * y deja estructura extensible.
 */

// =====================================================
// Tipos base
// =====================================================

export type MarcoLegalAV = 'Ley Fintech' | 'LFPIORPI' | 'CPF' | 'CFF' | 'Iniciativa 2026';

export type GravedadAV = 'MEDIA' | 'ALTA' | 'CRITICA' | 'CRITICA_MAX' | 'FUTURA';

export type TipoSancionAV = 'PENAL' | 'ADMINISTRATIVA' | 'FISCAL' | 'PROPUESTA';

export type EstatusLegalAV = 'LEGAL' | 'ILEGAL';

export interface ConductaAV {
  id: number;
  conducta: string;
  marcoLegal: MarcoLegalAV;
  articulo: string;
  calificacion: string;
  sancionCorta: string;
  sancionDetalle: string;
  gravedad: GravedadAV;
  noIgnorable: boolean;
  relevanteParaContador: boolean;
  tipos: TipoSancionAV[];
  anosPrision?: string;
  multaUMA?: string;
}

export interface AutoridadAV {
  id: string;
  sigla: string;
  nombre: string;
  funcion: string;
}

export interface HitoRegulatorioAV {
  orden: number;
  fecha: string;
  titulo: string;
  descripcion: string;
  esCritico: boolean;
}

export interface UmbralReporteAV {
  id: string;
  concepto: string;
  tipoUmbral: 'UMA' | 'SIN_UMBRAL';
  cantidadUMA?: number;
  obligacion: string;
  nota?: string;
}

export interface ReglaFronteraAV {
  id: string;
  orden: number;
  estatus: EstatusLegalAV;
  titulo: string;
  descripcion: string;
}

// =====================================================
// Catálogos para filtros
// =====================================================

export const MARCOS_LEGALES_AV: readonly MarcoLegalAV[] = [
  'Ley Fintech',
  'LFPIORPI',
  'CPF',
  'CFF',
  'Iniciativa 2026',
];

export const GRAVEDADES_AV: readonly GravedadAV[] = [
  'MEDIA',
  'ALTA',
  'CRITICA',
  'CRITICA_MAX',
  'FUTURA',
];

export const TIPOS_SANCION_AV: readonly TipoSancionAV[] = [
  'PENAL',
  'ADMINISTRATIVA',
  'FISCAL',
  'PROPUESTA',
];

// =====================================================
// Conductas
// =====================================================

export const CONDUCTAS_AV: ConductaAV[] = [
  {
    id: 1,
    conducta: 'Operar plataforma de activos virtuales sin autorización de la CNBV',
    marcoLegal: 'Ley Fintech',
    articulo: 'Art. 30 y régimen de autorización',
    calificacion: 'Actividad financiera no autorizada',
    sancionCorta: 'Multa + clausura',
    sancionDetalle:
      'Sanción administrativa determinada según gravedad, imposición de multa económica y clausura definitiva de operaciones. Inhabilitación para solicitar autorización futura.',
    gravedad: 'ALTA',
    noIgnorable: false,
    relevanteParaContador: true,
    tipos: ['ADMINISTRATIVA'],
    anosPrision: 'No aplica',
    multaUMA: 'Variable según gravedad',
  },
  {
    id: 2,
    conducta: 'Usar, obtener o transferir activos virtuales de clientes',
    marcoLegal: 'Ley Fintech',
    articulo: 'Art. 119',
    calificacion: 'Delito contra el patrimonio del cliente',
    sancionCorta: '3–9 años + 5,000–150,000 UMA',
    sancionDetalle:
      'Base: 3–9 años de prisión + multa de 5,000 a 150,000 UMA. Si el autor es interno —accionista, directivo, empleado o proveedor con acceso— la sanción puede elevarse a 6–18 años + 10,000–300,000 UMA. Agravante por abuso de confianza.',
    gravedad: 'CRITICA',
    noIgnorable: true,
    relevanteParaContador: true,
    tipos: ['PENAL'],
    anosPrision: '3–9 años / 6–18 años si es interno',
    multaUMA: '5,000–150,000 UMA / 10,000–300,000 UMA',
  },
  {
    id: 3,
    conducta: 'Desviar activos virtuales de clientes',
    marcoLegal: 'Ley Fintech',
    articulo: 'Art. 121',
    calificacion: 'Delito de desvío de recursos',
    sancionCorta: '3–9 años + escala por daño en UMA',
    sancionDetalle:
      'Base de 3–9 años + multa de 5,000 a 150,000 UMA. Escala por monto desviado: 2,200–57,000 UMA puede llegar a 4–10 años; 57,000–400,000 UMA a 5–11 años; más de 400,000 UMA hasta 12 años. Cúmulo con reparación del daño.',
    gravedad: 'CRITICA',
    noIgnorable: true,
    relevanteParaContador: true,
    tipos: ['PENAL'],
    anosPrision: '3–9 años base; hasta 12 años según monto',
    multaUMA: 'Escalado por daño',
  },
  {
    id: 4,
    conducta: 'Obtener, extraer o transferir activos virtuales sin autorización (hackeo)',
    marcoLegal: 'Ley Fintech',
    articulo: 'Art. 133',
    calificacion: 'Intrusión y apropiación ilícita',
    sancionCorta: '4–10 años + 7,000–170,000 UMA',
    sancionDetalle:
      'Cuando el monto sustraído está entre 2,200 y 57,000 UMA, la pena puede ser de 4–10 años de prisión + multa de 7,000 a 170,000 UMA. Puede concursar con delitos informáticos y asociación delictuosa si existe organización.',
    gravedad: 'CRITICA',
    noIgnorable: true,
    relevanteParaContador: false,
    tipos: ['PENAL'],
    anosPrision: '4–10 años',
    multaUMA: '7,000–170,000 UMA',
  },
  {
    id: 5,
    conducta: 'Divulgar información financiera o confidencial de clientes',
    marcoLegal: 'Ley Fintech',
    articulo: 'Art. 122',
    calificacion: 'Vulneración de datos personales y financieros',
    sancionCorta: '2–6 años + 1,000–50,000 UMA',
    sancionDetalle:
      'Divulgación dolosa de secretos financieros o datos personales custodiados por instituciones autorizadas. Pena de 2–6 años de prisión + multa de 1,000 a 50,000 UMA. Se agrava si se usa para extorsión o suplantación.',
    gravedad: 'ALTA',
    noIgnorable: false,
    relevanteParaContador: true,
    tipos: ['PENAL'],
    anosPrision: '2–6 años',
    multaUMA: '1,000–50,000 UMA',
  },
  {
    id: 6,
    conducta: 'Negarse a devolver activos virtuales encomendados',
    marcoLegal: 'Ley Fintech',
    articulo: 'Art. 120',
    calificacion: 'Posesión ilícita',
    sancionCorta: '3–9 años + 5,000–150,000 UMA',
    sancionDetalle:
      'Cuando existe obligación contractual de restitución. La retención indebida puede equipararse a abuso de confianza. Pena de 3–9 años + multa de 5,000 a 150,000 UMA. Puede perseguirse por querella del cliente y con intervención de autoridad.',
    gravedad: 'CRITICA',
    noIgnorable: true,
    relevanteParaContador: true,
    tipos: ['PENAL'],
    anosPrision: '3–9 años',
    multaUMA: '5,000–150,000 UMA',
  },
  {
    id: 7,
    conducta: 'No presentar los avisos de operaciones con activos virtuales ante la UIF',
    marcoLegal: 'LFPIORPI',
    articulo: 'Art. 32 y reglas conexas',
    calificacion: 'Incumplimiento antilavado',
    sancionCorta: 'Multa de 200–65,000 UMA',
    sancionDetalle:
      'Actividad vulnerable no reportada. Multa de 200 a 65,000 UMA según gravedad y reincidencia. Riesgo de clausura, revocación de inscripción y auditoría. El cumplimiento EBR será relevante en la etapa 2027.',
    gravedad: 'MEDIA',
    noIgnorable: true,
    relevanteParaContador: true,
    tipos: ['ADMINISTRATIVA'],
    anosPrision: 'No aplica',
    multaUMA: '200–65,000 UMA',
  },
  {
    id: 8,
    conducta: 'Lavado de dinero mediante activos virtuales',
    marcoLegal: 'CPF',
    articulo: 'Código Penal Federal y LFPIORPI',
    calificacion: 'Delito de lavado de dinero',
    sancionCorta: '5–15 años en México; hasta 20 años en EEUU',
    sancionDetalle:
      'Operaciones con recursos de procedencia ilícita usando mixers, OTC no registrado o layering. En México puede sancionarse con 5–15 años según CPF. En casos transfronterizos con jurisdicción estadounidense puede llegar hasta 20 años federales + decomiso total.',
    gravedad: 'CRITICA_MAX',
    noIgnorable: true,
    relevanteParaContador: true,
    tipos: ['PENAL'],
    anosPrision: '5–15 años MX / hasta 20 años EEUU',
    multaUMA: 'Decomiso + multa',
  },
  {
    id: 9,
    conducta: 'Robo violento de activos virtuales (key wrench attack)',
    marcoLegal: 'CPF',
    articulo: 'Robo / homicidio',
    calificacion: 'Delito penal común agravado',
    sancionCorta: '25–70 años por víctima',
    sancionDetalle:
      'Uso de violencia física para obtener llaves privadas, seed phrase o acceso a activos virtuales. Se juzga como robo agravado, secuestro o tentativa de homicidio según resultado. Por cada víctima la pena puede sumar 25–70 años.',
    gravedad: 'CRITICA_MAX',
    noIgnorable: true,
    relevanteParaContador: false,
    tipos: ['PENAL'],
    anosPrision: '25–70 años por víctima',
    multaUMA: 'No aplica',
  },
  {
    id: 10,
    conducta: 'Omitir o falsear ganancias por operaciones con activos virtuales',
    marcoLegal: 'CFF',
    articulo: 'Código Fiscal de la Federación',
    calificacion: 'Infracción fiscal / defraudación',
    sancionCorta: '55%–75% de multa + defraudación fiscal',
    sancionDetalle:
      'Las personas físicas deben declarar ganancias por enajenación o percepción derivada de activos virtuales. La omisión genera recargos, multa del 55% al 75% del monto evadido y posible defraudación fiscal equiparada si supera umbrales del CFF.',
    gravedad: 'ALTA',
    noIgnorable: false,
    relevanteParaContador: true,
    tipos: ['FISCAL'],
    anosPrision: 'No aplica',
    multaUMA: '55%–75% del monto evadido',
  },
  {
    id: 11,
    conducta: 'Emitir stablecoins (AVE) sin autorización de Banxico',
    marcoLegal: 'Iniciativa 2026',
    articulo: 'Pendiente — iniciativa Sen. Murat mayo 2026',
    calificacion: 'Se tipificaría como ilegal',
    sancionCorta: 'Multa, suspensión y revocación',
    sancionDetalle:
      'Propuesta en análisis. Régimen de autorización por Banxico con reserva 1:1 en activos líquidos. Sanciones propuestas: multa económica, suspensión de operaciones y revocación de autorización ITF.',
    gravedad: 'FUTURA',
    noIgnorable: false,
    relevanteParaContador: true,
    tipos: ['PROPUESTA'],
    anosPrision: 'Pendiente de aprobación',
    multaUMA: 'Reserva 1:1 obligatoria',
  },
  {
    id: 12,
    conducta: 'Ocultar reservas de stablecoins o proporcionar información falsa',
    marcoLegal: 'Iniciativa 2026',
    articulo: 'Ídem — reserva y transparencia',
    calificacion: 'Se tipificaría como ilegal',
    sancionCorta: 'Penal / administrativa propuesta',
    sancionDetalle:
      'Falsear auditorías de reservas o attestations. Se proponen sanciones penales por fraude financiero y administrativas por incumplimiento de transparencia. Posible inhabilitación de directivos.',
    gravedad: 'FUTURA',
    noIgnorable: false,
    relevanteParaContador: true,
    tipos: ['PROPUESTA'],
    anosPrision: 'Propuesta',
    multaUMA: 'Auditoría obligatoria',
  },
];

// =====================================================
// Autoridades
// =====================================================

export const AUTORIDADES_AV: AutoridadAV[] = [
  {
    id: 'cnbv',
    sigla: 'CNBV',
    nombre: 'Comisión Nacional Bancaria y de Valores',
    funcion: 'Autoriza y supervisa a las ITF, incluidas plataformas de activos virtuales.',
  },
  {
    id: 'banxico',
    sigla: 'Banxico',
    nombre: 'Banco de México',
    funcion:
      'Define qué activos virtuales pueden usarse en operaciones internas y regula sistemas de pago.',
  },
  {
    id: 'uif',
    sigla: 'UIF',
    nombre: 'Unidad de Inteligencia Financiera',
    funcion: 'Vigila cumplimiento antilavado y recibe reportes de operaciones de alto riesgo.',
  },
  {
    id: 'sat',
    sigla: 'SAT',
    nombre: 'Servicio de Administración Tributaria',
    funcion: 'Exige declarar ganancias y mantiene obligaciones de registro antilavado.',
  },
  {
    id: 'condusef',
    sigla: 'CONDUSEF',
    nombre:
      'Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios Financieros',
    funcion: 'Protege derechos del usuario y atiende quejas, reclamaciones y publicidad engañosa.',
  },
];

// =====================================================
// Timeline regulatorio
// =====================================================

export const TIMELINE_REGULATORIO_AV: HitoRegulatorioAV[] = [
  {
    orden: 1,
    fecha: 'Mayo 2026',
    titulo: 'Iniciativa stablecoins AVE',
    descripcion:
      'Se presenta iniciativa para regular stablecoins ancladas a fiat, con autorización de Banxico y obligación de reserva 1:1.',
    esCritico: false,
  },
  {
    orden: 2,
    fecha: 'Agosto 2026',
    titulo: 'Reforma mayor antilavado LFPIORPI',
    descripcion:
      'SHCP publica nuevas reglas generales: Enfoque Basado en Riesgos obligatorio, clasificación de riesgo, debida diligencia reforzada, monitoreo automatizado y controles PEP.',
    esCritico: true,
  },
  {
    orden: 3,
    fecha: '1 de marzo de 2027',
    titulo: 'Vigencia plena EBR',
    descripcion:
      'Entrada en vigor por etapas del modelo EBR. Los operadores de activos virtuales deben tener matriz de riesgos y monitoreo automatizado operativo.',
    esCritico: true,
  },
  {
    orden: 4,
    fecha: '2028',
    titulo: 'Primera auditoría anual obligatoria',
    descripcion:
      'Auditoría antilavado externa bajo el nuevo enfoque de riesgos. Validación de controles PEP y reportes UIF.',
    esCritico: false,
  },
  {
    orden: 5,
    fecha: 'Marzo 2029',
    titulo: 'Presentación de dictámenes',
    descripcion:
      'Fecha límite para presentar dictámenes de cumplimiento. El incumplimiento puede generar multas de 200 a 65,000 UMA y posible revocación.',
    esCritico: true,
  },
  {
    orden: 6,
    fecha: 'Debate abierto',
    titulo: 'Ley Fintech 2.0',
    descripcion:
      'El sector impulsa reformar la Ley Fintech de 2018 para agilizar autorizaciones, establecer reglas de riesgo escalonadas y clarificar NFT y DeFi.',
    esCritico: false,
  },
];

// =====================================================
// Umbrales de reporte
// =====================================================

export const UMBRALES_REPORTE_AV: UmbralReporteAV[] = [
  {
    id: 'operacion-individual',
    concepto: 'Operación individual',
    tipoUmbral: 'UMA',
    cantidadUMA: 210,
    obligacion: 'Presentar aviso ante la UIF',
    nota: 'El equivalente en MXN debe calcularse con la UMA diaria vigente.',
  },
  {
    id: 'comisiones-honorarios',
    concepto: 'Comisiones / honorarios',
    tipoUmbral: 'UMA',
    cantidadUMA: 4,
    obligacion: 'Presentar aviso',
    nota: 'El equivalente en MXN debe calcularse con la UMA diaria vigente.',
  },
  {
    id: 'identificacion-cliente',
    concepto: 'Identificación del cliente',
    tipoUmbral: 'SIN_UMBRAL',
    obligacion: 'KYC obligatorio',
    nota: 'Aplica desde la primera operación, sin umbral mínimo.',
  },
];

// =====================================================
// Frontera legal vs ilegal
// =====================================================

export const FRONTERA_LEGAL_AV: ReglaFronteraAV[] = [
  {
    id: 'legal-tenencia',
    orden: 1,
    estatus: 'LEGAL',
    titulo: 'Tenencia y comercio por particulares',
    descripcion:
      'Comprar y vender activos virtuales mediante ITF autorizadas por la CNBV. Operación legal y trazable.',
  },
  {
    id: 'legal-mineria',
    orden: 2,
    estatus: 'LEGAL',
    titulo: 'Minería',
    descripcion:
      'No está prohibida ni regulada específicamente en la ley mexicana. Se presume legal, pero debe declararse fiscalmente.',
  },
  {
    id: 'legal-remesas',
    orden: 3,
    estatus: 'LEGAL',
    titulo: 'Remesas transfronterizas vía ITF',
    descripcion:
      'Uso de activos virtuales para remesas de Estados Unidos a México mediante instituciones autorizadas.',
  },
  {
    id: 'ilegal-banca-tradicional',
    orden: 4,
    estatus: 'ILEGAL',
    titulo: 'Banca tradicional con cripto',
    descripcion:
      'La CNBV prohíbe expresamente a bancos tradicionales ofrecer compraventa o custodia directa de activos virtuales.',
  },
  {
    id: 'ilegal-proveedores-no-registrados',
    orden: 5,
    estatus: 'ILEGAL',
    titulo: 'Proveedores no registrados',
    descripcion:
      'Intercambio, custodia o transferencia sin registro como actividad vulnerable. Aplica aunque el proveedor opere desde el extranjero atendiendo México.',
  },
  {
    id: 'ilegal-stablecoins-no-autorizadas',
    orden: 6,
    estatus: 'ILEGAL',
    titulo: 'Emisión no autorizada de stablecoins',
    descripcion:
      'Emisión de stablecoins ancladas a fiat sin autorización de Banxico. Iniciativa 2026 propone sanciones penales y administrativas.',
  },
];

// =====================================================
// Resumen y avisos
// =====================================================

export const FILOSOFIA_AV = 'Aislar, no prohibir';

export const AVISO_LEGAL_AV =
  'Este mapa es informativo y no constituye asesoría legal. Validar con especialista antes de emitir opinión profesional.';

export const FUENTES_AV: string[] = [
  'Ley Fintech (2018, reforma 14 de noviembre de 2025)',
  'LFPIORPI, art. 32 y reglas conexas',
  'Código Penal Federal',
  'Código Fiscal de la Federación',
  'Iniciativa stablecoins 2026',
];

export const RESUMEN_MAPA_AV = {
  filosofia: FILOSOFIA_AV,
  totalConductas: CONDUCTAS_AV.length,
  totalAutoridades: AUTORIDADES_AV.length,
  totalHitos: TIMELINE_REGULATORIO_AV.length,
  totalUmbrales: UMBRALES_REPORTE_AV.length,
  totalReglasFrontera: FRONTERA_LEGAL_AV.length,
  conductasNoIgnorables: CONDUCTAS_AV.filter((conducta) => conducta.noIgnorable).length,
  conductasCriticas: CONDUCTAS_AV.filter(
    (conducta) => conducta.gravedad === 'CRITICA' || conducta.gravedad === 'CRITICA_MAX'
  ).length,
  conductasFiscales: CONDUCTAS_AV.filter((conducta) => conducta.tipos.includes('FISCAL')).length,
  conductasRelevantesParaContador: CONDUCTAS_AV.filter((conducta) => conducta.relevanteParaContador)
    .length,
};

// =====================================================
// Retrocompatibilidad
// =====================================================

export type Conducta = ConductaAV;
export const conductas = CONDUCTAS_AV;
export default CONDUCTAS_AV;
