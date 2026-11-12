# Términos y Condiciones de Servicio — ARK LEDGER

> **ESTADO: BORRADOR (DRAFT) — PENDIENTE DE REVISIÓN LEGAL.**  
> Este documento tiene fines estrictamente informativos y operativos. No constituye asesoría jurídica ni una certificación legal aprobada por abogado.

**Última actualización:** 2026-11-12

---

## 1. Aceptación y alcance del servicio

Los presentes Términos de Servicio regulan el acceso y uso de la plataforma **ARK LEDGER**, operada por **Substrate Holdings LLC** (`https://ledger.arksystems.site`), así como sus instancias institucionales o de marca blanca configuradas mediante `BrandConfig` (incluyendo **CANACO SERVYTUR MÉRIDA** y futuros tenants autorizados).

Al acceder, registrarse o utilizar cualquiera de las herramientas de cálculo, auditoría, nómina, facturación o compliance de la plataforma, el usuario y/o la organización (**Tenant**) aceptan sujetarse a estos Términos.

---

## 2. Naturaleza técnica de las herramientas (Deslinde fiscal y legal)

1. **Papeles de trabajo y apoyo analítico:** Todas las herramientas de **ARK LEDGER** (calculadoras fiscales y laborales, simuladores, validadores CFDI, conciliadores, monitores y generadores de layouts) emiten **papeles de trabajo internos y pre-validaciones técnicas** orientadas a facilitar el análisis contable, fiscal y administrativo.
2. **No sustituyen asesoría profesional:** Los resultados, cálculos, alertas (incluyendo las emitidas por el asistente AI **Noah**) o cédulas PDF/QR con sello SHA-256 **no constituyen asesoría legal, fiscal o contable colegiada**, ni dictamen oficial ante autoridad alguna.
3. **Verificación obligatoria por el usuario:** El usuario y el contador responsable del Tenant deben verificar todos los importes, tasas, fundamentos legales, XMLs y archivos exportados (incluyendo layouts **IDSE/DISPMAG** de 175 caracteres y cédulas CSV **AAFY**) antes de presentarlos ante el **SAT**, **IMSS**, **AAFY Yucatán**, **UIF** o cualquier otra autoridad.

---

## 3. Estado del módulo de Timbrado CFDI 4.0

- El proveedor de timbrado integrado en la plataforma es exclusivamente **Facturapi v2** (`https://www.facturapi.io/v2`).
- Actualmente, el módulo de Timbrado en producción opera en modo **`preview_only` / Sandbox SAT** (utilizando llaves `sk_test_` y el CSD de prueba `EKU9003173C9` para demostraciones y validaciones previas).
- El **timbrado fiscal en producción (CFDI reales ante el SAT) está deshabilitado** hasta que se formalicen por escrito los acuerdos comerciales de distribución correspondientes.
- Cualquier referencia interna heredada en rutas API (`/api/alegra/*`) o nombres técnicos de tablas en base de datos se mantiene únicamente por compatibilidad retroactiva de infraestructura y no representa un servicio activo de terceros.

---

## 4. Cuentas Multi-Tenant, roles e invitaciones

1. Cada organización o despacho (**Tenant**) administra su propio espacio lógico aislado en **Cloudflare D1**, incluyendo expedientes, clientes/RFCs y usuarios invitados.
2. El administrador de cada Tenant es responsable de:
   - Gestionar las invitaciones y permisos de sus colaboradores.
   - Mantener la confidencialidad de sus credenciales y API Keys (como llaves de Facturapi).
   - Contar con la autorización legal y avisos de privacidad necesarios respecto a los datos de sus propios clientes, empleados o afiliados que cargue en la plataforma.
3. **Instancias White-Label:** Las instancias dedicadas (como `CANACO SERVYTUR MÉRIDA`) pueden habilitar un subconjunto curado de herramientas (`allowedTools`) y funcionalidades específicas (`ventanillaPagos`, `onboardingDemo`, etc.) según su configuración institucional.

---

## 5. Propiedad intelectual

El código fuente, diseño visual, arquitectura, catálogos estructurados, marca **ARK LEDGER**, interfaces y documentación pertenecen a **Substrate Holdings LLC** (y, en el caso de elementos visuales o marcas institucionales de tenants white-label, a sus respectivos titulares). Queda prohibida la ingeniería inversa, redistribución no autorizada o explotación comercial ajena al plan contratado.

---

## 6. Cambios regulatorios y disponibilidad

1. Aunque **ARK LEDGER** mantiene un calendario de actualización para vigencias fiscales y laborales (UMA, SMG, tablas ISR, cuotas IMSS, RMF, DOF), las autoridades pueden emitir reformas, criterios o cambios técnicos en cualquier momento. **Substrate Holdings LLC** no garantiza la inmutabilidad normativa ni asume responsabilidad por multas, recargos o diferencias derivadas de cambios regulatorios sobrevenidos o de información incorrecta capturada por el usuario.
2. La disponibilidad de la plataforma depende de la infraestructura en la nube (**Cloudflare Workers / D1**) y servicios de terceros conectados. Se realizarán esfuerzos razonables de continuidad, sin garantizar disponibilidad ininterrumpida del 100% ante mantenimientos o fallas de fuerza mayor.
3. Algunas funcionalidades avanzadas recientemente incorporadas al código base (como la cédula CSV AAFY, el layout IDSE/DISPMAG 175 caracteres y la ventanilla tripartita AAFY–SAT–IMSS del commit `009634b`) se describen como capacidades de la suite y su activación en producción está sujeta a la ventana de despliegue y verificación correspondiente.

---

## 7. Suspensión y terminación

**Substrate Holdings LLC** podrá suspender o dar por terminado el acceso de un usuario o Tenant en caso de incumplimiento a estos Términos, uso ilícito de la plataforma, intento de vulneración de aislamiento multi-tenant o falta de pago en planes comerciales. El Tenant podrá solicitar el cierre de su cuenta y la baja de sus registros escribiendo a `pavel@arksystems.site`.
