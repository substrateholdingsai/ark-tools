/**
 * CANACO SERVYTUR MÉRIDA — Generador de Anexos Oficiales Imprimibles
 *
 * Emite los documentos oficiales prellenados listos para descargar/imprimir:
 * 1. Solicitud Oficial de Registro y Refrendo SIEM 2026.
 * 2. Aviso de Privacidad Institucional CANACO SERVYTUR Mérida.
 */

export interface DatosAnexoCanaco {
  rfc: string;
  razonSocial: string;
  contactoNombre: string;
  folioSiem: string;
  tipoPersona: 'fisica' | 'moral';
}

export function generarHtmlSolicitudRegistro(datos: DatosAnexoCanaco): string {
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Solicitud de Registro SIEM 2026 — ${datos.rfc}</title>
  <style>
    @page { size: letter; margin: 20mm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; font-size: 11pt; }
    .header { text-align: center; border-bottom: 2px solid #1A3A5C; padding-bottom: 12px; margin-bottom: 20px; }
    .logo-text { font-size: 16pt; font-weight: bold; color: #1A3A5C; letter-spacing: 0.5px; }
    .sub-logo { font-size: 9pt; color: #B85C38; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; }
    .title { font-size: 13pt; font-weight: bold; text-align: center; margin: 15px 0 5px; color: #111827; }
    .folio { text-align: right; font-family: monospace; font-size: 10pt; color: #4b5563; margin-bottom: 15px; }
    .section-title { font-size: 10pt; font-weight: bold; background-color: #FAF8F5; border-left: 4px solid #1A3A5C; padding: 4px 8px; margin: 15px 0 8px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; font-size: 10pt; }
    th { background-color: #f3f4f6; text-align: left; font-weight: 600; width: 30%; }
    .declaration { font-size: 9.5pt; text-align: justify; margin: 20px 0; color: #374151; }
    .signatures { margin-top: 50px; display: flex; justify-content: space-around; text-align: center; }
    .sig-line { width: 220px; border-top: 1px solid #111827; margin: 0 auto; padding-top: 5px; font-size: 9pt; font-weight: bold; }
    .footer { text-align: center; font-size: 8pt; color: #9ca3af; margin-top: 35px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="background: #1A3A5C; color: white; padding: 10px 15px; text-align: center; margin-bottom: 20px; border-radius: 6px;">
    <strong>Instrucciones:</strong> Imprime este documento oficial, fírmalo con tinta azul o negra y deposítalo escaneado o fotografiado en el <strong>Casillero Nº 6</strong> del Buzón Documental.
    <button onclick="window.print()" style="margin-left: 15px; padding: 4px 12px; background: #B85C38; border: none; color: white; font-weight: bold; cursor: pointer; border-radius: 4px;">Imprimir / Guardar como PDF</button>
  </div>

  <div class="header">
    <div class="logo-text">CÁMARA NACIONAL DE COMERCIO, SERVICIOS Y TURISMO DE MÉRIDA</div>
    <div class="sub-logo">Operador Autorizado del Sistema de Información Empresarial Mexicano (SIEM)</div>
  </div>

  <div class="folio">Folio Oficial: <strong>${datos.folioSiem || 'SIEM-MID-2026-OFICIAL'}</strong> | Fecha: Mérida, Yucatán a ${fechaHoy}</div>
  <div class="title">SOLICITUD DE AFILIACIÓN CAMERAL Y REGISTRO AL SIEM 2026</div>

  <div class="section-title">1. Datos de Identificación del Establecimiento</div>
  <table>
    <tr><th>Razón Social o Nombre:</th><td><strong>${datos.razonSocial}</strong></td></tr>
    <tr><th>RFC:</th><td><strong style="font-family: monospace;">${datos.rfc}</strong> (${datos.tipoPersona === 'moral' ? 'Persona Moral' : 'Persona Física'})</td></tr>
    <tr><th>Representante Legal / Titular:</th><td>${datos.contactoNombre || 'Representante Acreditado'}</td></tr>
    <tr><th>Entidad Federativa:</th><td>Yucatán (Municipio de Mérida y Zona Metropolitana)</td></tr>
  </table>

  <div class="section-title">2. Declaración bajo Protesta de Decir Verdad</div>
  <p class="declaration">
    Por medio del presente conducto, solicito formalmente la integración del establecimiento en el <strong>Padrón de Socios Activos de CANACO SERVYTUR Mérida</strong> y el refrendo de registro ante el <strong>SIEM</strong> conforme a lo dispuesto en la <em>Ley de Cámaras Empresariales y sus Confederaciones</em>. Declaro bajo protesta de decir verdad que los datos asentados y la documentación física y digital depositada en el Buzón Oficial son fidedignos, vigentes y corresponden a la operación legal del comercio representado.
  </p>

  <div class="signatures">
    <div>
      <br><br><br>
      <div class="sig-line">
        ${datos.contactoNombre || datos.razonSocial}<br>
        <span style="font-size: 8pt; font-weight: normal;">Firma del Representante Legal</span>
      </div>
    </div>
    <div>
      <br><br><br>
      <div class="sig-line">
        Oficialía de Partes CANACO<br>
        <span style="font-size: 8pt; font-weight: normal;">Sello Digital y Firma de Recepción</span>
      </div>
    </div>
  </div>

  <div class="footer">
    CANACO SERVYTUR Mérida — Av. Itzaes #272 x 31 y 33 Col. García Ginerés, C.P. 97070, Mérida, Yucatán.<br>
    Documento oficial vinculado criptográficamente a la Cédula SIEM 2026.
  </div>
</body>
</html>`;
}

export function generarHtmlAvisoPrivacidad(datos: DatosAnexoCanaco): string {
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Aviso de Privacidad CANACO — ${datos.rfc}</title>
  <style>
    @page { size: letter; margin: 20mm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; font-size: 10pt; }
    .header { text-align: center; border-bottom: 2px solid #1A3A5C; padding-bottom: 12px; margin-bottom: 15px; }
    .logo-text { font-size: 15pt; font-weight: bold; color: #1A3A5C; }
    .sub-logo { font-size: 8.5pt; color: #B85C38; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .title { font-size: 12pt; font-weight: bold; text-align: center; margin: 10px 0; color: #111827; }
    p { text-align: justify; margin: 8px 0; font-size: 9.5pt; color: #374151; }
    ul { font-size: 9pt; margin: 6px 0 10px 20px; color: #374151; }
    .consent-box { border: 1px dashed #1A3A5C; background: #FAF8F5; padding: 12px; margin-top: 20px; border-radius: 4px; }
    .signatures { margin-top: 40px; text-align: center; }
    .sig-line { width: 250px; border-top: 1px solid #111827; margin: 0 auto; padding-top: 5px; font-size: 9pt; font-weight: bold; }
    .footer { text-align: center; font-size: 8pt; color: #9ca3af; margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 6px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="background: #1A3A5C; color: white; padding: 10px 15px; text-align: center; margin-bottom: 15px; border-radius: 6px;">
    <strong>Instrucciones:</strong> Imprime este Aviso de Privacidad, fírmalo al calce de conformidad y deposítalo en el <strong>Casillero Nº 7</strong> del Buzón Documental.
    <button onclick="window.print()" style="margin-left: 15px; padding: 4px 12px; background: #B85C38; border: none; color: white; font-weight: bold; cursor: pointer; border-radius: 4px;">Imprimir / Guardar como PDF</button>
  </div>

  <div class="header">
    <div class="logo-text">CÁMARA NACIONAL DE COMERCIO, SERVICIOS Y TURISMO DE MÉRIDA</div>
    <div class="sub-logo">Protección de Datos Personales en Posesión de Particulares (LFPDPPP)</div>
  </div>

  <div class="title">AVISO DE PRIVACIDAD INTEGRAL PARA SOCIOS Y COMERCIOS SIEM</div>

  <p>
    La <strong>CÁMARA NACIONAL DE COMERCIO, SERVICIOS Y TURISMO DE MÉRIDA</strong> (en adelante "CANACO SERVYTUR Mérida"), con domicilio en Av. Itzaes #272 x 31 y 33, Col. García Ginerés, C.P. 97070, Mérida, Yucatán, es la entidad responsable del tratamiento y resguardo de sus datos personales y corporativos.
  </p>

  <p><strong>I. Finalidades del Tratamiento de Datos:</strong></p>
  <ul>
    <li>Integración del expediente oficial cameral y cumplimiento del registro ante el SIEM (Secretaría de Economía).</li>
    <li>Emisión de la Cédula Digital de Socio Activo con validación QR y sellos criptográficos SHA-256.</li>
    <li>Contacto institucional, provisión de servicios gremiales, asesoría fiscal, defensa jurídica y vinculación comercial.</li>
  </ul>

  <p><strong>II. Datos Recabados y Documentos en Custodia:</strong></p>
  <p>
    Para los efectos del padrón se recaba: Copia de Identificación Oficial (INE), Constancia de Situación Fiscal (SAT), Comprobante de Domicilio y, en su caso, Acta Constitutiva y Poder Notarial. Los archivos se preservan con cifrado en reposo bajo estrictos controles de seguridad perimetral.
  </p>

  <div class="consent-box">
    <strong>CONSTANCIA DE CONSENTIMIENTO EXPRESO Y ACEPTACIÓN:</strong><br>
    He leído y comprendido los términos del presente Aviso de Privacidad Integral. Otorgo mi pleno consentimiento para que CANACO SERVYTUR Mérida trate los datos personales y empresariales de <strong>${datos.razonSocial}</strong> (RFC: ${datos.rfc}) para los fines institucionales descritos.
  </div>

  <div class="signatures">
    <br><br>
    <div class="sig-line">
      ${datos.contactoNombre || datos.razonSocial}<br>
      <span style="font-size: 8pt; font-weight: normal;">Firma de Conformidad del Titular o Representante</span><br>
      <span style="font-size: 8pt; color: #6b7280;">Mérida, Yucatán a ${fechaHoy}</span>
    </div>
  </div>

  <div class="footer">
    CANACO SERVYTUR Mérida — En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.<br>
    Portal oficial de consulta: https://canacomerida.com.mx
  </div>
</body>
</html>`;
}

export function abrirAnexoCanaco(tipo: 'solicitud' | 'privacidad', datos: DatosAnexoCanaco) {
  const html =
    tipo === 'solicitud' ? generarHtmlSolicitudRegistro(datos) : generarHtmlAvisoPrivacidad(datos);

  const ventana = window.open('', '_blank');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  }
}
