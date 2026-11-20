-- ARK LEDGER - Migración 0019: Órdenes de pago Caja (payment_orders) + revivir billing_webhook_events
-- Contrato de consumo de Caja (POST /api/internal/payments/order, webhooks HMAC).
-- No aplicar en esta fase (solo crear migración). No deploy.
--
-- payment_orders: espejo genérico de órdenes Caja (no insertar `pending` en tenant_subscriptions;
-- 0008 tenant_subscriptions.status CHECK: active/past_due/canceled).
-- billing_webhook_events (0011) se revive como idempotencia de webhooks Caja:
--   - external_id (0011:8, UNIQUE) = event_id de Caja.
--   - se agregan caja_order_id y rail + índice único parcial en caja_order_id.
-- No ampliar canaco_payment_intents.channel CHECK (0014:33) en esta migración.

CREATE TABLE IF NOT EXISTS payment_orders (
  id               TEXT PRIMARY KEY, -- ULID
  caja_order_id    TEXT UNIQUE,
  tenant_id        TEXT NOT NULL,
  user_id          TEXT,
  concept          TEXT NOT NULL CHECK (concept IN ('canaco_membership', 'ark_pro_upgrade')),
  amount_cents     INTEGER NOT NULL,
  currency         TEXT NOT NULL CHECK (currency IN ('MXN')),
  rail             TEXT NOT NULL CHECK (rail IN ('codi', 'spei', 'paypal')),
  status           TEXT NOT NULL CHECK (status IN ('created', 'pending', 'paid', 'failed', 'expired', 'refunded')),
  provider         TEXT NOT NULL DEFAULT 'caja' CHECK (provider IN ('caja', 'legacy')),
  webhook_event_id TEXT,
  paid_at          INTEGER,
  expires_at       INTEGER,
  metadata_json    TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índice UNIQUE parcial en caja_order_id donde no nulo (además de UNIQUE en columna para compatibilidad)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_caja_order_id
  ON payment_orders(caja_order_id)
  WHERE caja_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_orders_tenant_concept_status
  ON payment_orders(tenant_id, concept, status);

CREATE INDEX IF NOT EXISTS idx_payment_orders_webhook_event_id
  ON payment_orders(webhook_event_id);

-- Revivir billing_webhook_events (0011) para idempotencia de webhooks Caja
-- external_id (0011:8) ya es UNIQUE y se usa para event_id de Caja.
ALTER TABLE billing_webhook_events ADD COLUMN caja_order_id TEXT;
ALTER TABLE billing_webhook_events ADD COLUMN rail TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_webhook_events_caja_order_id
  ON billing_webhook_events(caja_order_id)
  WHERE caja_order_id IS NOT NULL;