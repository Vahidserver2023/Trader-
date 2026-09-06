"""
Unit tests for Market Regime Classifier & Strategy Gating.
Validates multi-regime categorization, threshold triggers,
and strict prevention of forbidden strategies.
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.regime import (
    MarketRegime,
    MarketRegimeClassifier,
    StrategyGatingMatrix
)


class TestMarketRegime(unittest.TestCase):

    def setUp(self):
        self.classifier = MarketRegimeClassifier(
            adx_trend_threshold=25.0,
            adx_strong_threshold=35.0,
            high_volatility_atr_ratio=1.65,
            low_volatility_atr_ratio=0.70,
            bb_squeeze_bandwidth=4.0
        )

    def test_strong_bull_classification(self):
        # Bullish stack: Close (65000) > EMA50 (60000) > EMA200 (55000)
        # Strong directional ADX (42) and bullish RSI (68)
        report = self.classifier.classify(
            close=65000.0,
            ema_50=60000.0,
            ema_200=55000.0,
            adx=42.0,
            atr=1000.0,
            baseline_atr=900.0,
            rsi=68.0,
            volume=500.0,
            baseline_volume=400.0,
            bb_bandwidth=7.5
        )
        self.assertEqual(report.regime, MarketRegime.STRONG_BULL)
        self.assertGreaterEqual(report.confidence, 0.75)
        self.assertIn("strategy_a", report.compatible_strategies)
        self.assertIn("strategy_e", report.deactivated_strategies)

    def test_strong_bear_classification(self):
        # Bearish stack: Close (45000) < EMA50 (52000) < EMA200 (58000)
        # Strong ADX (38) and bearish RSI (32)
        report = self.classifier.classify(
            close=45000.0,
            ema_50=52000.0,
            ema_200=58000.0,
            adx=38.0,
            atr=1200.0,
            baseline_atr=1100.0,
            rsi=32.0,
            volume=600.0,
            baseline_volume=450.0,
            bb_bandwidth=8.0
        )
        self.assertEqual(report.regime, MarketRegime.STRONG_BEAR)
        self.assertIn("strategy_a", report.compatible_strategies)
        self.assertIn("strategy_e", report.deactivated_strategies)

    def test_high_volatility_override(self):
        # Volatility spike: ATR ratio 2.1x > 1.65x threshold
        report = self.classifier.classify(
            close=62000.0,
            ema_50=60000.0,
            ema_200=58000.0,
            adx=30.0,
            atr=2100.0,
            baseline_atr=1000.0,  # ATR ratio 2.1
            rsi=55.0,
            bb_bandwidth=14.0
        )
        self.assertEqual(report.regime, MarketRegime.HIGH_VOLATILITY)
        self.assertIn("strategy_f", report.compatible_strategies)  # Volatility Breakout
        self.assertIn("strategy_e", report.deactivated_strategies)

    def test_low_volatility_squeeze(self):
        # Squeeze: ATR ratio 0.60x <= 0.70x and Bandwidth 3.2% <= 4.0%
        report = self.classifier.classify(
            close=50000.0,
            ema_50=50100.0,
            ema_200=49900.0,
            adx=14.0,
            atr=300.0,
            baseline_atr=500.0,  # ATR ratio 0.60
            rsi=51.0,
            bb_bandwidth=3.2
        )
        self.assertEqual(report.regime, MarketRegime.LOW_VOLATILITY)
        self.assertIn("strategy_c", report.compatible_strategies)  # Squeeze Breakout prep

    def test_sideways_classification(self):
        # Mixed EMAs, low ADX (16.0)
        report = self.classifier.classify(
            close=50000.0,
            ema_50=49800.0,
            ema_200=50200.0,
            adx=16.0,
            atr=800.0,
            baseline_atr=850.0,
            rsi=49.0,
            bb_bandwidth=5.0
        )
        self.assertEqual(report.regime, MarketRegime.SIDEWAYS)
        # Mean Reversion active in Sideways
        self.assertIn("strategy_e", report.compatible_strategies)
        # Trend Following blocked in Sideways
        self.assertIn("strategy_a", report.deactivated_strategies)

    def test_strategy_gating_completeness(self):
        for regime in MarketRegime:
            allowed = StrategyGatingMatrix.get_allowed_strategies(regime)
            forbidden = StrategyGatingMatrix.get_forbidden_strategies(regime)
            self.assertTrue(len(allowed) > 0)
            # Allowed and forbidden sets must have no intersection
            overlap = set(allowed).intersection(set(forbidden))
            self.assertEqual(len(overlap), 0, f"Overlap in {regime}: {overlap}")


if __name__ == "__main__":
    unittest.main()
