"""Unit tests for AWS Lambda handler and API Gateway proxy routing."""
import unittest
import json
import os
import subprocess
import sys
from pathlib import Path
from backend.app.lambda_handler import handler

class TestLambdaHandler(unittest.TestCase):
    def test_health_endpoint(self):
        event = {
            "httpMethod": "GET",
            "path": "/health"
        }
        response = handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["status"], "healthy")
        self.assertIn("managed_services", body)
        self.assertGreaterEqual(len(body["managed_services"]), 4)

    def test_genres_endpoint(self):
        event = {
            "httpMethod": "GET",
            "path": "/genres"
        }
        response = handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertIn("genres", body)
        self.assertGreaterEqual(len(body["genres"]), 5)

    def test_presets_endpoint(self):
        event = {
            "httpMethod": "GET",
            "path": "/presets"
        }
        response = handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertIn("presets", body)
        self.assertGreaterEqual(len(body["presets"]), 5)

    def test_generate_playlist_and_export(self):
        gen_event = {
            "httpMethod": "POST",
            "path": "/playlists/generate",
            "body": json.dumps({
                "target_duration_minutes": 20,
                "selected_genres": ["Indie Pop", "Hip-Hop"],
                "curve_type": "pomodoro_peak",
                "name": "Integration Test Playlist"
            })
        }
        gen_res = handler(gen_event, None)
        self.assertEqual(gen_res["statusCode"], 200)
        gen_body = json.loads(gen_res["body"])
        self.assertTrue(gen_body["success"])
        playlist = gen_body["playlist"]
        pl_id = playlist["playlist_id"]

        # Test fetch by id
        fetch_event = {
            "httpMethod": "GET",
            "path": f"/playlists/{pl_id}"
        }
        fetch_res = handler(fetch_event, None)
        self.assertEqual(fetch_res["statusCode"], 200)

        # Test export
        export_event = {
            "httpMethod": "POST",
            "path": "/playlists/export",
            "body": json.dumps({
                "playlist_id": pl_id,
                "format": "m3u"
            })
        }
        exp_res = handler(export_event, None)
        self.assertEqual(exp_res["statusCode"], 200)
        exp_body = json.loads(exp_res["body"])
        self.assertIn("#EXTM3U", exp_body["content"])

        # A client-supplied playlist body must not replace the stored playlist.
        forged = dict(playlist, name="Forged", tracks=playlist["tracks"][:1])
        forged_res = handler({
            "httpMethod": "POST",
            "path": "/playlists/export",
            "body": json.dumps({"playlist_id": pl_id, "playlist": forged, "format": "m3u"}),
        }, None)
        self.assertEqual(forged_res["statusCode"], 200)
        forged_body = json.loads(forged_res["body"])
        self.assertIn("#PLAYLIST:Integration Test Playlist", forged_body["content"])
        self.assertEqual(forged_body["content"].count("#EXTINF"), playlist["track_count"])

    def test_export_requires_stored_playlist(self):
        cases = [
            ({"playlist": {"playlist_id": "pl_unsaved"}, "format": "m3u"}, 400),
            ({"playlist_id": "pl_doesnotexist000", "format": "csv"}, 404),
        ]
        for payload, status in cases:
            with self.subTest(payload=payload):
                response = handler({
                    "httpMethod": "POST",
                    "path": "/playlists/export",
                    "body": json.dumps(payload),
                }, None)
                self.assertEqual(response["statusCode"], status)

    def test_rejects_invalid_generation_parameters(self):
        cases = [
            {"energy_weight": float("nan")},
            {"harmonic_weight": float("inf")},
            {"beam_width": None},
            {"beam_width": 4.5},
            {"curve_type": []},
            {"user_id": None},
            {"min_bpm": 120, "max_bpm": 80},
            {"crossfade_seconds": 31},
            {"allow_repeats": "yes"},
            {"target_duration_minutes": 0},
            {"target_duration_minutes": 45, "selected_genres": ["Unknown Genre"]},
            {"target_duration_minutes": 45, "curve_type": "not-a-curve"},
            {"target_duration_minutes": 45, "curve_type": "custom", "custom_points": []},
            {
                "target_duration_minutes": 45,
                "energy_weight": -1,
                "tempo_weight": 0,
                "harmonic_weight": 0,
                "genre_weight": 0,
            },
        ]
        for payload in cases:
            with self.subTest(payload=payload):
                response = handler({
                    "httpMethod": "POST",
                    "path": "/playlists/generate",
                    "body": json.dumps(payload),
                }, None)
                self.assertEqual(response["statusCode"], 400)

    def test_rejects_unknown_export_format(self):
        response = handler({
            "httpMethod": "POST",
            "path": "/playlists/export",
            "body": json.dumps({"playlist": {}, "format": "xml"}),
        }, None)
        self.assertEqual(response["statusCode"], 400)

    def test_lambda_deployment_import_contract(self):
        repository_root = Path(__file__).resolve().parents[2]
        environment = dict(os.environ)
        environment["PYTHONPATH"] = str(repository_root / "backend")
        result = subprocess.run(
            [sys.executable, "-c", "from app.lambda_handler import handler; assert callable(handler)"],
            cwd=repository_root,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

if __name__ == "__main__":
    unittest.main()
