"""
Unit tests for Phase 13: Termux Optimizer and Mobile Profile
"""

import os
import unittest
from crypto_ai_trader.app.core.termux_optimizer import TermuxOptimizer, TermuxSystemProfile


class TestTermuxOptimizer(unittest.TestCase):

    def setUp(self):
        self.optimizer = TermuxOptimizer(enable_low_memory_profile=True)

    def test_apply_optimizations(self):
        profile = self.optimizer.apply_optimizations()
        self.assertIsInstance(profile, TermuxSystemProfile)
        self.assertEqual(profile.gc_threshold, (400, 8, 8))
        self.assertTrue(profile.low_memory_mode)

    def test_battery_adaptive_polling(self):
        normal_poll = self.optimizer.get_recommended_poll_interval(battery_level_pct=85.0)
        low_battery_poll = self.optimizer.get_recommended_poll_interval(battery_level_pct=15.0)
        self.assertEqual(normal_poll, 1.0)
        self.assertEqual(low_battery_poll, 3.0)

    def test_termux_detection_flags(self):
        # Even on CI or desktop, detector methods return boolean safely
        is_android = self.optimizer._detect_android()
        is_termux = self.optimizer._detect_termux()
        self.assertIsInstance(is_android, bool)
        self.assertIsInstance(is_termux, bool)


if __name__ == "__main__":
    unittest.main()
