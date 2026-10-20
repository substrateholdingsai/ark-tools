/**
 * ARK TOOLS — Cliente HTTP REST para Alegra API (v1)
 *
 * Se comunica con Alegra usando Basic Auth (email:token).
 * Maneja la validación de cuentas, consulta de empresa/CSD y emisión de CFDI 4.0.
 */

export interface AlegraCompanyInfo {
  id: string;
  name: string;
  identification: string;
  regime?: string;
  csd_configured: boolean;
  email?: string;
  phone?: string;
  currency?: string;
  raw?: Record<string, unknown>;
}

export interface AlegraInvoiceItem {
  id?: number | string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  discount?: number;
  productKey?: string; // Clave SAT (ej: '84111500')
  unit?: string; // Clave unidad SAT (ej: 'E48')
  tax?: Array<{
    id?: number | string;
    name?: string;
    percentage: number;
  }>;
}

export interface AlegraInvoicePayload {
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  client: {
    id?: string | number;
    name: string;
    identification: string; // RFC
    email?: string;
    cfdiUse?: string; // Ej: 'G03', 'CP01', etc.
    regime?: string; // Régimen fiscal del receptor (ej: '601', '605')
    address?: {
      zipCode: string; // CP fiscal obligatorio SAT 4.0
      street?: string;
      exteriorNumber?: string;
      city?: string;
      state?: string;
    };
  };
  items: AlegraInvoiceItem[];
  paymentMethod?: 'PUE' | 'PPD';
  paymentForm?: string; // Ej: '01' (Efectivo), '03' (Transferencia), etc.
  observations?: string;
  anotation?: string;
  stamp?: {
    generateStamp: boolean;
  };
}

export interface AlegraInvoiceResponse {
  id: string;
  numberTemplate?: {
    prefix?: string;
    number?: string | number;
    fullNumber?: string;
  };
  date: string;
  dueDate?: string;
  client: {
    name: string;
    identification: string;
    email?: string;
  };
  total: number;
  status: 'open' | 'paid' | 'void' | 'draft';
  stamp?: {
    uuid?: string;
    date?: string;
    xml?: string;
    pdf?: string;
    legalStatus?: string;
  };
  raw?: Record<string, unknown>;
}

export class AlegraError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AlegraError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AlegraClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(email: string, token: string, baseUrl = 'https://api.alegra.com/api/v1') {
    if (!email || !token) {
      throw new AlegraError(
        'Email y token de Alegra son requeridos para inicializar el cliente.',
        400
      );
    }
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    const credentials = `${email.trim()}:${token.trim()}`;
    // Basic Auth RFC 7617
    const encoded =
      typeof btoa === 'function' ? btoa(credentials) : Buffer.from(credentials).toString('base64');
    this.authHeader = `Basic ${encoded}`;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', this.authHeader);
    headers.set('Accept', 'application/json');
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err) {
      throw new AlegraError(
        'Alegra no respondió a tiempo o hubo un error de conexión. Reintenta.',
        504,
        err instanceof Error ? err.message : err
      );
    }

    if (response.status === 401) {
      throw new AlegraError(
        'Email o token incorrecto. Verifica tus credenciales en Alegra → Configuración → API.',
        401
      );
    }

    if (response.status === 403) {
      throw new AlegraError(
        'Tu plan de Alegra no incluye acceso a la API REST o no cuenta con los permisos necesarios.',
        403
      );
    }

    if (response.status === 429) {
      throw new AlegraError(
        'Alegra limitó las solicitudes (Rate Limit). Espera unos minutos antes de reintentar.',
        429
      );
    }

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors)
          ? data.errors.map((e: any) => e.message || e).join(', ')
          : null) ||
        `Error ${response.status} devuelto por Alegra.`;
      throw new AlegraError(errorMsg, response.status, data);
    }

    return data as T;
  }

  /**
   * Obtiene los datos de la empresa vinculada y valida estado de CSD / RFC
   */
  async getCompany(): Promise<AlegraCompanyInfo> {
    const company = await this.request<any>('/company');

    const id = String(company.id || company.companyId || 'alegra-company');
    const name = company.name || company.businessName || 'Empresa Alegra';
    const identification = company.identification || company.rfc || '';
    const regime = company.regime || company.taxRegime || '';
    const email = company.email || '';
    const phone = company.phone || '';
    const currency = company.currency?.code || 'MXN';

    // Detección de Certificado de Sello Digital (CSD)
    // Alegra almacena la configuración de timbrado en su perfil fiscal
    const hasCertificate = Boolean(
      company.certificate ||
      company.csd ||
      company.hasCertificate ||
      company.settings?.cfdi?.hasCertificate ||
      company.settings?.csd ||
      company.invoiceSettings?.csdConfigured ||
      (identification && identification.length >= 12)
    );

    return {
      id,
      name,
      identification,
      regime,
      csd_configured: hasCertificate,
      email,
      phone,
      currency,
      raw: company,
    };
  }

  /**
   * Emite y timbra una factura CFDI 4.0 en Alegra
   */
  async createInvoice(payload: AlegraInvoicePayload): Promise<AlegraInvoiceResponse> {
    // Por defecto forzar stamp = generateStamp: true para timbrar en tiempo real
    const bodyWithStamp: AlegraInvoicePayload = {
      ...payload,
      stamp: {
        generateStamp: payload.stamp?.generateStamp ?? true,
      },
    };

    const res = await this.request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(bodyWithStamp),
    });

    const prefix = res.numberTemplate?.prefix || '';
    const num = res.numberTemplate?.number || res.id;
    const fullNumber = prefix ? `${prefix}-${num}` : String(num);

    return {
      id: String(res.id),
      numberTemplate: {
        prefix,
        number: num,
        fullNumber,
      },
      date: res.date || new Date().toISOString().slice(0, 10),
      dueDate: res.dueDate,
      client: {
        name: res.client?.name || payload.client.name,
        identification: res.client?.identification || payload.client.identification,
        email: res.client?.email || payload.client.email,
      },
      total: Number(res.total || 0),
      status: (res.status as any) || 'open',
      stamp: res.stamp
        ? {
            uuid: res.stamp.uuid || res.stamp.folioFiscal,
            date: res.stamp.date,
            xml: res.stamp.xml,
            pdf: res.stamp.pdf || res.pdfUrl,
            legalStatus: res.stamp.legalStatus,
          }
        : undefined,
      raw: res,
    };
  }

  /**
   * Consulta una factura por su ID en Alegra
   */
  async getInvoice(invoiceId: string): Promise<AlegraInvoiceResponse> {
    const res = await this.request<any>(`/invoices/${encodeURIComponent(invoiceId)}`);
    const prefix = res.numberTemplate?.prefix || '';
    const num = res.numberTemplate?.number || res.id;
    const fullNumber = prefix ? `${prefix}-${num}` : String(num);

    return {
      id: String(res.id),
      numberTemplate: {
        prefix,
        number: num,
        fullNumber,
      },
      date: res.date,
      dueDate: res.dueDate,
      client: {
        name: res.client?.name || '',
        identification: res.client?.identification || '',
        email: res.client?.email,
      },
      total: Number(res.total || 0),
      status: (res.status as any) || 'open',
      stamp: res.stamp
        ? {
            uuid: res.stamp.uuid || res.stamp.folioFiscal,
            date: res.stamp.date,
            xml: res.stamp.xml,
            pdf: res.stamp.pdf || res.pdfUrl,
            legalStatus: res.stamp.legalStatus,
          }
        : undefined,
      raw: res,
    };
  }
}
