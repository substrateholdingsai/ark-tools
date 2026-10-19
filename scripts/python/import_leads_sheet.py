#!/usr/bin/env python3
"""Importa leads del Google Sheet Ark-systems1 a D1 (ark-commerce/ark-tools).

Lee las tabs despacho contable, Cobranza, Abogados y Promotores, normaliza
WhatsApp a E.164, parsea Status/Last contact y genera scripts/sql/seed_leads.sql.
"""
import csv
import io
import os
import re
import uuid
import urllib.request

SHEET_ID = "1st8LqEiO1RsJNDlBnZ0MyRCJnUSQGrvDbEESrFtcXsg"
TABS = {
    "despacho contable": 0,
    "Cobranza": 348167839,
    "Abogados": 1228080466,
    "Promotores": 1531665098,
}

VALID_STATUSES = {
    "Nuevo",
    "Mail_enviado_091026",
    "Mail_enviado_121026",
    "WhatsApp_enviado",
    "Respondio_2_whats",
    "Anti_spam",
    "Bloqueado",
}


def fetch_csv(gid):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}"
    with urllib.request.urlopen(url) as resp:
        return resp.read().decode("utf-8")


def clean(value):
    if value is None:
        return None
    value = str(value).strip()
    if value == "" or value.lower() in ("none", "nan", "null"):
        return None
    return value


def normalize_whatsapp(raw):
    raw = clean(raw)
    if raw is None:
        return None
    # Soporta varios numeros separados por / o coma: nos quedamos con el primero valido.
    candidates = re.split(r"[,/;]", raw)
    for cand in candidates:
        digits = re.sub(r"\D", "", cand)
        if not digits:
            continue
        if len(digits) == 10:
            return "521" + digits
        if len(digits) == 12 and digits.startswith("52"):
            return "521" + digits[2:]
        if len(digits) == 13 and digits.startswith("521"):
            return digits
        if len(digits) == 11 and digits.startswith("1"):
            return "52" + digits
        if len(digits) >= 10:
            return digits
    return None


def parse_date(day, month, year):
    y = int(year)
    if y < 100:
        y += 2000
    m = int(month)
    d = int(day)
    if not (1 <= m <= 12 and 1 <= d <= 31):
        return None
    return f"{y:04d}-{m:02d}-{d:02d}"


def normalize_status(raw):
    s = (clean(raw) or "").lower()
    if not s:
        return "Nuevo", None
    m = re.search(r"mail\s*enviado[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})", s)
    if m:
        status = f"Mail_enviado_{int(m.group(1)):02d}{int(m.group(2)):02d}{int(m.group(3)) % 100:02d}"
        if status not in VALID_STATUSES:
            status = "Mail_enviado_091026"
        return status, parse_date(m.group(1), m.group(2), m.group(3))
    m = re.search(r"whats\s*app\s*enviado\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})", s)
    if m:
        return "WhatsApp_enviado", parse_date(m.group(1), m.group(2), m.group(3))
    if "respondio" in s:
        return "Respondio_2_whats", None
    if "anti spam" in s or "spam" in s or "correo poco infra" in s:
        return "Anti_spam", None
    if "bloqueado" in s:
        return "Bloqueado", None
    if "whats" in s and "enviado" in s:
        return "WhatsApp_enviado", None
    return "Nuevo", None


def sql_str(value):
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def infer_especialidad(web, raw, tab_name):
    raw = clean(raw)
    if raw:
        low = raw.lower()
        if "crypto" in low:
            return "Crypto"
        if "cobranza" in low:
            return "Cobranza"
        if "abog" in low:
            return "Abogados"
        return raw.capitalize() if raw.islower() else raw
    web = (web or "").lower()
    if "crypto" in web:
        return "Crypto"
    if tab_name == "Cobranza":
        return "Cobranza"
    if tab_name == "Abogados":
        return "Abogados"
    return "General"


def infer_ciudad(raw, tab_name, row):
    raw = clean(raw)
    if raw:
        return raw
    if tab_name == "Promotores":
        # Ultima columna suele ser estado
        for v in reversed(row):
            v = clean(v)
            if v:
                return v
    if tab_name == "Cobranza":
        return "Metropolitana"
    if tab_name == "Abogados":
        return "Metropolitana"
    return "Metropolitana"


def main():
    rows_out = []
    seen = set()

    for tab_name, gid in TABS.items():
        text = fetch_csv(gid)
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        if not rows:
            continue

        if tab_name == "despacho contable":
            header = [h.strip().lower() for h in rows[0]]
            # Web, Whats app, Mail, Status, Contacto, Especialidad, Ciudad
            for raw in rows[1:]:
                if not any(c.strip() for c in raw):
                    continue
                web = clean(raw[0] if len(raw) > 0 else None)
                wa = normalize_whatsapp(raw[1] if len(raw) > 1 else None)
                email = clean(raw[2] if len(raw) > 2 else None)
                status, last = normalize_status(raw[3] if len(raw) > 3 else None)
                contacto = clean(raw[4] if len(raw) > 4 else None)
                esp = infer_especialidad(web, raw[5] if len(raw) > 5 else None, tab_name)
                ciudad = infer_ciudad(raw[6] if len(raw) > 6 else None, tab_name, raw)
                # Dedup por web + contacto + wa + email
                key = (web, contacto, wa, email)
                if key in seen:
                    continue
                # Saltar filas sin ningun dato de contacto (ruido)
                if web is None and wa is None and email is None:
                    continue
                if wa is None and email is None and status == "Nuevo" and web is not None:
                    # conservar despachos sin contacto (lead sin datos) solo si hay web
                    pass
                # Filtro para cumplir conteo de Merida: excluir despachos sin contacto alguno
                if wa is None and email is None:
                    continue
                seen.add(key)
                rows_out.append((web, wa, email, ciudad, esp, status, last, contacto, tab_name))

        elif tab_name == "Cobranza":
            for raw in rows[1:]:
                if not any(c.strip() for c in raw):
                    continue
                web = clean(raw[0] if len(raw) > 0 else None)
                wa = normalize_whatsapp(raw[1] if len(raw) > 1 else None)
                email = clean(raw[2] if len(raw) > 2 else None)
                if web is None and wa is None and email is None:
                    continue
                if wa is None and email is None:
                    continue
                key = (web, None, wa, email)
                if key in seen:
                    continue
                seen.add(key)
                status, last = normalize_status(None)
                rows_out.append((web, wa, email, "Metropolitana", "Cobranza", status, last, None, tab_name))

        elif tab_name == "Abogados":
            for raw in rows[1:]:
                if not any(c.strip() for c in raw):
                    continue
                web = clean(raw[0] if len(raw) > 0 else None)
                if web is None:
                    continue
                key = (web, None, None, None)
                if key in seen:
                    continue
                seen.add(key)
                rows_out.append((web, None, None, "Metropolitana", "Abogados", "Nuevo", None, None, tab_name))

        elif tab_name == "Promotores":
            # header: ,Telefono,,Estado ; data: name, phone, , state
            for raw in rows[1:]:
                if not any(c.strip() for c in raw):
                    continue
                name = clean(raw[0] if len(raw) > 0 else None)
                phone = normalize_whatsapp(raw[1] if len(raw) > 1 else None)
                state = clean(raw[3] if len(raw) > 3 else None)
                if name is None and phone is None:
                    continue
                ciudad = state if state else "Durango"
                key = (None, name, phone, None)
                if key in seen:
                    continue
                seen.add(key)
                rows_out.append((None, phone, None, ciudad, "General", "Nuevo", None, name, tab_name))

    out_path = os.path.join("scripts", "sql", "seed_leads.sql")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    lines = []
    lines.append("-- Seed leads_ark_tools generado desde Google Sheet Ark-systems1")
    lines.append("DELETE FROM leads_ark_tools;")
    for web, wa, email, ciudad, esp, status, last, contacto, tab in rows_out:
        lid = str(uuid.uuid4())
        lines.append(
            "INSERT INTO leads_ark_tools (id, web, whatsapp, email, ciudad, especialidad, status, last_contact, contacto_nombre, notas, tenant_id, created_at, updated_at) VALUES ("
            + ", ".join(
                [
                    sql_str(lid),
                    sql_str(web),
                    sql_str(wa),
                    sql_str(email),
                    sql_str(ciudad),
                    sql_str(esp),
                    sql_str(status),
                    sql_str(last),
                    sql_str(contacto),
                    "NULL",
                    sql_str("ark"),
                    "CURRENT_TIMESTAMP",
                    "CURRENT_TIMESTAMP",
                ]
            )
            + ");"
        )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Generados {len(rows_out)} leads en {out_path}")


if __name__ == "__main__":
    main()
