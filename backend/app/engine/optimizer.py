"""Bounded beam search with duration-aware scoring and cached transitions."""
import math
import time
import uuid
from collections import Counter
from datetime import datetime, timezone
from functools import lru_cache

from .curves import get_curve_energy, clamp
from .harmonic import evaluate_harmonic_transition
from .models import (
    ArchitectureMetrics, EnergyTrajectoryPoint, StructuredPlaylist, TrackTransition,
)

GENRE_AFFINITY = {
    frozenset(("Contemporary Classical Piano", "Ambient")): .95,
    frozenset(("Contemporary Classical Piano", "Neo-Soul")): .88,
    frozenset(("Contemporary Classical Piano", "Indie Pop")): .72,
    frozenset(("Contemporary Classical Piano", "Hip-Hop")): .65,
    frozenset(("Ambient", "Hip-Hop")): .82,
    frozenset(("Ambient", "Deep House")): .80,
    frozenset(("Neo-Soul", "Hip-Hop")): .94,
    frozenset(("Neo-Soul", "Indie Pop")): .86,
    frozenset(("Hip-Hop", "Indie Pop")): .82,
    frozenset(("Indie Pop", "Synthwave")): .84,
    frozenset(("Indie Pop", "Deep House")): .76,
    frozenset(("Deep House", "Synthwave")): .92,
}


def get_genre_transition_affinity(first, second):
    return 1.0 if first == second else GENRE_AFFINITY.get(frozenset((first, second)), .60)


def effective_bpm_delta(first, second):
    return min(abs(first - second), abs(first * 2 - second), abs(first - second * 2))


@lru_cache(maxsize=4096)
def compute_tempo_affinity(first, second):
    return math.exp(-effective_bpm_delta(first, second) ** 2 / (2 * 12 ** 2))


@lru_cache(maxsize=8192)
def transition_features(first_bpm, second_bpm, first_key, second_key, first_genre, second_genre):
    compatible, distance, harmonic = evaluate_harmonic_transition(first_key, second_key)
    return (
        compute_tempo_affinity(first_bpm, second_bpm), harmonic,
        get_genre_transition_affinity(first_genre, second_genre), compatible, distance,
    )


def format_duration(seconds):
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours}h {minutes:02d}m {seconds:02d}s" if hours else f"{minutes:02d}m {seconds:02d}s"


class PlaylistOptimizer:
    def __init__(self, catalog, energy_weight=.40, tempo_weight=.25,
                 harmonic_weight=.20, genre_weight=.15, beam_width=12):
        self.catalog = sorted(catalog, key=lambda track: track.id)
        values = [energy_weight, tempo_weight, harmonic_weight, genre_weight]
        if any(not math.isfinite(value) or value < 0 for value in values) or sum(values) <= 0:
            raise ValueError("Weights must be finite, non-negative and have a positive total.")
        self.weights = tuple(value / sum(values) for value in values)
        if not isinstance(beam_width, int) or not 2 <= beam_width <= 32:
            raise ValueError("beam_width must be an integer between 2 and 32.")
        self.beam_width = beam_width

    def generate_playlist(self, target_duration_minutes, selected_genres, curve_type,
                          custom_points=None, playlist_name=None, user_id="guest_user",
                          excluded_track_ids=None, min_bpm=40, max_bpm=220,
                          allow_repeats=True, crossfade_seconds=0, diversity_strength=.25):
        started = time.perf_counter()
        if not math.isfinite(target_duration_minutes) or target_duration_minutes <= 0:
            raise ValueError("Duration must be finite and positive.")
        target = round(target_duration_minutes * 60)
        if not 0 <= crossfade_seconds <= 30 or not 0 <= diversity_strength <= 1:
            raise ValueError("Invalid crossfade or diversity setting.")
        if not 20 <= min_bpm <= max_bpm <= 300:
            raise ValueError("BPM bounds must satisfy 20 <= min_bpm <= max_bpm <= 300.")
        excluded = set(excluded_track_ids or [])
        available = [
            track for track in self.catalog
            if (not selected_genres or track.genre in selected_genres)
            and track.id not in excluded and min_bpm <= track.bpm <= max_bpm
        ]
        if not available:
            raise ValueError("No tracks match the selected genres, BPM range and exclusions.")
        if any(track.duration_seconds <= crossfade_seconds for track in available):
            raise ValueError("Crossfade must be shorter than every track.")
        genres = set(selected_genres or [track.genre for track in available])
        missing = genres - {track.genre for track in available}
        if missing:
            raise ValueError("No eligible tracks for genre(s): " + ", ".join(sorted(missing)))
        # Cache curve evaluation at candidate midpoints. Each track is evaluated
        # across its full duration so long tracks cannot hide poor curve fit.
        @lru_cache(maxsize=32768)
        def energy_error(index, start, denominator):
            track = available[index]
            return sum(
                abs(track.energy - get_curve_energy(
                    curve_type, clamp((start + fraction * track.duration_seconds) / denominator, 0, 1),
                    custom_points))
                for fraction in (.15, .5, .85)
            ) / 3

        def features(first, second):
            return transition_features(first.bpm, second.bpm, first.camelot_code,
                                       second.camelot_code, first.genre, second.genre)

        # State: cumulative weighted utility, elapsed seconds, sequence of indices.
        beam = [(0.0, 0, ())]
        completed = []
        evaluations = 0
        shortest = min(track.duration_seconds - crossfade_seconds for track in available)
        max_steps = min(128, math.ceil(target / shortest) + 2)
        if not allow_repeats:
            max_steps = min(max_steps, len(available))
        tolerance = min(90, max(30, target * .015))

        def rank(state):
            utility, elapsed, sequence = state
            counts = Counter(available[index].genre for index in sequence)
            coverage = len(genres.intersection(counts)) / max(1, len(genres))
            return utility / max(1, elapsed) + diversity_strength * .15 * coverage

        for _ in range(max_steps):
            expanded = []
            for utility, elapsed, sequence in beam:
                counts = Counter(sequence)
                genre_counts = Counter(available[index].genre for index in sequence)
                unused = [index for index in range(len(available)) if index not in counts]
                candidates = unused if unused else (list(range(len(available))) if allow_repeats else [])
                if not candidates:
                    completed.append((utility, elapsed, sequence))
                    continue
                for index in candidates:
                    if sequence and sequence[-1] == index and len(available) > 1:
                        continue
                    track = available[index]
                    overlap = crossfade_seconds if sequence else 0
                    start = elapsed - overlap
                    new_elapsed = start + track.duration_seconds
                    error = energy_error(index, start, target)
                    tempo, harmonic, affinity = 1., 1., 1.
                    if sequence:
                        tempo, harmonic, affinity, _, _ = features(available[sequence[-1]], track)
                    balance = 1 / (1 + genre_counts[track.genre])
                    genre_score = (1 - diversity_strength) * affinity + diversity_strength * balance
                    score = sum(weight * value for weight, value in zip(
                        self.weights, (1 - error, tempo, harmonic, genre_score)))
                    # Penalize repetition after catalog exhaustion without violating
                    # the request to fill a longer session.
                    score -= min(.12, counts[index] * .035)
                    state = (utility + score * (track.duration_seconds - overlap),
                             new_elapsed, sequence + (index,))
                    evaluations += 1
                    if new_elapsed >= target - tolerance:
                        completed.append(state)
                    if new_elapsed < target:
                        expanded.append(state)
            if not expanded:
                break
            # Preserve elapsed-time diversity to avoid discarding all paths that
            # could finish close to the target duration.
            expanded.sort(key=rank, reverse=True)
            distinct, seen = [], set()
            for state in expanded:
                signature = (state[2][-1], state[1] // 20,
                             frozenset(available[index].genre for index in state[2]))
                if signature not in seen:
                    distinct.append(state)
                    seen.add(signature)
                if len(distinct) >= self.beam_width:
                    break
            beam = distinct

        def final_rank(state):
            _, elapsed, sequence = state
            if not sequence:
                return -math.inf
            energy = sum(
                energy_error(index, sum(available[j].duration_seconds for j in sequence[:position])
                             - crossfade_seconds * position, elapsed)
                * available[index].duration_seconds
                for position, index in enumerate(sequence)
            ) / sum(available[index].duration_seconds for index in sequence)
            coverage = len({available[index].genre for index in sequence}) / len(genres)
            return rank(state) - self.weights[0] * energy - 1.5 * abs(elapsed - target) / target +                + diversity_strength * .15 * coverage

        candidates = completed + beam
        _, actual, sequence = max(candidates, key=final_rank)
        tracks = [available[index] for index in sequence]
        trajectory, transitions, elapsed = [], [], 0
        weighted_error, tempo_total, compatible_count = 0., 0., 0
        for position, (index, track) in enumerate(zip(sequence, tracks)):
            if position:
                elapsed -= crossfade_seconds
            normalized = clamp((elapsed + track.duration_seconds / 2) / actual, 0, 1)
            target_energy = get_curve_energy(curve_type, normalized, custom_points)
            weighted_error += energy_error(index, elapsed, actual) * track.duration_seconds
            trajectory.append(EnergyTrajectoryPoint(
                position + 1, elapsed, format_duration(elapsed), round(normalized, 4),
                round(target_energy, 4), track.energy, round(track.energy - target_energy, 4),
                track.id, track.title, track.artist, track.genre, track.bpm, track.camelot_code,
            ))
            if position:
                previous = tracks[position - 1]
                tempo, harmonic, affinity, compatible, distance = features(previous, track)
                tempo_total += tempo
                compatible_count += int(compatible)
                transitions.append(TrackTransition(
                    previous.id, track.id, round(effective_bpm_delta(previous.bpm, track.bpm), 2),
                    distance, compatible, f"{previous.genre} -> {track.genre}",
                    round(tempo * .4 + harmonic * .35 + affinity * .25, 4),
                ))
            elapsed += track.duration_seconds
        count = len(transitions)
        energy_mae = weighted_error / sum(track.duration_seconds for track in tracks)
        smoothness = tempo_total / count if count else 1.
        harmonic_rate = compatible_count / count if count else 1.
        accuracy = max(0, 1 - abs(actual - target) / target)
        fit = .4 * (1 - energy_mae) + .25 * smoothness + .2 * harmonic_rate + .15 * accuracy
        warnings = []
        if abs(actual - target) > tolerance:
            warnings.append("Available whole tracks cannot closely match the requested duration.")
        if len(set(sequence)) < len(sequence):
            warnings.append("Tracks repeat because the eligible catalog is shorter than the session.")
        if len({track.genre for track in tracks}) < len(genres):
            warnings.append("Some requested genres did not fit this session.")
        diagnostics = {
            "engine": "duration-aware-beam-v2", "execution_ms": round((time.perf_counter() - started) * 1000, 2),
            "candidate_evaluations": evaluations, "eligible_track_count": len(available),
            "duration_error_seconds": actual - target, "repeat_count": len(sequence) - len(set(sequence)),
            "crossfade_seconds": crossfade_seconds, "warnings": warnings,
            "custom_points": [point.to_dict() for point in custom_points or []],
            "target_samples": [
                {"time_fraction": index / 100,
                 "energy": round(get_curve_energy(curve_type, index / 100, custom_points), 4)}
                for index in range(101)
            ],
        }
        return StructuredPlaylist(
            playlist_id=f"pl_{uuid.uuid4().hex[:12]}",
            name=playlist_name or f"Audio Architecture - {curve_type.replace('_', ' ').title()} ({target_duration_minutes:g}m)",
            created_at=datetime.now(timezone.utc).isoformat(),
            target_duration_minutes=target_duration_minutes, actual_duration_seconds=actual,
            actual_duration_formatted=format_duration(actual), track_count=len(tracks),
            genres_used=sorted({track.genre for track in tracks}), curve_type=curve_type,
            tracks=tracks, transitions=transitions, energy_trajectory=trajectory,
            metrics=ArchitectureMetrics(fit, energy_mae, smoothness, harmonic_rate * 100,
                                        len({track.genre for track in tracks}), accuracy * 100),
            user_id=user_id, diagnostics=diagnostics,
        )
