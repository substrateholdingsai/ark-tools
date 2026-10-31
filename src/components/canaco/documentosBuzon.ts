/**
 * CANACO SERVYTUR MÉRIDA — Catálogo del Buzón Documental (Oficialía de Partes Digital)
 *
 * Fuente única de verdad de los documentos que integra el expediente de afiliación /
 * refrendo SIEM. Lo consumen tanto el Worker (validación) como la UI (casilleros).
 */

export type TipoPersonaCanaco = 'fisica' | 'moral';

export type TipoDocumentoCanaco =
  | 'ine_representante'
  | 'constancia_fiscal'
  | 'comprobante_domicilio'
  | 'acta_constitutiva'
  | 'poder_representante'
  | 'solicitud_registro'
  | 'aviso_privacidad';

export type EstatusDocumentoCanaco = 'recibido' | 'aprobado' | 'rechazado';

export interface DocumentoCanacoDef {
  tipo: TipoDocumentoCanaco;
  numero: number;
  titulo: string;
  descripcion: string;
  /** Tipos de persona a los que aplica el documento. */
  aplicaA: TipoPersonaCanaco[];
  /** Si existe un formato oficial descargable (anexo) para firmar y subir. */
  anexo?: 'solicitud' | 'privacidad';
}

export const DOCUMENTOS_BUZON_CANACO: readonly DocumentoCanacoDef[] = [
  {
    tipo: 'ine_representante',
    numero: 1,
    titulo: 'INE del Representante Legal',
    descripcion: 'Copia legible por ambos lados (frente y reverso).',
    aplicaA: ['fisica', 'moral'],
  },
  {
    tipo: 'constancia_fiscal',
    numero: 2,
    titulo: 'Constancia de Situación Fiscal',
    descripcion: 'Actualizada, con antigüedad no mayor a 3 meses.',
    aplicaA: ['fisica', 'moral'],
  },
  {
    tipo: 'comprobante_domicilio',
    numero: 3,
    titulo: 'Comprobante de Domicilio',
    descripcion: 'Luz, agua, teléfono o predial reciente (máx. 3 meses).',
    aplicaA: ['fisica', 'moral'],
  },
  {
    tipo: 'acta_constitutiva',
    numero: 4,
    titulo: 'Acta Constitutiva',
    descripcion: 'Copia completa con datos de inscripción en el Registro Público.',
    aplicaA: ['moral'],
  },
  {
    tipo: 'poder_representante',
    numero: 5,
    titulo: 'Poder del Representante Legal',
    descripcion: 'Poder notarial vigente con facultades de administración.',
    aplicaA: ['moral'],
  },
  {
    tipo: 'solicitud_registro',
    numero: 6,
    titulo: 'Solicitud de Registro (Anexo)',
    descripcion: 'Descarga el formato prellenado, fírmalo y deposítalo aquí.',
    aplicaA: ['fisica', 'moral'],
    anexo: 'solicitud',
  },
  {
    tipo: 'aviso_privacidad',
    numero: 7,
    titulo: 'Aviso de Privacidad (Anexo)',
    descripcion: 'Descarga el aviso, fírmalo de conformidad y deposítalo aquí.',
    aplicaA: ['fisica', 'moral'],
    anexo: 'privacidad',
  },
] as const;

export const TIPOS_DOCUMENTO_CANACO: readonly TipoDocumentoCanaco[] = DOCUMENTOS_BUZON_CANACO.map(
  (d) => d.tipo
);

/** Formatos permitidos en el buzón (PDF o fotografía del documento). */
export const MIME_PERMITIDOS_BUZON: readonly string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** Límite por archivo cuando existe bucket R2 configurado. */
export const MAX_BYTES_BUZON_R2 = 10 * 1024 * 1024;
/** Límite por archivo en el respaldo D1 (base64 debe caber en una fila de ~2 MB). */
export const MAX_BYTES_BUZON_D1 = 1_400_000;

/**
 * Persona moral: RFC de 12 caracteres. Persona física: RFC de 13 caracteres.
 */
export function tipoPersonaPorRfc(rfc: string): TipoPersonaCanaco {
  return rfc.trim().length === 12 ? 'moral' : 'fisica';
}

export function documentosRequeridos(tipoPersona: TipoPersonaCanaco): DocumentoCanacoDef[] {
  return DOCUMENTOS_BUZON_CANACO.filter((d) => d.aplicaA.includes(tipoPersona));
}

export function esTipoDocumentoValido(valor: unknown): valor is TipoDocumentoCanaco {
  return typeof valor === 'string' && (TIPOS_DOCUMENTO_CANACO as readonly string[]).includes(valor);
}

export function normalizarRfc(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim().toUpperCase().replace(/\s+/g, '') : '';
}

export function rfcEsValido(rfc: string): boolean {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc);
}
