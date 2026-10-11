"""Unit tests for playlist optimization engine."""
import unittest
import json
from pathlib import Path
from backend.app.engine.models import Track, EnergyCurveType
from backend.app.engine.optimizer import PlaylistOptimizer

class TestOptimizer(unittest.TestCase):
    def setUp(self):
        catalog_path = Path(__file__).resolve().parent.parent / "app" / "data" / "track_catalog.json"
        with open(catalog_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
            self.catalog = [Track.from_dict(t) for t in raw]

    def test_playlist_generation_duration_and_structure(self):
        optimizer = PlaylistOptimizer(self.catalog)
        target_minutes = 20.0
        genres = ["Contemporary Classical Piano", "Indie Pop", "Hip-Hop"]

        playlist = optimizer.generate_playlist(
            target_duration_minutes=target_minutes,
            selected_genres=genres,
            curve_type=EnergyCurveType.POMODORO_PEAK.value
        )

        self.assertIsNotNone(playlist.playlist_id)
        self.assertGreater(playlist.track_count, 2)
        self.assertEqual(len(playlist.tracks), playlist.track_count)
        self.assertEqual(len(playlist.energy_trajectory), playlist.track_count)

        # Duration within reasonable target window (target 20m = 1200s)
        # Should be within +/- 3 minutes
        target_sec = target_minutes * 60
        self.assertLess(abs(playlist.actual_duration_seconds - target_sec), 180)

        # Metrics check
        self.assertGreaterEqual(playlist.metrics.overall_fit_score, 0.5)
        self.assertGreaterEqual(playlist.metrics.duration_accuracy_percent, 80.0)

    def test_multi_genre_cohesion(self):
        optimizer = PlaylistOptimizer(self.catalog)
        genres = ["Contemporary Classical Piano", "Ambient", "Indie Pop"]

        playlist = optimizer.generate_playlist(
            target_duration_minutes=30.0,
            selected_genres=genres,
            curve_type=EnergyCurveType.LINEAR_ASCENT.value
        )

        # Confirm multiple genres were actually utilized
        self.assertGreaterEqual(len(playlist.genres_used), 2)

        # Check transition list
        self.assertEqual(len(playlist.transitions), len(playlist.tracks) - 1)
        for tr in playlist.transitions:
            self.assertGreater(tr.transition_score, 0.0)

if __name__ == "__main__":
    unittest.main()
