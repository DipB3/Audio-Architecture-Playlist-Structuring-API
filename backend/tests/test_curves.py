"""Unit tests for mathematical energy curve engine."""
import unittest
from backend.app.engine.curves import (
    get_curve_energy,
    clamp,
    EnergyCurveType,
    CurvePoint,
    sample_curve_trajectory
)

class TestEnergyCurves(unittest.TestCase):
    def test_clamping(self):
        self.assertAlmostEqual(clamp(1.5), 0.95)
        self.assertAlmostEqual(clamp(-0.2), 0.05)
        self.assertAlmostEqual(clamp(0.5), 0.5)

    def test_linear_ascent(self):
        e_start = get_curve_energy(EnergyCurveType.LINEAR_ASCENT.value, 0.0)
        e_mid = get_curve_energy(EnergyCurveType.LINEAR_ASCENT.value, 0.5)
        e_end = get_curve_energy(EnergyCurveType.LINEAR_ASCENT.value, 1.0)
        self.assertTrue(e_start < e_mid < e_end)
        self.assertAlmostEqual(e_start, 0.20, places=2)
        self.assertAlmostEqual(e_end, 0.88, places=2)

    def test_linear_descent(self):
        e_start = get_curve_energy(EnergyCurveType.LINEAR_DESCENT.value, 0.0)
        e_mid = get_curve_energy(EnergyCurveType.LINEAR_DESCENT.value, 0.5)
        e_end = get_curve_energy(EnergyCurveType.LINEAR_DESCENT.value, 1.0)
        self.assertTrue(e_start > e_mid > e_end)
        self.assertAlmostEqual(e_start, 0.88, places=2)
        self.assertAlmostEqual(e_end, 0.20, places=2)

    def test_pomodoro_peak(self):
        # Warmup at t=0.0
        e_warmup = get_curve_energy(EnergyCurveType.POMODORO_PEAK.value, 0.0)
        # Deep focus peak at t=0.5
        e_peak = get_curve_energy(EnergyCurveType.POMODORO_PEAK.value, 0.5)
        # Cooldown resolution at t=1.0
        e_cooldown = get_curve_energy(EnergyCurveType.POMODORO_PEAK.value, 1.0)

        self.assertTrue(e_peak > e_warmup)
        self.assertTrue(e_peak > e_cooldown)
        self.assertGreaterEqual(e_peak, 0.70)
        self.assertLessEqual(e_cooldown, 0.35)

    def test_custom_curve_interpolation(self):
        pts = [
            CurvePoint(time_fraction=0.0, target_energy=0.2),
            CurvePoint(time_fraction=0.5, target_energy=0.9),
            CurvePoint(time_fraction=1.0, target_energy=0.3)
        ]
        val_0 = get_curve_energy(EnergyCurveType.CUSTOM.value, 0.0, pts)
        val_mid = get_curve_energy(EnergyCurveType.CUSTOM.value, 0.5, pts)
        val_quart = get_curve_energy(EnergyCurveType.CUSTOM.value, 0.25, pts)

        self.assertAlmostEqual(val_0, 0.2, places=2)
        self.assertAlmostEqual(val_mid, 0.9, places=2)
        self.assertAlmostEqual(val_quart, 0.55, places=2)

    def test_trajectory_sampling(self):
        samples = sample_curve_trajectory(EnergyCurveType.POMODORO_PEAK.value, num_samples=10)
        self.assertEqual(len(samples), 10)
        self.assertAlmostEqual(samples[0]["time_fraction"], 0.0)
        self.assertAlmostEqual(samples[-1]["time_fraction"], 1.0)

if __name__ == "__main__":
    unittest.main()
