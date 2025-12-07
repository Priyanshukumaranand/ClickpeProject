import csv
import json
import os
import urllib.parse
import urllib.request
from typing import List, Dict, Any

import boto3

from db import Database

s3 = boto3.client("s3")

def handler(event, context):  # type: ignore[override]
    records = event.get("Records", []) if isinstance(event, dict) else []
    total_inserted = 0
    failures: List[str] = []

    for record in records:
        bucket = record.get("s3", {}).get("bucket", {}).get("name")
        key = record.get("s3", {}).get("object", {}).get("key")
        if not bucket or not key:
            failures.append("missing_bucket_or_key")
            continue
        key = urllib.parse.unquote_plus(key)
        inserted, failed = process_object(bucket, key)
        total_inserted += inserted
        failures.extend(failed)

    if total_inserted > 0:
        notify_n8n(total_inserted)

    return {"inserted": total_inserted, "failures": failures}


def process_object(bucket: str, key: str):
    obj = s3.get_object(Bucket=bucket, Key=key)
    body = obj["Body"].read().decode("utf-8")
    reader = csv.DictReader(body.splitlines())

        rows = []
        parse_failures = 0
    for row in reader:
        try:
                        # required columns per spec
            user_id = row.get("user_id") or row.get("id")
            email = row.get("email")
            monthly_income = _to_float(row.get("monthly_income"))
            credit_score = _to_int(row.get("credit_score"))
            employment_status = row.get("employment_status")
            age = _to_int(row.get("age"))
            if not user_id or not email:
                raise ValueError("missing user_id/email")
            rows.append(
                (
                    user_id,
                    email,
                    monthly_income,
                    credit_score,
                    employment_status,
                    age,
                )
            )
        except Exception:  # noqa: BLE001
            parse_failures += 1
            continue

    cleaned_rows = rows
    db = Database()
    inserted = 0
    if cleaned_rows:
        inserted = db.executemany(
            """
            INSERT INTO users (id, email, monthly_income, credit_score, employment_status, age)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              monthly_income = EXCLUDED.monthly_income,
              credit_score = EXCLUDED.credit_score,
              employment_status = EXCLUDED.employment_status,
              age = EXCLUDED.age;
            """,
            cleaned_rows,
        )
    failures = [] if parse_failures == 0 else ["parse_errors"]
    return inserted, failures


def notify_n8n(inserted_count: int):
    webhook = os.environ.get("N8N_WEBHOOK_URL")
    if not webhook:
        return
    payload = json.dumps({"inserted": inserted_count}).encode("utf-8")
    req = urllib.request.Request(
        webhook,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=10)  # noqa: S310
    except Exception:
        # swallow errors so ingestion still succeeds
        return


def _to_int(value: Any):
    if value is None or value == "":
        return None
    return int(float(value))


def _to_float(value: Any):
    if value is None or value == "":
        return None
    return float(value)
