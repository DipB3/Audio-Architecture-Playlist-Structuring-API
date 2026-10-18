"""Persistent metadata-only user track catalog for local and AWS deployments."""
import json
import logging
import os
from decimal import Decimal
from pathlib import Path

logger = logging.getLogger(__name__)


def plain(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {key: plain(item) for key, item in value.items()}
    if isinstance(value, list):
        return [plain(item) for item in value]
    return value


class CustomTrackStorage:
    def __init__(self, table_name=None, local_dir=None):
        self.table_name = table_name or os.environ.get("CUSTOM_TRACKS_TABLE_NAME")
        root = Path(local_dir or os.environ.get("LOCAL_DATA_DIR") or Path(__file__).resolve().parent.parent / "data")
        self.local_dir = root / "custom_tracks"
        self.table = None
        if os.environ.get("AWS_EXECUTION_ENV"):
            if not self.table_name:
                logger.error("CUSTOM_TRACKS_TABLE_NAME is required in AWS.")
            else:
                try:
                    import boto3
                    self.table = boto3.resource("dynamodb").Table(self.table_name)
                    self.table.load()
                except Exception:
                    logger.exception("Custom track table unavailable.")

    def _ready(self):
        if os.environ.get("AWS_EXECUTION_ENV") and self.table is None:
            raise RuntimeError("Custom track storage is unavailable.")

    def list_tracks(self):
        self._ready()
        if self.table:
            items = []
            kwargs = {}
            while True:
                result = self.table.scan(**kwargs)
                items.extend(result.get("Items", []))
                if "LastEvaluatedKey" not in result:
                    break
                kwargs["ExclusiveStartKey"] = result["LastEvaluatedKey"]
            return [plain(item) for item in items]
        if not self.local_dir.exists():
            return []
        tracks = []
        for path in sorted(self.local_dir.glob("trk_custom_*.json")):
            try:
                tracks.append(json.loads(path.read_text(encoding="utf-8")))
            except (OSError, json.JSONDecodeError):
                logger.exception("Cannot read custom track %s", path.name)
        return tracks

    def save_track(self, track):
        self._ready()
        if self.table:
            self.table.put_item(Item=json.loads(json.dumps(track), parse_float=Decimal),
                                ConditionExpression="attribute_not_exists(id)")
            return
        self.local_dir.mkdir(parents=True, exist_ok=True)
        path = self.local_dir / f"{track['id']}.json"
        with path.open("x", encoding="utf-8") as handle:
            json.dump(track, handle, indent=2)

    def delete_track(self, track_id):
        self._ready()
        if self.table:
            response = self.table.delete_item(Key={"id": track_id}, ReturnValues="ALL_OLD")
            return "Attributes" in response
        path = self.local_dir / f"{track_id}.json"
        if not path.exists():
            return False
        path.unlink()
        return True
