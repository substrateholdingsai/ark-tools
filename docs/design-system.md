# ARK SYSTEMS — Sistema de Diseño

**Versión:** 1.0  
**Última actualización:** Octubre 2026  
**Mantenedor:** Substrate Holdings LLC  
**Aplicable a:** `ark-tools`, `ark-system`, `ark-compliance`, `ark-commerce`

---

## Índice

1. [Filosofía](#1-filosofía)
2. [Paleta de Color](#2-paleta-de-color)
3. [Tipografía](#3-tipografía)
4. [Espaciado y Layout](#4-espaciado-y-layout)
5. [Componentes Base](#5-componentes-base)
6. [Reglas de Oro](#6-reglas-de-oro)
7. [CSS Variables](#7-css-variables)
8. [Configuración Tailwind](#8-configuración-tailwind)
9. [Checklist de Entrega](#9-checklist-de-entrega)

---

## 1. Filosofía

### 1.1. El Problema

- **Gen Z no lee bloques densos.** Scrollean. Si el total no se ve como objeto, no existe.
- **Contadores ven muros de números.** 12 columnas iguales = ansiedad. Necesitan jerarquía física, no solo negritas.

### 1.2. La Solución ARK

- **Números como objetos físicos** (cúpula liquid glass con sombra de 8px).
- **Oro como señal de valor**, no decoración.
- **Blanco = confianza UNAM**, espacio para respirar.
- **El total es objeto, no texto.** Playfair 900 + text-shadow + drop-shadow dorado + 120% escala.

### 1.3. Principios Rectores

| Principio                   | Descripción                                            |
| --------------------------- | ------------------------------------------------------ |
| **Magnificación óptica**    | El ojo encuentra el dato clave sin leer.               |
| **Confianza institucional** | Blanco puro (#FFFFFF), no gris. Apple minimal + Pumas. |
| **Oro estratégico**         | Solo en 5 puntos por vista. Si todo brilla, nada vale. |
| **Jerarquía física**        | Los elementos tienen peso, sombra, profundidad.        |
| **Precisión contable**      | Cifras claras, tabulares, sin ambigüedad.              |

---

## 2. Paleta de Color

### 2.1. Colores del Sistema

| Nombre         | Hex       | Variable CSS   | Uso                                                            |
| -------------- | --------- | -------------- | -------------------------------------------------------------- |
| **Navy Trust** | `#002B7F` | `--navy`       | Primario. Confianza institucional, headers, acciones críticas. |
| **Navy Dark**  | `#001A4D` | `--navy-2`     | Sombra profunda, estados activos, contraste.                   |
| **Gold Value** | `#D4AF37` | `--gold`       | Señal de valor. Solo en totales, dividers, ganancias.          |
| **Gold Light** | `#F5D97A` | `--gold-light` | Highlight / shine de la cúpula. Hover states oro.              |
| **Gold Dark**  | `#A8883F` | `--gold-dark`  | Sombra física del domo. Borde 3D.                              |
| **LCD**        | `#9EA792` | `--lcd`        | Display vintage contable. Secundario / calculadora.            |
| **LCD Text**   | `#2A2F23` | `--lcd-text`   | Texto sobre LCD. Legibilidad contable.                         |
| **Cream**      | `#F5ECD7` | `--cream`      | Fondo cálido. Recibos, superficies suaves.                     |
| **Parchment**  | `#E8DCC4` | `--parchment`  | Línea, bordes, separación sutil.                               |
| **Surface**    | `#FFFFFF` | `--surface`    | Fondo principal. Blanco puro, no gris.                         |
| **Surface-2**  | `#F8F6F0` | `--surface-2`  | Fondo secundario, cards agrupadas.                             |
| **Ink**        | `#121A2E` | `--ink`        | Texto principal sobre blanco.                                  |
| **Muted**      | `#6B7A99` | `--muted`      | Texto secundario, labels, metadata.                            |
| **Line**       | `#E8E0CC` | `--line`       | Bordes, separadores, divisores sutiles.                        |

### 2.2. Reglas de Uso

- **Navy sobre blanco:** Contraste 12.1:1 (AAA). ✅
- **Oro sobre blanco:** Solo para acentos, nunca texto largo. ⚠️
- **Nunca fondo completo dorado.** Solo acento.
- **Nunca oro en errores o pérdidas.** Confunde valor.

---

## 3. Tipografía

### 3.1. Fuentes del Sistema

| Fuente               | Peso    | Uso                                        | Fallback                                         |
| -------------------- | ------- | ------------------------------------------ | ------------------------------------------------ |
| **Playfair Display** | 900     | Totales, dinero final, títulos editoriales | `Georgia, 'Times New Roman', serif`              |
| **Orbitron**         | 700     | Números UI, tablas, LCD, contadores        | `ui-monospace, SFMono-Regular, Menlo, monospace` |
| **Inter**            | 400-700 | Data, labels, body, todo lo demás          | `-apple-system, BlinkMacSystemFont, sans-serif`  |

### 3.2. Jerarquía Tipográfica

| Elemento           | Fuente   | Tamaño  | Peso | Tracking         |
| ------------------ | -------- | ------- | ---- | ---------------- |
| **Total (dinero)** | Playfair | 48-68px | 900  | -0.04em          |
| **Título H1**      | Playfair | 44-68px | 900  | -0.03em          |
| **Título H2**      | Playfair | 32-44px | 900  | -0.02em          |
| **Números UI**     | Orbitron | 22-36px | 700  | -0.02em          |
| **Labels**         | Inter    | 10-11px | 700  | 0.16em           |
| **Body**           | Inter    | 14-15px | 400  | 0                |
| **Small**          | Inter    | 10px    | 600  | 0.12em uppercase |

### 3.3. Reglas

- **Playfair 900** solo para dinero final. Si lo usas para labels, rompes el sistema.
- **Orbitron 700** con `tabular-nums` para tablas y números UI.
- **Inter** para todo lo que no es dinero. Legible, neutral, no compite.

---

## 4. Espaciado y Layout

### 4.1. Escala de Espaciado (basada en Tailwind)

| Token  | Valor | Uso                       |
| ------ | ----- | ------------------------- |
| `p-1`  | 4px   | Padding mínimo            |
| `p-2`  | 8px   | Padding de chips          |
| `p-3`  | 12px  | Padding de cards pequeñas |
| `p-4`  | 16px  | Padding estándar          |
| `p-6`  | 24px  | Padding de cards medianas |
| `p-8`  | 32px  | Padding de cards grandes  |
| `p-10` | 40px  | Padding de secciones      |
| `p-16` | 64px  | Padding de hero           |

### 4.2. Grid de Layout

| Breakpoint | Ancho     | Uso                   |
| ---------- | --------- | --------------------- |
| **Mobile** | `<640px`  | 1 columna, full-width |
| **sm**     | `≥640px`  | 2 columnas            |
| **md**     | `≥768px`  | 2-3 columnas          |
| **lg**     | `≥1024px` | 3-4 columnas, sidebar |
| **xl**     | `≥1280px` | 4-6 columnas          |

### 4.3. Contenedor Máximo

- **max-w-[1280px]** para landings y dashboards.
- **max-w-[1600px]** para aplicaciones data-heavy (ej. mapa de conductas).
- **max-w-[760px]** para contenido editorial.
- **max-w-[520px]** para formularios y calculadoras.

### 4.4. Radios de Borde

| Token            | Valor  | Uso                        |
| ---------------- | ------ | -------------------------- |
| `rounded`        | 4px    | Chips pequeños             |
| `rounded-[8px]`  | 8px    | Botones pequeños           |
| `rounded-[12px]` | 12px   | Inputs, cards pequeñas     |
| `rounded-[16px]` | 16px   | Cards medianas             |
| `rounded-[20px]` | 20px   | Cards grandes              |
| `rounded-[28px]` | 28px   | Cúpula, hero containers    |
| `rounded-full`   | 9999px | Pills, badges, botones CTA |

---

## 5. Componentes Base

### 5.1. `liquid-glass-dome`

**Uso:** Contenedor de dinero. Totales, precios, cifras clave.

```css
.liquid-glass-dome {
  background: linear-gradient(180deg, #fff, #fdfcf8 35%, #f5f0e1);
  box-shadow:
    0 8px 0 var(--gold-dark),
    0 14px 0 rgba(0, 43, 127, 0.08),
    0 24px 48px rgba(0, 43, 127, 0.12),
    inset 0 1px 0 #fff,
    inset 0 -1px 0 rgba(212, 175, 55, 0.3);
  position: relative;
  overflow: hidden;
}

.liquid-glass-dome::before {
  content: '';
  position: absolute;
  top: 0;
  left: 4%;
  right: 4%;
  height: 58%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9),
    rgba(255, 255, 255, 0.15) 55%,
    transparent
  );
  border-radius: 0 0 200px 200px;
  pointer-events: none;
}

.liquid-glass-dome::after {
  content: '';
  position: absolute;
  top: 8%;
  left: 12%;
  width: 28%;
  height: 18%;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0, transparent 70%);
  transform: rotate(-18deg);
  pointer-events: none;
}
```

### 5.2. `receipt-gold`

**Uso:** Recibos, facturas, comprobantes. Nunca más de 1 por vista.

```css
.receipt-gold {
  border: 1px solid var(--gold);
  outline: 3px solid var(--gold-light);
  outline-offset: -6px;
  box-shadow: 0 20px 40px rgba(0, 43, 127, 0.08);
}
```

### 5.3. `lcd-display`

**Uso:** Calculadora vintage, histórico contable. Secundario.

```css
.lcd-display {
  background: var(--lcd);
  color: var(--lcd-text);
  box-shadow:
    inset 0 3px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 0 rgba(255, 255, 255, 0.8);
  font-family: Orbitron, ui-monospace, monospace;
}
```

### 5.4. `glass-btn`

**Uso:** Botones interactivos. Variante `glass-btn-primary` para CTA.

```css
.glass-btn {
  background: linear-gradient(180deg, #fff, #f8f5eb);
  box-shadow:
    0 4px 0 var(--gold-dark),
    0 8px 20px rgba(0, 43, 127, 0.12),
    inset 0 1px 0 #fff;
  border: 1px solid #e8dcc4;
  transition: all 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glass-btn:active {
  transform: translateY(4px);
  box-shadow:
    0 0 0 var(--gold-dark),
    0 2px 8px rgba(0, 43, 127, 0.12),
    inset 0 1px 0 #fff;
}

.glass-btn-primary {
  background: linear-gradient(180deg, var(--gold-light) 0, var(--gold) 100%);
  color: var(--navy-2);
  border-color: var(--gold-dark);
}
```

### 5.5. `text-magnified`

**Uso:** Solo para totales. Playfair 900 + text-shadow + drop-shadow.

```css
.text-magnified {
  text-shadow:
    0 1px 0 #fff,
    0 2px 0 #f5ecd7,
    0 3px 0 #e8dcc4;
  filter: drop-shadow(0 6px 12px rgba(0, 43, 127, 0.18)) drop-shadow(0 2px 0 var(--gold));
}
```

### 5.6. `gold-divider`

**Uso:** Separador entre secciones de dinero. Con diamante ◆.

```css
.gold-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--gold-dark) 15%,
    var(--gold) 50%,
    var(--gold-dark) 85%,
    transparent
  );
  position: relative;
}

.gold-divider::after {
  content: '◆';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  color: var(--gold);
  background: var(--surface);
  padding: 0 12px;
  font-size: 10px;
  line-height: 1;
}
```

### 5.7. `badge-gold`

**Uso:** Badges de ganancia, verificación, destacados.

```css
.badge-gold {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  color: #2c1810;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
}
```

---

## 6. Reglas de Oro

### 6.1. DO — Oro Estratégico

✅ Total a pagar / cobrar en cúpula blanca con sombra oro.  
✅ Divider con diamante ◆ entre secciones de dinero.  
✅ Badge GANA $20k — solo ganancias positivas.  
✅ Botón primario: gradiente gold-light → gold.  
✅ Borde doble de recibo / folio verificado.

_Ejemplo correcto:_ 1 oro por pantalla, 80% blanco, 20% navy.

### 6.2. DON'T — Oro Decorativo

❌ Fondo completo dorado o degradado oro en header.  
❌ Texto largo en oro sobre blanco (ilegible).  
❌ Más de 2 elementos oro en misma vista.  
❌ Oro en estados de error o pérdida (confunde valor).  
❌ Iconos, ilustraciones o bordes finos en oro sin función.

_Antipatrón:_ Todo dorado = bazar, no sistema contable.

---

## 7. CSS Variables

```css
:root {
  /* Navy */
  --navy: #002b7f;
  --navy-2: #001a4d;

  /* Gold */
  --gold: #d4af37;
  --gold-light: #f5d97a;
  --gold-dark: #a8883f;

  /* LCD */
  --lcd: #9ea792;
  --lcd-text: #2a2f23;

  /* Surfaces */
  --surface: #ffffff;
  --surface-2: #f8f6f0;
  --cream: #f5ecd7;
  --parchment: #e8dcc4;

  /* Text */
  --ink: #121a2e;
  --muted: #6b7a99;

  /* Lines */
  --line: #e8e0cc;

  /* Safe Area (iOS) */
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
}
```

---

## 8. Configuración Tailwind

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#002B7F',
          dark: '#001A4D',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F5D97A',
          dark: '#A8883F',
        },
        lcd: {
          DEFAULT: '#9EA792',
          text: '#2A2F23',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F8F6F0',
        },
        cream: '#F5ECD7',
        parchment: '#E8DCC4',
        ink: '#121A2E',
        muted: '#6B7A99',
        line: '#E8E0CC',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        orbitron: ['Orbitron', 'ui-monospace', 'monospace'],
        inter: ['Inter', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        dome: '0 8px 0 var(--gold-dark), 0 14px 0 rgba(0,43,127,0.08), 0 24px 48px rgba(0,43,127,0.12)',
        glass: '0 4px 0 var(--gold-dark), 0 8px 20px rgba(0,43,127,0.12)',
        receipt: '0 20px 40px rgba(0,43,127,0.08)',
      },
      borderRadius: {
        dome: '28px',
        card: '20px',
        input: '14px',
      },
    },
  },
  plugins: [],
};
```

---

## 9. Checklist de Entrega

- [ ] Fuentes importadas y configuradas (`Playfair Display`, `Orbitron`, `Inter`).
- [ ] Variables CSS declaradas en `:root`.
- [ ] Configuración extendida de colores, sombras y radios en `tailwind.config.js`.
- [ ] Componentes estilizados siguiendo las reglas de oro (máx. 1 acento de oro por pantalla o bloque principal).
