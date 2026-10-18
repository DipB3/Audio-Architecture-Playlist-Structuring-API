"""Custom catalog persistence and API contract tests."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend.app import lambda_handler
from backend.app.storage.custom_tracks import CustomTrackStorage


def call(method, path, payload=None):
    event = {"httpMethod": method, "path": path}
    if payload is not None:
        event["body"] = json.dumps(payload)
    response = lambda_handler.handler(event)
    return response["statusCode"], json.loads(response["body"])


class CustomTracksTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.storage = CustomTrackStorage(local_dir=self.temp.name)
        self.patcher = patch.object(lambda_handler, "storage_custom", self.storage)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()
        self.temp.cleanup()

    def test_create_list_generate_delete(self):
        payload = {"title": "Own Song", "artist": "Demo Artist", "genre": "My Genre",
                   "duration_seconds": 203, "bpm": 112, "energy": .67,
                   "camelot_code": "8B", "musical_key": "C Major"}
        status, body = call("POST", "/tracks/custom", payload)
        self.assertEqual(status, 201)
        track_id = body["track"]["id"]
        self.assertTrue(Path(self.temp.name, "custom_tracks", track_id + ".json").exists())
        status, body = call("GET", "/tracks/custom")
        self.assertEqual(status, 200)
        self.assertEqual([track_id], [track["id"] for track in body["tracks"]])
        status, body = call("GET", "/genres")
        self.assertIn("My Genre", [item["name"] for item in body["genres"]])
        status, body = call("POST", "/playlists/generate", {
            "target_duration_minutes": 15, "selected_genres": ["My Genre"], "allow_repeats": True
        })
        self.assertEqual(status, 200, body)
        self.assertTrue(all(track["id"] == track_id for track in body["playlist"]["tracks"]))
        status, body = call("DELETE", f"/tracks/custom/{track_id}")
        self.assertEqual(status, 200)
        status, body = call("GET", "/tracks/custom")
        self.assertEqual(body["tracks"], [])
        status, _ = call("DELETE", f"/tracks/custom/{track_id}")
        self.assertEqual(status, 404)

    def test_rejects_invalid_metadata_and_unsafe_delete(self):
        good = {"title": "X", "artist": "Y", "genre": "Z", "duration_seconds": 200,
                "bpm": 120, "energy": .6}
        for bad in ({"energy": 2}, {"energy": float("nan")}, {"bpm": 0},
                    {"duration_seconds": 30.5}, {"title": ""}, {"title": "line\nbreak"},
                    {"camelot_code": "99X"}):
            with self.subTest(bad=bad):
                status, _ = call("POST", "/tracks/custom", {**good, **bad})
                self.assertEqual(status, 400)
        status, _ = call("DELETE", "/tracks/custom/../../bad")
        self.assertEqual(status, 400)

    def test_catalog_has_multiple_demo_scenarios(self):
        status, body = call("GET", "/tracks")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(body["total"], 100)
        self.assertGreaterEqual(len({item["genre"] for item in body["tracks"]}), 7)

    def test_distinct_demo_playlists_are_feasible(self):
        from backend.app.engine.optimizer import PlaylistOptimizer
        catalog = lambda_handler.load_catalog()
        cases = (
            (45, "pomodoro_peak", ["Contemporary Classical Piano", "Ambient", "Neo-Soul"]),
            (60, "wave_interval", ["Deep House", "Synthwave", "Indie Pop"]),
            (30, "linear_descent", ["Ambient", "Contemporary Classical Piano", "Neo-Soul"]),
            (45, "steady_flow", ["Hip-Hop", "Neo-Soul", "Indie Pop"]),
        )
        for duration, curve, genres in cases:
            with self.subTest(curve=curve):
                playlist = PlaylistOptimizer(catalog).generate_playlist(
                    target_duration_minutes=duration, selected_genres=genres, curve_type=curve)
                self.assertGreater(playlist.track_count, 5)
                self.assertLess(abs(playlist.actual_duration_seconds - duration * 60), 150)


if __name__ == "__main__":
    unittest.main()
