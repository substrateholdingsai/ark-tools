# Retención 2% Clínicas y Hospitales (Yucatán)

**Identificador:** `retencion-clinicas` · **Alcance:** Exclusivo Yucatán (`Solo Yucatán, Art. 20-Bis LGHY`).

## Qué es

Herramienta determinista para clínicas, sanatorios y hospitales ubicados en el Estado de Yucatán que pagan honorarios médicos o contraprestaciones por servicios profesionales de salud, conforme a la **Ley General de Hacienda del Estado de Yucatán (LGHY)**, reforma **D.O. 26-dic-2025**.

## Marco Legal (LGHY)

- **Arts. 16 al 20:** Impuesto sobre el Ejercicio Profesional (tasa 3%, pago a más tardar el día 17 del mes siguiente).
- **Art. 20-Bis (adicionado D.O. 26-dic-2025):** Obligación de retener el **2%** al momento del pago y enterarlo a más tardar el **día 10 del mes siguiente**.
- **Art. 20-Ter:** Expedición de la constancia **AAFY-30** dentro de los **5 días** siguientes al pago (Art. 20-Ter LGHY). Acumulación mensual no confirmada en reglas oficiales.
- **Art. 20-Quater:** Responsabilidad solidaria del retenedor por las retenciones omitidas.
- **Art. 20-Quinquies:** Declaración informativa trimestral (1er y 2do trimestre 2026 acumulados en **julio 2026**).
- **Acuerdo AAFY 12/2026 (III.1.5):** Prórroga del entero correspondiente a enero 2026 hasta el **20 de febrero de 2026**.

## Ejemplo de Cálculo

Para honorarios médicos pagados por **$10,000.00 MXN**:

- **Base de retención:** `$10,000.00`
- **Retención 2% (Art. 20-Bis):** `$200.00`
- **Neto a pagar al prestador:** `$9,800.00`
- **Impuesto sobre Ejercicio Profesional 3% (informativo):** `$300.00`

## Formatos Exportables (CSV UTF-8 con BOM + Sello SHA-256)

1. **AAFY-30:** Constancia de Retención del Impuesto sobre el Ejercicio Profesional (incluye folio, mes/año, datos del retenedor con REC/CIEE, datos del prestador con REC o domicilio fiscal, base 1.1, impuesto retenido 1.2 y firmas).
2. **AAFY-31:** Declaración de Entero de Retenciones (resumen de entero y Anexo 31.1).
3. **CSV Cotejo Portal AAFY:** Resumen tabular para conciliación.
