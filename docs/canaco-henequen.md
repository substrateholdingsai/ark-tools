# 📄 canaco-henequen.md — Design System HENEQUÉN

- **Versión:** 1.0.0
- **Instancia:** HENEQUÉN (Museo Digital & Portal del Asociado)
- **Cliente / Tenant:** CANACO SERVYTUR Mérida — Cámara de Comercio, Servicios y Turismo
- **Tipo de Huésped:** `service` (institucional-cultural)
- **Sistema:** HENEQUÉN — patrimonio comercial yucateco
- **Fecha:** 2026-10-28
- **Base:** reconstrucción de canacomerida.com.mx + capa de modernización museográfica y suite fiscal
- **Filosofía:** el comercio yucateco tejido en fibra, cal y añil

> **HENEQUÉN no ilustra Yucatán: lo teje.**
> Cada fibra es una historia de comercio. Cada muro de cal, memoria.
> El portal hereda la autoridad de la Cámara y la calidez del patrimonio comercial de 120 años.

---

## 1 · Manifiesto

Mérida se construyó sobre dos blancos: la **cal** de su piedra y la **fibra** de su henequén.
Durante un siglo, el "oro verde" salió de estas tierras al mundo entero, y con esa riqueza
nació la vida empresarial que CANACO representa desde hace 120 años (1906–2026).

La plataforma no es un archivo muerto: es el telar donde la memoria comercial y los servicios
financieros-tributarios de Yucatán se siguen tejiendo. Por eso HENEQUÉN no decora: **cada textura es un hilo, cada color un capítulo**.

Regla ornamental: **Regla del 8% henequenero**. La fibra, la greca y el oro aparecen como
acento y textura sutil (≤8% de la superficie). El resto es cal, espacio negativo y orden institucional.

---

## 2 · Tokens de color

Sistema **claro-first** (museo = papel, luz, legibilidad en visita móvil). Incluye gemelos
institucionales en añil para secciones oscuras de galería inmersiva.

### 2.1 · Paleta núcleo — 4 roles obligatorios

| Rol                  | Token         |       HEX | HSL                | Tailwind                | Uso                                         |
| -------------------- | ------------- | --------: | ------------------ | ----------------------- | ------------------------------------------- |
| Fondo maestro        | `bg-primary`  | `#FAF8F5` | `hsl(36 33% 97%)`  | `bg-henequen-cal`       | **Cal** — fondo general del museo           |
| Fondo lienzo         | `bg-canvas`   | `#EFE7D8` | `hsl(39 42% 89%)`  | `bg-henequen-sisal`     | **Sisal** — secciones alternas, fibra clara |
| Superficie           | `bg-surface`  | `#FFFDF9` | `hsl(40 100% 99%)` | `bg-henequen-muro`      | **Muro** — tarjetas, cédulas, fichas        |
| Acento institucional | `accent-500`  | `#1A3A5C` | `hsl(211 56% 23%)` | `bg-henequen-anil`      | **Añil CANACO** — navegación, autoridad     |
| Acento cultural      | `accent-400`  | `#B85C38` | `hsl(17 53% 47%)`  | `bg-henequen-terra`     | **Terracota** — CTA, acentos de museo       |
| Línea                | `border-line` | `#E8E2D9` | `hsl(36 25% 88%)`  | `border-henequen-arena` | **Arena** — bordes, separadores             |

### 2.2 · Paleta extendida

| Token                 |       HEX | HSL                | Rol                                                                |
| --------------------- | --------: | ------------------ | ------------------------------------------------------------------ |
| `anil-deep`           | `#132D47` | `hsl(210 58% 18%)` | Añil profundo, galería inmersiva oscura                            |
| `henequen-verde`      | `#4A7C6F` | `hsl(164 25% 39%)` | Verde agave — estados de éxito, iconografía viva                   |
| `henequen-verde-dark` | `#33605A` | `hsl(172 31% 29%)` | Verde texto seguro (AA)                                            |
| `terra-dark`          | `#9E4A2A` | `hsl(17 58% 39%)`  | Terracota hover + texto terracota AA                               |
| `oro-sisal`           | `#C9A227` | `hsl(46 68% 47%)`  | Oro antiguo — highlights de exhibición, **solo decorativo/grande** |
| `oro-sisal-dark`      | `#8A6F1A` | `hsl(46 68% 32%)`  | Oro seguro como texto (AA)                                         |
| `grafito`             | `#2C2C2C` | `hsl(0 0% 17%)`    | Texto principal                                                    |
| `piedra`              | `#6B6B6B` | `hsl(0 0% 42%)`    | Texto secundario, metadatos                                        |
| `cal-texto`           | `#FAF8F5` | `hsl(36 33% 97%)`  | Texto claro sobre fondos añil                                      |

### 2.3 · Tabla de contraste WCAG verificada

| Combinación                               |       Ratio | Nivel    | Uso permitido                          |
| ----------------------------------------- | ----------: | -------- | -------------------------------------- |
| Grafito `#2C2C2C` / Cal `#FAF8F5`         | **13.17:1** | AAA      | Texto principal                        |
| Piedra `#6B6B6B` / Cal `#FAF8F5`          |  **5.03:1** | AA       | Texto secundario                       |
| Añil `#1A3A5C` / Cal `#FAF8F5`            | **10.98:1** | AAA      | Títulos institucionales, enlaces       |
| Terracota `#B85C38` / Cal `#FAF8F5`       |  **4.28:1** | AA-large | ⚠️ Solo texto ≥18px o decorativo       |
| Blanco `#FFF` / Terracota `#B85C38`       |  **4.54:1** | AA       | Texto en botón primario                |
| Blanco `#FFF` / Terracota dark `#9E4A2A`  |  **6.06:1** | AA       | Botón hover, texto seguro              |
| Terracota dark `#9E4A2A` / Cal `#FAF8F5`  |  **5.71:1** | AA       | ✅ Texto terracota pequeño             |
| Verde `#4A7C6F` / Cal `#FAF8F5`           |  **4.50:1** | AA       | Texto verde (límite, verificar tamaño) |
| Verde dark `#33605A` / Cal `#FAF8F5`      |  **6.69:1** | AA       | ✅ Texto verde seguro                  |
| Oro `#C9A227` / Cal `#FAF8F5`             |  **2.28:1** | FAIL     | ❌ Nunca texto. Solo decorativo        |
| Oro dark `#8A6F1A` / Cal `#FAF8F5`        |  **4.53:1** | AA       | Oro seguro como texto                  |
| Cal `#FAF8F5` / Añil `#1A3A5C`            | **10.98:1** | AAA      | Texto claro sobre azul (dark mode)     |
| Sisal `#EFE7D8` / Añil profundo `#132D47` | **11.44:1** | AAA      | Galería inmersiva                      |
| Grafito `#2C2C2C` / Muro `#FFFDF9`        | **13.75:1** | AAA      | Texto en tarjetas                      |

---

## 3 · Tríada tipográfica

| Rol         | Fuente          |    Peso | Uso                                              | Regla                                     |
| ----------- | --------------- | ------: | ------------------------------------------------ | ----------------------------------------- |
| Display     | `Fraunces`      | 600–700 | Títulos de exhibición, hero, encabezados de sala | Serif contemporánea con carácter cultural |
| Cuerpo / UI | `Inter`         | 400–500 | Párrafos, navegación, botones, cédulas           | Neutralidad legible, mobile-first         |
| Mono        | `IBM Plex Mono` | 400–500 | Años, folios de pieza, inventario, fechas        | **Obligatoria con `tabular-nums`**        |

---

## 4 · Metáfora de operación — el Museo Digital & Portal Cameral

| Concepto genérico          | Vocabulario HENEQUÉN          |
| -------------------------- | ----------------------------- |
| Sección / Calculadora      | `sala` / `cédula de trabajo`  |
| Contenido / Dictamen       | `pieza` o `acervo fiscal`     |
| Ficha de información       | `cédula` (ficha de museo)     |
| Categorías de herramientas | `curaduría`                   |
| Navegación / Catálogo      | `recorrido`                   |
| Usuario / Contribuyente    | `socio agremiado`             |
| Afiliación a CANACO        | `sumarse a la Cámara`         |
| Evento / Obligación fiscal | `agenda cameral`              |
| Pago de cuotas             | `ventanilla de refrendo SIEM` |
