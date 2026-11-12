# Aviso de Privacidad Integral — ARK LEDGER

> **ESTADO: BORRADOR (DRAFT) — PENDIENTE DE REVISIÓN LEGAL.**  
> Este documento tiene fines estrictamente informativos y operativos. No constituye asesoría jurídica ni una certificación legal aprobada por abogado.

**Última actualización:** 2026-11-12

---

## 1. Identidad y domicilio del Responsable

En cumplimiento de la **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)**, su Reglamento y los Lineamientos del Aviso de Privacidad vigentes en México:

- **Responsable de la Plataforma:** **Substrate Holdings LLC**, operador de **ARK LEDGER** (`https://ledger.arksystems.site`).
- **Domicilio legal:** `[PLACEHOLDER — TODO: Pendiente de suministro del domicilio legal oficial por parte de Pavel Cortés / Substrate Holdings LLC]`.
- **Correo de contacto y Derechos ARCO:** `pavel@arksystems.site`
- **Instancias White-Label (Tenants Institucionales):** Cuando el usuario accede mediante una instancia de marca blanca configurada en `BrandConfig` (por ejemplo, **CANACO SERVYTUR MÉRIDA** en `https://socios.canacomerida.com.mx`, contacto `afiliaciones@canacomerida.com.mx`), dicha entidad institucional actúa como **Responsable** frente a sus propios afiliados o socios, conforme a su propio aviso de privacidad y anexos imprimibles (`anexosCanaco.ts`), mientras **Substrate Holdings LLC** opera la infraestructura tecnológica bajo el presente marco.

---

## 2. Rol dual bajo la LFPDPPP (Plataforma Multi-Tenant)

**ARK LEDGER** opera bajo una arquitectura **Cloud Multi-Tenant** con dos roles diferenciados:

1. **Como Responsable del Tratamiento:** respecto a los datos personales recabados directamente para el registro de cuentas, autenticación de usuarios, invitaciones de equipo, facturación de suscripciones, soporte técnico, bitácoras de sesión y gestión directa de prospectos (CRM/Leads).
2. **Como Encargado del Tratamiento (Data Processor):** respecto a la información fiscal, contable, laboral, de nómina, CFDI y expedientes de terceros (clientes, contribuyentes, trabajadores o socios) que cada **Tenant** (despacho contable, empresa o cámara empresarial) carga, consulta o administra dentro de su espacio lógico aislado en la plataforma. En este supuesto, **cada Tenant conserva el carácter de Responsable** frente a sus propios titulares y es responsable de contar con su propio Aviso de Privacidad y consentimiento.

---

## 3. Datos personales que se recaban y tratan

Según las herramientas utilizadas dentro de la suite, se pueden tratar las siguientes categorías de datos:

- **Identificación y contacto (cuentas, leads y expedientes):** nombre completo, razón social, correo electrónico, teléfono/WhatsApp, ciudad, especialidad o giro comercial.
- **Datos fiscales y registrales:** Registro Federal de Contribuyentes (**RFC**), régimen fiscal, código postal fiscal, Registro Estatal de Contribuyentes (**REC** para AAFY Yucatán), Número de Registro Patronal (**NRP** ante el IMSS), folio SIEM (en instancias camerales).
- **Datos laborales y de seguridad social:** Número de Seguridad Social (**NSS**), **CURP**, Salario Base de Cotización (**SBC**), percepciones, deducciones, incapacidades, ausentismos, finiquitos/liquidaciones e importes para cédulas **IDSE/DISPMAG** (175 caracteres) e **ISN / AAFY**.
- **Datos de facturación y cobro:** información para generación de enlaces de cobro **SPEI / Clip** y datos de comprobantes **CFDI 4.0** (en modo _preview_only_ / Sandbox SAT con Facturapi v2).
- **Datos de navegación y sesión:** tokens de sesión, marca de tiempo e identificadores técnicos necesarios para seguridad y aislamiento multi-tenant.

### Procesamiento 100% local en navegador (_Client-Side_)

Las herramientas de **análisis masivo de XML/CFDI**, **Conversor XML a Excel**, **Validador CFDI (Anexo 20 y cruce preventivo Art. 69-B CFF)**, **Auditor de CFDI Atípico** y **Conciliación Anexo 24** ejecutan el análisis de tus archivos XML **directamente en tu navegador**. Los archivos XML procesados en estas herramientas locales **no se transfieren ni almacenan** en los servidores de la plataforma.

---

## 4. Finalidades del tratamiento

### Finalidades primarias (necesarias para el servicio)

1. Crear, autenticar y administrar cuentas de usuario, roles e invitaciones dentro de cada tenant en **Cloudflare D1**.
2. Proveer las herramientas de cálculo fiscal, laboral, financiero y de auditoría de la suite, así como la generación de papeles de trabajo con sello SHA-256 y código QR.
3. Resguardar los expedientes únicos por cliente/RFC dentro del aislamiento lógico de cada tenant.
4. Generar archivos de exportación solicitados por el usuario (por ejemplo: layouts **IDSE/DISPMAG** de 175 caracteres, cédulas CSV **AAFY** para ISN, reportes para **SAT** o **UIF/LFPIORPI**, y registros para ventanilla **CANACO SIEM**). _(Nota: las funciones de cédula AAFY, layout IDSE y ventanilla tripartita AAFY–SAT–IMSS se encuentran integradas en el código base de la suite —commit `009634b`— y su disponibilidad en producción depende del despliegue verificado correspondiente)._
5. Atender solicitudes de pre-validación y timbrado CFDI 4.0 a través de **Facturapi v2** (`https://www.facturapi.io/v2`), operando actualmente en modo **`preview_only` / Sandbox SAT** (CSD de prueba `EKU9003173C9`). El timbrado en producción permanece deshabilitado hasta formalizar por escrito los acuerdos de distribución aplicables.
6. Brindar soporte técnico y asistencia contextual mediante **Noah** (ejecutado sobre **Cloudflare Workers AI**, cuando esté habilitado en la instancia).

### Finalidades secundarias

- Seguimiento comercial y atención de solicitudes de demostración o cotización enviadas voluntariamente por prospectos a través de formularios de contacto o CRM.
- Mejora operativa, prevención de fraude y auditoría técnica de seguridad.

Si no deseas que tus datos se traten para finalidades secundarias, puedes solicitarlo en cualquier momento escribiendo a `pavel@arksystems.site` (o al correo de soporte de tu instancia white-label).

---

## 5. Transferencias y proveedores tecnológicos

**ARK LEDGER no vende ni comercializa datos personales.** Para operar la infraestructura descrita, los datos estrictamente necesarios pueden ser procesados por los siguientes proveedores tecnológicos bajo sus respectivas políticas de seguridad:

| Proveedor / Destinatario                                | Rol / Motivo                                                                                                | Alcance                                                                                                                                                                                                                         |
| :------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Cloudflare, Inc.** (Workers, D1, Workers AI)          | Alojamiento de aplicación, base de datos relacional multi-tenant y procesamiento de asistente AI (Noah).    | Todos los tenants (según funcionalidades habilitadas en `BrandConfig`).                                                                                                                                                         |
| **Facturapi** (`https://www.facturapi.io/v2`)           | Conector PAC para CFDI 4.0 en modo `preview_only` / Sandbox SAT (`sk_test_`) y preparación de comprobantes. | Solo cuando el usuario conecta su API Key en la herramienta de Timbrado.                                                                                                                                                        |
| **Autoridades (SAT, IMSS, AAFY Yucatán, UIF) / CANACO** | Cumplimiento de obligaciones fiscales, laborales o camerales.                                               | **ARK LEDGER no transmite automáticamente datos a estas autoridades.** La descarga y presentación de layouts (IDSE, CSV AAFY, XML, avisos) es ejecutada directamente por el usuario o tenant bajo su exclusiva responsabilidad. |

---

## 6. Derechos ARCO y revocación del consentimiento

Como titular de tus datos personales, tienes derecho a conocer qué datos tenemos de ti, para qué los utilizamos y las condiciones de uso (**Acceso**); solicitar su corrección si son inexactos o incompletos (**Rectificación**); pedir su eliminación cuando consideres que no están siendo utilizados conforme a la ley (**Cancelación**); u oponerte al tratamiento para fines específicos (**Oposición**).

Para ejercer tus **Derechos ARCO** o revocar tu consentimiento:

1. Envía un correo electrónico a `pavel@arksystems.site` (o al correo `supportEmail` indicado en el pie de página de tu instancia white-label) con el asunto **"Solicitud Derechos ARCO — ARK LEDGER"**.
2. Incluye: nombre completo, correo registrado en la plataforma, descripción clara del derecho que deseas ejercer y, en su caso, documentación que acredite tu identidad o representación legal.
3. Si tu solicitud corresponde a datos cargados por un **Tenant** (por ejemplo, tu patrón o despacho contable), canalizaremos o coordinaremos la atención con dicho Tenant en su calidad de Responsable directo.

---

## 7. Cambios al Aviso de Privacidad

Cualquier modificación al presente Aviso de Privacidad se publicará dentro de la propia plataforma en el modal de **Compliance Legal** accesible desde el pie de página y en la documentación oficial del proyecto (`docs/compliance/aviso-de-privacidad.md`).
