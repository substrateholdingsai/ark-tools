/**
 * ARK LEDGER — Generador de Links de Pago (Clip Checkout)
 * Tipos de datos para solicitudes de pago, comisiones e historial
 */

export interface ClipCheckoutPayload {
  amount: number;
  purchase_description: string;
  currency?: string;
  client_reference?: string;
  customer_name?: string;
  customer_email?: string;
  enable_oxxo?: boolean;
  expires_in_days?: number;
}

export interface ClipCheckoutResult {
  payment_request_id: string;
  payment_request_url: string;
  amount: number;
  currency: string;
  purchase_description: string;
  status: string;
  created_at: string;
  is_mock?: boolean;
  notice?: string;
}

export interface ComisionClip {
  montoCobrado: number;
  tasaBasePorcentaje: number; // 3.6%
  ivaComisionPorcentaje: number; // 16% sobre la comisión (0.576% total)
  tasaEfectivaPorcentaje: number; // 4.176%
  comisionTotal: number;
  netoRecibido: number;
  msiMeses: number; // 0 = sin MSI, 3, 6, 9, 12
  sobretasaMSIPorcentaje: number;
}

export interface LinkCobroGuardado {
  id: string;
  fecha: string;
  cliente: string;
  concepto: string;
  monto: number;
  url: string;
  paymentRequestId: string;
  isMock: boolean;
}
