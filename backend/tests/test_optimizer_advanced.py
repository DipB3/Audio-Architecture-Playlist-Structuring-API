"""Constraint and quality regressions using the actual catalog."""
import json
import unittest
from pathlib import Path
from backend.app.engine.models import Track, CurvePoint
from backend.app.engine.optimizer import PlaylistOptimizer, effective_bpm_delta


class AdvancedOptimizerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        raw = json.loads((Path(__file__).parents[1] / "app/data/track_catalog.json").read_text())
        cls.catalog = [Track.from_dict(item) for item in raw]

    def generate(self, **options):
        return PlaylistOptimizer(self.catalog).generate_playlist(
            target_duration_minutes=options.pop("duration", 30),
            selected_genres=options.pop("genres", []),
            curve_type=options.pop("curve", "pomodoro_peak"), **options)

    def test_no_repeats_and_exclusions(self):
        excluded = [track.id for track in self.catalog[:4]]
        playlist = self.generate(duration=180, genres=["Ambient"],
                                 allow_repeats=False, excluded_track_ids=excluded)
        ids = [track.id for track in playlist.tracks]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertFalse(set(ids).intersection(excluded))
        self.assertTrue(playlist.diagnostics["warnings"])

    def test_bpm_filter(self):
        playlist = self.generate(min_bpm=80, max_bpm=100)
        self.assertTrue(all(80 <= track.bpm <= 100 for track in playlist.tracks))

    def test_crossfade_duration_and_timestamps(self):
        playlist = self.generate(crossfade_seconds=12)
        self.assertEqual(playlist.actual_duration_seconds,
                         sum(track.duration_seconds for track in playlist.tracks) -
                         12 * (playlist.track_count - 1))
        for index in range(1, playlist.track_count):
            self.assertEqual(playlist.energy_trajectory[index].time_seconds,
                             playlist.energy_trajectory[index - 1].time_seconds +
                             playlist.tracks[index - 1].duration_seconds - 12)

    def test_impossible_filter_does_not_silently_relax(self):
        with self.assertRaises(ValueError):
            self.generate(min_bpm=299, max_bpm=300)

    def test_long_session_repeats_only_when_needed(self):
        playlist = self.generate(duration=180, genres=["Ambient"])
        self.assertLess(abs(playlist.actual_duration_seconds - 10800), 200)
        self.assertGreater(playlist.diagnostics["repeat_count"], 0)
        self.assertTrue(all(first.id != second.id for first, second in
                            zip(playlist.tracks, playlist.tracks[1:])))

    def test_custom_curve_metrics_are_finite_and_bounded(self):
        playlist = self.generate(curve="custom", custom_points=[
            CurvePoint(0, .2), CurvePoint(.5, .8), CurvePoint(1, .3)])
        self.assertTrue(0 <= playlist.metrics.overall_fit_score <= 1)
        self.assertTrue(0 <= playlist.metrics.avg_energy_error <= 1)
        self.assertEqual(len(playlist.diagnostics["custom_points"]), 3)

    def test_deterministic_sequence(self):
        first, second = self.generate(), self.generate()
        self.assertEqual([track.id for track in first.tracks], [track.id for track in second.tracks])

    def test_weight_scaling_has_no_effect(self):
        first = PlaylistOptimizer(self.catalog, .4, .25, .2, .15)
        second = PlaylistOptimizer(self.catalog, 4, 2.5, 2, 1.5)
        kwargs = dict(target_duration_minutes=20, selected_genres=[], curve_type="linear_ascent")
        self.assertEqual([track.id for track in first.generate_playlist(**kwargs).tracks],
                         [track.id for track in second.generate_playlist(**kwargs).tracks])

    def test_half_time_transition_delta(self):
        self.assertEqual(effective_bpm_delta(70, 140), 0)

    def test_invalid_weight_rejected(self):
        with self.assertRaises(ValueError):
            PlaylistOptimizer(self.catalog, float("nan"))
