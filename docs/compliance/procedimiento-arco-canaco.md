# Procedimiento manual ARCO — CANACO Mérida

Este procedimiento aplica a solicitudes de acceso, rectificación, cancelación u
oposición relacionadas con datos tratados por CANACO Mérida. No se ejecutan
borrados automáticos. La persona responsable debe conservar evidencia mínima del
trámite, sin copiar datos personales a canales no autorizados.

## Responsable y registro

- Responsable inicial de cada caso: `horus.i2d@gmail.com`.
- Toda solicitud se registra en `canaco_arco_requests` mediante
  `POST /api/afiliaciones/arco`. El registro queda asignado al responsable y con
  fecha límite de respuesta; no se debe atender una solicitud informalmente sin
  crear su folio.
- Consultar la cola con `GET /api/afiliaciones/arco`. El acceso está limitado al
  Super Admin y a la persona administradora designada.
- Actualizar el estado con `PATCH /api/afiliaciones/arco/:id`. El sistema conserva
  responsable, marcas de tiempo, fecha límite y nota de resolución.

## Flujo operativo

1. **Recepción:** registrar correo, derecho solicitado y RFC. El sistema asocia el
   registro CANACO si encuentra una coincidencia exacta de RFC y correo; que no
   haya coincidencia no bloquea la solicitud ni revela información al solicitante.
2. **Asignación y acuse:** confirmar que el caso aparece asignado a la persona
   responsable. Enviar acuse por el canal de contacto registrado sin incluir
   información fiscal sensible.
3. **Verificación de identidad:** solicitar evidencia proporcional por un canal
   confiable; cotejar que la persona solicitante sea titular o representante
   autorizado. No adjuntar identificaciones al CRM. Registrar el resultado con el
   estado `identity_verified`; si no se puede acreditar identidad, no ejecutar
   cambios y documentar el motivo.
4. **Plazo:** `response_due_at` se calcula al recibir la solicitud como veinte días
   hábiles operativos y se muestra en la cola. Verificar el cómputo contra el texto
   legal vigente y días inhábiles oficiales; si corresponde una ampliación, obtener
   revisión legal y notificarla oportunamente al titular. Para solicitudes
   procedentes, `execution_due_at` registra el objetivo operativo de quince días
   hábiles después de iniciar la atención. No usar estos campos como sustituto de
   la revisión legal del plazo aplicable.
5. **Análisis y ejecución manual:** determinar el alcance con asesoría legal si es
   necesario. Para cancelación u oposición, identificar los datos afectados,
   obligaciones de conservación y cada encargado/procesador. Cuando proceda,
   realizar la acción manualmente en los sistemas autorizados y registrar cada
   instrucción en `canaco_arco_processor_actions`. No borrar registros fiscales o
   evidencia de pago sin autorización legal.
6. **Resolución y confirmación:** marcar `completed` solo después de ejecutar lo
   procedente y enviar respuesta al solicitante. Registrar en `completion_notes`
   la fecha, el resultado y los sistemas/procesadores atendidos, evitando copiar
   datos sensibles. Si no procede, cerrar como `rejected` con el fundamento y la
   explicación comunicada.
7. **Cierre y seguimiento:** comprobar que el expediente contiene responsable,
   verificación, decisión, ejecución (si corresponde) y evidencia de respuesta.
   Revisar diariamente casos abiertos y escalar de inmediato cualquier caso
   próximo a vencer o sin avance.

La aplicación solo registra y asigna solicitudes; no verifica identidad, no calcula
días inhábiles, no instruye procesadores y no elimina datos. La persona responsable
debe completar esas tareas fuera del sistema y dejar constancia en el expediente.
