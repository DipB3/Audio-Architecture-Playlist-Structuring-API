import tempfile
import unittest
from unittest.mock import patch
from backend.app.storage.dynamodb_client import DynamoDBStorage, history_summary


class StorageTests(unittest.TestCase):
    def test_history_filters_before_limiting(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.dict("os.environ", {"LOCAL_DATA_DIR": directory}):
                with patch.object(DynamoDBStorage, "_init_client"):
                    storage = DynamoDBStorage()
            for index in range(3):
                storage.save_playlist({"playlist_id": f"pl_{index}", "user_id": "a",
                                       "metrics": {"overall_fit_score": .7}})
            storage.save_playlist({"playlist_id": "pl_other", "user_id": "b"})
            self.assertEqual(len(storage.list_recent_playlists("a", 2)), 2)
            self.assertEqual(storage.get_playlist("pl_other")["user_id"], "b")

    def test_cloud_history_summary_contract(self):
        summary = history_summary({"playlist_id": "pl_x", "metrics": {"overall_fit_score": .9}})
        self.assertEqual(summary["overall_fit_score"], .9)

    def test_cloud_write_does_not_claim_local_persistence(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.dict("os.environ", {"LOCAL_DATA_DIR": directory, "AWS_EXECUTION_ENV": "AWS_Lambda_python3.11"}):
                with patch.object(DynamoDBStorage, "_init_client"):
                    storage = DynamoDBStorage()
                self.assertFalse(storage.save_playlist({"playlist_id": "pl_x"}))
