"""
Harmonic Mixing & Camelot Wheel Compatibility Matrix.
Ensures seamless, non-jarring acoustic transitions between musical keys,
even when traversing distinct musical genres.
"""
from typing import Tuple

def parse_camelot(code: str) -> Tuple[int, str]:
    """
    Parses a Camelot code string like '8A', '12B', '4A' into (hour: int, mode: str).
    """
    cleaned = code.strip().upper()
    if not cleaned:
        return (8, "B")
    mode = cleaned[-1]
    if mode not in ("A", "B"):
        mode = "B"
    try:
        hour = int(cleaned[:-1])
    except ValueError:
        hour = 8
    # Camelot hours are 1 through 12
    hour = ((hour - 1) % 12) + 1
    return hour, mode

def calculate_camelot_distance(code1: str, code2: str) -> int:
    """
    Computes shortest distance around the 12-hour Camelot circle.
    Returns integer between 0 and 6.
    """
    h1, _ = parse_camelot(code1)
    h2, _ = parse_camelot(code2)
    diff = abs(h1 - h2)
    circular_dist = min(diff, 12 - diff)
    return circular_dist

def evaluate_harmonic_transition(code1: str, code2: str) -> Tuple[bool, int, float]:
    """
    Evaluates harmonic compatibility between two tracks.
    Returns (is_compatible: bool, circular_hour_distance: int, compatibility_score: float [0..1]).
    """
    h1, m1 = parse_camelot(code1)
    h2, m2 = parse_camelot(code2)

    diff = abs(h1 - h2)
    hour_dist = min(diff, 12 - diff)

    # Rule 1: Exact match (same key, same mode)
    if hour_dist == 0 and m1 == m2:
        return (True, 0, 1.0)

    # Rule 2: Relative Major / Relative Minor (e.g. 8A to 8B)
    if hour_dist == 0 and m1 != m2:
        return (True, 0, 0.92)

    # Rule 3: Adjacent key on wheel (same mode, +1 or -1 hour)
    if hour_dist == 1 and m1 == m2:
        return (True, 1, 0.85)

    # Rule 4: Diagonal mix (+1 or -1 hour AND mode change, e.g., 8A to 9B)
    if hour_dist == 1 and m1 != m2:
        return (True, 1, 0.75)

    # Rule 5: Energy boost modulation (+2 hours, e.g. 8A to 10A)
    if hour_dist == 2 and m1 == m2:
        return (True, 2, 0.65)

    # Non-harmonic or distant transition
    score = max(0.1, 0.5 - (hour_dist * 0.08))
    return (False, hour_dist, round(score, 3))
