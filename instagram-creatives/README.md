# 🎨 ARK TOOLS — Instagram Creatives Generator

Generador de creativos de Instagram (1080×1080 @ 2x Retina) para campañas de ARK TOOLS.

## 🚀 Instalación

```bash
# 1. Instalar dependencias Python
pip install -r requirements.txt

# 2. Instalar navegador Chromium para Playwright
playwright install chromium
```

## 📖 Uso

### Generar todos los posts
```bash
python generate.py
```

### Generar un post específico
```bash
python generate.py --id release-validador-xml
```

### Cambiar escala de renderizado
```bash
# 1x = 1080x1080px (estándar)
python generate.py --scale 1

# 2x = 2160x2160px (Retina, default)
python generate.py --scale 2

# 3x = 3240x3240px (Ultra HD)
python generate.py --scale 3
```

## 📁 Estructura de Salida

```
creatives/
└── output/
    ├── release-validador-xml/
    │   ├── slide_01.png  (2160x2160px)
    │   ├── slide_02.png
    │   └── slide_03.png
    └── resico-2026-launch/
        ├── slide_01.png
        ├── slide_02.png
        └── slide_03.png
```

## 🎨 Layouts Disponibles

| Layout | Uso | Elementos |
|--------|-----|-----------|
| `problem` | Planteamiento del dolor | Badge color, título grande, descripción |
| `solution_glass` | Solución con glassmorphism | Badge, título dorado, tag técnico, descripción |
| `cta` | Llamado a la acción | Logo, título, botón dorado, URL |

## 📝 Formato de `posts.json`

```json
{
  "id": "identificador-unico",
  "type": "feature_release",
  "category": "NUEVA HERRAMIENTA",
  "slides": [
    {
      "layout": "problem",
      "badge": "EL PROBLEMA",
      "badge_color": "#ef4444",
      "title": "Título impactante.",
      "description": "Descripción del dolor."
    }
  ]
}
```

## 🛠️ Personalización

### Agregar nuevo layout
1. Editar `templates/template.html`
2. Agregar clase CSS `.layout-nuevo`
3. Agregar bloque `{% elif slide.layout == 'nuevo' %}` en Jinja2
4. Definir estructura HTML del slide

### Modificar colores ARK
Editar variables CSS en `:root`:
```css
--ark-navy: #0F172A;
--ark-gold: #F59E0B;
```

## 🔧 Troubleshooting

**Error: "Timeout esperando networkidle"**
- Las fuentes de Google Fonts tardaron en cargar. El script continúa con las disponibles.
- Solución: Verificar conexión a internet o usar fuentes locales.

**Imágenes pixeladas**
- Asegurar `--scale 2` o superior.
- Verificar que `device_scale_factor` se esté aplicando.

**Fuentes no cargan**
- Ejecutar `playwright install chromium` nuevamente.
- Verificar que el HTML incluya el `<link>` de Google Fonts.

## 📊 Métricas de Rendimiento

- **Tiempo por slide**: ~2-3 segundos
- **Tiempo por post (3 slides)**: ~8-10 segundos
- **Tamaño de imagen 2x**: ~400-600 KB PNG
- **RAM requerida**: ~500 MB (Chromium headless)

## 🎯 Casos de Uso

✅ Carruseles de Instagram (hasta 10 slides)
✅ Stories verticales (ajustar viewport)
✅ Posts estáticos de LinkedIn
✅ Thumbnails para YouTube
✅ Banners para newsletters

## 📜 Licencia

© 2026 Substrate Holdings LLC. Todos los derechos reservados.
