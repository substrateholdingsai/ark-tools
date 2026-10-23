#!/usr/bin/env python3
"""
ARK SYSTEMS · Social Meta Tags Forge (SVG puro, cero dependencias)
------------------------------------------------------------------
Reproduce el cubo isométrico de circuito (logo ARK) y genera:
  public/og-image.svg        1200×630 (safe zone 100px)
  public/twitter-image.svg   1200×630 (idéntico)
  public/favicon.svg         64×64
  public/logo-cube.svg       256×256 (cubo suelto, fondo claro)
  public/logo-lockup.svg     640×160 (cubo + wordmark outline)
  public/manifest.json       auditoría de pesos

Uso:
    python forge_ark_meta.py --out public
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

# UTF-8 Windows nativo
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# --------------------------------------------------------------------------
# DESIGN SYSTEM ARK (tokens exactos)
# --------------------------------------------------------------------------
ARK_NAVY        = "#0B132B"
ARK_NAVY_DEEP   = "#020617"
ARK_GOLD        = "#F59E0B"
ARK_GOLD_BRIGHT = "#FBBF24"
ARK_GOLD_DEEP   = "#D97706"
ARK_GOLD_SOFT   = "#D8BE8E"   # traza champagne del logo original
ARK_WHITE       = "#FFFFFF"
ARK_INK         = "#0F172A"
ARK_SLATE       = "#6B7A99"
ARK_SLATE_LIT   = "#C4CEDF"   # tinte derivado p/ texto sobre navy (AA)
ARK_NODE        = "#E9A6DC"   # nodos rosa del cubo
ARK_NODE_CORE   = "#86198F"

FONT_DISPLAY = "'Playfair Display', serif"
FONT_SANS    = "'Inter', system-ui, sans-serif"
FONT_TECH    = "'Orbitron', sans-serif"

COS30 = math.cos(math.radians(30))


def n(v: float) -> str:
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def lerp(p, q, t):
    return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)


# ==========================================================================
#  FORGE
# ==========================================================================
class ArkForge:

    # ---------------- CUBO ISOMÉTRICO DE CIRCUITO ----------------
    def cube(self, x: float, y: float, S: float,
             edge: str, trace: str, node: str, ring: str) -> str:
        """Cubo iso con aristas quebradas, grillas, trazas doradas y nodos."""
        R, w = S * 0.47, S * 0.47 * COS30
        cx, cy = x + S / 2, y + S / 2
        T  = (cx, cy - R);  UR = (cx + w, cy - R / 2)
        LR = (cx + w, cy + R / 2); B = (cx, cy + R)
        LL = (cx - w, cy + R / 2); UL = (cx - w, cy - R / 2)
        C  = (cx, cy)

        ew = max(1.1, S * 0.060)          # grosor arista
        tw = ew * 0.42                    # grosor traza/grilla
        nr = max(1.5, S * 0.048)          # radio de nodo
        out = []

        def seg(p, q, t0=0.0, t1=1.0):
            a, b = lerp(p, q, t0), lerp(p, q, t1)
            out.append(f'<line x1="{n(a[0])}" y1="{n(a[1])}" x2="{n(b[0])}" '
                       f'y2="{n(b[1])}" stroke="{edge}" stroke-width="{n(ew)}" '
                       f'stroke-linecap="round"/>')

        def line(p, q, wdt, col):
            out.append(f'<line x1="{n(p[0])}" y1="{n(p[1])}" x2="{n(q[0])}" '
                       f'y2="{n(q[1])}" stroke="{col}" stroke-width="{n(wdt)}" '
                       f'stroke-linecap="round"/>')

        # caras en coordenadas (a,b) ∈ [0,1]²
        def top(a, b):   return (T[0] + a*(UR[0]-T[0]) + b*(UL[0]-T[0]),
                                 T[1] + a*(UR[1]-T[1]) + b*(UL[1]-T[1]))
        def left(a, b):  return (UL[0] + a*(C[0]-UL[0]) + b*(LL[0]-UL[0]),
                                 UL[1] + a*(C[1]-UL[1]) + b*(LL[1]-UL[1]))
        def right(a, b): return (C[0] + a*(UR[0]-C[0]) + b*(B[0]-C[0]),
                                 C[1] + a*(UR[1]-C[1]) + b*(B[1]-C[1]))

        def ladder(face, a0, a1, b0, b1, rungs):
            for i in range(rungs):
                a = a0 + (a1 - a0) * i / (rungs - 1)
                line(face(a, b0), face(a, b1), tw, edge)
            line(face(a0, b0), face(a1, b0), tw, edge)
            line(face(a0, b1), face(a1, b1), tw, edge)

        def trace(face, pts):
            P = [face(a, b) for a, b in pts]
            out.append('<polyline points="' +
                       " ".join(f"{n(p[0])},{n(p[1])}" for p in P) +
                       f'" fill="none" stroke="{trace}" stroke-width="{n(tw)}" '
                       f'stroke-linecap="round" stroke-linejoin="round"/>')

        def node_at(face, a, b, core=True):
            px, py = face(a, b)
            out.append(f'<circle cx="{n(px)}" cy="{n(py)}" r="{n(nr)}" '
                       f'fill="{node}" stroke="{ring}" stroke-width="{n(tw)}"/>')
            if core:
                out.append(f'<circle cx="{n(px)}" cy="{n(py)}" r="{n(nr*0.38)}" '
                           f'fill="{ARK_NODE_CORE}" opacity="0.6"/>')

        # --- hexágono exterior con dos quiebres (firma del logo) ---
        seg(T, UR); seg(UR, LR)
        seg(LR, B, 0.00, 0.55); seg(LR, B, 0.72, 1.0)
        seg(B, LL); seg(LL, UL)
        seg(UL, T, 0.00, 0.45); seg(UL, T, 0.62, 1.0)
        # --- aristas interiores ---
        seg(C, UL); seg(C, UR)
        seg(C, B, 0.00, 0.42); seg(C, B, 0.58, 1.0)

        # --- grillas tipo ventilación ---
        ladder(top,  0.08, 0.34, 0.58, 0.94, 6)
        ladder(left, 0.12, 0.42, 0.08, 0.34, 5)
        ladder(left, 0.52, 0.88, 0.58, 0.94, 5)
        # --- paneles ---
        line(right(0.35, 0.08), right(0.35, 0.52), tw, edge)
        line(top(0.58, 0.06),  top(0.58, 0.48),  tw, edge)
        line(top(0.58, 0.48),  top(0.92, 0.48),  tw, edge)

        # --- trazas de circuito + nodos ---
        trace(top,  [(0.50, 0.10), (0.50, 0.45), (0.68, 0.45)])
        node_at(top, 0.68, 0.45)
        trace(top,  [(0.84, 0.16), (0.84, 0.40)])
        node_at(top, 0.84, 0.16); node_at(top, 0.84, 0.40)
        trace(right,[(0.18, 0.12), (0.18, 0.62)])
        node_at(right, 0.18, 0.12)
        trace(right,[(0.52, 0.30), (0.80, 0.30), (0.80, 0.74)])
        node_at(right, 0.80, 0.74); node_at(right, 0.92, 0.52)
        trace(left, [(0.70, 0.14), (0.70, 0.50), (0.54, 0.50)])
        node_at(left, 0.70, 0.14)
        node_at(left, 0.20, 0.78); node_at(right, 0.30, 0.86)

        return "<g>" + "".join(out) + "</g>"

    # ---------------- FAVICON 64×64 ----------------
    def favicon(self) -> str:
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
                f'<rect width="64" height="64" rx="14" fill="{ARK_NAVY}"/>'
                f'{self.cube(9, 8, 46, ARK_WHITE, ARK_GOLD_BRIGHT, ARK_NODE, ARK_NAVY)}'
                f'</svg>')

    # ---------------- CUBO SUELTO 256 (fondo claro) ----------------
    def logo_cube(self) -> str:
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" '
                f'viewBox="0 0 256 256">'
                f'{self.cube(10, 10, 236, ARK_NAVY, ARK_GOLD_SOFT, ARK_NODE, ARK_NAVY)}'
                f'</svg>')

    # ---------------- LOCKUP 640×160 ----------------
    def logo_lockup(self) -> str:
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160" '
                f'viewBox="0 0 640 160">'
                f'{self.cube(18, 26, 108, ARK_NAVY, ARK_GOLD_SOFT, ARK_NODE, ARK_NAVY)}'
                f'<text x="152" y="98" font-family={FONT_TECH} font-size="46" '
                f'font-weight="500" letter-spacing="8" fill="none" '
                f'stroke="{ARK_GOLD_DEEP}" stroke-width="1.1">ARK SYSTEMS</text>'
                f'</svg>')

    # ---------------- OG / TWITTER 1200×630 ----------------
    def og_image(self) -> str:
        W, H = 1200, 630
        desc = [
            "Suite pericial de cálculo financiero y fiscal",
            "para contadores en México. Papel de trabajo",
            "con Sello Criptográfico SHA-256 verificable.",
        ]
        desc_xml = "".join(
            f'<text x="100" y="{300 + i*38}" font-family={FONT_SANS} font-size="24" '
            f'fill="{ARK_SLATE_LIT}">{t}</text>' for i, t in enumerate(desc))

        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">'
            # fondo: navy + glow radial dorado 20%/20%
            f'<defs><radialGradient id="glow" cx="20%" cy="20%" r="55%">'
            f'<stop offset="0" stop-color="{ARK_GOLD}" stop-opacity="0.08"/>'
            f'<stop offset="0.5" stop-color="{ARK_GOLD}" stop-opacity="0"/>'
            f'<stop offset="1" stop-color="{ARK_GOLD}" stop-opacity="0"/>'
            f'</radialGradient></defs>'
            f'<rect width="{W}" height="{H}" fill="{ARK_NAVY}"/>'
            f'<rect width="{W}" height="{H}" fill="url(#glow)"/>'
            # top row: logo 64 + título + subtítulo + badge
            f'{self.cube(100, 116, 64, ARK_WHITE, ARK_GOLD_BRIGHT, ARK_NODE, ARK_NAVY)}'
            f'<text x="186" y="152" font-family={FONT_DISPLAY} font-size="42" '
            f'font-weight="700" fill="{ARK_WHITE}">ARK TOOLS</text>'
            f'<text x="187" y="182" font-family={FONT_SANS} font-size="19" '
            f'fill="{ARK_SLATE}">El Sistema Operativo de la Defensa Fiscal</text>'
            f'<rect x="906" y="128" width="194" height="36" rx="8" '
            f'fill="{ARK_GOLD}" fill-opacity="0.10" stroke="{ARK_GOLD}" stroke-opacity="0.40"/>'
            f'<text x="1003" y="151" text-anchor="middle" font-family={FONT_TECH} '
            f'font-size="14" letter-spacing="2" fill="{ARK_GOLD_BRIGHT}">19 HERRAMIENTAS</text>'
            # divider gold 2px · 60% · opacity 40%
            f'<line x1="100" y1="236" x2="820" y2="236" stroke="{ARK_GOLD}" '
            f'stroke-width="2" opacity="0.4"/>'
            # descripción (safe zone)
            f'{desc_xml}'
            # pie: firma + URL tech
            f'<text x="100" y="506" font-family={FONT_SANS} font-size="13" '
            f'letter-spacing="4" fill="{ARK_SLATE}">ARK SYSTEMS · DEFENSA FISCAL</text>'
            f'<text x="1100" y="506" text-anchor="end" font-family={FONT_TECH} '
            f'font-size="18" letter-spacing="3" fill="{ARK_GOLD_BRIGHT}">tools.arksystems.site</text>'
            f'</svg>'
        )

    # ---------------- BUILD ----------------
    def build(self, out: Path) -> list[dict]:
        out.mkdir(parents=True, exist_ok=True)
        og = self.og_image()
        files = {
            "og-image.svg":       og,
            "twitter-image.svg":  og,                      # idéntico por spec
            "favicon.svg":        self.favicon(),
            "logo-cube.svg":      self.logo_cube(),
            "logo-lockup.svg":    self.logo_lockup(),
        }
        manifest = []
        for name, content in files.items():
            p = out / name
            p.write_text(content, encoding="utf-8")
            kb = round(p.stat().st_size / 1024, 2)
            manifest.append({"file": name, "kb": kb,
                             "dims": "1200x630" if "image" in name else "auto"})
            print(f"  ✓ {name:<22} {kb:>7.2f} KB")

        mp = out / "manifest.json"
        mp.write_text(json.dumps(
            {"system": "ARK", "client": "ARK Systems · Tools",
             "meta": {"og": "1200x630", "safe_zone": "100px", "ratio": "1.91:1"},
             "assets": manifest}, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  ✓ {'manifest.json':<22} {round(mp.stat().st_size/1024, 2):>7.2f} KB")
        return manifest


def main():
    ap = argparse.ArgumentParser(description="ARK Systems · Social Meta Tags Forge")
    ap.add_argument("--out", default="public", help="carpeta de salida")
    a = ap.parse_args()
    print(f"\n🧊  ARK SYSTEMS · Meta Tags Forge (SVG puro, cero dependencias)\n")
    ArkForge().build(Path(a.out))
    print(f"\n  ✔ og-image + twitter-image + favicon + lockup → {a.out}/\n")


if __name__ == "__main__":
    main()