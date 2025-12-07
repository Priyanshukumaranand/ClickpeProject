import json
import os
import uuid
import boto3
from datetime import timedelta, datetime
from typing import Any, Dict

s3 = boto3.client("s3")


def handler(event, context):  # type: ignore[override]
    bucket = os.environ.get("UPLOAD_BUCKET")
    if not bucket:
        return _response(500, {"error": "UPLOAD_BUCKET is not configured"})

    key_prefix = f"uploads/{datetime.utcnow().date()}"
    object_key = f"{key_prefix}/{uuid.uuid4()}.csv"

    fields = {"Content-Type": "text/csv"}
    conditions = [["starts-with", "$Content-Type", "text/csv"]]

    presigned = s3.generate_presigned_post(
        Bucket=bucket,
        Key=object_key,
        Fields=fields,
        Conditions=conditions,
        ExpiresIn=int(timedelta(minutes=10).total_seconds()),
    )

    return _response(200, {"upload": presigned, "key": object_key})


def _response(status: int, body: Dict[str, Any]):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        },
        "body": json.dumps(body),
    }
