"""Unit tests for harmonic mixing and Camelot Wheel calculations."""
import unittest
from backend.app.engine.harmonic import (
    parse_camelot,
    calculate_camelot_distance,
    evaluate_harmonic_transition
)

class TestHarmonicMixing(unittest.TestCase):
    def test_parse_camelot(self):
        h, m = parse_camelot("8A")
        self.assertEqual(h, 8)
        self.assertEqual(m, "A")

        h2, m2 = parse_camelot("12B")
        self.assertEqual(h2, 12)
        self.assertEqual(m2, "B")

    def test_circular_distance(self):
        # 8 to 9 is 1 hour
        self.assertEqual(calculate_camelot_distance("8A", "9A"), 1)
        # 12 to 1 is 1 hour (circular wrap-around)
        self.assertEqual(calculate_camelot_distance("12B", "1B"), 1)
        # 1 to 12 is 1 hour
        self.assertEqual(calculate_camelot_distance("1A", "12A"), 1)
        # 6 to 12 is 6 hours
        self.assertEqual(calculate_camelot_distance("6A", "12A"), 6)

    def test_exact_match_compatibility(self):
        is_comp, dist, score = evaluate_harmonic_transition("8A", "8A")
        self.assertTrue(is_comp)
        self.assertEqual(dist, 0)
        self.assertEqual(score, 1.0)

    def test_relative_major_minor(self):
        is_comp, dist, score = evaluate_harmonic_transition("8A", "8B")
        self.assertTrue(is_comp)
        self.assertEqual(dist, 0)
        self.assertGreaterEqual(score, 0.90)

    def test_adjacent_hour(self):
        is_comp, dist, score = evaluate_harmonic_transition("8A", "9A")
        self.assertTrue(is_comp)
        self.assertEqual(dist, 1)
        self.assertGreaterEqual(score, 0.80)

    def test_distant_transition(self):
        is_comp, dist, score = evaluate_harmonic_transition("1A", "7A")
        self.assertFalse(is_comp)
        self.assertEqual(dist, 6)
        self.assertLess(score, 0.5)

if __name__ == "__main__":
    unittest.main()
