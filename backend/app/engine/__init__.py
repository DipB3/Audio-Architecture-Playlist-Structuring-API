"""Audio Architecture Engine Package"""
from .models import (
    Track,
    TrackTransition,
    EnergyTrajectoryPoint,
    ArchitectureMetrics,
    StructuredPlaylist,
    CurvePoint,
    EnergyCurveType
)
from .curves import get_curve_energy, CURVE_PRESETS, sample_curve_trajectory
from .harmonic import evaluate_harmonic_transition, calculate_camelot_distance
from .optimizer import PlaylistOptimizer
