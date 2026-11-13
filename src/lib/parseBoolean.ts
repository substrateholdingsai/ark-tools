/**
 * ARK LEDGER — Parser estricto de booleanos para entradas de herramientas.
 *
 * Los modelos de lenguaje y los formularios pueden enviar booleanos como
 * strings ("true"/"false", "1"/"0"). `Boolean("false")` es `true`, lo que
 * convierte un "no" en un "sí" y puede cambiar una tasa fiscal.
 *
 * Reglas:
 * - true/false booleanos se respetan.
 * - "true"/"false" (case-insensitive, con espacios) se interpretan.
 * - 1/0 numéricos se interpretan.
 * - Cualquier otro valor devuelve `undefined` para que el llamador aplique
 *   su default explícito (nunca un `Boolean(string)` silencioso).
 */
export function parseStrictBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }

  return undefined;
}
