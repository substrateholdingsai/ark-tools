"""
ARK LEDGER — Instagram Creatives Generator
Propósito: Renderizar creativos de Instagram (1080x1080 @ 2x Retina) a partir
de JSON estructurado usando Playwright (Chromium headless) + Jinja2.
Soporta 100% CSS moderno: Glassmorphism, backdrop-filter, Google Fonts, Grid.
Mantenedor: Substrate Holdings LLC
Fecha: Octubre 2026
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape
from playwright.sync_api import sync_playwright, Page, Browser, TimeoutError as PlaywrightTimeout

# Asegurar soporte de UTF-8 en consola (especialmente en Windows)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


# ==============================================================================
# 1. CONFIGURACIÓN Y CONSTANTES
# ==============================================================================

BASE_DIR = Path(__file__).parent
CONTENT_DIR = BASE_DIR / "content"
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = BASE_DIR / "creatives" / "output"

POSTS_FILE = CONTENT_DIR / "posts.json"
TEMPLATE_FILE = TEMPLATES_DIR / "template.html"

DEFAULT_SCALE = 2
BASE_RESOLUTION = 1080
VIEWPORT_WIDTH = BASE_RESOLUTION
VIEWPORT_HEIGHT = BASE_RESOLUTION


# ==============================================================================
# 2. CARGA DE DATOS Y PLANTILLA
# ==============================================================================

def load_posts(filter_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Carga el archivo posts.json y opcionalmente filtra por ID."""
    if not POSTS_FILE.exists():
        print(f"❌ No se encontró {POSTS_FILE}")
        sys.exit(1)
    
    with open(POSTS_FILE, "r", encoding="utf-8") as f:
        posts = json.load(f)
    
    if filter_id:
        posts = [p for p in posts if p.get("id") == filter_id]
        if not posts:
            print(f"❌ No se encontró ningún post con id='{filter_id}'")
            sys.exit(1)
    
    return posts


def render_html(posts: List[Dict[str, Any]]) -> str:
    """Renderiza la plantilla Jinja2 con todos los posts inyectados."""
    if not TEMPLATE_FILE.exists():
        print(f"❌ No se encontró {TEMPLATE_FILE}")
        sys.exit(1)
    
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"])
    )
    template = env.get_template("template.html")
    
    return template.render(posts=posts)


# ==============================================================================
# 3. MOTOR DE RENDERIZADO (PLAYWRIGHT)
# ==============================================================================

def render_creatives(html_content: str, posts: List[Dict[str, Any]], scale: int):
    """
    Renderiza cada slide de cada post como imagen PNG de alta resolución.
    Usa device_scale_factor para calidad Retina.
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    with sync_playwright() as p:
        browser: Browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": VIEWPORT_WIDTH, "height": VIEWPORT_HEIGHT},
            device_scale_factor=scale,
            locale="es-MX"
        )
        page: Page = context.new_page()
        
        # Cargar HTML renderizado
        page.set_content(html_content, wait_until="domcontentloaded")
        
        # Esperar a que las fuentes externas (Google Fonts) se carguen completamente
        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except PlaywrightTimeout:
            print("⚠️  Timeout esperando networkidle. Continuando con fuentes disponibles.")
        
        # Esperar explícitamente a que las fuentes estén listas
        page.evaluate("() => document.fonts.ready")
        
        print(f"\n🎨 Renderizando {len(posts)} post(s) a escala {scale}x...")
        
        for post in posts:
            post_id = post.get("id", "unknown")
            slides = post.get("slides", [])
            post_output_dir = OUTPUT_DIR / post_id
            post_output_dir.mkdir(parents=True, exist_ok=True)
            
            print(f"\n📸 [{post_id}] Generando {len(slides)} slide(s)...")
            
            for idx, slide in enumerate(slides, start=1):
                selector = f"#slide-{post_id}-{idx}"
                output_path = post_output_dir / f"slide_{idx:02d}.png"
                
                try:
                    # Localizar el elemento específico del slide
                    element = page.wait_for_selector(selector, timeout=5000)
                    
                    if element is None:
                        print(f"   ❌ No se encontró el selector: {selector}")
                        continue
                    
                    # Captura selectiva del elemento (no pantalla completa)
                    element.screenshot(path=str(output_path), type="png")
                    
                    print(f"   ✅ slide_{idx:02d}.png ({BASE_RESOLUTION * scale}x{BASE_RESOLUTION * scale}px)")
                
                except PlaywrightTimeout:
                    print(f"   ❌ Timeout buscando {selector}")
                except Exception as e:
                    print(f"   ❌ Error en slide {idx}: {e}")
        
        browser.close()
    
    print(f"\n✅ Proceso completado. Archivos en: {OUTPUT_DIR.absolute()}")


# ==============================================================================
# 4. CLI PRINCIPAL
# ==============================================================================

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="ARK LEDGER — Instagram Creatives Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python generate.py                          # Genera todos los posts
  python generate.py --id release-validador   # Genera solo un post específico
  python generate.py --scale 1                # Genera a 1080x1080 (sin Retina)
  python generate.py --scale 3                # Genera a 3240x3240 (Ultra HD)
        """
    )
    parser.add_argument(
        "--id",
        type=str,
        help="ID del post específico a generar (ej: release-validador-xml)"
    )
    parser.add_argument(
        "--scale",
        type=int,
        default=DEFAULT_SCALE,
        choices=[1, 2, 3, 4],
        help=f"Multiplicador de resolución (1x=1080p, 2x=2160p). Default: {DEFAULT_SCALE}"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    
    print("=" * 60)
    print("🎨 ARK LEDGER — Instagram Creatives Generator")
    print("=" * 60)
    print(f"📐 Resolución base: {BASE_RESOLUTION}x{BASE_RESOLUTION}px")
    print(f"🔍 Escala: {args.scale}x → {BASE_RESOLUTION * args.scale}x{BASE_RESOLUTION * args.scale}px")
    if args.id:
        print(f"🎯 Filtro: solo post '{args.id}'")
    print("=" * 60)
    
    # 1. Cargar datos
    posts = load_posts(filter_id=args.id)
    print(f"\n📦 {len(posts)} post(s) cargado(s) desde {POSTS_FILE.name}")
    
    # 2. Renderizar HTML con Jinja2
    html_content = render_html(posts)
    print(f"📝 HTML renderizado ({len(html_content):,} bytes)")
    
    # 3. Renderizar imágenes con Playwright
    render_creatives(html_content, posts, scale=args.scale)


if __name__ == "__main__":
    main()
