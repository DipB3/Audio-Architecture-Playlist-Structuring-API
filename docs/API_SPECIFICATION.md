# API Specification: Audio Architecture & Playlist Structuring API

## Base URLs
- **Production (AWS API Gateway):** `https://<api-id>.execute-api.<region>.amazonaws.com`
- **Local Development / Demo:** `http://localhost:8000`

---

## Endpoints

## Engine version 2 options

Generation also accepts min_bpm (20-300), max_bpm (20-300),
excluded_track_ids (known catalog IDs), allow_repeats (boolean),
crossfade_seconds (0-30), diversity_strength (0-1), and beam_width (integer 2-32,
default 12). Empty candidate pools produce 400 errors instead of relaxing
filters. Genre diversity is a preference rather than guaranteed coverage.
The seeded catalog contains 118 fictional metadata tracks across seven genres.
Custom metadata is included in genre statistics and generation immediately.

The returned diagnostics include engine name, execution_ms, candidate_evaluations,
eligible_track_count, duration_error_seconds, repeat_count, crossfade_seconds,
warnings, custom_points and 101 target_samples. Stored sessions preserve these
fields and JSON export includes them. M3U records planned crossfade as a comment.

Crossfade changes the schedule only, not the actual audio signal. Previews use
synthesized motifs, and exported media paths require supplied audio files.
Cloud health returns 503 when required persistence adapters are unavailable.
Local health identifies storage_mode as local. user_id organizes history but
does not authenticate callers. The current application is a shared guest demo.

All JSON error responses use the form `{"error": "...", "message": "..."}`. Playlist generation accepts durations from 15 to 180 minutes, rejects unknown genres and curves, normalizes non-negative optimizer weights, and requires at least two unique control points for a custom curve.

### 1. Health & Managed Services Diagnostic
- **Method:** `GET`
- **Path:** `/health`
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "Audio Architecture & Playlist Structuring API",
  "version": "1.0.0",
  "aws_region": "us-east-1",
  "dynamodb_connected": true,
  "s3_connected": true,
  "catalog_track_count": 118,
  "custom_track_count": 0,
  "storage_mode": "aws",
  "managed_services": [
    "AWS Lambda (Serverless Compute)",
    "Amazon API Gateway (HTTP API v2)",
    "Amazon DynamoDB (NoSQL Data & History)",
    "Amazon S3 (Playlist Export Bundles)",
    "Amazon CloudWatch & AWS Budgets (DevOps & Alerts)"
  ]
}
```

Cloud health requires both DynamoDB tables and S3 to be connected. Local mode
reports `storage_mode: "local"` and does not imply an AWS deployment.

### Custom track catalog

`POST /tracks/custom` creates a metadata-only record and returns `201` with
`{"track": {...}}`. Required fields: `title`, `artist`, `genre` (1–80 characters),
`duration_seconds` (integer 30–900), `bpm` (40–220), and `energy` (0–1).
Optional: `camelot_code` (1A–12B, default 8B), `musical_key` (default C Major),
`valence`, `acousticness`, `danceability` (each 0–1). The server assigns an ID.
Audio recordings are not uploaded. Control characters are rejected.

`GET /tracks/custom` returns `{"tracks": [...]}`. `DELETE /tracks/custom/{id}`
deletes a custom catalog entry and returns `{"deleted": "..."}` or 404. The
limit is 500 custom records per shared demo deployment. Saved playlists retain
their snapshot even after a track is deleted. `GET /tracks` accepts `limit`
(1–500) and `offset` (0+), returns total/offset/limit/tracks, and can filter by
`genre`. The public demo has no per-user authentication; do not use it for
private audio or personal data.

---

### 2. Supported Genres & Acoustic Profiling
- **Method:** `GET`
- **Path:** `/genres`
- **Response `200 OK`:**
```json
{
  "genres": [
    {
      "name": "Contemporary Classical Piano",
      "track_count": 8,
      "min_bpm": 65.0,
      "max_bpm": 88.0,
      "avg_bpm": 75.4,
      "avg_energy": 0.35
    },
    {
      "name": "Indie Pop",
      "track_count": 8,
      "min_bpm": 92.0,
      "max_bpm": 115.0,
      "avg_bpm": 103.5,
      "avg_energy": 0.58
    },
    {
      "name": "Hip-Hop",
      "track_count": 8,
      "min_bpm": 78.0,
      "max_bpm": 94.0,
      "avg_bpm": 86.5,
      "avg_energy": 0.63
    }
  ]
}
```

---

### 3. Generate Audio Architecture
- **Method:** `POST`
- **Path:** `/playlists/generate`
- **Request Body:**
```json
{
  "target_duration_minutes": 45,
  "selected_genres": [
    "Contemporary Classical Piano",
    "Indie Pop",
    "Hip-Hop"
  ],
  "curve_type": "pomodoro_peak",
  "energy_weight": 0.40,
  "tempo_weight": 0.25,
  "harmonic_weight": 0.20,
  "genre_weight": 0.15,
  "name": "Deep Work Sprint Architecture"
}
```

- **Response `200 OK`:**
```json
{
  "success": true,
  "playlist": {
    "playlist_id": "pl_7f8a9b0c1d2e",
    "name": "Deep Work Sprint Architecture",
    "created_at": "2026-10-12T01:00:00Z",
    "target_duration_minutes": 45,
    "actual_duration_seconds": 2680,
    "actual_duration_formatted": "44m 40s",
    "track_count": 12,
    "genres_used": [
      "Contemporary Classical Piano",
      "Indie Pop",
      "Hip-Hop"
    ],
    "curve_type": "pomodoro_peak",
    "tracks": [...],
    "transitions": [...],
    "energy_trajectory": [...],
    "metrics": {
      "overall_fit_score": 0.941,
      "avg_energy_error": 0.042,
      "tempo_smoothness_score": 0.915,
      "harmonic_compatibility_rate": 88.5,
      "genre_diversity_count": 3,
      "duration_accuracy_percent": 99.2
    }
  }
}
```

---

### 4. Export Playlist
- **Method:** `POST`
- **Path:** `/playlists/export`
- **Request Body:**
```json
{
  "playlist_id": "pl_7f8a9b0c1d2e",
  "format": "m3u"
}
```
- **Behavior:** The API exports only the stored playlist with this ID. Any
  `playlist` object in the request body is ignored, so callers cannot replace
  another playlist's export file. `format` is `m3u`, `json` or `csv`.
- **Errors:** `400` for a missing or malformed `playlist_id` or unknown format,
  `404` when no stored playlist has that ID.
- **Response `200 OK`:**
```json
{
  "format": "m3u",
  "filename": "Deep_Work_Sprint_Architecture.m3u",
  "content": "#EXTM3U\n#PLAYLIST:Deep Work Sprint Architecture\n#EXTINF:234,Elena Rostova - Metamorphosis in F\n#EXT-X-BPM:68.0\n#EXT-X-KEY:7B (F Major)\n#EXT-X-ENERGY:0.22\ntracks/trk_cl_001.mp3\n...",
  "content_type": "audio/x-mpegurl",
  "s3_url": "https://<export-bucket>.s3.amazonaws.com/exports/pl_7f8a9b0c1d2e.m3u?X-Amz-Expires=3600&..."
}
```
In local mode `s3_url` is a `local://storage/...` reference. On AWS it is a
private presigned link that expires after one hour.

---

### 5. List Catalog Tracks
- **Method:** `GET`
- **Path:** `/tracks?genre=<genre>&limit=<1-500>&offset=<n>`
- **Response:** `{total, tracks, offset, limit}` for the seeded and custom catalog, filtered by genre when supplied.

### 6. Retrieve Playlist
- **Method:** `GET`
- **Path:** `/playlists/{playlist_id}`
- **Responses:** `200 OK` with the stored playlist, or `404 Not Found`.

### 7. Generation History
- **Method:** `GET`
- **Path:** `/playlists/history?user_id=guest_user&limit=15`
- **Response:** Newest-first playlist records from the DynamoDB `UserPlaylistIndex`.

### 8. Energy Curve Presets
- **Method:** `GET`
- **Path:** `/presets`
- **Response:** Available mathematical curves and sampled preview coordinates.

The deployed stage throttles all routes (default 5 requests/second, burst 10;
see `terraform/variables.tf`). Excess requests receive `429 Too Many Requests`.
