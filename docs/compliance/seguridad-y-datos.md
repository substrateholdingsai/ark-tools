# Política de Seguridad y Manejo de Datos Personales — ARK LEDGER

> **ESTADO: BORRADOR (DRAFT) — PENDIENTE DE REVISIÓN LEGAL.**  
> Este documento tiene fines estrictamente informativos y operativos. No constituye asesoría jurídica ni una certificación legal aprobada por abogado.

**Última actualización:** 2026-11-12

---

## 1. Enfoque _Privacy-by-Design_ (Procesamiento Local vs. Nube)

**ARK LEDGER** minimiza la exposición de información fiscal sensible separando claramente lo que se procesa en el dispositivo del usuario de lo que se persiste en la nube:

1. **Procesamiento 100% Local en el Navegador (_Client-Side_):**
   - Herramientas como **Conversor XML → Excel**, **Validador CFDI (Anexo 20 y Art. 69-B CFF)**, **Auditor de CFDI Atípico** y **Conciliación Anexo 24** leen y analizan tus comprobantes XML directamente en la memoria del navegador del usuario.
   - Los archivos XML analizados en estas herramientas **no se suben, almacenan ni comercializan** en servidores externos.
2. **Persistencia Multi-Tenant en Cloudflare D1:**
   - Se almacenan en **Cloudflare D1** únicamente los registros estructurados necesarios para operar la cuenta y los flujos colaborativos del despacho o institución: usuarios, sesiones, invitaciones, expedientes de clientes/RFC, cédulas de trabajo, registros de ventanilla, leads y configuraciones de timbrado.

---

## 2. Aislamiento Multi-Tenant y Control de Acceso

- **Separación lógica por Tenant:** Cada organización, despacho o instancia white-label (`BrandConfig`) opera con identificadores de tenant (`tenant_id` / organización) que restringen las consultas y operaciones en **Cloudflare Workers** y **D1** al ámbito autorizado de cada cuenta.
- **Autenticación y roles:** Acceso protegido mediante autenticación de sesión y control de permisos por rol (administrador, colaborador, super-admin de plataforma cuando aplique).
- **Cifrado de credenciales sensibles:** Las llaves de API configuradas por un despacho (por ejemplo, Secret Keys de **Facturapi v2**, `sk_test_` o `sk_live_`) se cifran en reposo mediante **AES-GCM (256 bits)** en el Worker antes de persistirse y nunca se exponen en texto plano al navegador.

---

## 3. Seguridad en Tránsito y en Reposo

- **En tránsito:** Todas las comunicaciones entre el navegador del usuario, el edge de **Cloudflare Workers** y las APIs integradas (**Facturapi v2**, **Workers AI**) utilizan cifrado **HTTPS / TLS**.
- **En reposo:** Los datos persistidos en **Cloudflare D1** están protegidos bajo los controles de cifrado en reposo y seguridad física/lógica de la infraestructura de Cloudflare.
- **Integridad de papeles de trabajo:** Las cédulas oficiales generadas por la plataforma incorporan huella criptográfica **SHA-256** y código **QR** de verificación pública controlada para detectar alteraciones posteriores en los documentos impresos o compartidos.

---

## 4. Integraciones y Exportaciones Regulatorias

1. **Facturapi v2 (CFDI 4.0):** Opera actualmente en modo **`preview_only` / Sandbox SAT** (`EKU9003173C9`). La emisión en producción permanece deshabilitada hasta formalizar acuerdos comerciales de distribución. _(Rutas heredadas `/api/alegra/*` permanecen únicamente como alias técnico interno de compatibilidad)._
2. **Asistente IA (Noah):** Ejecutado mediante **Cloudflare Workers AI** (cuando está habilitado en la instancia) para consultas fiscales/técnicas sobre el catálogo de herramientas; los usuarios deben evitar introducir datos personales sensibles innecesarios en prompts conversacionales.
3. **Exportaciones generadas por el usuario (SAT, IMSS, AAFY, UIF, CANACO):**
   - Los archivos generados por la suite (cédulas CSV **AAFY** para ISN/REC, layouts **IDSE/DISPMAG** de 175 caracteres para IMSS, reportes **LFPIORPI**) se descargan directamente al equipo del usuario.
   - El usuario o Tenant es responsable de resguardar dichos archivos en su propio entorno y de transmitirlos por los portales oficiales correspondientes.

---

## 5. Conservación, Retención y Eliminación de Datos

- **Datos de cuenta y expedientes activos:** Se conservan mientras la cuenta del usuario o del Tenant permanezca activa y sea necesaria para la prestación del servicio.
- **Cierre de cuenta o solicitud de cancelación (ARCO):** Al solicitar la baja definitiva de un Tenant o usuario mediante `pavel@arksystems.site`, los registros operativos serán eliminados o anonimizados en D1 dentro de un plazo razonable de atención operativa, salvo aquellos datos que deban conservarse temporalmente por obligación legal, prevención de fraude o resolución de controversias.
- **Datos en navegador (_client-side_):** Se liberan automáticamente al cerrar o recargar la pestaña del navegador (o al limpiar la bóveda local del usuario cuando utilice almacenamiento local opcional).

---

## 6. Gestión de Incidentes de Seguridad

En caso de detectarse un incidente de seguridad que comprometa la confidencialidad o integridad de datos personales almacenados en la plataforma:

1. Se procederá a la contención inmediata, rotación de llaves/tokens comprometidos y análisis de registros en Cloudflare Workers / D1.
2. Se notificará a los Tenants y usuarios afectados a través de los correos registrados (`supportEmail` / cuenta titular) conforme a la **LFPDPPP**, indicando la naturaleza del incidente y las medidas de mitigación recomendadas.
3. Para reportar vulnerabilidades o incidentes, contacta de inmediato a: `pavel@arksystems.site`.
