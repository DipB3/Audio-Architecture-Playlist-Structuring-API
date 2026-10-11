"""
Mathematical Energy Profiling & Curve Generation Module.
Provides continuous energy curve functions E(t) for t in [0.0, 1.0],
guaranteeing deliberate energy flow during audio sessions.
"""
import math
from typing import List, Optional, Dict, Any
from .models import CurvePoint, EnergyCurveType

# Catalog of curve presets and descriptions
CURVE_PRESETS: Dict[str, Dict[str, Any]] = {
    EnergyCurveType.POMODORO_PEAK.value: {
        "id": EnergyCurveType.POMODORO_PEAK.value,
        "name": "Pomodoro Focus Peak",
        "description": "Gradual warm-up (0-20%), sustained high-intensity flow peak (20-80%), and calming resolution cool-down (80-100%). Ideal for deep work sprints.",
        "icon": "mountain",
        "default_duration_minutes": 50
    },
    EnergyCurveType.LINEAR_ASCENT.value: {
        "id": EnergyCurveType.LINEAR_ASCENT.value,
        "name": "Continuous Ascent",
        "description": "Monotonically increasing energy curve from tranquil ambient into pulsating high-drive tracks. Great for morning awakenings or workout ramps.",
        "icon": "trending-up",
        "default_duration_minutes": 45
    },
    EnergyCurveType.LINEAR_DESCENT.value: {
        "id": EnergyCurveType.LINEAR_DESCENT.value,
        "name": "Decompression Glide",
        "description": "High-energy starting pace smoothly transitioning down to tranquil, low-tempo serenity. Perfect for post-work unwind or evening meditation.",
        "icon": "trending-down",
        "default_duration_minutes": 40
    },
    EnergyCurveType.WAVE_INTERVAL.value: {
        "id": EnergyCurveType.WAVE_INTERVAL.value,
        "name": "Interval Wave",
        "description": "Oscillating peaks and troughs simulating high-intensity interval training or periodic sprints with structured recovery valleys.",
        "icon": "activity",
        "default_duration_minutes": 60
    },
    EnergyCurveType.STEADY_FLOW.value: {
        "id": EnergyCurveType.STEADY_FLOW.value,
        "name": "Steady-State Flow",
        "description": "Even, undisturbed medium-energy baseline with subtle organic variations. Prevents cognitive distraction during marathon reading or coding.",
        "icon": "minus",
        "default_duration_minutes": 90
    },
    EnergyCurveType.SUNSET_CHILL.value: {
        "id": EnergyCurveType.SUNSET_CHILL.value,
        "name": "Sunset Transition",
        "description": "Warm afternoon momentum holding steady before gliding down into nocturnal tranquility.",
        "icon": "sun",
        "default_duration_minutes": 60
    },
    EnergyCurveType.CUSTOM.value: {
        "id": EnergyCurveType.CUSTOM.value,
        "name": "Custom Energy Architecture",
        "description": "User-designed energy profile with arbitrary control points and target thresholds.",
        "icon": "sliders",
        "default_duration_minutes": 45
    }
}

def clamp(val: float, min_val: float = 0.05, max_val: float = 0.95) -> float:
    """Clamps a floating point number within bounded audio energy range."""
    return max(min_val, min(max_val, val))

def get_curve_energy(curve_type: str, t: float, custom_points: Optional[List[CurvePoint]] = None) -> float:
    """
    Computes target energy E(t) for normalized time t in [0.0, 1.0].
    Returns an energy value in [0.05, 0.95].
    """
    t = max(0.0, min(1.0, float(t)))

    if curve_type == EnergyCurveType.LINEAR_ASCENT.value:
        # Linear slope: 0.20 -> 0.88
        raw = 0.20 + 0.68 * t
        return clamp(raw)

    elif curve_type == EnergyCurveType.LINEAR_DESCENT.value:
        # Linear slope: 0.88 -> 0.20
        raw = 0.88 - 0.68 * t
        return clamp(raw)

    elif curve_type == EnergyCurveType.POMODORO_PEAK.value:
        # Sine-shaped focus arc peaking in the middle 75% of the session
        # Phase shifted for warm-up and cool-down
        if t < 0.20:
            # Warmup: quadratic ramp from 0.25 to 0.72
            phase = t / 0.20
            raw = 0.25 + 0.47 * (phase ** 1.3)
        elif t <= 0.80:
            # Peak: steady plateau with subtle sinusoidal vitality
            phase = (t - 0.20) / 0.60
            raw = 0.72 + 0.12 * math.sin(phase * math.pi)
        else:
            # Cooldown: smooth decline from 0.72 down to 0.22
            phase = (t - 0.80) / 0.20
            raw = 0.72 - 0.50 * (phase ** 0.9)
        return clamp(raw)

    elif curve_type == EnergyCurveType.WAVE_INTERVAL.value:
        # 2 complete oscillation cycles (peaks at ~0.25 and ~0.75, troughs at ~0.50 and ~1.0)
        cycles = 2.0
        raw = 0.52 + 0.33 * math.sin(2.0 * math.pi * cycles * t - math.pi / 2.0)
        return clamp(raw)

    elif curve_type == EnergyCurveType.STEADY_FLOW.value:
        # Stable baseline around 0.48 with slight natural ripple (+/- 0.04)
        raw = 0.48 + 0.04 * math.sin(4.0 * math.pi * t)
        return clamp(raw)

    elif curve_type == EnergyCurveType.SUNSET_CHILL.value:
        # Sigmoidal dropoff centered around t=0.45
        raw = 0.22 + 0.62 / (1.0 + math.exp(9.0 * (t - 0.45)))
        return clamp(raw)

    elif curve_type == EnergyCurveType.CUSTOM.value and custom_points:
        return interpolate_custom_curve(t, custom_points)

    # Default fallback to steady flow
    return 0.50

def interpolate_custom_curve(t: float, points: List[CurvePoint]) -> float:
    """
    Interpolates target energy at normalized time t using piecewise linear
    interpolation between sorted control points.
    """
    if not points:
        return 0.50

    sorted_pts = sorted(points, key=lambda p: p.time_fraction)

    # Clamp boundary edge points if not covering [0, 1]
    if t <= sorted_pts[0].time_fraction:
        return clamp(sorted_pts[0].target_energy)
    if t >= sorted_pts[-1].time_fraction:
        return clamp(sorted_pts[-1].target_energy)

    # Find bounding segment
    for i in range(len(sorted_pts) - 1):
        p0 = sorted_pts[i]
        p1 = sorted_pts[i + 1]
        if p0.time_fraction <= t <= p1.time_fraction:
            seg_len = p1.time_fraction - p0.time_fraction
            if seg_len <= 1e-6:
                return clamp(p0.target_energy)
            alpha = (t - p0.time_fraction) / seg_len
            interpolated = p0.target_energy + alpha * (p1.target_energy - p0.target_energy)
            return clamp(interpolated)

    return clamp(sorted_pts[-1].target_energy)

def sample_curve_trajectory(curve_type: str, num_samples: int = 50, custom_points: Optional[List[CurvePoint]] = None) -> List[Dict[str, float]]:
    """
    Samples the curve at discrete points to feed frontend graphs or analysis.
    """
    samples = []
    for i in range(num_samples):
        tf = i / max(1, num_samples - 1)
        energy = get_curve_energy(curve_type, tf, custom_points)
        samples.append({
            "time_fraction": round(tf, 4),
            "target_energy": round(energy, 4)
        })
    return samples
