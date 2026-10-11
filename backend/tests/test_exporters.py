"""Unit tests for M3U, JSON, and CSV exporters."""
import unittest
import json
from pathlib import Path
from backend.app.engine.models import Track, EnergyCurveType
from backend.app.engine.optimizer import PlaylistOptimizer
from backend.app.export.exporters import export_to_m3u, export_to_json, export_to_csv

class TestExporters(unittest.TestCase):
    def setUp(self):
        catalog_path = Path(__file__).resolve().parent.parent / "app" / "data" / "track_catalog.json"
        with open(catalog_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
            catalog = [Track.from_dict(t) for t in raw]
        optimizer = PlaylistOptimizer(catalog)
        self.playlist = optimizer.generate_playlist(
            target_duration_minutes=15.0,
            selected_genres=["Contemporary Classical Piano", "Hip-Hop"],
            curve_type=EnergyCurveType.POMODORO_PEAK.value
        )

    def test_m3u_export(self):
        m3u_text = export_to_m3u(self.playlist)
        self.assertTrue(m3u_text.startswith("#EXTM3U"))
        self.assertIn("#EXTINF:", m3u_text)
        self.assertIn("#EXT-X-BPM:", m3u_text)
        self.assertIn("#EXT-X-KEY:", m3u_text)
        self.assertIn("#EXT-X-ENERGY:", m3u_text)

    def test_json_export(self):
        json_text = export_to_json(self.playlist)
        data = json.loads(json_text)
        self.assertEqual(data["playlist_id"], self.playlist.playlist_id)
        self.assertIn("tracks", data)
        self.assertIn("metrics", data)

    def test_csv_export(self):
        csv_text = export_to_csv(self.playlist)
        lines = csv_text.strip().split("\n")
        self.assertGreater(len(lines), 2)
        # Check header
        self.assertIn("Position,Track ID,Title,Artist,Genre", lines[0])

if __name__ == "__main__":
    unittest.main()
