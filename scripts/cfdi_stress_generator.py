"""
ARK LEDGER — CFDI Stress Generator
Propósito: Generar lotes masivos (50-500+) de archivos XML CFDI 4.0 sintéticos 
y estructuralmente válidos (Anexo 20 SAT) para pruebas de estrés, QA y validación 
de parsers sin exponer datos reales de clientes.
Mantenedor: Substrate Holdings LLC
Fecha: Octubre 2026
"""

import os
import sys
import uuid
import base64
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

# Forzar UTF-8 en consolas Windows para soporte de spinners y caracteres acentuados
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import xmltodict
from lxml import etree
from faker import Faker
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.x509 import Name, NameAttribute, CertificateBuilder
from cryptography.x509.oid import NameOID
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel

console = Console()

# ==============================================================================
# 1. CONFIGURACIÓN Y CONSTANTES FISCALES (DOF 2026)
# ==============================================================================

OUTPUT_DIR = "./stress_test_xmls"
NUM_FILES = 100  # Ajustar entre 50 y 500+

# Valores DOF 2026
UMA_DIARIA = 117.31
TOPE_25_UMA = 2932.75  # 25 * 117.31
SALARIO_MINIMO = 315.04

# RFCs de prueba y EFOS simulados (Art. 69-B CFF)
RFC_EMISOR_GENERICO = "ARK900101XXX"
RFC_EFOS_SIMULADO = "EFOS850101A1B"  # Será detectado por el validador
RFC_RECEPTOR_GENERICO = "XAXX010101000"

fake = Faker("es_MX")

# ==============================================================================
# 2. MOTOR CRIPTOGRÁFICO SINTÉTICO (Mock FIEL)
# ==============================================================================

class MockFIEL:
    """Genera un certificado y sello estructuralmente válidos para pasar regex y parsers."""
    def __init__(self):
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self.subject = issuer = Name([
            NameAttribute(NameOID.COMMON_NAME, "ARK LEDGER Synthetic FIEL"),
            NameAttribute(NameOID.ORGANIZATION_NAME, "Substrate Holdings LLC"),
            NameAttribute(NameOID.COUNTRY_NAME, "MX"),
        ])
        now = datetime.now(timezone.utc)
        self.cert = CertificateBuilder().subject_name(
            self.subject
        ).issuer_name(
            issuer
        ).public_key(
            self.private_key.public_key()
        ).serial_number(
            random.randint(10**19, 10**20 - 1)  # 20 dígitos para NoCertificado
        ).not_valid_before(
            now - timedelta(days=30)
        ).not_valid_after(
            now + timedelta(days=365)
        ).sign(self.private_key, hashes.SHA256())

        self.no_certificado = str(self.cert.serial_number).zfill(20)
        self.cert_pem = self.cert.public_bytes(serialization.Encoding.DER)
        self.cert_b64 = base64.b64encode(self.cert_pem).decode('utf-8')

    def sign_cadena(self, cadena_original: str) -> str:
        signature = self.private_key.sign(
            cadena_original.encode('utf-8'),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode('utf-8')

# Instancia única para el lote (simula un mismo CSD emitiendo todo el lote)
mock_fiel = MockFIEL()

# ==============================================================================
# 3. GENERADORES DE ESCENARIOS CFDI 4.0
# ==============================================================================

def generate_uuid() -> str:
    return str(uuid.uuid4()).upper()

def get_mock_rfc(is_efos: bool = False) -> str:
    if is_efos:
        return RFC_EFOS_SIMULADO
    # Generar RFC sintético válido para pruebas QA
    letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=4))
    digits = f"{random.randint(70, 99):02d}{random.randint(1, 12):02d}{random.randint(1, 28):02d}"
    homo = random.choice(["000", "XXX", "A1B", "1A1"])
    return f"{letters}{digits}{homo}"

def build_cadena_original(comprobante: Dict) -> str:
    """Simula la cadena original para el sellado (simplificada para el mock)."""
    return f"||{comprobante['cfdi:Comprobante']['@Version']}|{comprobante['cfdi:Comprobante']['@Folio']}|{comprobante['cfdi:Comprobante']['@Total']}||"

def generate_cfdi_ingreso(scenario: str) -> Dict[str, Any]:
    """Genera un CFDI de Ingreso con escenarios: Normal, RESICO con retención, o EFOS."""
    is_efos = scenario == "efos"
    is_resico = scenario == "resico"
    
    subtotal = round(random.uniform(1000, 50000), 2)
    iva = round(subtotal * 0.16, 2)
    retencion_isr = round(subtotal * 0.0125, 2) if is_resico else 0.0
    total = round(subtotal + iva - retencion_isr, 2)
    fecha_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    
    doc = {
        "cfdi:Comprobante": {
            "@xmlns:cfdi": "http://www.sat.gob.mx/cfd/4",
            "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            "@xsi:schemaLocation": "http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd",
            "@Version": "4.0",
            "@Serie": "A",
            "@Folio": str(random.randint(1000, 9999)),
            "@Fecha": fecha_iso,
            "@Sello": "", # Se llena al sellar
            "@NoCertificado": mock_fiel.no_certificado,
            "@Certificado": mock_fiel.cert_b64,
            "@SubTotal": f"{subtotal:.2f}",
            "@Descuento": "0.00",
            "@Moneda": "MXN",
            "@Total": f"{total:.2f}",
            "@TipoDeComprobante": "I",
            "@Exportacion": "01",
            "@MetodoPago": "PUE",
            "@FormaPago": "03",
            "@LugarExpedicion": "06000",
            "cfdi:Emisor": {
                "@Rfc": RFC_EMISOR_GENERICO,
                "@Nombre": "ARK LEDGER SA DE CV",
                "@RegimenFiscal": "601" if not is_resico else "626"
            },
            "cfdi:Receptor": {
                "@Rfc": get_mock_rfc(is_efos=is_efos),
                "@Nombre": "CLIENTE SINTETICO SA DE CV" if not is_efos else "EMPRESA FANTASMA EFOS SC",
                "@DomicilioFiscalReceptor": "06000",
                "@RegimenFiscalReceptor": "601",
                "@UsoCFDI": "G03"
            },
            "cfdi:Conceptos": {
                "cfdi:Concepto": {
                    "@ClaveProdServ": "84111506",
                    "@NoIdentificacion": "SRV-001",
                    "@Cantidad": "1",
                    "@ClaveUnidad": "E48",
                    "@Unidad": "Servicio",
                    "@Descripcion": "Servicios de consultoría fiscal y tecnológica",
                    "@ValorUnitario": f"{subtotal:.2f}",
                    "@Importe": f"{subtotal:.2f}",
                    "cfdi:Impuestos": {
                        "cfdi:Traslados": {
                            "cfdi:Traslado": {
                                "@Base": f"{subtotal:.2f}",
                                "@Impuesto": "002",
                                "@TipoFactor": "Tasa",
                                "@TasaOCuota": "0.160000",
                                "@Importe": f"{iva:.2f}"
                            }
                        }
                    } if not is_resico else {}
                }
            },
            "cfdi:Impuestos": {
                "@TotalImpuestosTrasladados": f"{iva:.2f}",
                **( {"@TotalImpuestosRetenidos": f"{retencion_isr:.2f}"} if is_resico else {} ),
                "cfdi:Traslados": {
                    "cfdi:Traslado": {
                        "@Base": f"{subtotal:.2f}",
                        "@Impuesto": "002",
                        "@TipoFactor": "Tasa",
                        "@TasaOCuota": "0.160000",
                        "@Importe": f"{iva:.2f}"
                    }
                },
                **( {
                    "cfdi:Retenciones": {
                        "cfdi:Retencion": {
                            "@Base": f"{subtotal:.2f}",
                            "@Impuesto": "001",
                            "@TipoFactor": "Tasa",
                            "@TasaOCuota": "0.012500",
                            "@Importe": f"{retencion_isr:.2f}"
                        }
                    }
                } if is_resico else {} )
            },
            "cfdi:Complemento": {
                "tfd:TimbreFiscalDigital": {
                    "@xmlns:tfd": "http://www.sat.gob.mx/TimbreFiscalDigital",
                    "@xsi:schemaLocation": "http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd",
                    "@Version": "1.1",
                    "@UUID": generate_uuid(),
                    "@FechaTimbrado": fecha_iso,
                    "@RfcProvCertif": "EKU9003173C9",
                    "@SelloCFD": "", # Se llena al sellar
                    "@NoCertificadoSAT": "30001000000400002434",
                    "@SelloSAT": ""  # Se llena al sellar
                }
            }
        }
    }
    return doc

def generate_cfdi_nomina(scenario: str) -> Dict[str, Any]:
    """Genera un CFDI de Nómina. Escenario 'tope_uma' fuerza el SBC a 25 UMAs exactas."""
    dias = 15
    salario_diario = TOPE_25_UMA if scenario == "tope_uma" else round(random.uniform(400, 1500), 2)
    salario_integrado = round(salario_diario * 1.0493, 2)
    subtotal = round(salario_diario * dias, 2)
    
    # Cálculo simplificado de IMSS y ISR para el mock
    imss_obrero = round(subtotal * 0.01175, 2) 
    isr = round(subtotal * 0.10, 2)
    subsidio = 0.0
    total = round(subtotal - imss_obrero - isr + subsidio, 2)
    now = datetime.now(timezone.utc)
    fecha_iso = now.strftime("%Y-%m-%dT%H:%M:%S")

    doc = {
        "cfdi:Comprobante": {
            "@xmlns:cfdi": "http://www.sat.gob.mx/cfd/4",
            "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            "@xmlns:nomina12": "http://www.sat.gob.mx/nomina12",
            "@xsi:schemaLocation": "http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/nomina12 http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd",
            "@Version": "4.0",
            "@Serie": "N",
            "@Folio": str(random.randint(10000, 99999)),
            "@Fecha": fecha_iso,
            "@Sello": "",
            "@NoCertificado": mock_fiel.no_certificado,
            "@Certificado": mock_fiel.cert_b64,
            "@SubTotal": f"{subtotal:.2f}",
            "@Descuento": "0.00",
            "@Moneda": "MXN",
            "@Total": f"{total:.2f}",
            "@TipoDeComprobante": "N",
            "@Exportacion": "01",
            "@MetodoPago": "PUE",
            "@FormaPago": "99",
            "@LugarExpedicion": "06000",
            "cfdi:Emisor": {
                "@Rfc": RFC_EMISOR_GENERICO,
                "@Nombre": "ARK LEDGER SA DE CV",
                "@RegimenFiscal": "601"
            },
            "cfdi:Receptor": {
                "@Rfc": get_mock_rfc(),
                "@Nombre": fake.name().upper(),
                "@DomicilioFiscalReceptor": "06000",
                "@RegimenFiscalReceptor": "616",
                "@UsoCFDI": "P01"
            },
            "cfdi:Conceptos": {
                "cfdi:Concepto": {
                    "@ClaveProdServ": "84111506",
                    "@Cantidad": "1",
                    "@ClaveUnidad": "E48",
                    "@Descripcion": "Pago de nómina",
                    "@ValorUnitario": f"{subtotal:.2f}",
                    "@Importe": f"{subtotal:.2f}"
                }
            },
            "cfdi:Complemento": {
                "nomina12:Nomina": {
                    "@xmlns:nomina12": "http://www.sat.gob.mx/nomina12",
                    "@xsi:schemaLocation": "http://www.sat.gob.mx/nomina12 http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd",
                    "@Version": "1.2",
                    "@TipoNomina": "O",
                    "@FechaPago": now.strftime("%Y-%m-%d"),
                    "@FechaInicialPago": (now - timedelta(days=15)).strftime("%Y-%m-%d"),
                    "@FechaFinalPago": now.strftime("%Y-%m-%d"),
                    "@NumDiasPagados": str(dias),
                    "nomina12:Emisor": {
                        "@RegistroPatronal": "Y9999999999",
                        "@RfcPatronOrigen": RFC_EMISOR_GENERICO
                    },
                    "nomina12:Receptor": {
                        "@Curp": fake.curp().upper(),
                        "@NumSeguridadSocial": f"{random.randint(10000000000, 99999999999)}",
                        "@FechaInicioRelLaboral": (now - timedelta(days=random.randint(100, 1000))).strftime("%Y-%m-%d"),
                        "@TipoContrato": "01",
                        "@Sindicato": "01",
                        "@TipoJornada": "02",
                        "@TipoRegimen": "02",
                        "@NumEmpleado": str(random.randint(1000, 9999)),
                        "@Departamento": "Sistemas",
                        "@Puesto": "Desarrollador",
                        "@RiesgoPuesto": "1",
                        "@PeriodicidadPago": "04",
                        "@Banco": "012",
                        "@CuentaBancaria": "123456789012345678",
                        "@SalarioBaseCotApor": f"{salario_integrado:.2f}",
                        "@SalarioDiarioIntegrado": f"{salario_integrado:.2f}",
                        "@ClaveEntFed": "CMX"
                    },
                    "nomina12:Percepciones": {
                        "@TotalSueldos": f"{subtotal:.2f}",
                        "@TotalExento": "0.00",
                        "@TotalGravado": f"{subtotal:.2f}",
                        "nomina12:Percepcion": {
                            "@TipoPercepcion": "001",
                            "@Clave": "001",
                            "@Concepto": "Sueldo Base",
                            "@ImporteGravado": f"{subtotal:.2f}",
                            "@ImporteExento": "0.00"
                        }
                    },
                    "nomina12:Deducciones": {
                        "@TotalOtrasDeducciones": f"{round(imss_obrero + isr, 2):.2f}",
                        "@TotalImpuestosRetenidos": f"{isr:.2f}",
                        "nomina12:Deduccion": [
                            {
                                "@TipoDeduccion": "002",
                                "@Clave": "002",
                                "@Concepto": "IMSS Obrero",
                                "@Importe": f"{imss_obrero:.2f}"
                            },
                            {
                                "@TipoDeduccion": "001",
                                "@Clave": "001",
                                "@Concepto": "ISR",
                                "@Importe": f"{isr:.2f}"
                            }
                        ]
                    }
                },
                "tfd:TimbreFiscalDigital": {
                    "@xmlns:tfd": "http://www.sat.gob.mx/TimbreFiscalDigital",
                    "@Version": "1.1",
                    "@UUID": generate_uuid(),
                    "@FechaTimbrado": fecha_iso,
                    "@RfcProvCertif": "EKU9003173C9",
                    "@SelloCFD": "",
                    "@NoCertificadoSAT": "30001000000400002434",
                    "@SelloSAT": ""
                }
            }
        }
    }
    return doc

# ==============================================================================
# 4. PROCESADOR DE LOTE Y SELLADO
# ==============================================================================

def sign_and_save_xml(doc: Dict[str, Any], filename: str):
    """Aplica sellos mock sobre la estructura y guarda el archivo XML validado."""
    # 1. Generar sellos (simulados pero criptográficamente estructurados con RSA SHA-256)
    cadena = build_cadena_original(doc)
    sello_cfd = mock_fiel.sign_cadena(cadena)
    sello_sat = base64.b64encode(os.urandom(256)).decode('utf-8')

    # 2. Inyectar sellos directamente en el diccionario estructurado
    comprobante = doc.get("cfdi:Comprobante", {})
    comprobante["@Sello"] = sello_cfd
    
    complemento = comprobante.get("cfdi:Complemento", {})
    tfd = complemento.get("tfd:TimbreFiscalDigital")
    if tfd:
        tfd["@SelloCFD"] = sello_cfd
        tfd["@SelloSAT"] = sello_sat

    # 3. Unparse a XML string
    xml_str = xmltodict.unparse(doc, pretty=True)
    
    # 4. Validar estructura básica con lxml
    try:
        etree.fromstring(xml_str.encode('utf-8'))
    except etree.XMLSyntaxError as e:
        console.print(f"[bold red]Error de sintaxis XML en {filename}: {e}[/bold red]")
        return

    # 5. Guardar
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(xml_str)

def main():
    console.print(Panel.fit(
        "[bold gold1]ARK LEDGER — CFDI Stress Generator v1.0[/bold gold1]\n"
        "Generando lotes sintéticos de CFDI 4.0 con escenarios borde para QA.",
        border_style="gold1"
    ))
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Limpiar directorio previo
    for f in os.listdir(OUTPUT_DIR):
        os.remove(os.path.join(OUTPUT_DIR, f))
        
    scenarios = [
        ("ingreso_normal", generate_cfdi_ingreso, "normal"),
        ("ingreso_resico", generate_cfdi_ingreso, "resico"),
        ("ingreso_efos", generate_cfdi_ingreso, "efos"),
        ("nomina_tope_uma", generate_cfdi_nomina, "tope_uma"),
        ("nomina_normal", generate_cfdi_nomina, "normal"),
    ]
    
    console.print(f"\n[bold]Generando {NUM_FILES} archivos XML en: {os.path.abspath(OUTPUT_DIR)}[/bold]\n")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        task = progress.add_task("[cyan]Procesando...", total=NUM_FILES)
        
        for i in range(NUM_FILES):
            scenario_name, generator_func, scenario_arg = random.choice(scenarios)
            doc = generator_func(scenario_arg)
            
            # Nombre de archivo descriptivo para fácil identificación en QA
            tipo = "ING" if "ingreso" in scenario_name else "NOM"
            extra = scenario_arg.upper()
            filename = f"CFDI_40_{tipo}_{extra}_{i+1:04d}_{generate_uuid()[:8]}.xml"
            
            sign_and_save_xml(doc, filename)
            progress.update(task, advance=1)
            
    console.print("\n[bold green]✅ Generación completada exitosamente.[/bold green]")
    console.print(f"[dim]Total de archivos: {len(os.listdir(OUTPUT_DIR))}[/dim]")
    console.print("[dim]Escenarios incluidos: Ingreso Normal, RESICO (Retención 1.25%), EFOS (Art. 69-B), Nómina Tope 25 UMAs.[/dim]")

if __name__ == "__main__":
    main()
