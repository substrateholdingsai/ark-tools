import type {
  ValorFiscal,
  ResultadoVigencia,
  ConfigVigencia,
} from './tipos';

const CONFIG_DEFAULT: ConfigVigencia = {
  diasAlerta: 60,
  fechaReferencia: new Date(),
  infinitosSiSinFecha: true,
};

/**
 * Convierte una fecha ISO (YYYY-MM-DD) a Date en UTC mediodía,
 * evitando bugs de zona horaria.
 */
function parseFechaISO(iso: string): Date {
  const parts = iso.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Diferencia en días entre dos fechas (positivo si `b` es futuro).
 */
function diasEntre(a: Date, b: Date): number {
  const MS_DIA = 86_400_000;
  return Math.round((b.getTime() - a.getTime()) / MS_DIA);
}

/**
 * Evalúa el estado de vigencia de un valor fiscal.
 */
export function evaluarVigencia(
  valor: ValorFiscal,
  config: Partial<ConfigVigencia> = {}
): ResultadoVigencia {
  const cfg = { ...CONFIG_DEFAULT, ...config };
  const hoy = cfg.fechaReferencia;
  const desde = parseFechaISO(valor.vigencia.inicio);

  // Aún no entra en vigor
  if (hoy < desde) {
    const dias = diasEntre(hoy, desde);
    return {
      estado: 'proximo-vencer',
      diasRestantes: dias,
      mensaje: `Entra en vigor en ${dias} día${dias === 1 ? '' : 's'} (${valor.vigencia.inicio}).`,
      requiereAtencion: false,
    };
  }

  // Sin fecha de fin → nunca caduca (si config lo permite)
  if (valor.vigencia.fin === null) {
    if (cfg.infinitosSiSinFecha) {
      return {
        estado: 'vigente',
        diasRestantes: null,
        mensaje: 'Vigente sin fecha de caducidad conocida.',
        requiereAtencion: false,
      };
    }
    return {
      estado: 'vigente',
      diasRestantes: null,
      mensaje: 'Sin fecha de fin declarada. Verificar manualmente.',
      requiereAtencion: true,
    };
  }

  const hasta = parseFechaISO(valor.vigencia.fin);
  const dias = diasEntre(hoy, hasta);

  // Vencido
  if (dias < 0) {
    return {
      estado: 'vencido',
      diasRestantes: dias,
      mensaje: `Venció hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'} (${valor.vigencia.fin}). Actualizar.`,
      requiereAtencion: true,
    };
  }

  // Próximo a vencer
  if (dias <= cfg.diasAlerta) {
    return {
      estado: 'proximo-vencer',
      diasRestantes: dias,
      mensaje: `Vence en ${dias} día${dias === 1 ? '' : 's'} (${valor.vigencia.fin}).`,
      requiereAtencion: true,
    };
  }

  // Vigente
  return {
    estado: 'vigente',
    diasRestantes: dias,
    mensaje: `Vigente hasta ${valor.vigencia.fin}.`,
    requiereAtencion: false,
  };
}

/**
 * Evalúa un lote completo y separa por estado.
 */
export function evaluarLote(
  valores: readonly ValorFiscal[],
  config: Partial<ConfigVigencia> = {}
): {
  vigentes: ValorFiscal[];
  proximosAVencer: ValorFiscal[];
  vencidos: ValorFiscal[];
  criticos: ValorFiscal[];
} {
  const vigentes: ValorFiscal[] = [];
  const proximosAVencer: ValorFiscal[] = [];
  const vencidos: ValorFiscal[] = [];
  const criticos: ValorFiscal[] = [];

  for (const v of valores) {
    const r = evaluarVigencia(v, config);
    if (r.estado === 'vigente') vigentes.push(v);
    else if (r.estado === 'proximo-vencer') proximosAVencer.push(v);
    else if (r.estado === 'vencido') {
      vencidos.push(v);
      if (v.criticidad === 'ALTA') criticos.push(v);
    }
  }

  return { vigentes, proximosAVencer, vencidos, criticos };
}