"""
DynamoDB Storage Adapter.
Manages persistent storage and retrieval of generated audio architectures
and user playlist history in Amazon DynamoDB with seamless local fallback.
"""
import os
import json
import logging
import tempfile
from decimal import Decimal
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


def from_dynamo(value):
    """Convert DynamoDB Decimals back to JSON numbers, keeping whole numbers as int."""
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, dict):
        return {key: from_dynamo(item) for key, item in value.items()}
    if isinstance(value, list):
        return [from_dynamo(item) for item in value]
    return value


def history_summary(data):
    return {
        key: data.get(key)
        for key in ("playlist_id", "name", "created_at", "curve_type",
                    "track_count", "actual_duration_formatted", "genres_used")
    } | {"overall_fit_score": float(data.get("metrics", {}).get("overall_fit_score", 0))}

# Environment variable for DynamoDB table name (defaults configured via Terraform)
TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "AudioArchitectures")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

class DynamoDBStorage:
    def __init__(self, table_name: str = TABLE_NAME, region_name: str = AWS_REGION):
        self.table_name = table_name
        self.region_name = region_name
        self.client = None
        self.table = None
        self.is_connected = False

        # Local storage fallback directory
        local_root = os.environ.get("LOCAL_DATA_DIR")
        if local_root:
            self.fallback_dir = Path(local_root) / "saved_playlists"
        elif os.environ.get("AWS_EXECUTION_ENV"):
            self.fallback_dir = Path(tempfile.gettempdir()) / "audio_architecture" / "saved_playlists"
        else:
            self.fallback_dir = Path(__file__).resolve().parent.parent / "data" / "saved_playlists"
        self.fallback_dir.mkdir(parents=True, exist_ok=True)

        self._init_client()

    def _init_client(self):
        """Attempts to initialize boto3 DynamoDB resource."""
        if os.environ.get("LOCAL_ONLY") == "1":
            return
        try:
            import boto3
            # Attempt to connect to AWS DynamoDB
            dynamodb = boto3.resource("dynamodb", region_name=self.region_name)
            table = dynamodb.Table(self.table_name)
            # Ping table state
            table.load()
            self.table = table
            self.is_connected = True
            logger.info("Connected to Amazon DynamoDB table: %s", self.table_name)
        except Exception as e:
            logger.warning("AWS DynamoDB connection unavailable (%s). Using local storage adapter.", str(e))
            self.is_connected = False

    def save_playlist(self, playlist_dict: Dict[str, Any]) -> bool:
        """Saves structured playlist to DynamoDB or local storage."""
        playlist_id = playlist_dict.get("playlist_id")
        if not playlist_id:
            return False

        if self.is_connected and self.table:
            try:
                # DynamoDB requires float conversion to Decimal or JSON serialization
                def convert_floats(obj):
                    if isinstance(obj, float):
                        return Decimal(str(obj))
                    elif isinstance(obj, dict):
                        return {k: convert_floats(v) for k, v in obj.items()}
                    elif isinstance(obj, list):
                        return [convert_floats(v) for v in obj]
                    return obj

                item = convert_floats(playlist_dict)
                self.table.put_item(Item=item)
                return True
            except Exception as e:
                logger.error("Failed to save to DynamoDB: %s. Falling back to local disk.", str(e))

        # Local fallback save
        if os.environ.get("AWS_EXECUTION_ENV"):
            return False
        try:
            file_path = self.fallback_dir / f"{playlist_id}.json"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(playlist_dict, f, indent=2)
            return True
        except Exception as e:
            logger.error("Failed to save playlist locally: %s", str(e))
            return False

    def get_playlist(self, playlist_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves playlist by playlist_id."""
        if self.is_connected and self.table:
            try:
                response = self.table.get_item(Key={"playlist_id": playlist_id})
                item = response.get("Item")
                if item:
                    # Convert Decimals back to float/int
                    return from_dynamo(item)
            except Exception as e:
                logger.error("Failed to get from DynamoDB: %s", str(e))

        # Local fallback lookup
        if os.environ.get("AWS_EXECUTION_ENV"):
            return None
        file_path = self.fallback_dir / f"{playlist_id}.json"
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error("Failed to read local playlist: %s", str(e))
        return None

    def list_recent_playlists(self, user_id: str = "guest_user", limit: int = 15) -> List[Dict[str, Any]]:
        """Lists recent playlist summaries."""
        if self.is_connected and self.table:
            try:
                from boto3.dynamodb.conditions import Key
                response = self.table.query(
                    IndexName="UserPlaylistIndex",
                    KeyConditionExpression=Key("user_id").eq(user_id),
                    ScanIndexForward=False,
                    Limit=limit,
                )
                items = response.get("Items", [])
                return [history_summary(from_dynamo(item)) for item in items]
            except Exception as e:
                logger.error("Failed scanning DynamoDB: %s", str(e))

        # Local fallback list
        if os.environ.get("AWS_EXECUTION_ENV"):
            return []
        results = []
        if self.fallback_dir.exists():
            for p in sorted(self.fallback_dir.glob("*.json"), key=os.path.getmtime, reverse=True):
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if data.get("user_id", "guest_user") != user_id:
                            continue
                        # Return summary
                        results.append(history_summary(data))
                        if len(results) >= limit:
                            break
                except Exception:
                    continue
        return results
