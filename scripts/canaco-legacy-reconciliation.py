#!/usr/bin/env python3
"""Dry-run reconciliation report for a local/exported ARK LEDGER SQLite database."""

import argparse
import json
import sqlite3
import uuid
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path, help="Local or exported SQLite D1 database")
    parser.add_argument(
        "--apply-known-demo-flags",
        action="store_true",
        help="Mark only the exact CANACO demo fixture as demo; no consent or lifecycle changes",
    )
    parser.add_argument(
        "--apply-reviewed-payment-stages",
        action="store_true",
        help="Set lifecycle_stage only for non-demo active labels with a paid production intent",
    )
    args = parser.parse_args()

    if not args.database.is_file():
        raise SystemExit(f"SQLite database does not exist: {args.database}")
    write_requested = args.apply_known_demo_flags or args.apply_reviewed_payment_stages
    database_uri = args.database.resolve().as_uri()
    connection = sqlite3.connect(
        str(args.database) if write_requested else f"{database_uri}?mode=ro",
        uri=not write_requested,
    )
    connection.row_factory = sqlite3.Row
    try:
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(leads_ark_tools)")
        }
        required = {
            "canonical_rfc",
            "lifecycle_stage",
            "origin",
            "is_demo",
            "consent_accepted_at",
            "payment_environment",
        }
        missing = sorted(required - columns)
        if missing:
            raise SystemExit(
                f"Database is missing lifecycle columns: {', '.join(missing)}. "
                "Apply the lifecycle migration to a local/exported database first."
            )
        if not connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'canaco_payment_intents'"
        ).fetchone():
            raise SystemExit("Database is missing canaco_payment_intents; apply the lifecycle migration.")

        if args.apply_known_demo_flags:
            connection.execute(
                """
                UPDATE leads_ark_tools
                SET is_demo = 1, updated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = 'canaco_merida'
                  AND LOWER(TRIM(email)) = 'demo@example.invalid'
                  AND UPPER(TRIM(web)) = 'COMERCIALIZADORA DEL MAYAB'
                """
            )
            connection.commit()

        if args.apply_reviewed_payment_stages:
            verified_active = connection.execute(
                """
                SELECT lead.id, lead.lifecycle_stage AS from_stage, MIN(intent.id) AS intent_id
                FROM leads_ark_tools lead
                JOIN canaco_payment_intents intent ON intent.lead_id = lead.id
                WHERE lead.tenant_id = 'canaco_merida'
                  AND COALESCE(lead.is_demo, 0) = 0
                  AND lead.status = 'Socio Activo'
                  AND lead.lifecycle_stage != 'socio_activo'
                  AND intent.tenant_id = 'canaco_merida'
                  AND intent.status = 'paid' AND intent.environment = 'production'
                GROUP BY lead.id
                """
            ).fetchall()
            with connection:
                for row in verified_active:
                    connection.execute(
                        """
                        UPDATE leads_ark_tools
                        SET lifecycle_stage = 'socio_activo',
                            payment_environment = 'production',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ? AND tenant_id = 'canaco_merida'
                        """,
                        (row["id"],),
                    )
                    connection.execute(
                        """
                        INSERT OR IGNORE INTO canaco_lifecycle_audit
                          (id, lead_id, actor_email, from_stage, to_stage, reason,
                           payment_outcome, evidence_reference)
                        VALUES (?, ?, 'legacy-reconciliation', ?, 'socio_activo',
                                'Reviewed legacy production payment evidence', 'paid', ?)
                        """,
                        (str(uuid.uuid4()), row["id"], row["from_stage"], row["intent_id"]),
                    )

        by_status_stage = connection.execute(
            """
            SELECT status, lifecycle_stage, COUNT(*) AS count
            FROM leads_ark_tools
            WHERE tenant_id = 'canaco_merida' AND origin = 'legacy'
            GROUP BY status, lifecycle_stage
            ORDER BY status, lifecycle_stage
            """
        ).fetchall()
        consent_status = connection.execute(
            """
            SELECT
              SUM(CASE WHEN consent_accepted_at IS NULL THEN 1 ELSE 0 END) AS missing_consent,
              SUM(CASE WHEN consent_accepted_at IS NOT NULL THEN 1 ELSE 0 END) AS recorded_consent
            FROM leads_ark_tools
            WHERE tenant_id = 'canaco_merida' AND origin = 'legacy'
            """
        ).fetchone()
        active_evidence = connection.execute(
            """
            SELECT
              SUM(CASE WHEN EXISTS (
                SELECT 1 FROM canaco_payment_intents intent
                WHERE intent.lead_id = lead.id AND intent.tenant_id = 'canaco_merida'
                  AND intent.status = 'paid' AND intent.environment = 'production'
              ) THEN 1 ELSE 0 END) AS payment_evidence,
              SUM(CASE WHEN NOT EXISTS (
                SELECT 1 FROM canaco_payment_intents intent
                WHERE intent.lead_id = lead.id AND intent.tenant_id = 'canaco_merida'
                  AND intent.status = 'paid' AND intent.environment = 'production'
              ) THEN 1 ELSE 0 END) AS label_only
            FROM leads_ark_tools lead
            WHERE lead.tenant_id = 'canaco_merida' AND lead.status = 'Socio Activo'
            """
        ).fetchone()
        active_rows = connection.execute(
            """
            SELECT lead.id, lead.web, lead.email, lead.status, lead.lifecycle_stage,
                   CASE WHEN EXISTS (
                     SELECT 1 FROM canaco_payment_intents intent
                     WHERE intent.lead_id = lead.id AND intent.tenant_id = 'canaco_merida'
                       AND intent.status = 'paid' AND intent.environment = 'production'
                   ) THEN 'payment_evidence' ELSE 'label_only' END AS classification
            FROM leads_ark_tools lead
            WHERE lead.tenant_id = 'canaco_merida' AND lead.status = 'Socio Activo'
            ORDER BY classification, lead.id
            """
        ).fetchall()
        demo_rows = connection.execute(
            """
            SELECT id, web, email, status, lifecycle_stage, is_demo,
                   CASE WHEN is_demo = 1 THEN 'explicit_demo_flag'
                        WHEN LOWER(TRIM(email)) = 'demo@example.invalid'
                          AND UPPER(TRIM(web)) = 'COMERCIALIZADORA DEL MAYAB'
                        THEN 'known_demo_fixture'
                        WHEN LOWER(TRIM(email)) LIKE '%.invalid' THEN 'review_invalid_email'
                        ELSE 'not_flagged' END AS classification
            FROM leads_ark_tools
            WHERE tenant_id = 'canaco_merida'
              AND (is_demo = 1 OR LOWER(TRIM(email)) LIKE '%.invalid')
            ORDER BY web, id
            """
        ).fetchall()

        print(
            json.dumps(
                {
                    "mode": (
                        "reviewed_apply"
                        if args.apply_known_demo_flags or args.apply_reviewed_payment_stages
                        else "dry_run"
                    ),
                    "legacy_by_status_and_stage": [dict(row) for row in by_status_stage],
                    "legacy_consent": {
                        "missing_consent": consent_status["missing_consent"] or 0,
                        "recorded_consent": consent_status["recorded_consent"] or 0,
                        "instruction": "Keep missing consent NULL; capture it at the next contact.",
                    },
                    "active_labels": {
                        "with_production_payment_evidence": active_evidence["payment_evidence"] or 0,
                        "label_only_without_production_payment_evidence": active_evidence["label_only"] or 0,
                    },
                    "active_label_rows": [dict(row) for row in active_rows],
                    "reviewed_payment_stage_corrections": args.apply_reviewed_payment_stages,
                    "demo_candidates": [dict(row) for row in demo_rows],
                    "consent_policy": "No consent fields are changed; legacy consent remains NULL.",
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    finally:
        connection.close()


if __name__ == "__main__":
    main()
