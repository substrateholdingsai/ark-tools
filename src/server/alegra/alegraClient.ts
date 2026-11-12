/**
 * ARK LEDGER — Cliente REST para Facturapi v2 (Timbrado CFDI 4.0 Multi-Emisor)
 *
 * Reemplaza el conector legado de Alegra por Facturapi v2 (`https://www.facturapi.io/v2`),
 * permitiendo timbrado real de CFDI 4.0 tanto en Sandbox (`sk_test_...` con CSD de prueba
 * del SAT EKU9003173C9) como en Producción (`sk_live_...` con CSD del contribuyente),
 * descarga nativa de XML/PDF y cancelación ante el SAT (motivos 01, 02, 03, 04).
 *
 * Mantiene los alias `AlegraClient` y `AlegraError` para compatibilidad total con D1 y hooks.
 */

const FACTURAPI_BASE_URL = 'https://www.facturapi.io/v2';

export interface AlegraCompanyInfo {
  id: string;
  name: string;
  identification: string; // RFC en México
  regime?: string;
  email?: string;
  phone?: string;
  csd_configured: boolean;
  environment?: 'sandbox' | 'live';
  raw?: Record<string, unknown>;
}

export interface AlegraInvoiceItem {
  id?: string | number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  discount?: number;
  productKey?: string; // ClaveProdServ SAT (8 dígitos, ej. 84111500)
  codeCabys?: string; // Alias legado para ClaveProdServ SAT
  unit?: string; // ClaveUnidad SAT (ej. E48, H87, ACT)
  tax?: Array<{
    id?: string | number;
    percentage?: number;
    name?: string;
    type?: string;
    withholding?: boolean;
  }>;
}

export interface FacturapiInvoiceTax {
  type: 'IVA' | 'ISR' | 'IEPS';
  rate: number;
  factor?: 'Tasa' | 'Cuota' | 'Exento';
  withholding?: boolean;
}

export interface FacturapiInvoicePayload {
  type?: 'I' | 'E' | 'P' | 'N' | 'T';
  customer: {
    legal_name: string;
    tax_id: string;
    tax_system: string;
    email?: string;
    address: {
      zip: string;
    };
  };
  items: Array<{
    quantity: number;
    discount?: number;
    product: {
      description: string;
      product_key: string;
      unit_key?: string;
      unit_name?: string;
      price: number;
      tax_included?: boolean;
      taxes?: FacturapiInvoiceTax[];
    };
  }>;
  use: string;
  payment_form: string;
  payment_method: 'PUE' | 'PPD';
  series?: string;
  currency?: string;
  exchange?: number;
  external_id?: string;
  pdf_custom_section?: string;
}

export interface AlegraInvoicePayload {
  date?: string;
  dueDate?: string;
  type?: 'I' | 'E' | 'P' | 'N' | 'T';
  client?: {
    id?: string | number;
    name: string;
    identification: string; // RFC receptor
    email?: string;
    cfdiUse?: string; // G01, G03, S01, etc.
    regime?: string; // Régimen fiscal receptor (601, 612, 626, etc.)
    address?: {
      zipCode?: string; // Código postal (obligatorio en CFDI 4.0)
      street?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  };
  customer?: FacturapiInvoicePayload['customer'];
  items: AlegraInvoiceItem[] | FacturapiInvoicePayload['items'];
  paymentForm?: string; // Código SAT FormaPago ('01', '03', '04', '28', '99') o legado ('CASH', 'TRANSFER')
  paymentMethod?: string; // 'PUE' | 'PPD' o código SAT si viene invertido
  payment_form?: string;
  payment_method?: 'PUE' | 'PPD';
  cfdiUse?: string;
  use?: string;
  series?: string;
  currency?: {
    code: string;
    exchangeRate?: number;
  };
  observations?: string;
  termsConditions?: string;
  stamp?: {
    generateStamp: boolean;
  };
  external_id?: string;
}

export interface AlegraInvoiceResponse {
  id: string;
  date: string;
  dueDate?: string;
  status: 'open' | 'paid' | 'void' | 'draft';
  total: number;
  series?: string;
  folio_number?: number;
  verification_url?: string;
  numberTemplate?: {
    prefix?: string;
    number?: string | number;
    fullNumber?: string;
  };
  client?: {
    id?: string | number;
    name?: string;
    identification?: string;
  };
  stamp?: {
    uuid?: string;
    date?: string;
    satCertNumber?: string;
    xml?: string;
    pdf?: string;
    verificationUrl?: string;
  };
  pdf?: string;
  xml?: string;
  raw?: Record<string, unknown>;
}

export class FacturapiError extends Error {
  public readonly status: number;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string = 'FACTURAPI_API_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'FacturapiError';
    this.status = status;
    this.statusCode = status;
    this.code = code;
    this.details = details;
  }
}

export { FacturapiError as AlegraError };

const UNIT_KEY_MAP: Record<string, string> = {
  SERVICE: 'E48',
  SERVICIO: 'E48',
  UNIT: 'H87',
  PIECE: 'H87',
  PIEZA: 'H87',
  ACTIVITY: 'ACT',
  ACTIVIDAD: 'ACT',
  MONTH: 'MON',
  MES: 'MON',
  HOUR: 'HUR',
  HORA: 'HUR',
  DAY: 'DAY',
  DIA: 'DAY',
};

function normalizeSatUnitKey(rawUnit?: string): string {
  if (!rawUnit || !rawUnit.trim()) return 'E48';
  const cleaned = rawUnit.trim().toUpperCase();
  return UNIT_KEY_MAP[cleaned] || cleaned;
}

function normalizePaymentMethodAndForm(payload: AlegraInvoicePayload): {
  paymentMethod: 'PUE' | 'PPD';
  paymentForm: string;
} {
  const rawMethod = (payload.payment_method || payload.paymentMethod || '').trim().toUpperCase();
  const rawForm = (payload.payment_form || payload.paymentForm || '').trim().toUpperCase();

  let paymentMethod: 'PUE' | 'PPD' = 'PUE';
  if (rawMethod === 'PPD' || rawForm === 'PPD') {
    paymentMethod = 'PPD';
  } else if (rawMethod === 'PUE' || rawForm === 'PUE') {
    paymentMethod = 'PUE';
  }

  const LEGACY_FORM_MAP: Record<string, string> = {
    CASH: '01',
    EFECTIVO: '01',
    CHECK: '02',
    CHEQUE: '02',
    TRANSFER: '03',
    TRANSFERENCIA: '03',
    CARD: '04',
    CREDIT_CARD: '04',
    DEBIT_CARD: '28',
    TBD: '99',
    POR_DEFINIR: '99',
  };

  let candidateForm = rawForm;
  if (candidateForm === 'PUE' || candidateForm === 'PPD' || !candidateForm) {
    candidateForm = rawMethod !== 'PUE' && rawMethod !== 'PPD' ? rawMethod : '';
  }

  let paymentForm = LEGACY_FORM_MAP[candidateForm] || candidateForm;
  if (!/^\d{2}$/.test(paymentForm)) {
    paymentForm = paymentMethod === 'PPD' ? '99' : '03';
  }

  // En CFDI 4.0, si el método de pago es PPD la forma de pago debe ser 99 (Por definir)
  if (paymentMethod === 'PPD' && paymentForm !== '99') {
    paymentForm = '99';
  }

  return { paymentMethod, paymentForm };
}

/**
 * Transforma un payload de Ark Ledger (o un payload nativo de Facturapi)
 * al esquema oficial `POST /v2/invoices` de Facturapi CFDI 4.0.
 */
export function toFacturapiInvoicePayload(payload: AlegraInvoicePayload): FacturapiInvoicePayload {
  const customer = payload.customer ?? {
    legal_name: payload.client?.name?.trim() || 'PUBLICO EN GENERAL',
    tax_id: (payload.client?.identification || 'XAXX010101000').trim().toUpperCase(),
    tax_system: (payload.client?.regime || '601').trim(),
    ...(payload.client?.email ? { email: payload.client.email.trim() } : {}),
    address: {
      zip: (payload.client?.address?.zipCode || '06600').trim(),
    },
  };

  const { paymentMethod, paymentForm } = normalizePaymentMethodAndForm(payload);
  const cfdiUse = (payload.use || payload.cfdiUse || payload.client?.cfdiUse || 'G03')
    .trim()
    .toUpperCase();

  const items: FacturapiInvoicePayload['items'] = (payload.items as any[]).map((item) => {
    if (item && typeof item === 'object' && 'product' in item && item.product) {
      return item as FacturapiInvoicePayload['items'][number];
    }

    const legacyItem = item as AlegraInvoiceItem;
    const price = Number(legacyItem.price) || 0;
    const quantity = Number(legacyItem.quantity) || 1;
    const discountPct = Number(legacyItem.discount) || 0;
    const discountAmount =
      discountPct > 0 ? Number(((price * quantity * discountPct) / 100).toFixed(2)) : undefined;

    const description =
      legacyItem.description &&
      legacyItem.description.trim() &&
      legacyItem.description.trim() !== legacyItem.name.trim()
        ? `${legacyItem.name.trim()} - ${legacyItem.description.trim()}`
        : legacyItem.name.trim();

    const productKey = (legacyItem.productKey || legacyItem.codeCabys || '84111500').trim();
    const unitKey = normalizeSatUnitKey(legacyItem.unit);

    const rawTaxes =
      Array.isArray(legacyItem.tax) && legacyItem.tax.length > 0
        ? legacyItem.tax
        : [{ percentage: 16, name: 'IVA' }];

    const taxes: FacturapiInvoiceTax[] = rawTaxes.map((t) => {
      const rawPct = Number(t.percentage ?? 16);
      const rate = rawPct > 1 ? Number((rawPct / 100).toFixed(6)) : rawPct;
      const upperName = (t.name || t.type || 'IVA').toUpperCase();
      const taxType: 'IVA' | 'ISR' | 'IEPS' = upperName.includes('ISR')
        ? 'ISR'
        : upperName.includes('IEPS')
          ? 'IEPS'
          : 'IVA';
      const withholding = Boolean(
        t.withholding ||
        (t.type && t.type.toLowerCase() === 'retention') ||
        upperName.includes('RET')
      );
      return {
        type: taxType,
        rate,
        withholding,
      };
    });

    return {
      quantity,
      ...(discountAmount ? { discount: discountAmount } : {}),
      product: {
        description,
        product_key: productKey,
        unit_key: unitKey,
        price,
        tax_included: false,
        taxes,
      },
    };
  });

  return {
    type: payload.type || 'I',
    customer,
    items,
    use: cfdiUse,
    payment_form: paymentForm,
    payment_method: paymentMethod,
    ...(payload.series ? { series: payload.series } : {}),
    ...(payload.currency?.code ? { currency: payload.currency.code } : {}),
    ...(payload.currency?.exchangeRate ? { exchange: payload.currency.exchangeRate } : {}),
    ...(payload.external_id ? { external_id: payload.external_id } : {}),
    ...(payload.observations ? { pdf_custom_section: payload.observations } : {}),
  };
}

export class FacturapiClient {
  private readonly email: string;
  private readonly token: string;
  private readonly baseUrl: string;

  constructor(emailOrToken: string, token?: string, baseUrl: string = FACTURAPI_BASE_URL) {
    if (token !== undefined) {
      this.email =
        emailOrToken.trim() ||
        (token.trim().startsWith('sk_test_') ? 'sandbox@facturapi.io' : 'live@facturapi.io');
      this.token = token.trim();
    } else {
      this.token = emailOrToken.trim();
      this.email = this.token.startsWith('sk_test_') ? 'sandbox@facturapi.io' : 'live@facturapi.io';
    }
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public get environment(): 'sandbox' | 'live' {
    return this.token.startsWith('sk_live_') ? 'live' : 'sandbox';
  }

  private getAuthHeader(): string {
    return `Bearer ${this.token}`;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(init.headers);
    headers.set('Authorization', this.getAuthHeader());
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers,
      });
    } catch (err: any) {
      throw new FacturapiError(
        `Error de red al conectar con Facturapi: ${err?.message || 'Fallo de conexión'}`,
        502,
        'FACTURAPI_NETWORK_ERROR'
      );
    }

    let body: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        body = null;
      }
    } else {
      try {
        body = await response.text();
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      const apiMessage =
        typeof body === 'object' && body !== null
          ? body.message || body.error || JSON.stringify(body)
          : String(body || response.statusText);

      if (response.status === 401 || response.status === 403) {
        throw new FacturapiError(
          'Email o token incorrecto. Verifica tu Secret Key de Facturapi (sk_test_... o sk_live_...).',
          response.status,
          'FACTURAPI_AUTH_INVALID',
          body
        );
      }

      if (response.status === 400 || response.status === 422 || response.status === 409) {
        throw new FacturapiError(
          `Error de validación CFDI 4.0 en Facturapi: ${apiMessage}`,
          response.status,
          'FACTURAPI_VALIDATION_ERROR',
          body
        );
      }

      throw new FacturapiError(
        `Error del servidor de Facturapi (${response.status}): ${apiMessage}`,
        response.status,
        'FACTURAPI_SERVER_ERROR',
        body
      );
    }

    return body as T;
  }

  /**
   * Obtiene la información de la organización en Facturapi (`/v2/organizations/me`),
   * incluyendo RFC, Razón Social, Régimen Fiscal y estado del Certificado de Sello Digital (CSD).
   * En modo Sandbox (`sk_test_...`), Facturapi firma automáticamente con el CSD de prueba del SAT (`EKU9003173C9`).
   */
  async getCompany(): Promise<AlegraCompanyInfo> {
    const data = await this.request<any>('/organizations/me', { method: 'GET' });

    const legal = data?.legal && typeof data.legal === 'object' ? data.legal : {};
    const cert = data?.certificate && typeof data.certificate === 'object' ? data.certificate : {};

    const hasCertInApi = Boolean(
      cert.has_certificate === true ||
      cert.expires_at ||
      cert.serial_number ||
      cert.status === 'active' ||
      data?.is_production_ready === true ||
      data?.csd ||
      data?.hasCsd === true ||
      data?.electronicInvoicing === true
    );

    const isSandbox = this.environment === 'sandbox';
    const csdConfigured = isSandbox ? true : hasCertInApi;

    const rfc =
      legal.tax_id ||
      data?.identification ||
      data?.tax_id ||
      data?.rfc ||
      data?.nit ||
      (isSandbox ? 'EKU9003173C9' : '');

    const companyName =
      legal.name ||
      legal.legal_name ||
      data?.name ||
      data?.companyName ||
      (isSandbox ? 'ESCUELA KEMPER URGATE (Sandbox Facturapi)' : 'Organización Facturapi');

    const regime = String(
      legal.tax_system ||
        (typeof data?.regime === 'object' ? data?.regime?.code : data?.regime) ||
        '601'
    );

    return {
      id: String(data?.id || (isSandbox ? 'org_sandbox_facturapi' : 'org_live_facturapi')),
      name: String(companyName),
      identification: String(rfc).toUpperCase(),
      regime,
      email: String(legal.support_email || data?.email || this.email),
      phone: String(legal.phone || data?.phone || ''),
      csd_configured: csdConfigured,
      environment: this.environment,
      raw: data,
    };
  }

  /**
   * Emite y timbra una factura CFDI 4.0 en Facturapi (`POST /v2/invoices`).
   * Retorna el UUID fiscal del SAT, folio, URL de verificación y rutas de descarga PDF/XML.
   */
  async createInvoice(payload: AlegraInvoicePayload): Promise<AlegraInvoiceResponse> {
    const facturapiBody = toFacturapiInvoicePayload(payload);

    const raw = await this.request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(facturapiBody),
    });

    return this.normalizeInvoiceResponse(raw, facturapiBody);
  }

  /**
   * Consulta el detalle y estado actual de una factura en Facturapi (`GET /v2/invoices/:id`)
   */
  async getInvoice(invoiceId: string): Promise<AlegraInvoiceResponse> {
    const raw = await this.request<any>(`/invoices/${encodeURIComponent(invoiceId)}`, {
      method: 'GET',
    });

    return this.normalizeInvoiceResponse(raw);
  }

  /**
   * Cancela un CFDI 4.0 ante el SAT a través de Facturapi (`DELETE /v2/invoices/:id?motive=...`).
   * Motivos SAT válidos: '01' (Con relación), '02' (Sin relación), '03' (No se llevó a cabo), '04' (Factura global).
   */
  async cancelInvoice(
    invoiceId: string,
    motive: '01' | '02' | '03' | '04' = '02',
    substitution?: string
  ): Promise<AlegraInvoiceResponse> {
    const params = new URLSearchParams({ motive });
    if (substitution && substitution.trim()) {
      params.set('substitution', substitution.trim());
    }
    const raw = await this.request<any>(
      `/invoices/${encodeURIComponent(invoiceId)}?${params.toString()}`,
      { method: 'DELETE' }
    );

    return this.normalizeInvoiceResponse(raw);
  }

  /**
   * Descarga el archivo binario (PDF, XML o ZIP) de una factura timbrada en Facturapi
   * (`GET /v2/invoices/:id/pdf` | `/xml` | `/zip`).
   */
  async downloadInvoiceFile(
    invoiceId: string,
    format: 'pdf' | 'xml' | 'zip'
  ): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    const url = `${this.baseUrl}/invoices/${encodeURIComponent(invoiceId)}/${format}`;
    const headers = new Headers();
    headers.set('Authorization', this.getAuthHeader());

    let response: Response;
    try {
      response = await fetch(url, { method: 'GET', headers });
    } catch (err: any) {
      throw new FacturapiError(
        `Error de red al descargar ${format.toUpperCase()} de Facturapi: ${err?.message || 'Fallo de conexión'}`,
        502,
        'FACTURAPI_NETWORK_ERROR'
      );
    }

    if (!response.ok) {
      throw new FacturapiError(
        `No se pudo descargar el archivo ${format.toUpperCase()} de Facturapi (${response.status}).`,
        response.status,
        'FACTURAPI_DOWNLOAD_ERROR'
      );
    }

    const buffer = await response.arrayBuffer();
    const defaultMime =
      format === 'pdf'
        ? 'application/pdf'
        : format === 'xml'
          ? 'application/xml; charset=utf-8'
          : 'application/zip';

    return {
      buffer,
      contentType: response.headers.get('content-type') || defaultMime,
    };
  }

  private normalizeInvoiceResponse(
    raw: any,
    sentPayload?: FacturapiInvoicePayload
  ): AlegraInvoiceResponse {
    const invoiceId = String(raw?.id || '');
    const uuid =
      raw?.uuid || raw?.stamp?.uuid || raw?.cfdi?.uuid || raw?.electronicBilling?.uuid || undefined;

    const series = raw?.series || raw?.numberTemplate?.prefix || sentPayload?.series || 'F';
    const folioNumber =
      raw?.folio_number ?? raw?.numberTemplate?.number ?? raw?.number ?? undefined;
    const fullNumber =
      raw?.numberTemplate?.fullNumber ||
      (series && folioNumber !== undefined
        ? `${series}-${folioNumber}`
        : folioNumber !== undefined
          ? String(folioNumber)
          : invoiceId);

    // Mapear estatus Facturapi ('valid' | 'canceled' | 'draft' | 'pending') a D1 ('open' | 'paid' | 'void' | 'draft')
    const rawStatus = String(raw?.status || 'valid').toLowerCase();
    let normalizedStatus: 'open' | 'paid' | 'void' | 'draft' = 'open';
    if (rawStatus === 'canceled' || rawStatus === 'cancelled' || rawStatus === 'void') {
      normalizedStatus = 'void';
    } else if (rawStatus === 'draft') {
      normalizedStatus = 'draft';
    } else if (rawStatus === 'paid') {
      normalizedStatus = 'paid';
    } else {
      normalizedStatus = 'open';
    }

    const pdfUrl =
      raw?.stamp?.pdf ||
      raw?.pdf ||
      raw?.pdfUrl ||
      (invoiceId ? `/api/facturapi/invoices/${invoiceId}/pdf` : undefined);
    const xmlUrl =
      raw?.stamp?.xml ||
      raw?.xml ||
      raw?.xmlUrl ||
      (invoiceId ? `/api/facturapi/invoices/${invoiceId}/xml` : undefined);
    const verificationUrl = raw?.verification_url || raw?.stamp?.verificationUrl || undefined;

    const customerName =
      raw?.customer?.legal_name ||
      raw?.client?.name ||
      sentPayload?.customer?.legal_name ||
      undefined;
    const customerRfc =
      raw?.customer?.tax_id ||
      raw?.client?.identification ||
      sentPayload?.customer?.tax_id ||
      undefined;

    return {
      id: invoiceId,
      date: String(raw?.created_at || raw?.date || new Date().toISOString()),
      dueDate: raw?.dueDate ? String(raw.dueDate) : undefined,
      status: normalizedStatus,
      total: Number(raw?.total || 0),
      series: String(series),
      folio_number: folioNumber !== undefined ? Number(folioNumber) : undefined,
      verification_url: verificationUrl,
      numberTemplate: {
        prefix: String(series),
        number: folioNumber,
        fullNumber,
      },
      client: {
        id: raw?.customer?.id || raw?.client?.id,
        name: customerName,
        identification: customerRfc,
      },
      stamp: {
        uuid,
        date: raw?.stamp?.date || raw?.created_at || raw?.date,
        satCertNumber: raw?.stamp?.sat_cert_number || raw?.stamp?.satCertNumber,
        xml: xmlUrl,
        pdf: pdfUrl,
        verificationUrl,
      },
      pdf: pdfUrl,
      xml: xmlUrl,
      raw,
    };
  }
}

export { FacturapiClient as AlegraClient };
