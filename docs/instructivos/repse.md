# Rastreador REPSE (Registro Público de Contratistas de Servicios Especializados u Obras Especializadas)

## Descripción

Herramienta para que un despacho contable lleve el control de sus proveedores de servicios especializados y verifique que cuenten con registro REPSE vigente. Si un proveedor tiene su registro vencido, suspendido o en renovación, los pagos realizados a ese proveedor **ponen en riesgo la deducibilidad fiscal** (LFT Art. 1004-C, CFF Art. 29, LISR Art. 27).

## Fundamento Legal

- **Ley Federal del Trabajo (LFT), Arts. 13 y 15** — Reforma en materia de subcontratación (DOF 23/04/2021). Solo se permite subcontratar servicios especializados u obras especializadas que no formen parte del objeto social ni de la actividad económica preponderante de la beneficiaria, y el contratista debe estar registrado en el padrón público (Art. 15 LFT).
- **Acuerdo DOF 24/05/2021** (modificado por Acuerdo DOF 21/02/2024) — Disposiciones de carácter general para el registro REPSE:
  - Art. 13: Vigencia de 3 años contados a partir de la inscripción en el Padrón.
  - Art. 16: Renovación dentro de los 3 meses anteriores al vencimiento.
  - Art. 18: Los contratos deben incluir el folio y vigencia del registro REPSE.
- **LFT Art. 1004-C** — Multa de 2,000 a 50,000 UMAs por subcontratar sin registro REPSE.
- **CFF Art. 29, fracc. IV** / **LISR Art. 27** — Requisitos de comprobantes fiscales para deducibilidad; pagos a contratistas sin REPSE vigente ponen en riesgo la deducción.

> **Nota:** La herramienta **no consulta el padrón STPS en tiempo real**. El usuario registra la fecha de su última verificación manual. El riesgo se calcula automáticamente con base en el estatus y la vigencia declarada.

## Columnas de la Tabla

| Columna                    | Descripción                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| RFC                        | RFC del proveedor (validado por formato: 12 chars persona moral, 13 chars persona física) |
| Razón Social               | Nombre o razón social del proveedor                                                       |
| Actividad REPSE Registrada | Descripción de la actividad especializada registrada ante STPS                            |
| Folio REPSE                | Número de folio asignado por la STPS (ej. `REPSE-2024-001234`)                            |
| Vigencia REPSE             | Fecha de vencimiento del registro (YYYY-MM-DD)                                            |
| Estatus REPSE              | `Activo`, `En Renovación`, `Suspendido`, `Vencido` (píldoras de color)                    |
| Nivel de Riesgo            | Calculado automáticamente: `Crítico`, `Alto`, `Medio`, `Bajo`                             |
| Última Verificación        | Fecha en que el usuario verificó manualmente el registro en el padrón STPS                |

## Reglas de Cálculo de Riesgo (Nivel de Riesgo)

El riesgo **no se captura manualmente**, se deriva del **Estatus + Vigencia**:

| Condición                             | Nivel de Riesgo |
| ------------------------------------- | --------------- |
| Estatus = `Suspendido` o `Vencido`    | **Crítico**     |
| Estatus = `En Renovación`             | **Alto**        |
| Vigencia ≤ 30 días (y estatus Activo) | **Alto**        |
| Vigencia ≤ 90 días (y estatus Activo) | **Medio**       |
| Resto (Activo con vigencia > 90 días) | **Bajo**        |

> **Derivación automática de estatus:** Si el usuario marca `Activo` pero la vigencia ya pasó, el sistema recalcula el estatus a `Vencido` y el riesgo a `Crítico`.

## Alertas de Vigencia (Strip Superior)

Resumen en tarjetas KPI:

- Total de proveedores
- Activos / En Renovación / Suspendidos / Vencidos
- Expiran en ≤ 30 días / ≤ 60 días / ≤ 90 días

## Formulario Alta / Edición

Campos:

- RFC (validación formato + RFC genéricos XAXX010101000 / XEXX010101000)
- Razón Social
- Actividad REPSE
- Folio REPSE
- Vigencia (date picker, validación YYYY-MM-DD)
- Estatus (selector: Activo / En Renovación / Suspendido / Vencido)
- Última Verificación (date picker, default hoy)

Botones: **Guardar Cambios** / **Cancelar**

## Datos de Ejemplo (Seed)

La herramienta incluye 6 proveedores de ejemplo **marcados con badge "Ejemplo"**:

1. Logística y Transporte del Centro S.A. de C.V. — Activo, Bajo
2. Seguridad Privada e Industrial Vanguardia S.A. de C.V. — En Renovación, Alto
3. Servicios Integrales de Limpieza S.A. de C.V. — Vencido, Crítico
4. Tecnología y Soporte Operativo TI S.A. de C.V. — Activo, Bajo
5. Mantenimiento Electromecánico del Norte S.A. de C.V. — Suspendido, Crítico
6. Consultores en Ingeniería y Supervisión de Obra S.A. de C.V. — En Renovación, Alto

> **No se pueden eliminar** los proveedores de ejemplo. Son solo para demostración de la interfaz.

## Exportación

- **CSV** con BOM UTF-8 (compatible con Excel) — Columnas: RFC, Razón Social, Actividad REPSE, Folio REPSE, Vigencia REPSE, Estatus REPSE, Nivel de Riesgo, Última Verificación, Es Ejemplo
- **Excel (.xlsx)** usando SheetJS (xlsx) — Misma estructura, hoja "Proveedores REPSE"

## Uso Recomendado

1. Verificar manualmente cada proveedor en el padrón público REPSE: https://repse.stps.gob.mx/
2. Registrar la fecha de verificación en "Última Verificación"
3. La herramienta calcula automáticamente el riesgo y alerta sobre vencimientos próximos
4. Exportar el listado para papel de trabajo o entrega a cliente
5. Re-verificar periódicamente (recomendado: mensual o antes de pagos relevantes)

## Limitaciones

- No consulta el padrón STPS automáticamente (requiere API oficial no disponible públicamente)
- No valida la autenticidad del folio REPSE (solo formato)
- Los datos de ejemplo no son registros reales verificados
- El usuario es responsable de la verificación y actualización de los datos
