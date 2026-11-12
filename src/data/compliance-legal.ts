/**
 * ARK LEDGER — Contenido Legal y de Compliance Multi-Tenant
 *
 * Fuente única de contenido estructurado para:
 * 1. Aviso de Privacidad Integral (LFPDPPP)
 * 2. Términos y Condiciones de Servicio
 * 3. Política de Seguridad y Manejo de Datos Personales
 *
 * Todos los textos se parametrizan dinámicamente a partir de `BrandConfig`
 * para soportar tanto ARK LEDGER (Substrate Holdings LLC) como instancias
 * white-label (ej. CANACO SERVYTUR MÉRIDA).
 */

import type { BrandConfig } from '@/config/brand/types';

export type LegalDocId = 'privacidad' | 'terminos' | 'seguridad';

export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocumentContent {
  id: LegalDocId;
  tabLabel: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  draftNotice: string;
  sections: LegalSection[];
}

export const COMPLIANCE_LAST_UPDATED = '2026-11-12';

const DRAFT_NOTICE =
  'BORRADOR (DRAFT) pendiente de revisión legal. Este documento tiene fines informativos y operativos; no constituye asesoría jurídica ni certificación legal aprobada.';

export function getComplianceDocuments(
  brand: BrandConfig
): Record<LegalDocId, LegalDocumentContent> {
  const isWhiteLabel = brand.id !== 'ark';
  const domicileText =
    brand.id === 'canaco_merida'
      ? 'Av. Itzaes #272 x 31 y 33, Col. García Ginerés, C.P. 97070, Mérida, Yucatán.'
      : '[PENDIENTE DE REGISTRO LEGAL — TODO: Domicilio oficial por confirmar con Substrate Holdings LLC]';

  const platformOperatorNote = isWhiteLabel
    ? `La instancia ${brand.brandName} (${brand.legalEntity}) actúa como entidad responsable frente a sus asociados y usuarios directos, operando sobre la infraestructura tecnológica multi-tenant de ARK LEDGER (Substrate Holdings LLC).`
    : `Substrate Holdings LLC, operador de ${brand.brandName} (${brand.portalUrl}), actúa como Responsable de los datos de plataforma y como Encargado del tratamiento respecto a los datos cargados por cada Tenant.`;

  return {
    privacidad: {
      id: 'privacidad',
      tabLabel: 'Aviso de Privacidad',
      title: 'Aviso de Privacidad Integral',
      subtitle: `${brand.brandName} · ${brand.legalEntity} (LFPDPPP)`,
      lastUpdated: COMPLIANCE_LAST_UPDATED,
      draftNotice: DRAFT_NOTICE,
      sections: [
        {
          title: '1. Identidad y Contacto del Responsable',
          paragraphs: [
            `En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), ${brand.legalEntity} (${brand.brandName}, portal ${brand.portalUrl}) informa los términos bajo los cuales recaba, utiliza y resguarda los datos personales.`,
            `Domicilio de referencia: ${domicileText}`,
            `Correo oficial de atención y Derechos ARCO: ${brand.supportEmail}.`,
          ],
        },
        {
          title: '2. Rol Dual Multi-Tenant (Responsable y Encargado)',
          paragraphs: [
            platformOperatorNote,
            'Cuando un despacho contable, empresa o cámara empresarial (Tenant) administra información de sus clientes, colaboradores o socios dentro de su espacio aislado, dicho Tenant conserva el carácter de Responsable directo frente a sus titulares.',
          ],
          bullets: [
            'Responsable del Tratamiento: registro de cuentas, autenticación, sesiones, invitaciones de equipo, facturación, soporte y CRM/leads directos.',
            'Encargado del Tratamiento: expedientes fiscales, nóminas, cédulas, comprobantes CFDI y registros de terceros cargados por cada Tenant.',
          ],
        },
        {
          title: '3. Datos Personales y Procesamiento Local',
          paragraphs: [
            'De acuerdo con las herramientas utilizadas en la suite, se tratan datos de identificación y contacto, datos fiscales (RFC, régimen fiscal, REC estatal, NRP patronal, folio SIEM), datos laborales y de seguridad social (NSS, CURP, SBC, percepciones e incidencias), así como datos para enlaces de cobro SPEI/Clip y pre-validación CFDI 4.0.',
            'Procesamiento 100% local en navegador (Client-Side): las herramientas de análisis XML/CFDI (Conversor XML a Excel, Validador Anexo 20 y Art. 69-B CFF, Auditor CFDI Atípico y Conciliación Anexo 24) procesan los archivos XML directamente en el navegador del usuario; dichos XML no se transfieren ni almacenan en servidores externos.',
          ],
        },
        {
          title: '4. Finalidades y Proveedores Tecnológicos',
          paragraphs: [
            `${brand.brandName} no vende ni comercializa datos personales. Los datos se utilizan exclusivamente para autenticación multi-tenant, operación de calculadoras y cédulas PDF/QR con sello SHA-256, resguardo de expedientes y generación de exportaciones solicitadas por el usuario (layouts IMSS IDSE/DISPMAG de 175 caracteres, cédulas CSV AAFY Yucatán, reportes UIF/LFPIORPI y registros de ventanilla SIEM).`,
            'Las funciones de cédula AAFY, layout IDSE y ventanilla tripartita AAFY–SAT–IMSS forman parte de las capacidades de la suite sujetas a su despliegue verificado en producción.',
          ],
          bullets: [
            'Cloudflare (Workers, D1 y Workers AI): alojamiento edge, base de datos relacional multi-tenant con aislamiento lógico y asistente AI Noah cuando está habilitado.',
            'Facturapi v2 (facturapi.io/v2): conector de timbrado CFDI 4.0 operando actualmente en modo preview_only / Sandbox SAT (CSD de prueba EKU9003173C9). El timbrado en producción permanece deshabilitado hasta formalizar por escrito los acuerdos de distribución correspondientes.',
            'Autoridades (SAT, IMSS, AAFY, UIF): la plataforma no transmite datos automáticamente; el usuario descarga y presenta sus propios archivos.',
          ],
        },
        {
          title: '5. Derechos ARCO y Revocación',
          paragraphs: [
            `Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), o revocar tu consentimiento, enviando una solicitud a ${brand.supportEmail} con el asunto "Solicitud Derechos ARCO — ${brand.shortName}", indicando tu nombre, correo registrado y el derecho que deseas ejercer.`,
          ],
        },
      ],
    },
    terminos: {
      id: 'terminos',
      tabLabel: 'Términos de Servicio',
      title: 'Términos y Condiciones de Servicio',
      subtitle: `${brand.brandName} · ${brand.legalEntity}`,
      lastUpdated: COMPLIANCE_LAST_UPDATED,
      draftNotice: DRAFT_NOTICE,
      sections: [
        {
          title: '1. Alcance y Aceptación',
          paragraphs: [
            `El acceso y uso de ${brand.brandName} (${brand.portalUrl}), operado sobre la plataforma ARK LEDGER de Substrate Holdings LLC, se rige por estos Términos de Servicio aplicables a todos los usuarios y Tenants.`,
          ],
        },
        {
          title: '2. Naturaleza Técnica de las Herramientas (Deslinde)',
          paragraphs: [
            'Las calculadoras fiscales y laborales, simuladores, validadores CFDI, auditores y generadores de layouts emiten papeles de trabajo internos y pre-validaciones técnicas.',
            'Los resultados obtenidos —incluyendo respuestas del asistente AI Noah y cédulas con sello SHA-256— no sustituyen la asesoría contable, fiscal o jurídica colegiada. El usuario debe verificar todos los cálculos y archivos (IDSE/DISPMAG, CSV AAFY, XML, declaraciones) antes de presentarlos ante autoridad.',
          ],
        },
        {
          title: '3. Módulo de Timbrado CFDI 4.0 (Facturapi v2)',
          paragraphs: [
            'El único proveedor de timbrado integrado es Facturapi v2 (https://www.facturapi.io/v2). En producción, el módulo opera actualmente en modo preview_only / Sandbox SAT con el CSD de prueba EKU9003173C9.',
            'El timbrado real en producción está deshabilitado hasta la firma por escrito de los acuerdos de distribución aplicables. Cualquier alias técnico heredado en API o tablas internas se conserva únicamente por compatibilidad retroactiva.',
          ],
        },
        {
          title: '4. Cuentas Multi-Tenant, Roles y White-Label',
          paragraphs: [
            'Cada Tenant administra su espacio aislado en Cloudflare D1, sus expedientes por RFC y las invitaciones a su equipo. El administrador del Tenant es responsable de resguardar sus credenciales, API Keys y contar con la autorización legal de los titulares cuyos datos administre.',
            'Las instancias white-label pueden limitar o habilitar herramientas específicas y módulos institucionales (como ventanilla de pagos o registro SIEM) mediante su perfil de marca.',
          ],
        },
        {
          title: '5. Vigencias Regulatorias, Disponibilidad y Terminación',
          paragraphs: [
            `Aunque la plataforma actualiza periódicamente sus catálogos de vigencias fiscales (UMA, SMG, ISR, IMSS, RMF), ${brand.legalEntity} y Substrate Holdings LLC no asumen responsabilidad por cambios normativos repentinos, criterios de autoridad o captura errónea del usuario.`,
            `El servicio depende de infraestructura cloud (Cloudflare Workers y D1). Para solicitar la baja o cierre de un Tenant, escribe a ${brand.supportEmail}.`,
          ],
        },
      ],
    },
    seguridad: {
      id: 'seguridad',
      tabLabel: 'Seguridad de Datos',
      title: 'Política de Seguridad y Manejo de Datos Personales',
      subtitle: `${brand.brandName} · Arquitectura Cloud Multi-Tenant`,
      lastUpdated: COMPLIANCE_LAST_UPDATED,
      draftNotice: DRAFT_NOTICE,
      sections: [
        {
          title: '1. Privacy-by-Design: Navegador vs. Nube',
          paragraphs: [
            'La plataforma minimiza la exposición de datos fiscales sensibles separando el procesamiento local del almacenamiento en nube:',
          ],
          bullets: [
            'Procesamiento 100% en navegador: Conversor XML → Excel, Validador CFDI (Anexo 20 y Art. 69-B CFF), Auditor CFDI Atípico y Anexo 24 procesan archivos XML localmente sin enviarlos al servidor.',
            'Persistencia en Cloudflare D1: solo se almacenan registros estructurados necesarios (cuentas, sesiones, invitaciones, expedientes, cédulas, leads y configuración de timbrado Sandbox/Facturapi).',
          ],
        },
        {
          title: '2. Aislamiento Multi-Tenant y Cifrado',
          paragraphs: [
            'Cada Tenant cuenta con aislamiento lógico estricto por identificador de organización en Cloudflare Workers y D1.',
            'Todas las comunicaciones viajan cifradas mediante HTTPS/TLS. Las Secret Keys de Facturapi v2 (sk_test_ / sk_live_) se cifran en reposo con AES-GCM de 256 bits en el Worker y nunca se exponen al navegador.',
            'Las cédulas oficiales emitidas integran huella criptográfica SHA-256 y código QR para verificar su integridad.',
          ],
        },
        {
          title: '3. Retención, Eliminación e Incidentes',
          paragraphs: [
            'Los datos se conservan mientras la cuenta o Tenant permanezca activo. Al recibir una solicitud de baja o cancelación ARCO, los registros operativos se eliminan o anonimizan en D1 en un plazo operativo razonable, salvo obligaciones legales de resguardo.',
            `Ante cualquier sospecha de incidente de seguridad o vulnerabilidad, repórtalo de inmediato a ${brand.supportEmail} para activar contención, rotación de credenciales y notificación conforme a la LFPDPPP.`,
          ],
        },
      ],
    },
  };
}
