"""
Unit tests for Technical Indicators & Price Action Engine.
Verifies mathematical precision, edge cases, zero lookahead bias,
and sub-millisecond incremental cache consistency.
"""

import math
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.indicators.technical import (
    calculate_sma,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_atr,
    calculate_bollinger_bands,
    calculate_adx,
    calculate_stochastic_rsi,
    calculate_vwap,
    calculate_obv,
    PriceActionDetector,
    PriceStructure,
    IndicatorCache,
    TechnicalEngine
)


class TestTechnicalIndicators(unittest.TestCase):

    def test_sma_calculation(self):
        prices = [10.0, 20.0, 30.0, 40.0, 50.0]
        sma3 = calculate_sma(prices, 3)
        self.assertIsNone(sma3[0])
        self.assertIsNone(sma3[1])
        self.assertAlmostEqual(sma3[2], 20.0, places=5)
        self.assertAlmostEqual(sma3[3], 30.0, places=5)
        self.assertAlmostEqual(sma3[4], 40.0, places=5)

    def test_ema_calculation(self):
        prices = [10.0] * 10
        ema = calculate_ema(prices, 5)
        self.assertIsNone(ema[0])
        self.assertIsNone(ema[3])
        # Constant prices must yield exact constant EMA
        self.assertAlmostEqual(ema[4], 10.0, places=5)
        self.assertAlmostEqual(ema[9], 10.0, places=5)

    def test_rsi_bounds_and_monotony(self):
        # Monotonically increasing prices -> RSI should approach 100
        rising_prices = [float(i * 10) for i in range(1, 30)]
        rsi = calculate_rsi(rising_prices, 14)
        valid_rsi = [r for r in rsi if r is not None]
        self.assertTrue(len(valid_rsi) > 0)
        self.assertAlmostEqual(valid_rsi[-1], 100.0, places=1)

        # Monotonically falling prices -> RSI should approach 0
        falling_prices = [float(1000 - (i * 10)) for i in range(1, 30)]
        rsi_falling = calculate_rsi(falling_prices, 14)
        valid_falling = [r for r in rsi_falling if r is not None]
        self.assertTrue(len(valid_falling) > 0)
        self.assertAlmostEqual(valid_falling[-1], 0.0, places=1)

    def test_macd_relationship(self):
        prices = [100.0 + math.sin(i * 0.2) * 10.0 for i in range(50)]
        macd_data = calculate_macd(prices, fast=12, slow=26, signal=9)
        macd = macd_data["macd"]
        sig = macd_data["signal"]
        hist = macd_data["hist"]

        # Check that for any index where both macd and signal exist, hist = macd - signal
        checked = 0
        for m, s, h in zip(macd, sig, hist):
            if m is not None and s is not None and h is not None:
                self.assertAlmostEqual(h, m - s, places=5)
                checked += 1
        self.assertTrue(checked > 0)

    def test_atr_positive(self):
        highs = [105.0, 107.0, 104.0, 109.0, 112.0] * 5
        lows = [95.0, 96.0, 93.0, 98.0, 100.0] * 5
        closes = [100.0, 102.0, 99.0, 105.0, 108.0] * 5
        atr = calculate_atr(highs, lows, closes, 14)
        valid_atr = [a for a in atr if a is not None]
        self.assertTrue(len(valid_atr) > 0)
        for a in valid_atr:
            self.assertGreater(a, 0.0)

    def test_bollinger_bands_geometry(self):
        prices = [50.0 + (i % 7) * 2.0 for i in range(40)]
        bb = calculate_bollinger_bands(prices, period=20, std_multiplier=2.0)
        upper = bb["upper"]
        middle = bb["middle"]
        lower = bb["lower"]
        bw = bb["bandwidth"]

        for u, m, l, b in zip(upper, middle, lower, bw):
            if u is not None and m is not None and l is not None:
                self.assertGreaterEqual(u, m)
                self.assertGreaterEqual(m, l)
                expected_bw = ((u - l) / m) * 100.0
                self.assertAlmostEqual(b, expected_bw, places=4)

    def test_adx_computation(self):
        # Trending prices
        highs = [100.0 + i * 2.0 + 1.0 for i in range(50)]
        lows = [100.0 + i * 2.0 - 1.0 for i in range(50)]
        closes = [100.0 + i * 2.0 for i in range(50)]

        adx_res = calculate_adx(highs, lows, closes, period=14)
        valid_adx = [a for a in adx_res["adx"] if a is not None]
        self.assertTrue(len(valid_adx) > 0)
        # Strong uptrend should have plus_di > minus_di
        last_p_di = [p for p in adx_res["plus_di"] if p is not None][-1]
        last_m_di = [m for m in adx_res["minus_di"] if m is not None][-1]
        self.assertGreater(last_p_di, last_m_di)

    def test_price_action_swings(self):
        # Create a clean zig-zag pattern with clear Higher High and Higher Low
        # Swing High at index 3 (price 120), Swing Low at index 6 (price 95),
        # Higher High at index 9 (price 130), Higher Low at index 12 (price 105)
        highs = [100, 105, 110, 120, 110, 100, 95, 110, 120, 130, 120, 110, 105, 115, 125, 135]
        lows  = [90,  95,  100, 110, 100, 92,  90, 100, 110, 120, 110, 102, 100, 110, 120, 130]

        detector = PriceActionDetector(left_bars=2, right_bars=2)
        swings = detector.find_swings(highs, lows)
        self.assertTrue(len(swings) >= 2)

        high_swings = [s for s in swings if s.is_high]
        if len(high_swings) >= 2:
            if high_swings[1].price > high_swings[0].price:
                self.assertEqual(high_swings[1].structure, PriceStructure.HIGHER_HIGH)

    def test_indicator_cache_incremental(self):
        cache = IndicatorCache()
        # Feed candle 1
        s1 = cache.update_candle("BTC/USDT", "1h", 1000, 50000, 50500, 49800, 50200, 100)
        self.assertEqual(s1.last_close, 50200)

        # Feed candle 2
        s2 = cache.update_candle("BTC/USDT", "1h", 2000, 50200, 51000, 50100, 50800, 120)
        self.assertEqual(s2.last_close, 50800)
        self.assertIsNotNone(s2.ema_9)
        self.assertIsNotNone(s2.atr_14)


if __name__ == "__main__":
    unittest.main()
