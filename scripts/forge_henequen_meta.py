#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HENEQUÉN — Fábrica Vectorial · CANACO SERVYTUR Mérida (Museo Digital & Portal del Asociado)
Stdlib pura: math, random, pathlib, json, argparse. Cero Pillow/Cairo.
"""

import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import argparse
import json
import math
import random
from pathlib import Path

XML = '<?xml version="1.0" encoding="UTF-8"?>\n'
_rng = random.Random(20261028)
NOISE_SEED = _rng.randint(1000, 9999)

# ── Paleta HENEQUÉN ──
CAL      = "#FAF8F5"
SISAL    = "#EFE7D8"
MURO     = "#FFFDF9"
ARENA    = "#E8E2D9"
ANIL     = "#1A3A5C"
ANIL_DP  = "#132D47"
VERDE    = "#4A7C6F"
VERDE_DK = "#33605A"
TERRA    = "#B85C38"
TERRA_DK = "#9E4A2A"
ORO      = "#C9A227"
GRAFITO  = "#2C2C2C"
PIEDRA   = "#6B6B6B"


# ══════════════ MONOGRAMA HENEQUÉN (hoja de agave geométrica) ══════════════
def _roseta_agave(cx, cy, r_hoja, n_hojas=9, color_fibra=ORO, color_punta=VERDE):
    """Roseta geométrica de hojas de agave (henequén), abstracta y botánica."""
    hojas = []
    for i in range(n_hojas):
        ang = -90 + (i - (n_hojas - 1) / 2) * (170 / (n_hojas - 1))
        rad = math.radians(ang)
        # punta de la hoja
        px = cx + r_hoja * math.cos(rad)
        py = cy + r_hoja * math.sin(rad)
        # base ancha perpendicular
        perp = rad + math.pi / 2
        bw = r_hoja * 0.16
        b1x = cx + bw * math.cos(perp)
        b1y = cy + bw * math.sin(perp)
        b2x = cx - bw * math.cos(perp)
        b2y = cy - bw * math.sin(perp)
        hojas.append(
            f'<path d="M{b1x:.1f} {b1y:.1f} L{px:.1f} {py:.1f} L{b2x:.1f} {b2y:.1f} Z" '
            f'fill="{color_fibra}" opacity="0.92"/>'
        )
    centro = f'<circle cx="{cx}" cy="{cy}" r="{r_hoja*0.13:.1f}" fill="{color_punta}"/>'
    return "\n    ".join(hojas) + "\n    " + centro


MONOGRAM_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="mnCal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{MURO}"/>
      <stop offset="1" stop-color="{SISAL}"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="58" fill="url(#mnCal)" stroke="{ARENA}" stroke-width="2"/>
  <circle cx="64" cy="64" r="50" fill="none" stroke="{VERDE}" stroke-width="1" opacity="0.35"/>
  <g transform="translate(0 8)">
    {_roseta_agave(64, 78, 34, 9, ORO, VERDE_DK)}
  </g>
  <path d="M40 100 H88" stroke="{TERRA}" stroke-width="3" stroke-linecap="round"/>
</svg>
"""


# ══════════════ FAVICON (viewBox 64, rx=14) ══════════════
FAVICON_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="favAnil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{ANIL}"/>
      <stop offset="1" stop-color="{ANIL_DP}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#favAnil)"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="{VERDE}" stroke-width="1" opacity="0.4"/>
  <g transform="translate(32 38) scale(0.42) translate(-64 -78)">
    {_roseta_agave(64, 78, 34, 9, ORO, TERRA)}
  </g>
  <path d="M22 48 H42" stroke="{CAL}" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
</svg>
"""


# ══════════════ LOGO LOCKUP (~640×160) ══════════════
LOGO_LOCKUP_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" width="640" height="160">
  <g transform="translate(24 32) scale(1.5)">
    <circle cx="32" cy="32" r="30" fill="{ANIL}"/>
    <g transform="translate(32 40) scale(0.42) translate(-64 -78)">
      {_roseta_agave(64, 78, 34, 9, ORO, TERRA)}
    </g>
    <path d="M18 50 H46" stroke="{CAL}" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
  </g>
  <text x="130" y="76" font-family="Fraunces, Georgia, serif" font-size="46" font-weight="700" letter-spacing="1" fill="{ANIL}">CANACO</text>
  <text x="132" y="104" font-family="Inter, Helvetica, Arial, sans-serif" font-size="15" font-weight="500" letter-spacing="3" fill="{PIEDRA}">SERVYTUR MÉRIDA</text>
  <text x="132" y="130" font-family="'IBM Plex Mono', Consolas, monospace" font-size="12" letter-spacing="2" fill="{TERRA}">MUSEO DIGITAL · 120 AÑOS</text>
  <path d="M130 142 H600" stroke="{ARENA}" stroke-width="1.5"/>
</svg>
"""


# ══════════════ PATRÓN SISAL (fibra tejida, seamless <4KB, opacidad baja) ══════════════
def build_pattern_sisal() -> str:
    """Urdimbre y trama de fibra de henequén: líneas diagonales cruzadas."""
    hilos = []
    # urdimbre (diagonal /)
    for i in range(-64, 128, 12):
        hilos.append(
            f'<line x1="{i}" y1="0" x2="{i+64}" y2="64" stroke="{VERDE}" '
            f'stroke-width="1.4" opacity="0.055"/>'
        )
    # trama (diagonal \)
    for i in range(-64, 128, 12):
        hilos.append(
            f'<line x1="{i+64}" y1="0" x2="{i}" y2="64" stroke="{ORO}" '
            f'stroke-width="1.2" opacity="0.05"/>'
        )
    # nudos de fibra
    for gx in range(6, 64, 12):
        for gy in range(6, 64, 12):
            hilos.append(f'<circle cx="{gx}" cy="{gy}" r="0.8" fill="{TERRA}" opacity="0.05"/>')
    cuerpo = "\n    ".join(hilos)
    return XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <g>
    {cuerpo}
  </g>
</svg>
"""


# ══════════════ PATRÓN GRECA (escalonada maya abstracta, seamless) ══════════════
def build_pattern_greca() -> str:
    """Greca escalonada como ritmo geométrico — abstracción, nunca glifo sagrado."""
    def greca(x0, y0, s, color, op):
        p = [
            (0,0),(4,0),(4,1),(3,1),(3,2),(2,2),(2,3),(1,3),(1,2),(0,2)
        ]
        pts = " ".join(f"{x0+px*s:.1f},{y0+py*s:.1f}" for px,py in p)
        return f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="{s*0.6:.1f}" opacity="{op}" stroke-linejoin="miter"/>'
    grecas = []
    for gx in range(0, 64, 32):
        grecas.append(greca(gx + 4, 20, 4.5, TERRA, 0.10))
        grecas.append(greca(gx + 20, 20, 4.5, VERDE, 0.10))
    cuerpo = "\n    ".join(grecas)
    return XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <g>
    {cuerpo}
  </g>
</svg>
"""


# ══════════════ TEXTURA CAL (piedra caliza porosa, feTurbulence) ══════════════
def build_texture_cal() -> str:
    return XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="cal" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="{NOISE_SEED}" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.86
                                                  0 0 0 0 0.83
                                                  0 0 0 0 0.78
                                                  0 0 0 0.16 0" result="t"/>
      <feComposite in="t" in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>
  <rect width="512" height="512" fill="{CAL}"/>
  <rect width="512" height="512" filter="url(#cal)"/>
</svg>
"""


# ══════════════ TEXTURA SISAL (fibra orgánica, feTurbulence direccional) ══════════════
def build_texture_sisal() -> str:
    return XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="sisal" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="turbulence" baseFrequency="0.02 0.55" numOctaves="3" seed="{NOISE_SEED+7}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.79
                                                  0 0 0 0 0.64
                                                  0 0 0 0 0.15
                                                  0 0 0 0.13 0" result="t"/>
      <feComposite in="t" in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>
  <rect width="512" height="512" fill="{SISAL}"/>
  <rect width="512" height="512" filter="url(#sisal)"/>
</svg>
"""


# ══════════════ DIVISOR PORTAL (arco colonial meridano) ══════════════
DIVIDER_PORTAL_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 72" width="600" height="72">
  <path d="M0 48 H230" stroke="{ARENA}" stroke-width="2" stroke-linecap="round"/>
  <path d="M370 48 H600" stroke="{ARENA}" stroke-width="2" stroke-linecap="round"/>
  <path d="M250 48 A50 50 0 0 1 350 48" fill="none" stroke="{ANIL}" stroke-width="3"/>
  <path d="M262 48 A38 38 0 0 1 338 48" fill="none" stroke="{TERRA}" stroke-width="1.5" opacity="0.6"/>
  <rect x="292" y="20" width="16" height="16" rx="2" fill="{VERDE}"/>
  <circle cx="300" cy="28" r="3" fill="{ORO}"/>
  <circle cx="230" cy="48" r="3" fill="{TERRA}"/>
  <circle cx="370" cy="48" r="3" fill="{TERRA}"/>
</svg>
"""


# ══════════════ OG IMAGE (1200×630, safe zone 100px) ══════════════
OG_IMAGE_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogFondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{CAL}"/>
      <stop offset="1" stop-color="{SISAL}"/>
    </linearGradient>
    <filter id="ogCal" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="18" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.86  0 0 0 0 0.83  0 0 0 0 0.78  0 0 0 0.12 0"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#ogFondo)"/>
  <rect width="1200" height="630" filter="url(#ogCal)"/>

  <!-- banda institucional añil superior -->
  <rect width="1200" height="12" fill="{ANIL}"/>
  <rect y="618" width="1200" height="12" fill="{TERRA}"/>

  <!-- greca decorativa lateral -->
  <g opacity="0.5" transform="translate(1020 180)">
    {"".join(f'<polyline points="0,0 40,0 40,12 28,12 28,24 16,24 16,36 0,36" fill="none" stroke="{VERDE}" stroke-width="4" transform="translate(0 {i*52})"/>' for i in range(4))}
  </g>

  <!-- monograma -->
  <g transform="translate(140 210) scale(1.7)">
    <circle cx="64" cy="64" r="58" fill="{MURO}" stroke="{ARENA}" stroke-width="2"/>
    <g transform="translate(0 8)">
      {_roseta_agave(64, 78, 34, 9, ORO, VERDE_DK)}
    </g>
    <path d="M40 100 H88" stroke="{TERRA}" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- tipografía -->
  <text x="430" y="300" font-family="Fraunces, Georgia, serif" font-size="92" font-weight="700" fill="{ANIL}">Museo Digital</text>
  <text x="432" y="356" font-family="Inter, Helvetica, Arial, sans-serif" font-size="30" font-weight="500" letter-spacing="4" fill="{TERRA}">CANACO SERVYTUR MÉRIDA</text>
  <text x="432" y="404" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="{PIEDRA}">El telar de la memoria comercial yucateca</text>
  <text x="432" y="470" font-family="'IBM Plex Mono', Consolas, monospace" font-size="22" fill="{VERDE_DK}">120 años · 1906 — 2026</text>

  <rect x="430" y="420" width="360" height="2" fill="{ARENA}"/>
</svg>
"""


# ══════════════ SPRITE MUSEO / COMERCIO (8 iconos 24×24) ══════════════
SPRITE_ICONS = [
    ("henequen",
     """<path d="M12 21V9"/>
     <path d="M12 9C12 9 9 6 8 3c3 1 4 4 4 6z"/>
     <path d="M12 9c0 0 3-3 4-6-3 1-4 4-4 6z"/>
     <path d="M12 12c0 0-3-2-6-2 2 3 5 3 6 2z"/>
     <path d="M12 12c0 0 3-2 6-2-2 3-5 3-6 2z"/>
     <path d="M9 21h6"/>"""),
    ("museo",
     """<path d="M3 9l9-5 9 5"/>
     <path d="M4 9v9h16V9"/>
     <path d="M8 18v-6M12 18v-6M16 18v-6"/>
     <path d="M2 21h20"/>"""),
    ("comercio",
     """<path d="M3 6h18l-1.5 12H4.5z"/>
     <path d="M8 6V5a4 4 0 0 1 8 0v1"/>
     <path d="M9 11h6"/>"""),
    ("turismo",
     """<circle cx="12" cy="12" r="9"/>
     <path d="M15.5 8.5l-2 5-5 2 2-5z"/>
     <circle cx="12" cy="12" r="1"/>"""),
    ("exhibicion",
     """<rect x="3" y="4" width="18" height="14" rx="1"/>
     <path d="M3 14l5-4 4 3 3-2 6 5"/>
     <circle cx="8.5" cy="8" r="1.2"/>
     <path d="M9 21h6"/>"""),
    ("cedula",
     """<rect x="4" y="3" width="16" height="18" rx="2"/>
     <path d="M8 8h8M8 12h8M8 16h5"/>"""),
    ("agenda",
     """<rect x="3" y="5" width="18" height="16" rx="2"/>
     <path d="M3 10h18M8 3v4M16 3v4"/>
     <path d="M8 14h3M8 17h6"/>"""),
    ("socio",
     """<circle cx="9" cy="8" r="3"/>
     <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/>
     <path d="M16 6a3 3 0 0 1 0 6"/>
     <path d="M17 14c2.4.5 4 2.4 4 5"/>"""),
]


def build_sprite_museo() -> str:
    groups = []
    for i, (icon_id, paths) in enumerate(SPRITE_ICONS):
        x = i * 24
        groups.append(
            f'<g id="{icon_id}" transform="translate({x} 0)" fill="none" '
            f'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
            f'stroke-linejoin="round">\n    {paths}\n  </g>'
        )
    body = "\n  ".join(groups)
    return XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 24" width="192" height="24" style="color:{ANIL}">
  {body}
</svg>
"""


# ══════════════ HELPERS ══════════════
def write_asset(out_dir: Path, name: str, content: str) -> Path:
    path = out_dir / name
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")
    return path


def kb(size_bytes: int) -> float:
    return round(size_bytes / 1024, 2)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="HENEQUÉN vector forge — CANACO Mérida Museo Digital (stdlib pura)."
    )
    parser.add_argument("--out", default="public/assets/henequen",
                        help="Directorio de salida. Ej.: public/assets/henequen")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    assets = [
        ("favicon.svg", FAVICON_SVG),
        ("logo-lockup.svg", LOGO_LOCKUP_SVG),
        ("monogram-henequen.svg", MONOGRAM_SVG),
        ("pattern-sisal.svg", build_pattern_sisal()),
        ("pattern-greca.svg", build_pattern_greca()),
        ("texture-cal.svg", build_texture_cal()),
        ("texture-sisal.svg", build_texture_sisal()),
        ("divider-portal.svg", DIVIDER_PORTAL_SVG),
        ("og-image.svg", OG_IMAGE_SVG),
        ("sprite-museo.svg", build_sprite_museo()),
    ]

    records = []
    for name, content in assets:
        path = write_asset(out_dir, name, content)
        size = path.stat().st_size
        records.append({"path": name, "bytes": size, "kb": kb(size)})

    sisal_rec = next(r for r in records if r["path"] == "pattern-sisal.svg")
    sisal_ok = sisal_rec["bytes"] < 4096

    manifest = {
        "schema": "bobs.asset-manifest.v1",
        "system": "HENEQUÉN",
        "slug": "canaco-henequen",
        "cliente": "CANACO SERVYTUR Mérida",
        "huesped": "service",
        "kind": "vector-forge",
        "stdlib_only": True,
        "noise_seed": NOISE_SEED,
        "files": records,
        "total_bytes": sum(r["bytes"] for r in records),
        "total_kb": round(sum(r["bytes"] for r in records) / 1024, 2),
        "checks": {"pattern_sisal_under_4kb": sisal_ok},
    }

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    manifest_size = manifest_path.stat().st_size

    print("\n🌵 HENEQUÉN — Fábrica Vectorial · CANACO Mérida")
    print(f"📁 Salida: {out_dir.resolve()}")
    print("─" * 56)
    for record in records:
        flag = "  ✓<4KB" if record["path"] == "pattern-sisal.svg" and sisal_ok else ""
        print(f"{record['path']:<28} {record['kb']:>8.2f} KB{flag}")
    print("─" * 56)
    print(f"{'manifest.json':<28} {kb(manifest_size):>8.2f} KB")
    print(f"{'TOTAL SVG':<28} {manifest['total_kb']:>8.2f} KB")
    print(f"✓ Greca = abstracción geométrica (ética cultural OK)")
    print("✅ Listo. Zero Pillow. Zero dependencias externas.\n")


if __name__ == "__main__":
    main()
