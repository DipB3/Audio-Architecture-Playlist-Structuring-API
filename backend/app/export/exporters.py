"""
Export & Integration Module.
Formats and packages finalized audio architectures for export into industry-standard
audio containers and playlist formats (M3U, JSON, CSV).
"""
import json
import csv
import io
from typing import Dict, Any
from ..engine.models import StructuredPlaylist

def export_to_m3u(playlist: StructuredPlaylist) -> str:
    """
    Generates standard Extended M3U (#EXTM3U) playlist file with rich
    acoustic commentary tags for DJ / media player compatibility.
    """
    lines = [
        "#EXTM3U",
        f"#PLAYLIST:{playlist.name}",
        f"#CURVE_TYPE:{playlist.curve_type}",
        f"#TARGET_DURATION:{playlist.target_duration_minutes}m",
        f"#ACTUAL_DURATION:{playlist.actual_duration_formatted}",
        f"#OVERALL_FIT_SCORE:{playlist.metrics.overall_fit_score}",
        f"#PLANNED_CROSSFADE_SECONDS:{playlist.diagnostics.get('crossfade_seconds', 0)}",
        ""
    ]

    for i, track in enumerate(playlist.tracks):
        # Extended info: length in seconds, Artist - Title
        lines.append(f"#EXTINF:{track.duration_seconds},{track.artist} - {track.title}")
        lines.append(f"#EXT-X-BPM:{track.bpm}")
        lines.append(f"#EXT-X-KEY:{track.camelot_code} ({track.musical_key})")
        lines.append(f"#EXT-X-ENERGY:{round(track.energy, 2)}")
        lines.append(f"#EXT-X-GENRE:{track.genre}")
        # Audio file uri or track identifier
        lines.append(f"tracks/{track.id}.mp3")
        lines.append("")

    return "\n".join(lines)

def export_to_json(playlist: StructuredPlaylist) -> str:
    """Exports structured playlist to formatted JSON string."""
    return json.dumps(playlist.to_dict(), indent=2)

def export_to_csv(playlist: StructuredPlaylist) -> str:
    """Exports tracklist and trajectory data to CSV string."""
    output = io.StringIO()
    writer = csv.writer(output)
    def safe_cell(value):
        """Prevent spreadsheet formula execution for user-supplied metadata."""
        if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")):
            return "'" + value
        return value

    # Header
    writer.writerow([
        "Position",
        "Track ID",
        "Title",
        "Artist",
        "Genre",
        "Duration (Seconds)",
        "BPM",
        "Musical Key",
        "Camelot Code",
        "Energy (0-1)",
        "Target Energy",
        "Energy Delta",
        "Valence",
        "Acousticness",
        "Danceability"
    ])

    for i, track in enumerate(playlist.tracks):
        traj_point = playlist.energy_trajectory[i] if i < len(playlist.energy_trajectory) else None
        target_e = traj_point.target_energy if traj_point else ""
        delta_e = traj_point.energy_delta if traj_point else ""

        writer.writerow([safe_cell(cell) for cell in [
            i + 1,
            track.id,
            track.title,
            track.artist,
            track.genre,
            track.duration_seconds,
            track.bpm,
            track.musical_key,
            track.camelot_code,
            track.energy,
            target_e,
            delta_e,
            track.valence,
            track.acousticness,
            track.danceability
        ]])

    return output.getvalue()
