# API Specification: Audio Architecture & Playlist Structuring API

## Base URLs
- **Production (AWS API Gateway):** `https://<api-id>.execute-api.<region>.amazonaws.com`
- **Local Development / Demo:** `http://localhost:8000`

---

## Endpoints

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
  "catalog_track_count": 48,
  "managed_services": [
    "AWS Lambda (Serverless Compute)",
    "Amazon API Gateway (REST API)",
    "Amazon DynamoDB (NoSQL Data & History)",
    "Amazon S3 (Catalog & Export Bundles)",
    "Amazon CloudWatch & AWS Budgets (DevOps & Alerts)"
  ]
}
```

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
- **Response `200 OK`:**
```json
{
  "format": "m3u",
  "filename": "Deep_Work_Sprint_Architecture.m3u",
  "content": "#EXTM3U\n#PLAYLIST:Deep Work Sprint Architecture\n#EXTINF:234,Elena Rostova - Metamorphosis in F\n#EXT-X-BPM:68.0\n#EXT-X-KEY:7B (F Major)\n#EXT-X-ENERGY:0.22\ntracks/trk_cl_001.mp3\n...",
  "s3_url": "https://audio-architecture-assets.s3.us-east-1.amazonaws.com/exports/pl_7f8a9b0c1d2e.m3u"
}
```
