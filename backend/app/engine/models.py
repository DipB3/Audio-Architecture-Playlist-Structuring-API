"""
Core data models for the Audio Architecture System.
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
from enum import Enum

class EnergyCurveType(str, Enum):
    LINEAR_ASCENT = "linear_ascent"
    LINEAR_DESCENT = "linear_descent"
    POMODORO_PEAK = "pomodoro_peak"
    WAVE_INTERVAL = "wave_interval"
    STEADY_FLOW = "steady_flow"
    SUNSET_CHILL = "sunset_chill"
    CUSTOM = "custom"

@dataclass
class CurvePoint:
    time_fraction: float  # Normalized time in [0.0, 1.0]
    target_energy: float  # Normalized energy in [0.0, 1.0]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "time_fraction": round(self.time_fraction, 3),
            "target_energy": round(self.target_energy, 3)
        }

@dataclass
class Track:
    id: str
    title: str
    artist: str
    genre: str
    duration_seconds: int
    bpm: float
    musical_key: str
    camelot_code: str
    energy: float
    valence: float = 0.5
    acousticness: float = 0.5
    danceability: float = 0.5
    notes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Track":
        return cls(
            id=data["id"],
            title=data["title"],
            artist=data["artist"],
            genre=data["genre"],
            duration_seconds=int(data["duration_seconds"]),
            bpm=float(data["bpm"]),
            musical_key=data.get("musical_key", "C Major"),
            camelot_code=data.get("camelot_code", "8B"),
            energy=float(data.get("energy", 0.5)),
            valence=float(data.get("valence", 0.5)),
            acousticness=float(data.get("acousticness", 0.5)),
            danceability=float(data.get("danceability", 0.5)),
            notes=data.get("notes", [])
        )

@dataclass
class TrackTransition:
    from_track_id: str
    to_track_id: str
    bpm_delta: float
    camelot_distance: int
    camelot_compatible: bool
    genre_transition: str  # e.g., "Contemporary Classical Piano -> Indie Pop"
    transition_score: float  # 0.0 to 1.0 (higher = smoother)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class EnergyTrajectoryPoint:
    index: int
    time_seconds: int
    time_formatted: str
    normalized_time: float
    target_energy: float
    actual_energy: float
    energy_delta: float
    track_id: str
    track_title: str
    artist: str
    genre: str
    bpm: float
    camelot_code: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class ArchitectureMetrics:
    overall_fit_score: float         # 0.0 to 1.0 (composite optimization fitness)
    avg_energy_error: float          # Mean Absolute Error |target - actual|
    tempo_smoothness_score: float    # 0.0 to 1.0 (penalizes erratic BPM jumps)
    harmonic_compatibility_rate: float # Percentage of transitions with Camelot dist <= 1 or relative key
    genre_diversity_count: int       # Number of unique genres integrated
    duration_accuracy_percent: float # 100 - (|target - actual| / target * 100)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_fit_score": round(self.overall_fit_score, 3),
            "avg_energy_error": round(self.avg_energy_error, 3),
            "tempo_smoothness_score": round(self.tempo_smoothness_score, 3),
            "harmonic_compatibility_rate": round(self.harmonic_compatibility_rate, 3),
            "genre_diversity_count": self.genre_diversity_count,
            "duration_accuracy_percent": round(self.duration_accuracy_percent, 2)
        }

@dataclass
class StructuredPlaylist:
    playlist_id: str
    name: str
    created_at: str
    target_duration_minutes: float
    actual_duration_seconds: int
    actual_duration_formatted: str
    track_count: int
    genres_used: List[str]
    curve_type: str
    tracks: List[Track]
    transitions: List[TrackTransition]
    energy_trajectory: List[EnergyTrajectoryPoint]
    metrics: ArchitectureMetrics
    user_id: str = "guest_user"
    diagnostics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "playlist_id": self.playlist_id,
            "name": self.name,
            "created_at": self.created_at,
            "target_duration_minutes": self.target_duration_minutes,
            "actual_duration_seconds": self.actual_duration_seconds,
            "actual_duration_formatted": self.actual_duration_formatted,
            "track_count": self.track_count,
            "genres_used": self.genres_used,
            "curve_type": self.curve_type,
            "tracks": [t.to_dict() for t in self.tracks],
            "transitions": [tr.to_dict() for tr in self.transitions],
            "energy_trajectory": [p.to_dict() for p in self.energy_trajectory],
            "metrics": self.metrics.to_dict(),
            "user_id": self.user_id,
            "diagnostics": self.diagnostics
        }
