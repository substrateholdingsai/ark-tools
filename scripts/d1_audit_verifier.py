"""
ARK LEDGER — D1 Audit Verifier (Forensic Reconciliation Tool)
Propósito: Auditoría forense y reconciliación criptográfica de la base de datos 
Cloudflare D1 (ark_tools_db). Recalcula hashes SHA-256 canónicos de expedientes 
y valida integridad anti-tamper para respaldos periciales ante el SAT (Art. 28 CFF).
Mantenedor: Substrate Holdings LLC
Fecha: Octubre 2026
"""

import os
import sys
import json
import hashlib
import sqlite3
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

# Forzar UTF-8 en consolas Windows para soporte de spinners y caracteres acentuados
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import httpx
from pydantic import BaseModel, Field
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from dotenv import load_dotenv

load_dotenv()
console = Console()

# ==============================================================================
# 1. CONFIGURACIÓN Y MODELOS PYDANTIC
# ==============================================================================

CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
D1_DATABASE_ID = os.getenv("D1_DATABASE_ID", "3e53559f-9062-4311-bdc9-f6dd206560a1")

D1_API_BASE = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/d1/database/{D1_DATABASE_ID}"
BACKUP_DIR = Path("./d1_forensic_backups")
REPORT_DIR = Path("./d1_audit_reports")

# Estampas oficiales DOF (deben coincidir con CURRENT_CATALOG_VERSION del Worker)
KNOWN_CATALOG_VERSIONS = [
    "DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75",
    "DOF-2025-UMA108.57-SMG278.80-TOPESBC2714.25",
]

class Expediente(BaseModel):
    id: str
    client_id: str
    tenant_id: str
    tool_id: str
    titulo: Optional[str] = None
    input_hash: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    catalog_version: str
    created_by: Optional[str] = None
    created_at: str

class Client(BaseModel):
    id: str
    tenant_id: str
    nombre: str
    rfc: Optional[str] = None
    tipo: str

class LedgerEntry(BaseModel):
    id: str
    tenant_id: str
    client_id: Optional[str] = None
    tool_id: str
    payload_hash: str
    prev_hash: str
    created_at: str

class VerificationResult(BaseModel):
    expediente_id: str
    status: str  # "VALIDO", "TAMPERED", "CATALOGO_DESCONOCIDO", "ERROR"
    computed_hash: str
    stored_hash: str
    catalog_version: str
    reason: Optional[str] = None

# ==============================================================================
# 2. MOTOR DE HASH CANÓNICO (Réplica exacta del Worker)
# ==============================================================================

def normalize(obj: Any) -> Any:
    """
    Normaliza un objeto JSON de forma determinista para reproducir fielmente
    computeDeterministicHash() de src/server/d1Api.expediente.ts:
    - Ordena llaves alfabéticamente de forma recursiva.
    - Mantiene arrays en orden original normalizando elementos.
    - Preserva tipos primitivos idénticos a JSON.stringify() de V8.
    """
    if obj is None or not isinstance(obj, (dict, list)):
        return obj
    if isinstance(obj, list):
        return [normalize(item) for item in obj]
    return {k: normalize(obj[k]) for k in sorted(obj.keys())}

def compute_canonical_hash(inputs: Dict[str, Any], catalog_version: Optional[str] = None) -> str:
    """
    Calcula el hash SHA-256 canónico de un expediente coincidiendo exactamente
    con computeDeterministicHash(inputs) del Worker.
    """
    canonical_obj = normalize(inputs)
    canonical_json = json.dumps(canonical_obj, ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()

def compute_canonical_hash_composite(inputs: Dict[str, Any], catalog_version: str) -> str:
    """Variante alternativa compuesta con catalog_version para auditoría exhaustiva."""
    canonical_obj = {
        "catalog_version": catalog_version,
        "inputs": normalize(inputs)
    }
    canonical_json = json.dumps(canonical_obj, ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()

# ==============================================================================
# 3. CLIENTE D1 API (Cloudflare REST)
# ==============================================================================

class D1Client:
    def __init__(self):
        if not CLOUDFLARE_API_TOKEN or not CLOUDFLARE_ACCOUNT_ID:
            raise ValueError("Faltan CLOUDFLARE_API_TOKEN o CLOUDFLARE_ACCOUNT_ID en .env o entorno")
        self.client = httpx.Client(
            base_url=D1_API_BASE,
            headers={
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    def query(self, sql: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        """Ejecuta una consulta SQL contra D1 y retorna los resultados."""
        payload: Dict[str, Any] = {"sql": sql}
        if params:
            payload["params"] = params
        
        response = self.client.post("/query", json=payload)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("success"):
            raise RuntimeError(f"D1 API Error: {data.get('errors')}")
        
        result = data.get("result", [{}])[0]
        return result.get("results", [])
    
    def fetch_expedientes(self, tenant_id: Optional[str] = None) -> List[Expediente]:
        sql = "SELECT * FROM expedientes"
        params = []
        if tenant_id:
            sql += " WHERE tenant_id = ?"
            params.append(tenant_id)
        sql += " ORDER BY created_at DESC"
        rows = self.query(sql, params)
        return [Expediente(**self._parse_row(r)) for r in rows]
    
    def fetch_clients(self, tenant_id: Optional[str] = None) -> List[Client]:
        sql = "SELECT * FROM clients"
        params = []
        if tenant_id:
            sql += " WHERE tenant_id = ?"
            params.append(tenant_id)
        rows = self.query(sql, params)
        return [Client(**self._parse_row(r)) for r in rows]
    
    def fetch_ledger(self, tenant_id: Optional[str] = None) -> List[LedgerEntry]:
        sql = "SELECT * FROM arkangel_ledger"
        params = []
        if tenant_id:
            sql += " WHERE tenant_id = ?"
            params.append(tenant_id)
        sql += " ORDER BY created_at ASC"
        rows = self.query(sql, params)
        return [LedgerEntry(**self._parse_row(r)) for r in rows]
    
    def _parse_row(self, row: Dict) -> Dict:
        """Convierte campos JSON string a dict."""
        for field in ["inputs", "outputs", "metadata"]:
            if field in row and isinstance(row[field], str):
                try:
                    row[field] = json.loads(row[field])
                except json.JSONDecodeError:
                    row[field] = {}
        return row

# ==============================================================================
# 4. MOTOR DE VERIFICACIÓN FORENSE
# ==============================================================================

def verify_expediente(exp: Expediente) -> VerificationResult:
    """Verifica la integridad criptográfica de un expediente."""
    computed = compute_canonical_hash(exp.inputs, exp.catalog_version)
    
    # Comprobar contra hash canónico directo y alternativo compuesto
    if computed != exp.input_hash:
        alt_computed = compute_canonical_hash_composite(exp.inputs, exp.catalog_version)
        if alt_computed == exp.input_hash:
            computed = alt_computed
        else:
            return VerificationResult(
                expediente_id=exp.id,
                status="TAMPERED",
                computed_hash=computed,
                stored_hash=exp.input_hash,
                catalog_version=exp.catalog_version,
                reason="El hash recalculado NO coincide con el almacenado. Posible alteración."
            )
    
    if exp.catalog_version not in KNOWN_CATALOG_VERSIONS:
        return VerificationResult(
            expediente_id=exp.id,
            status="CATALOGO_DESCONOCIDO",
            computed_hash=computed,
            stored_hash=exp.input_hash,
            catalog_version=exp.catalog_version,
            reason="Versión de catálogo no reconocida en el baseline oficial."
        )
    
    return VerificationResult(
        expediente_id=exp.id,
        status="VALIDO",
        computed_hash=computed,
        stored_hash=exp.input_hash,
        catalog_version=exp.catalog_version
    )

def verify_ledger_chain(entries: List[LedgerEntry]) -> List[Tuple[LedgerEntry, bool, str]]:
    """
    Verifica la cadena de hashes del ledger inmutable (append-only).
    Cada entry.payload_hash debe enlazarse con entry.prev_hash del anterior.
    """
    results = []
    prev_hash = "0" * 64  # Génesis
    
    for entry in entries:
        is_valid = (entry.prev_hash == prev_hash)
        reason = "" if is_valid else f"Ruptura de cadena: prev_hash esperado {prev_hash[:16]}... pero es {entry.prev_hash[:16]}..."
        results.append((entry, is_valid, reason))
        prev_hash = entry.payload_hash
    
    return results

# ==============================================================================
# 5. GENERADOR DE RESPALDO LOCAL (SQLite + JSON)
# ==============================================================================

def create_local_backup(
    expedientes: List[Expediente],
    clients: List[Client],
    ledger: List[LedgerEntry],
    tenant_id: str
) -> Path:
    """Crea un respaldo SQLite local portátil con todos los datos del tenant."""
    BACKUP_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    db_path = BACKUP_DIR / f"ark_forensic_{tenant_id[:8]}_{timestamp}.sqlite"
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Schema local
    c.executescript("""
        CREATE TABLE clients (
            id TEXT PRIMARY KEY,
            tenant_id TEXT,
            nombre TEXT,
            rfc TEXT,
            tipo TEXT
        );
        CREATE TABLE expedientes (
            id TEXT PRIMARY KEY,
            client_id TEXT,
            tenant_id TEXT,
            tool_id TEXT,
            titulo TEXT,
            input_hash TEXT,
            inputs TEXT,
            outputs TEXT,
            catalog_version TEXT,
            created_by TEXT,
            created_at TEXT,
            verification_status TEXT,
            computed_hash TEXT
        );
        CREATE TABLE arkangel_ledger (
            id TEXT PRIMARY KEY,
            tenant_id TEXT,
            client_id TEXT,
            tool_id TEXT,
            payload_hash TEXT,
            prev_hash TEXT,
            created_at TEXT,
            chain_valid INTEGER
        );
        CREATE TABLE audit_metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    """)
    
    # Insertar datos
    for client in clients:
        c.execute(
            "INSERT INTO clients VALUES (?, ?, ?, ?, ?)",
            (client.id, client.tenant_id, client.nombre, client.rfc, client.tipo)
        )
    
    for exp in expedientes:
        res = verify_expediente(exp)
        c.execute(
            "INSERT INTO expedientes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (exp.id, exp.client_id, exp.tenant_id, exp.tool_id, exp.titulo,
             exp.input_hash, json.dumps(exp.inputs, ensure_ascii=False),
             json.dumps(exp.outputs, ensure_ascii=False), exp.catalog_version,
             exp.created_by, exp.created_at, res.status, res.computed_hash)
        )
    
    ledger_results = verify_ledger_chain(ledger)
    for entry, is_valid, _ in ledger_results:
        c.execute(
            "INSERT INTO arkangel_ledger VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (entry.id, entry.tenant_id, entry.client_id, entry.tool_id,
             entry.payload_hash, entry.prev_hash, entry.created_at, int(is_valid))
        )
    
    # Metadatos de auditoría
    audit_meta = {
        "audit_timestamp": datetime.now(timezone.utc).isoformat(),
        "auditor_tool": "d1_audit_verifier.py v1.0",
        "tenant_id": tenant_id,
        "total_expedientes": len(expedientes),
        "total_clients": len(clients),
        "total_ledger_entries": len(ledger),
        "d1_database_id": D1_DATABASE_ID
    }
    for key, value in audit_meta.items():
        c.execute("INSERT INTO audit_metadata VALUES (?, ?)", (key, str(value)))
    
    conn.commit()
    conn.close()
    
    return db_path

# ==============================================================================
# 6. GENERADOR DE REPORTE DE RECONCILIACIÓN (HTML)
# ==============================================================================

def generate_audit_report(
    tenant_id: str,
    verification_results: List[VerificationResult],
    ledger_results: List[Tuple[LedgerEntry, bool, str]],
    backup_path: Path
) -> Path:
    """Genera un reporte HTML standalone de reconciliación forense."""
    REPORT_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    report_path = REPORT_DIR / f"audit_report_{tenant_id[:8]}_{timestamp}.html"
    
    valid_count = sum(1 for r in verification_results if r.status == "VALIDO")
    tampered_count = sum(1 for r in verification_results if r.status == "TAMPERED")
    unknown_count = sum(1 for r in verification_results if r.status == "CATALOGO_DESCONOCIDO")
    ledger_valid = sum(1 for _, is_valid, _ in ledger_results if is_valid)
    ledger_broken = len(ledger_results) - ledger_valid
    
    # Hash del reporte mismo (para auto-verificación)
    report_content_for_hash = f"{tenant_id}|{timestamp}|{valid_count}|{tampered_count}|{ledger_valid}"
    report_hash = hashlib.sha256(report_content_for_hash.encode()).hexdigest()
    
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Auditoría Forense - ARK LEDGER</title>
    <style>
        body {{ font-family: 'Segoe UI', system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; background: #0F172A; color: #E2E8F0; }}
        h1 {{ color: #F59E0B; border-bottom: 2px solid #F59E0B; padding-bottom: 0.5rem; }}
        h2 {{ color: #FBBF24; margin-top: 2rem; }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0; }}
        .card {{ background: #1E293B; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #F59E0B; }}
        .card.valid {{ border-left-color: #10B981; }}
        .card.tampered {{ border-left-color: #EF4444; }}
        .card.unknown {{ border-left-color: #F59E0B; }}
        .card h3 {{ margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #94A3B8; text-transform: uppercase; }}
        .card .value {{ font-size: 2rem; font-weight: bold; }}
        table {{ width: 100%; border-collapse: collapse; margin: 1rem 0; background: #1E293B; }}
        th, td {{ padding: 0.75rem; text-align: left; border-bottom: 1px solid #334155; font-size: 0.85rem; }}
        th {{ background: #0F172A; color: #FBBF24; text-transform: uppercase; font-size: 0.75rem; }}
        .hash {{ font-family: 'Courier New', monospace; font-size: 0.75rem; color: #94A3B8; word-break: break-all; }}
        .badge {{ display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }}
        .badge.valid {{ background: #10B981; color: white; }}
        .badge.tampered {{ background: #EF4444; color: white; }}
        .badge.unknown {{ background: #F59E0B; color: #0F172A; }}
        .footer {{ margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #334155; font-size: 0.8rem; color: #64748B; }}
        @media print {{ body {{ background: white; color: #0F172A; }} .card {{ background: #F8FAFC; }} table {{ background: white; }} }}
    </style>
</head>
<body>
    <h1>🔐 Reporte de Auditoría Forense ARK LEDGER</h1>
    <p><strong>Tenant ID:</strong> <code>{tenant_id}</code></p>
    <p><strong>Fecha de Auditoría:</strong> {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")}</p>
    <p><strong>Herramienta:</strong> d1_audit_verifier.py v1.0 | Substrate Holdings LLC</p>
    
    <h2>📊 Resumen Ejecutivo</h2>
    <div class="summary">
        <div class="card valid">
            <h3>Expedientes Válidos</h3>
            <div class="value">{valid_count}</div>
        </div>
        <div class="card tampered">
            <h3>Alterados (Tampered)</h3>
            <div class="value">{tampered_count}</div>
        </div>
        <div class="card unknown">
            <h3>Catálogo Desconocido</h3>
            <div class="value">{unknown_count}</div>
        </div>
        <div class="card">
            <h3>Ledger Íntegro</h3>
            <div class="value">{ledger_valid}/{len(ledger_results)}</div>
        </div>
    </div>
    
    <h2>📋 Detalle de Expedientes Verificados</h2>
    <table>
        <thead>
            <tr>
                <th>Estado</th>
                <th>Tool ID</th>
                <th>Título</th>
                <th>Versión DOF</th>
                <th>Hash Almacenado</th>
                <th>Hash Recalculado</th>
            </tr>
        </thead>
        <tbody>
"""
    
    for result in verification_results:
        badge_class = result.status.lower() if result.status in ["VALIDO", "TAMPERED"] else "unknown"
        html += f"""
            <tr>
                <td><span class="badge {badge_class}">{result.status}</span></td>
                <td>{result.catalog_version.split('-')[1] if '-' in result.catalog_version else result.catalog_version}</td>
                <td>{result.expediente_id[:8]}...</td>
                <td><code>{result.catalog_version}</code></td>
                <td class="hash">{result.stored_hash[:32]}...</td>
                <td class="hash">{result.computed_hash[:32]}...</td>
            </tr>
"""
    
    html += f"""
        </tbody>
    </table>
    
    <h2>🔗 Integridad de Cadena Ledger (arkangel_ledger)</h2>
    <p>Entradas verificadas: <strong>{ledger_valid}</strong> | Rupturas detectadas: <strong>{ledger_broken}</strong></p>
    
    <div class="footer">
        <p><strong>Hash del Reporte:</strong> <code>{report_hash}</code></p>
        <p><strong>Respaldo SQLite:</strong> <code>{backup_path.name}</code></p>
        <p>Este reporte es auto-contenido y verificable. Los hashes SHA-256 pueden ser recalculados independientemente usando el script <code>d1_audit_verifier.py</code>.</p>
        <p>Fundamentación: Art. 28 CFF (obligación de contabilidad), Art. 29-A CFF (CFDI), LISR, LSS, LFT.</p>
    </div>
</body>
</html>
"""
    
    report_path.write_text(html, encoding="utf-8")
    return report_path

# ==============================================================================
# 7. CLI PRINCIPAL
# ==============================================================================

def main():
    console.print(Panel.fit(
        "[bold gold1]ARK LEDGER — D1 Audit Verifier v1.0[/bold gold1]\n"
        "Auditoría forense y reconciliación criptográfica de expedientes D1.",
        border_style="gold1"
    ))
    
    if not CLOUDFLARE_API_TOKEN or not CLOUDFLARE_ACCOUNT_ID:
        console.print("[bold red]❌ Faltan variables de entorno:[/bold red]")
        console.print("   - CLOUDFLARE_API_TOKEN")
        console.print("   - CLOUDFLARE_ACCOUNT_ID")
        console.print("\n[dim]Configura estas variables en tu archivo .env o .dev.vars[/dim]")
        return
    
    try:
        d1 = D1Client()
    except ValueError as e:
        console.print(f"[bold red]❌ {e}[/bold red]")
        return
    
    # Solicitar tenant_id (o usar todos)
    tenant_id = os.getenv("AUDIT_TENANT_ID")
    if not tenant_id:
        console.print("[yellow]⚠️ AUDIT_TENANT_ID no configurado. Auditando TODOS los tenants.[/yellow]")
        tenant_filter = None
    else:
        console.print(f"[bold]Auditing tenant:[/bold] {tenant_id}")
        tenant_filter = tenant_id
    
    # 1. Descargar datos de D1
    console.print("\n[bold blue]📥 Descargando datos desde Cloudflare D1...[/bold blue]")
    try:
        expedientes = d1.fetch_expedientes(tenant_filter)
        clients = d1.fetch_clients(tenant_filter)
        ledger = d1.fetch_ledger(tenant_filter)
    except Exception as e:
        console.print(f"[bold red]❌ Error al consultar D1: {e}[/bold red]")
        return
    
    console.print(f"   ✓ {len(expedientes)} expedientes")
    console.print(f"   ✓ {len(clients)} clientes")
    console.print(f"   ✓ {len(ledger)} entradas en ledger")
    
    if not expedientes:
        console.print("[yellow]⚠️ No hay expedientes para auditar.[/yellow]")
        return
    
    # 2. Verificar integridad criptográfica
    console.print("\n[bold blue]🔐 Verificando integridad SHA-256...[/bold blue]")
    verification_results = []
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        task = progress.add_task("[cyan]Recalculando hashes...", total=len(expedientes))
        
        for exp in expedientes:
            result = verify_expediente(exp)
            verification_results.append(result)
            progress.update(task, advance=1)
    
    # 3. Verificar cadena de ledger
    console.print("[bold blue]🔗 Verificando cadena de ledger...[/bold blue]")
    ledger_results = verify_ledger_chain(ledger)
    
    # 4. Mostrar resultados en consola
    console.print("\n[bold]📊 Resultados de Verificación:[/bold]")
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Estado", width=20)
    table.add_column("Expediente ID", width=36)
    table.add_column("Versión DOF", width=40)
    table.add_column("Detalle")
    
    for result in verification_results:
        status_style = "green" if result.status == "VALIDO" else "red" if result.status == "TAMPERED" else "yellow"
        table.add_row(
            f"[{status_style}]{result.status}[/{status_style}]",
            result.expediente_id,
            result.catalog_version,
            result.reason or "Hash coincide perfectamente"
        )
    
    console.print(table)
    
    # 5. Generar respaldo local
    effective_tenant = tenant_filter or "all_tenants"
    console.print(f"\n[bold blue]💾 Generando respaldo local SQLite...[/bold blue]")
    backup_path = create_local_backup(expedientes, clients, ledger, effective_tenant)
    console.print(f"   ✓ Respaldo creado: [link=file://{backup_path.absolute()}]{backup_path.name}[/link]")
    
    # 6. Generar reporte HTML
    console.print("[bold blue]📄 Generando reporte de reconciliación HTML...[/bold blue]")
    report_path = generate_audit_report(effective_tenant, verification_results, ledger_results, backup_path)
    console.print(f"   ✓ Reporte creado: [link=file://{report_path.absolute()}]{report_path.name}[/link]")
    
    # 7. Resumen final
    valid_count = sum(1 for r in verification_results if r.status == "VALIDO")
    tampered_count = sum(1 for r in verification_results if r.status == "TAMPERED")
    
    console.print("\n" + Panel.fit(
        f"[bold green]✅ Auditoría completada[/bold green]\n\n"
        f"Expedientes válidos: [bold green]{valid_count}[/bold green]\n"
        f"Expedientes alterados: [bold red]{tampered_count}[/bold red]\n"
        f"Respaldo SQLite: {backup_path.name}\n"
        f"Reporte HTML: {report_path.name}",
        border_style="gold1"
    ))
    
    if tampered_count > 0:
        console.print("\n[bold red]🚨 ALERTA: Se detectaron expedientes con hashes inconsistentes.[/bold red]")
        console.print("[dim]Esto podría indicar alteración de datos o divergencia en el algoritmo de hash.[/dim]")
        console.print("[dim]Revisa el reporte HTML para identificar los expedientes afectados.[/dim]")

if __name__ == "__main__":
    main()
