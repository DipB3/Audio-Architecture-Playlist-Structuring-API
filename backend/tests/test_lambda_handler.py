"""Unit tests for AWS Lambda handler and API Gateway proxy routing."""
import unittest
import json
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

if __name__ == "__main__":
    unittest.main()
