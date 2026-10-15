"""
AWS Lambda Handler for Audio Architecture & Playlist Structuring API.
Processes API Gateway proxy events, routes HTTP requests, and interfaces
with the serverless optimization engine, DynamoDB, and Amazon S3.
"""
import os
import json
import logging
import math
import base64
import re
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

MIN_DURATION_MINUTES = 15
MAX_DURATION_MINUTES = 180


def parse_json_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """Parse and validate a JSON object from an API Gateway event."""
    body = event.get("body")
    if event.get("isBase64Encoded"):
        try:
            body = base64.b64decode(body, validate=True).decode("utf-8")
        except (ValueError, TypeError, UnicodeError) as exc:
            raise ValueError("Invalid base64 JSON body.") from exc
    if body in (None, ""):
        return {}
    try:
        payload = json.loads(body) if isinstance(body, str) else body
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Request body must contain valid JSON.") from exc
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")
    return payload


def validate_generation_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and normalize playlist generation parameters."""
    try:
        duration_min = float(payload.get("target_duration_minutes", 45))
    except (TypeError, ValueError) as exc:
        raise ValueError("target_duration_minutes must be a number.") from exc
    if not MIN_DURATION_MINUTES <= duration_min <= MAX_DURATION_MINUTES:
        raise ValueError(
            f"target_duration_minutes must be between {MIN_DURATION_MINUTES} and {MAX_DURATION_MINUTES}."
        )

    genres = payload.get("selected_genres", [])
    if not isinstance(genres, list) or not all(isinstance(item, str) for item in genres):
        raise ValueError("selected_genres must be an array of genre names.")
    known_genres = {track.genre for track in TRACK_CATALOG}
    unknown_genres = sorted(set(genres) - known_genres)
    if unknown_genres:
        raise ValueError(f"Unknown genre(s): {', '.join(unknown_genres)}.")

    curve_type = payload.get("curve_type", EnergyCurveType.POMODORO_PEAK.value)
    allowed_curves = {curve.value for curve in EnergyCurveType}
    if not isinstance(curve_type, str) or curve_type not in allowed_curves:
        raise ValueError(f"Unknown curve_type '{curve_type}'.")

    weight_names = ("energy_weight", "tempo_weight", "harmonic_weight", "genre_weight")
    defaults = (0.40, 0.25, 0.20, 0.15)
    try:
        weights = [float(payload.get(name, default)) for name, default in zip(weight_names, defaults)]
    except (TypeError, ValueError) as exc:
        raise ValueError("Optimizer weights must be numeric.") from exc
    if any(not math.isfinite(weight) or weight < 0 for weight in weights) or not math.isfinite(sum(weights)) or sum(weights) <= 0:
        raise ValueError("Optimizer weights must be non-negative and have a positive total.")
    weight_total = sum(weights)
    weights = [weight / weight_total for weight in weights]

    custom_points = None
    raw_points = payload.get("custom_points", [])
    if curve_type == EnergyCurveType.CUSTOM.value:
        if not isinstance(raw_points, list) or not 2 <= len(raw_points) <= 32:
            raise ValueError("A custom curve requires at least two control points.")
        try:
            custom_points = [
                CurvePoint(
                    time_fraction=float(point["time_fraction"]),
                    target_energy=float(point["target_energy"]),
                )
                for point in raw_points
            ]
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError("Each custom point requires numeric time_fraction and target_energy values.") from exc
        if any(not 0 <= point.time_fraction <= 1 or not 0 <= point.target_energy <= 1 for point in custom_points):
            raise ValueError("Custom point values must be between 0 and 1.")
        custom_points.sort(key=lambda point: point.time_fraction)
        if any(
            custom_points[index].time_fraction == custom_points[index - 1].time_fraction
            for index in range(1, len(custom_points))
        ):
            raise ValueError("Custom curve time_fraction values must be unique.")

    return {
        "duration_min": duration_min,
        "genres": genres,
        "curve_type": curve_type,
        "custom_points": custom_points,
        "weights": weights,
    }


def validate_options(payload):
    options = {}
    beam = payload.get("beam_width", 12)
    if isinstance(beam, bool) or not isinstance(beam, int) or not 2 <= beam <= 32:
        raise ValueError("beam_width must be an integer between 2 and 32.")
    for name, default, low, high in (
        ("min_bpm", 40, 20, 300), ("max_bpm", 220, 20, 300),
        ("crossfade_seconds", 0, 0, 30), ("diversity_strength", .25, 0, 1),
    ):
        try:
            value = float(payload.get(name, default))
        except (ValueError, TypeError) as exc:
            raise ValueError(f"{name} must be numeric.") from exc
        if not math.isfinite(value) or not low <= value <= high:
            raise ValueError(f"{name} must be between {low} and {high}.")
        options[name] = value
    if options["min_bpm"] > options["max_bpm"]:
        raise ValueError("min_bpm cannot exceed max_bpm.")
    repeats = payload.get("allow_repeats", True)
    if not isinstance(repeats, bool):
        raise ValueError("allow_repeats must be a boolean.")
    options["allow_repeats"] = repeats
    excluded = payload.get("excluded_track_ids", [])
    if not isinstance(excluded, list) or not all(isinstance(item, str) for item in excluded):
        raise ValueError("excluded_track_ids must be an array of track IDs.")
    if set(excluded) - {track.id for track in TRACK_CATALOG}:
        raise ValueError("excluded_track_ids contains unknown tracks.")
    options["excluded_track_ids"] = excluded
    for name in ("name", "user_id"):
        value = payload.get(name)
        if name in payload and (not isinstance(value, str) or not 1 <= len(value.strip()) <= 120):
            raise ValueError(f"{name} must be a non-empty string up to 120 characters.")
    return options


def validate_playlist_id(value):
    if not isinstance(value, str) or not re.fullmatch(r"pl_[A-Za-z0-9_]+", value):
        raise ValueError("Invalid playlist_id.")
    return value

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
    if norm_path == "/api" or norm_path.startswith("/api/"):
        norm_path = norm_path[4:]
    if not norm_path:
        norm_path = "/"

    # 1. Handle CORS Preflight
    if http_method == "OPTIONS":
        return make_response(200, {"message": "CORS preflight OK"})

    try:
        # Route: GET /health
        if http_method == "GET" and norm_path in ("/", "/health"):
            ready = bool(TRACK_CATALOG) and (not os.environ.get("AWS_EXECUTION_ENV") or
                                            (storage_db.is_connected and storage_s3.is_connected))
            return make_response(200 if ready else 503, {
                "status": "healthy" if ready else "degraded",
                "service": "Audio Architecture & Playlist Structuring API",
                "version": "1.0.0",
                "aws_region": os.environ.get("AWS_REGION", "us-east-1"),
                "dynamodb_connected": storage_db.is_connected,
                "s3_connected": storage_s3.is_connected,
                "catalog_track_count": len(TRACK_CATALOG),
                "storage_mode": "aws" if storage_db.is_connected and storage_s3.is_connected else "local",
                "managed_services": [
                    "AWS Lambda (Serverless Compute)",
                    "Amazon API Gateway (HTTP API v2)",
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
            limit = max(1, min(50, int(params.get("limit", 50))))

            tracks_to_return = TRACK_CATALOG
            if genre_filter:
                tracks_to_return = [t for t in tracks_to_return if t.genre.lower() == genre_filter.lower()]

            return make_response(200, {
                "total": len(tracks_to_return),
                "tracks": [t.to_dict() for t in tracks_to_return[:limit]]
            })

        # Route: POST /playlists/generate
        elif http_method == "POST" and norm_path == "/playlists/generate":
            payload = parse_json_body(event)
            validated = validate_generation_payload(payload)
            duration_min = validated["duration_min"]
            genres = validated["genres"]
            curve_type = validated["curve_type"]
            custom_points = validated["custom_points"]
            weights = validated["weights"]
            options = validate_options(payload)

            playlist_name = payload.get("name")
            user_id = payload.get("user_id", "guest_user")

            optimizer = PlaylistOptimizer(
                catalog=TRACK_CATALOG,
                energy_weight=weights[0],
                tempo_weight=weights[1],
                harmonic_weight=weights[2],
                genre_weight=weights[3],
                beam_width=int(payload.get("beam_width", 12))
            )

            structured_playlist = optimizer.generate_playlist(
                target_duration_minutes=duration_min,
                selected_genres=genres,
                curve_type=curve_type,
                custom_points=custom_points,
                playlist_name=playlist_name,
                user_id=user_id,
                **options
            )

            # Persist to DynamoDB
            playlist_dict = structured_playlist.to_dict()
            if not storage_db.save_playlist(playlist_dict):
                return make_response(503, {"error": "Playlist could not be persisted. Retry later."})

            return make_response(200, {
                "success": True,
                "playlist": playlist_dict
            })

        # Route: GET /playlists/history
        elif http_method == "GET" and norm_path == "/playlists/history":
            params = event.get("queryStringParameters") or {}
            user_id = params.get("user_id", "guest_user")
            limit = max(1, min(50, int(params.get("limit", 15))))
            recent = storage_db.list_recent_playlists(user_id=user_id, limit=limit)
            return make_response(200, {
                "history": recent
            })

        # Route: GET /playlists/{id}
        elif http_method == "GET" and norm_path.startswith("/playlists/"):
            parts = norm_path.split("/")
            playlist_id = parts[-1]
            validate_playlist_id(playlist_id)
            found = storage_db.get_playlist(playlist_id)
            if not found:
                return make_response(404, {"error": f"Playlist '{playlist_id}' not found."})
            return make_response(200, {"playlist": found})

        # Route: POST /playlists/export
        elif http_method == "POST" and norm_path == "/playlists/export":
            payload = parse_json_body(event)

            playlist_id = payload.get("playlist_id")
            export_format = payload.get("format", "m3u")
            if not isinstance(export_format, str):
                raise ValueError("format must be a string.")
            export_format = export_format.lower()
            if export_format not in {"m3u", "json", "csv"}:
                raise ValueError("format must be one of: m3u, json, csv.")
            playlist_dict = payload.get("playlist")
            if playlist_id:
                validate_playlist_id(playlist_id)

            if not playlist_dict and playlist_id:
                playlist_dict = storage_db.get_playlist(playlist_id)

            if not playlist_dict:
                return make_response(400, {"error": "Missing playlist data or playlist_id for export."})
            if not isinstance(playlist_dict, dict):
                raise ValueError("playlist must be an object.")
            validate_playlist_id(playlist_dict.get("playlist_id"))

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
                user_id=playlist_dict.get("user_id", "guest_user"),
                diagnostics=playlist_dict.get("diagnostics", {})
            )

            if export_format == "m3u":
                content = export_to_m3u(structured)
                content_type = "audio/x-mpegurl"
                extension = "m3u"
            elif export_format == "csv":
                content = export_to_csv(structured)
                content_type = "text/csv"
                extension = "csv"
            elif export_format == "json":
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

    except ValueError as e:
        return make_response(400, {"error": "Invalid request", "message": str(e)})
    except Exception as e:
        logger.exception("Internal error in Lambda handler: %s", str(e))
        return make_response(500, {
            "error": "Internal Server Error",
            "message": str(e)
        })
