"""
AWS Lambda Handler for Audio Architecture & Playlist Structuring API.
Processes API Gateway proxy events, routes HTTP requests, and interfaces
with the serverless optimization engine, DynamoDB, and Amazon S3.
"""
import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List

from .engine.models import Track, CurvePoint, EnergyCurveType
from .engine.curves import CURVE_PRESETS, sample_curve_trajectory
from .engine.optimizer import PlaylistOptimizer
from .export.exporters import export_to_m3u, export_to_json, export_to_csv
from .storage.dynamodb_client import DynamoDBStorage
from .storage.s3_client import S3Storage

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Load track catalog into memory (persists across warm Lambda invocations)
CATALOG_PATH = Path(__file__).resolve().parent / "data" / "track_catalog.json"
TRACK_CATALOG: List[Track] = []

def load_catalog() -> List[Track]:
    global TRACK_CATALOG
    if not TRACK_CATALOG and CATALOG_PATH.exists():
        try:
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                TRACK_CATALOG = [Track.from_dict(t) for t in raw_data]
                logger.info("Loaded %d tracks into catalog memory.", len(TRACK_CATALOG))
        except Exception as e:
            logger.error("Failed loading catalog: %s", str(e))
    return TRACK_CATALOG

# Initialize storage adapters
storage_db = DynamoDBStorage()
storage_s3 = S3Storage()

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json"
}

def make_response(status_code: int, body_data: Any, custom_headers: Dict[str, str] = None) -> Dict[str, Any]:
    """Helper to formulate API Gateway proxy response."""
    headers = dict(CORS_HEADERS)
    if custom_headers:
        headers.update(custom_headers)
    
    body_str = json.dumps(body_data) if not isinstance(body_data, str) else body_data
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": body_str
    }

def handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    Main AWS Lambda Entrypoint.
    """
    load_catalog()

    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path = event.get("path") or event.get("rawPath", "/")

    # Normalize path (strip /api prefix or trailing slashes)
    norm_path = path.rstrip("/")
    if norm_path.startswith("/api"):
        norm_path = norm_path[4:]
    if not norm_path:
        norm_path = "/"

    # 1. Handle CORS Preflight
    if http_method == "OPTIONS":
        return make_response(200, {"message": "CORS preflight OK"})

    try:
        # Route: GET /health
        if http_method == "GET" and norm_path in ("/", "/health"):
            return make_response(200, {
                "status": "healthy",
                "service": "Audio Architecture & Playlist Structuring API",
                "version": "1.0.0",
                "aws_region": os.environ.get("AWS_REGION", "us-east-1"),
                "dynamodb_connected": storage_db.is_connected,
                "s3_connected": storage_s3.is_connected,
                "catalog_track_count": len(TRACK_CATALOG),
                "managed_services": [
                    "AWS Lambda (Serverless Compute)",
                    "Amazon API Gateway (REST API)",
                    "Amazon DynamoDB (NoSQL Data & History)",
                    "Amazon S3 (Catalog & Export Bundles)",
                    "Amazon CloudWatch & AWS Budgets (DevOps & Alerts)"
                ]
            })

        # Route: GET /genres
        elif http_method == "GET" and norm_path == "/genres":
            genre_stats = {}
            for t in TRACK_CATALOG:
                if t.genre not in genre_stats:
                    genre_stats[t.genre] = {
                        "name": t.genre,
                        "track_count": 0,
                        "min_bpm": 999.0,
                        "max_bpm": 0.0,
                        "avg_bpm": 0.0,
                        "avg_energy": 0.0,
                        "_bpm_sum": 0.0,
                        "_energy_sum": 0.0
                    }
                g = genre_stats[t.genre]
                g["track_count"] += 1
                g["min_bpm"] = min(g["min_bpm"], t.bpm)
                g["max_bpm"] = max(g["max_bpm"], t.bpm)
                g["_bpm_sum"] += t.bpm
                g["_energy_sum"] += t.energy

            for g in genre_stats.values():
                count = g["track_count"]
                g["avg_bpm"] = round(g["_bpm_sum"] / count, 1)
                g["avg_energy"] = round(g["_energy_sum"] / count, 2)
                del g["_bpm_sum"]
                del g["_energy_sum"]

            return make_response(200, {
                "genres": list(genre_stats.values())
            })

        # Route: GET /presets
        elif http_method == "GET" and norm_path == "/presets":
            presets_with_previews = []
            for preset_id, info in CURVE_PRESETS.items():
                samples = sample_curve_trajectory(preset_id, num_samples=25)
                item = dict(info)
                item["sample_trajectory"] = samples
                presets_with_previews.append(item)
            return make_response(200, {"presets": presets_with_previews})

        # Route: GET /tracks
        elif http_method == "GET" and norm_path == "/tracks":
            params = event.get("queryStringParameters") or {}
            genre_filter = params.get("genre")
            limit = int(params.get("limit", 50))

            tracks_to_return = TRACK_CATALOG
            if genre_filter:
                tracks_to_return = [t for t in tracks_to_return if t.genre.lower() == genre_filter.lower()]

            return make_response(200, {
                "total": len(tracks_to_return),
                "tracks": [t.to_dict() for t in tracks_to_return[:limit]]
            })

        # Route: POST /playlists/generate
        elif http_method == "POST" and norm_path == "/playlists/generate":
            body = event.get("body")
            payload = json.loads(body) if isinstance(body, str) else (body or {})

            duration_min = float(payload.get("target_duration_minutes", 45))
            genres = payload.get("selected_genres", [])
            curve_type = payload.get("curve_type", EnergyCurveType.POMODORO_PEAK.value)
            custom_pts_data = payload.get("custom_points", [])
            custom_points = [
                CurvePoint(time_fraction=p["time_fraction"], target_energy=p["target_energy"])
                for p in custom_pts_data
            ] if custom_pts_data else None

            playlist_name = payload.get("name")
            user_id = payload.get("user_id", "guest_user")

            optimizer = PlaylistOptimizer(
                catalog=TRACK_CATALOG,
                energy_weight=float(payload.get("energy_weight", 0.40)),
                tempo_weight=float(payload.get("tempo_weight", 0.25)),
                harmonic_weight=float(payload.get("harmonic_weight", 0.20)),
                genre_weight=float(payload.get("genre_weight", 0.15)),
                beam_width=int(payload.get("beam_width", 6))
            )

            structured_playlist = optimizer.generate_playlist(
                target_duration_minutes=duration_min,
                selected_genres=genres,
                curve_type=curve_type,
                custom_points=custom_points,
                playlist_name=playlist_name,
                user_id=user_id
            )

            # Persist to DynamoDB
            playlist_dict = structured_playlist.to_dict()
            storage_db.save_playlist(playlist_dict)

            return make_response(200, {
                "success": True,
                "playlist": playlist_dict
            })

        # Route: GET /playlists/history
        elif http_method == "GET" and norm_path == "/playlists/history":
            recent = storage_db.list_recent_playlists(limit=15)
            return make_response(200, {
                "history": recent
            })

        # Route: GET /playlists/{id}
        elif http_method == "GET" and norm_path.startswith("/playlists/"):
            parts = norm_path.split("/")
            playlist_id = parts[-1]
            found = storage_db.get_playlist(playlist_id)
            if not found:
                return make_response(404, {"error": f"Playlist '{playlist_id}' not found."})
            return make_response(200, {"playlist": found})

        # Route: POST /playlists/export
        elif http_method == "POST" and norm_path == "/playlists/export":
            body = event.get("body")
            payload = json.loads(body) if isinstance(body, str) else (body or {})

            playlist_id = payload.get("playlist_id")
            export_format = payload.get("format", "m3u").lower()
            playlist_dict = payload.get("playlist")

            if not playlist_dict and playlist_id:
                playlist_dict = storage_db.get_playlist(playlist_id)

            if not playlist_dict:
                return make_response(400, {"error": "Missing playlist data or playlist_id for export."})

            # Reconstruct model for formatting
            from .engine.models import StructuredPlaylist, ArchitectureMetrics, TrackTransition, EnergyTrajectoryPoint
            structured = StructuredPlaylist(
                playlist_id=playlist_dict["playlist_id"],
                name=playlist_dict["name"],
                created_at=playlist_dict["created_at"],
                target_duration_minutes=playlist_dict["target_duration_minutes"],
                actual_duration_seconds=playlist_dict["actual_duration_seconds"],
                actual_duration_formatted=playlist_dict["actual_duration_formatted"],
                track_count=playlist_dict["track_count"],
                genres_used=playlist_dict["genres_used"],
                curve_type=playlist_dict["curve_type"],
                tracks=[Track.from_dict(t) for t in playlist_dict["tracks"]],
                transitions=[TrackTransition(**tr) for tr in playlist_dict.get("transitions", [])],
                energy_trajectory=[EnergyTrajectoryPoint(**tp) for tp in playlist_dict.get("energy_trajectory", [])],
                metrics=ArchitectureMetrics(**playlist_dict["metrics"]),
                user_id=playlist_dict.get("user_id", "guest_user")
            )

            if export_format == "m3u":
                content = export_to_m3u(structured)
                content_type = "audio/x-mpegurl"
                extension = "m3u"
            elif export_format == "csv":
                content = export_to_csv(structured)
                content_type = "text/csv"
                extension = "csv"
            else:
                content = export_to_json(structured)
                content_type = "application/json"
                extension = "json"

            file_key = f"exports/{structured.playlist_id}.{extension}"
            s3_url = storage_s3.put_export_artifact(file_key, content, content_type)

            return make_response(200, {
                "format": export_format,
                "filename": f"{structured.name.replace(' ', '_')}.{extension}",
                "content": content,
                "content_type": content_type,
                "s3_url": s3_url
            })

        # Not found
        return make_response(404, {"error": f"Endpoint not found: {http_method} {path}"})

    except Exception as e:
        logger.exception("Internal error in Lambda handler: %s", str(e))
        return make_response(500, {
            "error": "Internal Server Error",
            "message": str(e)
        })
