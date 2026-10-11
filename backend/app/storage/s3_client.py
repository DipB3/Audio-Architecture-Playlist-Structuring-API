"""
Amazon S3 Storage Adapter.
Manages persistent catalog asset storage and exports on Amazon S3 with local disk fallback.
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "audio-architecture-assets")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

class S3Storage:
    def __init__(self, bucket_name: str = BUCKET_NAME, region_name: str = AWS_REGION):
        self.bucket_name = bucket_name
        self.region_name = region_name
        self.s3_client = None
        self.is_connected = False

        self.fallback_dir = Path(__file__).resolve().parent.parent / "data" / "s3_local_exports"
        self.fallback_dir.mkdir(parents=True, exist_ok=True)

        self._init_client()

    def _init_client(self):
        """Attempts to initialize boto3 S3 client."""
        try:
            import boto3
            client = boto3.client("s3", region_name=self.region_name)
            # Test head bucket
            client.head_bucket(Bucket=self.bucket_name)
            self.s3_client = client
            self.is_connected = True
            logger.info("Connected to Amazon S3 Bucket: %s", self.bucket_name)
        except Exception as e:
            logger.warning("AWS S3 connection unavailable (%s). Using local S3 fallback adapter.", str(e))
            self.is_connected = False

    def put_export_artifact(self, file_key: str, content: str, content_type: str = "text/plain") -> str:
        """
        Uploads exported playlist artifact to S3 bucket or local fallback directory.
        Returns URL or reference path.
        """
        if self.is_connected and self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=file_key,
                    Body=content.encode("utf-8"),
                    ContentType=content_type
                )
                url = f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{file_key}"
                return url
            except Exception as e:
                logger.error("Failed uploading to S3: %s. Using local fallback.", str(e))

        # Local fallback
        local_target = self.fallback_dir / Path(file_key).name
        try:
            with open(local_target, "w", encoding="utf-8") as f:
                f.write(content)
            return f"local://storage/{local_target.name}"
        except Exception as e:
            logger.error("Failed writing local export: %s", str(e))
            return f"error://{str(e)}"
