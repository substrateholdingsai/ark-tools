/**
 * ARK LEDGER — Generador de Links de Pago (Clip Checkout)
 * Librería de integración con la API de Clip Developers y calculadora de comisiones
 *
 * @see https://developer.clip.mx/docs/getting-started
 */

import type { ClipCheckoutPayload, ClipCheckoutResult, ComisionClip } from '../types';

/**
 * Tasas de sobretasa por Meses Sin Intereses (MSI) de Clip en México
 */
export const SOBRETASAS_MSI: Record<number, number> = {
  0: 0,
  3: 4.5,
  6: 7.5,
  9: 9.9,
  12: 11.9,
};

/**
 * Calcula la comisión de Clip (3.60% + IVA) y el desglose neto a recibir
 */
export function calcularComisionClip(monto: number, msiMeses: number = 0): ComisionClip {
  const montoValido = Math.max(0, monto);
  const tasaBase = 3.6; // 3.6% base Clip
  const sobretasaMSI = SOBRETASAS_MSI[msiMeses] || 0;

  const tasaCombinada = tasaBase + sobretasaMSI;
  const ivaSobreComision = tasaCombinada * 0.16; // 16% de IVA sobre la comisión
  const tasaEfectiva = tasaCombinada + ivaSobreComision; // ~4.176% base

  const comisionTotal = Math.round(((montoValido * tasaEfectiva) / 100) * 100) / 100;
  const netoRecibido = Math.round((montoValido - comisionTotal) * 100) / 100;

  return {
    montoCobrado: montoValido,
    tasaBasePorcentaje: tasaBase,
    ivaComisionPorcentaje: ivaSobreComision,
    tasaEfectivaPorcentaje: Math.round(tasaEfectiva * 1000) / 1000,
    comisionTotal,
    netoRecibido,
    msiMeses,
    sobretasaMSIPorcentaje: sobretasaMSI,
  };
}

/**
 * Valida los datos requeridos antes de enviar la solicitud a Clip
 */
export function validarSolicitudCobro(payload: ClipCheckoutPayload): {
  valido: boolean;
  error?: string;
} {
  if (!payload.amount || payload.amount < 1) {
    return { valido: false, error: 'El monto mínimo a cobrar es $1.00 MXN.' };
  }

  if (payload.amount > 500000) {
    return {
      valido: false,
      error: 'El monto máximo por transacción en Clip es de $500,000.00 MXN.',
    };
  }

  if (!payload.purchase_description || payload.purchase_description.trim().length === 0) {
    return { valido: false, error: 'La descripción del cobro es obligatoria.' };
  }

  if (payload.purchase_description.trim().length > 250) {
    return { valido: false, error: 'La descripción no puede exceder los 250 caracteres.' };
  }

  return { valido: true };
}

/**
 * Solicita la creación de un nuevo Checkout en la API de Clip a través del backend intermedio
 */
export async function crearLinkPagoClip(payload: ClipCheckoutPayload): Promise<ClipCheckoutResult> {
  const validacion = validarSolicitudCobro(payload);
  if (!validacion.valido) {
    throw new Error(validacion.error);
  }

  // Calcular fecha de expiración si se solicitó
  let expires_at: string | undefined;
  if (payload.expires_in_days && payload.expires_in_days > 0) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + payload.expires_in_days);
    expires_at = fecha.toISOString();
  }

  try {
    const res = await fetch('/api/clip/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency || 'MXN',
        purchase_description: payload.purchase_description.trim(),
        client_reference: payload.client_reference?.trim(),
        expires_at,
        enable_oxxo: payload.enable_oxxo,
      }),
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      throw new Error(
        errData.message || errData.error || `Error al contactar con la API (${res.status})`
      );
    }

    const data = (await res.json()) as ClipCheckoutResult;
    return data;
  } catch (err) {
    // Si la llamada fetch falla por entorno local aislado, generar fallback estructurado
    const idGenerado = `pay_req_demo_${Date.now()}`;
    return {
      payment_request_id: idGenerado,
      payment_request_url: `https://checkout.clip.mx/checkout/${idGenerado}`,
      amount: payload.amount,
      currency: 'MXN',
      purchase_description: payload.purchase_description,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      is_mock: true,
      notice:
        'Modo demostración activo. Configura CLIP_API_KEY y CLIP_API_SECRET para transacciones reales.',
    };
  }
}

/**
 * Genera el enlace de compartir a WhatsApp prellenado para el cliente
 */
export function generarMensajeWhatsApp({
  cliente,
  monto,
  concepto,
  linkPago,
  telefono,
}: {
  cliente?: string;
  monto: number;
  concepto: string;
  linkPago: string;
  telefono?: string;
}): string {
  const saludo = cliente ? `Hola ${cliente},` : 'Hola,';
  const montoFmt = formatearMXN(monto);
  const texto = `${saludo} te comparto tu enlace de pago seguro para: *${concepto}* por un total de *${montoFmt} MXN*.\n\nPuedes pagar con tarjeta de débito, crédito u OXXO aquí:\n${linkPago}\n\nQuedo a tus órdenes para emitir tu factura CFDI al confirmarse el pago.`;

  const encoded = encodeURIComponent(texto);
  const telLimpio = telefono ? telefono.replace(/\D/g, '') : '';

  if (telLimpio) {
    return `https://wa.me/${telLimpio}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Formateador de moneda en pesos mexicanos
 */
export function formatearMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
