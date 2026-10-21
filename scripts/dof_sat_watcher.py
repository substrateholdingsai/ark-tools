"""
ARK TOOLS — DOF/SAT Watcher
Propósito: Monitor desatendido de publicaciones oficiales (DOF) para detectar 
actualizaciones de valores fiscales (UMA, SMG, ISR, Subsidio) y generar alertas/diffs.
Mantenedor: Substrate Holdings LLC
Fecha: Octubre 2026
"""

import os
import re
import json
import hashlib
import feedparser
import requests
from datetime import datetime, timezone
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

import sys
from bs4 import BeautifulSoup
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown
from dotenv import load_dotenv

# Forzar UTF-8 en consolas Windows para soporte de emojis y caracteres acentuados
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Cargar variables de entorno (.env)
load_dotenv()

console = Console()

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ==============================================================================
# 1. CONFIGURACIÓN Y BASELINE (Espejo de src/data/valores-vigentes/catalogo.ts)
# ==============================================================================

DOF_RSS_URL = "https://dof.gob.mx/sumario.xml"
KEYWORDS_FISCALES = [
    "UMA", "Unidad de Medida y Actualización",
    "Salario Mínimo", "CONASAMI",
    "INPC", "Índice Nacional de Precios al Consumidor",
    "Anexo 8", "Tabla de ISR", "Impuesto Sobre la Renta",
    "Subsidio para el Empleo", "Decreto", "Ley del ISR"
]

# Baseline actual (debe mantenerse sincronizado con catalogo.ts)
BASELINE_CATALOG = {
    "UMA_DIARIA_2026": {"valor": 117.31, "fecha_vigencia": "2026-02-01", "fuente": "INEGI/DOF"},
    "SALARIO_MINIMO_GENERAL_2026": {"valor": 315.04, "fecha_vigencia": "2026-01-01", "fuente": "CONASAMI/DOF"},
    "TARIFA_ISR_MENSUAL_2026": {"valor": "11 rangos", "fecha_vigencia": "2026-01-01", "fuente": "SAT/DOF"},
    "SUBSIDIO_EMPLEO_2026": {"valor": "Vigente", "fecha_vigencia": "2026-01-01", "fuente": "DOF"},
    "TASA_RECARGOS_MORA_2026": {"valor": 1.47, "fecha_vigencia": "2026-01-01", "fuente": "LIF/DOF"}
}

@dataclass
class FiscalAlert:
    keyword: str
    title: str
    link: str
    published_date: str
    summary_snippet: str
    severity: str  # "CRITICO", "PREVENTIVO", "INFO"

# ==============================================================================
# 2. MOTORES DE EXTRACCIÓN Y ANÁLISIS
# ==============================================================================

def fetch_dof_feed() -> List[dict]:
    """Obtiene las últimas publicaciones del sumario oficial del DOF."""
    console.print("[bold blue]📡 Conectando al Sumario oficial del DOF (https://dof.gob.mx/sumario.xml)...[/bold blue]")
    try:
        response = requests.get(
            DOF_RSS_URL,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            verify=False,
            timeout=15,
        )
        if response.status_code != 200:
            console.print(f"[bold red]⚠️ DOF respondió con HTTP {response.status_code}.[/bold red]")
            return []
        feed = feedparser.parse(response.content)
        return feed.entries[:50]
    except Exception as e:
        console.print(f"[bold red]❌ Error de red al consultar el DOF: {e}[/bold red]")
        return []

def analyze_entry(entry: dict) -> Optional[FiscalAlert]:
    """Analiza una entrada del RSS buscando palabras clave fiscales."""
    title = entry.get("title", "").upper()
    summary = entry.get("summary", "").upper()
    text_to_search = f"{title} {summary}"
    
    for keyword in KEYWORDS_FISCALES:
        if keyword.upper() in text_to_search:
            # Determinar severidad
            severity = "INFO"
            if any(k in text_to_search for k in ["UMA", "SALARIO MÍNIMO", "CONASAMI", "INPC"]):
                severity = "CRITICO"
            elif any(k in text_to_search for k in ["ANEXO 8", "ISR", "SUBSIDIO"]):
                severity = "PREVENTIVO"
            
            # Extraer un snippet limpio
            soup = BeautifulSoup(entry.get("summary", ""), "html.parser")
            snippet = soup.get_text(separator=" ", strip=True)[:200] + "..."
            
            return FiscalAlert(
                keyword=keyword,
                title=entry.get("title", "Sin título"),
                link=entry.get("link", ""),
                published_date=entry.get("published", "Fecha desconocida"),
                summary_snippet=snippet,
                severity=severity
            )
    return None

def extract_proposed_values(alert: FiscalAlert) -> Dict:
    """
    Intenta extraer valores numéricos del resumen usando Regex.
    (Nota: Para precisión del 100%, se requiere descarga del PDF/HTML completo, 
    pero esto da un primer indicador para el diff).
    """
    if "INPC" in alert.keyword.upper() or "CONSUMIDOR" in alert.keyword.upper():
        # INPC típicamente tiene formato de 3 dígitos enteros y 3 a 4 decimales (ej. 148.529)
        inpc_pattern = r'\b(\d{3}\.\d{3,4})\b'
        matches = re.findall(inpc_pattern, f"{alert.title} {alert.summary_snippet}")
        return {
            "detected_numbers": list(set(matches)),
            "is_inpc": True,
            "action_required": "Validar publicación oficial de INEGI y anexar a TABLA_INPC en catalogo.ts"
        }

    # Regex para buscar patrones de moneda mexicana (ej: $117.31, 315.04)
    money_pattern = r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
    matches = re.findall(money_pattern, alert.summary_snippet)
    
    return {
        "detected_numbers": list(set(matches)),
        "is_inpc": False,
        "action_required": "Verificar decreto en el enlace y actualizar catalogo.ts"
    }

def update_inpc_catalog(year: int, month: int, inpc_value: float, pub_date: str) -> bool:
    """
    Actualiza de forma desatendida src/data/valores-vigentes/catalogo.ts anexando el nuevo INPC
    si no existe previamente en TABLA_INPC.
    """
    catalogo_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "valores-vigentes", "catalogo.ts")
    if not os.path.exists(catalogo_path):
        return False

    with open(catalogo_path, "r", encoding="utf-8") as f:
        content = f.read()

    needle = f"anio: {year}, mes: {month}"
    if needle in content:
        console.print(f"[yellow]ℹ️ INPC para {year}-{month:02d} ya existe en catalogo.ts.[/yellow]")
        return False

    new_entry = f"  {{ anio: {year}, mes: {month}, inpc: {inpc_value}, fechaPublicacionDOF: '{pub_date}' }},\n];"
    updated_content = content.replace("];\n\n/** Índice O(1) de INPC por clave YYYY-MM */", new_entry + "\n\n/** Índice O(1) de INPC por clave YYYY-MM */")
    
    if updated_content != content:
        with open(catalogo_path, "w", encoding="utf-8") as f:
            f.write(updated_content)
        console.print(f"[bold green]✨ TABLA_INPC actualizada con éxito: {year}-{month:02d} = {inpc_value}[/bold green]")
        return True
    return False

# ==============================================================================
# 3. GENERACIÓN DE DIFFS Y ALERTAS
# ==============================================================================

def generate_ts_diff(alert: FiscalAlert, detected_values: List[str]) -> str:
    """Genera el snippet de código TypeScript listo para copiar y pegar."""
    return f"""
// 🚨 ACTUALIZACIÓN DETECTADA: {alert.keyword}
// Fecha de publicación DOF: {alert.published_date}
// Enlace: {alert.link}
// 
// Reemplazar en: src/data/valores-vigentes/catalogo.ts
// 
// export const NUEVO_VALOR_DETECTADO = {{
//   id: 'UMA_DIARIA_2027', // Ajustar según el ejercicio
//   nombre: 'UMA Diaria',
//   valor: {detected_values[0] if detected_values else 'XXX.XX'}, // ⚠️ VERIFICAR MANUALMENTE
//   unidad: 'MXN',
//   fechaVigencia: '2027-02-01', // Ajustar según decreto
//   fuenteDOF: '{alert.link}',
//   criticidad: 'alta',
//   esProyeccion: false
// }};
"""

def send_webhook_alert(alerts: List[FiscalAlert]):
    """Envía alerta a Discord/Slack o Resend."""
    webhook_url = os.getenv("ARK_WATCHER_WEBHOOK_URL")
    if not webhook_url:
        console.print("[yellow]⚠️ ARK_WATCHER_WEBHOOK_URL no configurado. Omitiendo envío.[/yellow]")
        return

    payload = {
        "embeds": [{
            "title": "🚨 ALERTA FISCAL DOF DETECTADA",
            "color": 16753920, # Naranja/Dorado ARK
            "fields": [
                {"name": "Concepto", "value": alert.keyword, "inline": True},
                {"name": "Severidad", "value": alert.severity, "inline": True},
                {"name": "Fecha", "value": alert.published_date, "inline": True},
                {"name": "Enlace DOF", "value": f"[Ver Decreto]({alert.link})"},
                {"name": "Resumen", "value": alert.summary_snippet[:500]}
            ],
            "footer": {"text": "ARK TOOLS Watcher v1.8 | Substrate Holdings LLC"}
        }]
        for alert in alerts
    }
    
    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        if response.status_code == 204:
            console.print("[bold green]✅ Alerta enviada exitosamente al webhook.[/bold green]")
        else:
            console.print(f"[bold red]❌ Error en webhook: {response.status_code}[/bold red]")
    except Exception as e:
        console.print(f"[bold red]❌ Fallo al enviar webhook: {e}[/bold red]")

# ==============================================================================
# 4. EJECUCIÓN PRINCIPAL (CLI)
# ==============================================================================

def main():
    console.print(Panel.fit(
        "[bold gold1]ARK TOOLS — DOF/SAT Watcher v1.8[/bold gold1]\n"
        "Monitorizando cambios fiscales oficiales para mantener el catálogo 100% vigente.",
        border_style="gold1"
    ))

    entries = fetch_dof_feed()
    if not entries:
        console.print("[bold red]No se pudieron obtener entradas del DOF.[/bold red]")
        return

    alerts_found = []
    
    console.print("\n[bold]🔍 Analizando publicaciones recientes...[/bold]")
    for entry in entries:
        alert = analyze_entry(entry)
        if alert:
            alerts_found.append(alert)

    if not alerts_found:
        console.print("[bold green]✅ Todo en orden. No se detectaron nuevas publicaciones fiscales en las últimas 50 entradas.[/bold green]")
        return

    # Mostrar resultados en tabla Rich
    table = Table(title="📢 Publicaciones Fiscales Detectadas", show_header=True, header_style="bold magenta")
    table.add_column("Severidad", style="dim", width=12)
    table.add_column("Keyword", width=15)
    table.add_column("Título / Fecha")
    table.add_column("Acción")

    for alert in alerts_found:
        severity_style = "red" if alert.severity == "CRITICO" else "yellow" if alert.severity == "PREVENTIVO" else "blue"
        detected = extract_proposed_values(alert)
        
        table.add_row(
            f"[{severity_style}]{alert.severity}[/{severity_style}]",
            alert.keyword,
            f"[bold]{alert.title}[/bold]\n[dim]{alert.published_date}[/dim]",
            f"[link={alert.link}]Ver DOF[/link]"
        )
        
        # Mostrar diff propuesto en consola
        console.print("\n" + Panel(
            Markdown(generate_ts_diff(alert, detected["detected_numbers"])),
            title=f"🛠️ Diff Propuesto para: {alert.keyword}",
            border_style="cyan"
        ))

    console.print(table)

    # Enviar notificación externa
    console.print("\n[bold]📤 Enviando alertas a canales configurados...[/bold]")
    send_webhook_alert(alerts_found)

    console.print("\n[bold green]✅ Proceso de vigilancia completado.[/bold green]")

if __name__ == "__main__":
    main()
