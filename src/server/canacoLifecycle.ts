export type CanacoLifecycleStage =
  'prospecto' | 'registrado' | 'pago_pendiente' | 'socio_activo' | 'cancelado';

export interface VerifiedConektaEvidence {
  provider: 'conekta';
  signatureVerified: true;
  eventType: 'order.paid' | 'charge.paid';
  leadId: string;
  intentId: string;
  transactionReference: string;
  eventId: string;
  amountCents: number;
  currency: 'MXN';
  environment: 'production';
  paidAt: string;
}

export interface CanacoPaymentActivationResult {
  activated: boolean;
  replay: boolean;
}

export async function expireCanacoPaymentIntents(db: D1Database, now: string): Promise<void> {
  await db.batch([
    db
      .prepare(
        `UPDATE canaco_payment_intents
         SET status = 'expired'
         WHERE tenant_id = 'canaco_merida' AND status = 'created' AND expires_at <= ?`
      )
      .bind(now),
    db
      .prepare(
        `INSERT OR IGNORE INTO canaco_lifecycle_audit
         (id, lead_id, from_stage, to_stage, reason, payment_outcome, evidence_reference)
         SELECT lower(hex(randomblob(16))), lead.id, 'pago_pendiente', 'registrado',
                'Conekta payment intent expired', 'expired', intent.id
         FROM leads_ark_tools lead
         JOIN canaco_payment_intents intent ON intent.lead_id = lead.id
         WHERE lead.tenant_id = 'canaco_merida' AND lead.lifecycle_stage = 'pago_pendiente'
           AND intent.tenant_id = 'canaco_merida' AND intent.status = 'expired'
           AND intent.expires_at <= ?
           AND NOT EXISTS (
             SELECT 1 FROM canaco_payment_intents current
             WHERE current.lead_id = lead.id AND current.status = 'created'
               AND current.expires_at > ?
           )
           AND NOT EXISTS (
             SELECT 1 FROM canaco_payment_intents paid
             WHERE paid.lead_id = lead.id AND paid.status = 'paid'
           )`
      )
      .bind(now, now),
    db
      .prepare(
        `UPDATE leads_ark_tools
         SET lifecycle_stage = 'registrado', status = 'Registrado', updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = 'canaco_merida' AND lifecycle_stage = 'pago_pendiente'
           AND EXISTS (
             SELECT 1 FROM canaco_payment_intents expired
             WHERE expired.lead_id = leads_ark_tools.id AND expired.status = 'expired'
               AND expired.expires_at <= ?
           )
           AND NOT EXISTS (
             SELECT 1 FROM canaco_payment_intents current
             WHERE current.lead_id = leads_ark_tools.id AND current.status = 'created'
               AND current.expires_at > ?
           )
           AND NOT EXISTS (
             SELECT 1 FROM canaco_payment_intents paid
             WHERE paid.lead_id = leads_ark_tools.id AND paid.status = 'paid'
           )`
      )
      .bind(now, now),
  ]);
}

export function canonicalizarRfc(value: string): string | null {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed || /\s/.test(trimmed)) return null;
  if (!/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(trimmed)) return null;

  const datePart = trimmed.slice(trimmed.length - 9, trimmed.length - 3);
  const year = 2000 + Number(datePart.slice(0, 2));
  const month = Number(datePart.slice(2, 4));
  const day = Number(datePart.slice(4, 6));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return trimmed;
}

export async function activateCanacoSocioByPayment(
  db: D1Database,
  evidence: VerifiedConektaEvidence
): Promise<CanacoPaymentActivationResult> {
  if (
    evidence.provider !== 'conekta' ||
    evidence.signatureVerified !== true ||
    !['order.paid', 'charge.paid'].includes(evidence.eventType) ||
    evidence.environment !== 'production' ||
    evidence.currency !== 'MXN' ||
    !evidence.leadId ||
    !evidence.intentId ||
    !evidence.transactionReference ||
    !Number.isInteger(evidence.amountCents) ||
    evidence.amountCents < 1
  ) {
    throw new Error('La evidencia de pago no cumple los requisitos de activación.');
  }

  const intent = await db
    .prepare(
      `SELECT id, lead_id, status, environment, amount_cents, order_id,
              transaction_reference, channel, expires_at
       FROM canaco_payment_intents
       WHERE id = ? AND lead_id = ? AND tenant_id = 'canaco_merida'
       LIMIT 1`
    )
    .bind(evidence.intentId, evidence.leadId)
    .first<{
      id: string;
      lead_id: string;
      status: string;
      environment: string;
      amount_cents: number;
      order_id: string | null;
      transaction_reference: string | null;
      channel: string;
      expires_at: string;
    }>();

  if (
    !intent ||
    intent.environment !== 'production' ||
    !['conekta_card', 'conekta_spei'].includes(intent.channel) ||
    intent.amount_cents !== evidence.amountCents ||
    intent.order_id !== evidence.transactionReference ||
    (intent.status !== 'paid' && Date.parse(intent.expires_at) <= Date.now())
  ) {
    throw new Error('La intención de pago no coincide con la evidencia del proveedor.');
  }

  const existingTransaction = await db
    .prepare(
      `SELECT id, lead_id, transaction_reference, status
       FROM canaco_payment_intents
       WHERE transaction_reference = ?
       LIMIT 1`
    )
    .bind(evidence.transactionReference)
    .first<{
      id: string;
      lead_id: string;
      transaction_reference: string;
      status: string;
    }>();

  if (
    existingTransaction &&
    (existingTransaction.id !== evidence.intentId ||
      existingTransaction.lead_id !== evidence.leadId)
  ) {
    throw new Error('La referencia de pago ya está asociada a otro registro.');
  }

  const evidenceJson = JSON.stringify({
    provider: evidence.provider,
    eventType: evidence.eventType,
    eventId: evidence.eventId,
    transactionReference: evidence.transactionReference,
    amountCents: evidence.amountCents,
    currency: evidence.currency,
    environment: evidence.environment,
  });

  const statements = [
    db
      .prepare(
        `UPDATE canaco_payment_intents
         SET status = 'paid', transaction_reference = ?, payment_event_id = ?, evidence_json = ?,
             paid_at = ?
         WHERE id = ? AND lead_id = ? AND environment = 'production'
           AND amount_cents = ? AND order_id = ?
           AND status IN ('created', 'paid')
           AND (status = 'paid' OR expires_at > ?)
           AND EXISTS (
             SELECT 1 FROM leads_ark_tools
             WHERE id = ? AND tenant_id = 'canaco_merida'
               AND lifecycle_stage IN ('pago_pendiente', 'socio_activo')
           )`
      )
      .bind(
        evidence.transactionReference,
        evidence.eventId,
        evidenceJson,
        evidence.paidAt,
        evidence.intentId,
        evidence.leadId,
        evidence.amountCents,
        evidence.transactionReference,
        evidence.paidAt,
        evidence.leadId
      ),
    db
      .prepare(
        `UPDATE leads_ark_tools
         SET status = 'Socio Activo', lifecycle_stage = 'socio_activo',
             payment_environment = ?,
             notas = COALESCE(notas, '') || ' | Pago Confirmado Conekta: '
               || ? || ' ($' || ? || ' MXN)',
             last_contact = DATE('now'), updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND tenant_id = 'canaco_merida' AND lifecycle_stage = 'pago_pendiente'
           AND EXISTS (
             SELECT 1 FROM canaco_payment_intents
             WHERE id = ? AND lead_id = ? AND status = 'paid'
               AND transaction_reference = ? AND amount_cents = ? AND environment = 'production'
           )`
      )
      .bind(
        evidence.environment,
        evidence.transactionReference,
        (evidence.amountCents / 100).toLocaleString('es-MX'),
        evidence.leadId,
        evidence.intentId,
        evidence.leadId,
        evidence.transactionReference,
        evidence.amountCents
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO canaco_lifecycle_audit
           (id, lead_id, actor_id, actor_email, from_stage, to_stage, reason,
            payment_outcome, evidence_reference)
         SELECT ?, ?, NULL, 'conekta', 'pago_pendiente', 'socio_activo',
                'Provider-verified Conekta payment', 'paid', ?
         WHERE EXISTS (
           SELECT 1 FROM leads_ark_tools
           WHERE id = ? AND tenant_id = 'canaco_merida' AND lifecycle_stage = 'socio_activo'
         )`
      )
      .bind(crypto.randomUUID(), evidence.leadId, evidence.transactionReference, evidence.leadId),
  ];

  const results = await db.batch(statements);
  if (results[0]?.meta.changes !== 1) {
    throw new Error('La intención dejó de ser válida antes de aplicar el pago.');
  }

  const updatedLead = await db
    .prepare(
      `SELECT lifecycle_stage, status
       FROM leads_ark_tools
       WHERE id = ? AND tenant_id = 'canaco_merida'
       LIMIT 1`
    )
    .bind(evidence.leadId)
    .first<{ lifecycle_stage: string; status: string }>();

  if (updatedLead?.lifecycle_stage !== 'socio_activo' || updatedLead.status !== 'Socio Activo') {
    throw new Error('El registro cambió antes de aplicar la confirmación de pago.');
  }

  return {
    activated: true,
    replay: existingTransaction?.id === evidence.intentId && intent.status === 'paid',
  };
}
