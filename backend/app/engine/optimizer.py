"""
Audio Architecture Optimizer Engine.
Implements multi-objective beam-search sequencing to mathematically structure
continuous, multi-genre audio playlists tailored to requested energy curves.
"""
import uuid
import math
import time
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple, Set, Any

from .models import (
    Track,
    TrackTransition,
    EnergyTrajectoryPoint,
    ArchitectureMetrics,
    StructuredPlaylist,
    CurvePoint
)
from .curves import get_curve_energy, clamp
from .harmonic import evaluate_harmonic_transition, calculate_camelot_distance

# Genre acoustic compatibility matrix (distance / bridge affinity)
# 1.0 = seamless acoustic bridge, lower = requires careful tempo/harmonic transition
GENRE_AFFINITY: Dict[Tuple[str, str], float] = {
    ("Contemporary Classical Piano", "Ambient"): 0.95,
    ("Ambient", "Contemporary Classical Piano"): 0.95,
    ("Contemporary Classical Piano", "Neo-Soul"): 0.88,
    ("Neo-Soul", "Contemporary Classical Piano"): 0.88,
    ("Contemporary Classical Piano", "Indie Pop"): 0.72,
    ("Indie Pop", "Contemporary Classical Piano"): 0.72,
    ("Contemporary Classical Piano", "Hip-Hop"): 0.65,
    ("Hip-Hop", "Contemporary Classical Piano"): 0.65,

    ("Ambient", "Hip-Hop"): 0.82,
    ("Hip-Hop", "Ambient"): 0.82,
    ("Ambient", "Deep House"): 0.80,
    ("Deep House", "Ambient"): 0.80,

    ("Neo-Soul", "Hip-Hop"): 0.94,
    ("Hip-Hop", "Neo-Soul"): 0.94,
    ("Neo-Soul", "Indie Pop"): 0.86,
    ("Indie Pop", "Neo-Soul"): 0.86,

    ("Hip-Hop", "Indie Pop"): 0.82,
    ("Indie Pop", "Hip-Hop"): 0.82,
    ("Indie Pop", "Synthwave"): 0.84,
    ("Synthwave", "Indie Pop"): 0.84,
    ("Indie Pop", "Deep House"): 0.76,
    ("Deep House", "Indie Pop"): 0.76,

    ("Deep House", "Synthwave"): 0.92,
    ("Synthwave", "Deep House"): 0.92,
}

def get_genre_transition_affinity(g1: str, g2: str) -> float:
    """Returns affinity score [0.0..1.0] between two genres."""
    if g1 == g2:
        return 1.0
    return GENRE_AFFINITY.get((g1, g2), 0.60)

def compute_tempo_affinity(bpm1: float, bpm2: float) -> float:
    """
    Computes tempo transition affinity score [0.0..1.0].
    Accounts for natural BPM proximity and 2x/0.5x harmonic tempo bridging.
    """
    # Direct delta
    d_direct = abs(bpm1 - bpm2)
    # Double time (e.g. 70 -> 140)
    d_double = abs(bpm1 * 2.0 - bpm2)
    # Half time (e.g. 140 -> 70)
    d_half = abs(bpm1 - bpm2 * 2.0)

    effective_delta = min(d_direct, d_double, d_half)
    # Gaussian-like decay: delta=0 -> 1.0; delta=10 -> 0.70; delta=25 -> 0.25
    return math.exp(-(effective_delta ** 2) / (2.0 * (12.0 ** 2)))

def format_duration(seconds: int) -> str:
    """Formats duration in seconds as mm:ss or hh:mm:ss."""
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h}h {m:02d}m {s:02d}s"
    return f"{m:02d}m {s:02d}s"

class PlaylistOptimizer:
    def __init__(
        self,
        catalog: List[Track],
        energy_weight: float = 0.40,
        tempo_weight: float = 0.25,
        harmonic_weight: float = 0.20,
        genre_weight: float = 0.15,
        beam_width: int = 6
    ):
        self.catalog = catalog
        self.energy_weight = energy_weight
        self.tempo_weight = tempo_weight
        self.harmonic_weight = harmonic_weight
        self.genre_weight = genre_weight
        self.beam_width = beam_width

    def generate_playlist(
        self,
        target_duration_minutes: float,
        selected_genres: List[str],
        curve_type: str,
        custom_points: Optional[List[CurvePoint]] = None,
        playlist_name: Optional[str] = None,
        user_id: str = "guest_user"
    ) -> StructuredPlaylist:
        """
        Executes beam-search optimization to assemble the optimal tracklist.
        """
        start_time = time.time()
        target_seconds = int(target_duration_minutes * 60)

        # 1. Filter tracks by selected genres, or use all if none selected
        available_tracks = [
            t for t in self.catalog
            if not selected_genres or t.genre in selected_genres
        ]
        if not available_tracks:
            # Fallback to full catalog if filter returned nothing
            available_tracks = list(self.catalog)

        # 2. Estimate required track count based on average track length
        avg_track_len = sum(t.duration_seconds for t in available_tracks) / len(available_tracks)
        est_track_count = max(2, int(round(target_seconds / avg_track_len)))

        # 3. Beam Search Initialization
        # Beam state: (score, elapsed_seconds, track_sequence_list)
        # Seed candidates: top tracks matching energy at t=0.0
        initial_target_energy = get_curve_energy(curve_type, 0.0, custom_points)
        sorted_starters = sorted(
            available_tracks,
            key=lambda t: abs(t.energy - initial_target_energy)
        )[:self.beam_width * 2]

        # Initialize beam
        beam = []
        for starter in sorted_starters:
            e_diff = abs(starter.energy - initial_target_energy)
            e_score = 1.0 - e_diff
            beam.append((e_score, starter.duration_seconds, [starter]))

        # 4. Iterative Expansion until reaching target duration
        max_steps = est_track_count + 6

        for step in range(max_steps):
            new_candidates = []
            all_beams_completed = True

            for cumulative_score, elapsed_sec, seq in beam:
                # Check if current sequence is already within acceptable target window
                # e.g., within 90 seconds of target duration
                if elapsed_sec >= target_seconds - 90:
                    new_candidates.append((cumulative_score, elapsed_sec, seq))
                    continue

                all_beams_completed = False
                current_track = seq[-1]
                used_ids: Set[str] = {t.id for t in seq}

                # Next normalized time position
                next_center_sec = elapsed_sec + (avg_track_len / 2.0)
                norm_time = clamp(next_center_sec / target_seconds, 0.0, 1.0)
                target_e = get_curve_energy(curve_type, norm_time, custom_points)

                # Track candidate pool: exclude already used tracks
                candidates = [t for t in available_tracks if t.id not in used_ids]
                if not candidates:
                    # If all used up, allow recycling to satisfy duration
                    candidates = available_tracks

                # Score each candidate transition
                # Track genre frequency in current sequence to encourage genre balance
                genre_counts = {}
                for t in seq:
                    genre_counts[t.genre] = genre_counts.get(t.genre, 0) + 1

                for cand in candidates:
                    # 4a. Energy matching score
                    e_fit = 1.0 - abs(cand.energy - target_e)

                    # 4b. Tempo transition score
                    t_fit = compute_tempo_affinity(current_track.bpm, cand.bpm)

                    # 4c. Harmonic transition score
                    _, _, h_fit = evaluate_harmonic_transition(
                        current_track.camelot_code,
                        cand.camelot_code
                    )

                    # 4d. Genre transition score
                    g_affinity = get_genre_transition_affinity(current_track.genre, cand.genre)
                    # Genre balancing bonus: encourage variety across requested genres
                    diversity_factor = 1.0 / (1.0 + genre_counts.get(cand.genre, 0) * 0.35)
                    g_fit = g_affinity * 0.7 + diversity_factor * 0.3

                    # Composite transition fitness
                    step_fitness = (
                        self.energy_weight * e_fit +
                        self.tempo_weight * t_fit +
                        self.harmonic_weight * h_fit +
                        self.genre_weight * g_fit
                    )

                    new_elapsed = elapsed_sec + cand.duration_seconds
                    # Duration penalty if grossly overshooting
                    overshoot = max(0, new_elapsed - (target_seconds + 120))
                    duration_penalty = (overshoot / 120.0) * 0.5

                    new_total_score = cumulative_score + step_fitness - duration_penalty
                    new_candidates.append((new_total_score, new_elapsed, seq + [cand]))

            if all_beams_completed or not new_candidates:
                break

            # Prune to beam width (keep highest average score per track)
            new_candidates.sort(key=lambda item: item[0] / len(item[2]), reverse=True)
            beam = new_candidates[:self.beam_width]

        # 5. Select Best Sequence that best balances target duration and score
        def final_fitness(item):
            score, dur, seq = item
            avg_step_score = score / max(1, len(seq))
            dur_error_ratio = abs(dur - target_seconds) / target_seconds
            dur_fit = max(0.0, 1.0 - dur_error_ratio * 1.8)
            return avg_step_score * 0.7 + dur_fit * 0.3

        best_beam = max(beam, key=final_fitness)
        best_score, actual_duration_sec, best_tracks = best_beam

        # 6. Build Transitions and Trajectory Datasets
        transitions: List[TrackTransition] = []
        trajectory: List[EnergyTrajectoryPoint] = []
        accumulated_sec = 0

        harmonic_compatible_count = 0
        total_energy_error = 0.0
        tempo_smoothness_accum = 0.0

        for i, track in enumerate(best_tracks):
            track_center_sec = accumulated_sec + (track.duration_seconds / 2)
            norm_t = clamp(track_center_sec / actual_duration_sec, 0.0, 1.0)
            target_e = get_curve_energy(curve_type, norm_t, custom_points)
            e_delta = track.energy - target_e
            total_energy_error += abs(e_delta)

            # Record trajectory point
            trajectory.append(EnergyTrajectoryPoint(
                index=i + 1,
                time_seconds=int(accumulated_sec),
                time_formatted=format_duration(int(accumulated_sec)),
                normalized_time=round(norm_t, 3),
                target_energy=round(target_e, 3),
                actual_energy=round(track.energy, 3),
                energy_delta=round(e_delta, 3),
                track_id=track.id,
                track_title=track.title,
                artist=track.artist,
                genre=track.genre,
                bpm=round(track.bpm, 1),
                camelot_code=track.camelot_code
            ))

            # Build transition data if not the first track
            if i > 0:
                prev_track = best_tracks[i - 1]
                bpm_diff = round(abs(track.bpm - prev_track.bpm), 1)
                is_comp, cam_dist, h_score = evaluate_harmonic_transition(
                    prev_track.camelot_code,
                    track.camelot_code
                )
                if is_comp:
                    harmonic_compatible_count += 1

                t_score = compute_tempo_affinity(prev_track.bpm, track.bpm)
                tempo_smoothness_accum += t_score

                g_shift = f"{prev_track.genre} -> {track.genre}"
                g_score = get_genre_transition_affinity(prev_track.genre, track.genre)
                composite_trans_score = round(t_score * 0.4 + h_score * 0.35 + g_score * 0.25, 3)

                transitions.append(TrackTransition(
                    from_track_id=prev_track.id,
                    to_track_id=track.id,
                    bpm_delta=bpm_diff,
                    camelot_distance=cam_dist,
                    camelot_compatible=is_comp,
                    genre_transition=g_shift,
                    transition_score=composite_trans_score
                ))

            accumulated_sec += track.duration_seconds

        # 7. Compute Summary Architecture Metrics
        num_transitions = max(1, len(best_tracks) - 1)
        avg_e_err = total_energy_error / len(best_tracks)
        tempo_smoothness = tempo_smoothness_accum / num_transitions
        harmonic_rate = (harmonic_compatible_count / num_transitions) * 100.0
        genres_used = sorted(list(set(t.genre for t in best_tracks)))
        duration_acc = max(0.0, 100.0 - (abs(actual_duration_sec - target_seconds) / target_seconds * 100.0))

        # Overall composite fit score in [0.0..1.0]
        overall_fit = (
            (1.0 - min(1.0, avg_e_err * 2.0)) * 0.40 +
            tempo_smoothness * 0.25 +
            (harmonic_rate / 100.0) * 0.20 +
            (duration_acc / 100.0) * 0.15
        )

        metrics = ArchitectureMetrics(
            overall_fit_score=overall_fit,
            avg_energy_error=avg_e_err,
            tempo_smoothness_score=tempo_smoothness,
            harmonic_compatibility_rate=harmonic_rate,
            genre_diversity_count=len(genres_used),
            duration_accuracy_percent=duration_acc
        )

        name = playlist_name or f"Audio Architecture - {curve_type.replace('_', ' ').title()} ({int(target_duration_minutes)}m)"

        return StructuredPlaylist(
            playlist_id=f"pl_{uuid.uuid4().hex[:12]}",
            name=name,
            created_at=datetime.now(timezone.utc).isoformat(),
            target_duration_minutes=target_duration_minutes,
            actual_duration_seconds=actual_duration_sec,
            actual_duration_formatted=format_duration(actual_duration_sec),
            track_count=len(best_tracks),
            genres_used=genres_used,
            curve_type=curve_type,
            tracks=best_tracks,
            transitions=transitions,
            energy_trajectory=trajectory,
            metrics=metrics,
            user_id=user_id
        )
