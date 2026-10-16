/**
 * ARK TOOLS — Generador de Borrador de Respuesta SAT / IMSS
 *
 * Construye el escrito de respuesta legal preliminar con base en el acto fiscal,
 * el paso activo y los items completados de la guía operativa.
 */

import type { ActoFiscal, PasoGuia } from '@/data/actos';

export interface ParametrosBorrador {
  acto: ActoFiscal;
  paso: PasoGuia;
  checklistActivo: string[];
  avance: number;
  fechaPersonalizada?: string;
}

export function generarBorrador({
  acto,
  paso,
  checklistActivo,
  avance,
  fechaPersonalizada,
}: ParametrosBorrador): string {
  const fecha =
    fechaPersonalizada ??
    new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const checklistTexto =
    checklistActivo.length > 0
      ? checklistActivo.map((item) => `   - ${item}`).join('\n')
      : '   - Pendiente de completar checklist operativo.';

  return `ASUNTO: Respuesta a ${acto.titulo} — Paso ${paso.id} ${paso.corto}

H. Autoridad Fiscal / IMSS
Presente.

Por medio del presente, en atención a su ${acto.titulo.toLowerCase()} notificado el [FECHA], con folio [FOLIO], me permito manifestar:

1. VALIDEZ
Se revisó competencia, fundamento y plazo otorgado.
Fundamento de referencia: ${paso.fundamento}.

2. CLASIFICACIÓN
El acto se identifica como:
   ${acto.autoridad} — ${acto.titulo}
   Código interno: ${acto.codigo}
   Fundamento: ${acto.fundamento}

3. ANÁLISIS
Se concilió información de declaraciones, CFDI, nómina, SUA y SIPARE, según aplique.

4. ACCIÓN SUGERIDA
${acto.accion}.

5. CHECKLIST OPERATIVO DEL PASO ACTIVO (${paso.titulo})
${checklistTexto}

6. PRUEBAS
Se anexan únicamente las pruebas pertinentes, sin ampliar indebidamente el alcance de la revisión.

Solicito se tenga por atendido en tiempo y forma, conservando acuse correspondiente.

Fecha de preparación: ${fecha}
Avance de guía ARK: ${avance}%

Atentamente,
[Nombre / RFC / Registro Patronal]
`;
}
