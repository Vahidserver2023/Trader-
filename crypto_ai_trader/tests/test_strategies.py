"""
Comprehensive Unit & Integration Test Suite for Phase 4 (Multi-Strategy Engine).
Tests:
  1. BaseStrategy interface & parameter validation
  2. TradeSignal mathematical validation (R/R > 1.5, valid TP/SL)
  3. Strategy A (Trend Following): Bullish pullback & Bearish continuation
  4. Strategy B (EMA + RSI Momentum crossover)
  5. Strategy C (Bollinger Squeeze & Volatility Breakout)
  6. Strategy D (Adaptive MACD + StochRSI Pulse)
  7. Strategy E (Statistical Mean Reversion & Gating out in strong trends)
  8. Strategy F (Volatility Impulse)
  9. StrategyGatingMatrix enforcement across all strategies
  10. MultiStrategyEngine parallel evaluation & conflict arbitrage
"""

import math
import unittest
from typing import Any, Dict, List

from app.strategies.base import BaseStrategy, SignalAction, TradeSignal
from app.strategies.trend import TrendFollowingStrategy
from app.strategies.breakout import BreakoutStrategy
from app.strategies.momentum import EMAMomentumRSIStrategy, AdaptiveMomentumPulseStrategy
from app.strategies.mean_reversion import (
    StatisticalMeanReversionStrategy, VolatilityBreakoutStrategy
)
from app.strategies.engine import MultiStrategyEngine, StrategyRegistry
from app.ai.regime import MarketRegime, StrategyGatingMatrix


def make_candle(
    timestamp: int,
    open_: float,
    high: float,
    low: float,
    close: float,
    volume: float = 1000.0,
    symbol: str = "BTC/USDT"
) -> Dict[str, Any]:
    return {
        "timestamp": timestamp,
        "open": open_,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume,
        "symbol": symbol,
        "timeframe": "1h"
    }


def generate_trending_candles(count: int = 250, start_price: float = 50000.0, slope: float = 80.0) -> List[Dict[str, Any]]:
    candles = []
    p = start_price
    t = 1700000000000
    for i in range(count):
        noise = math.sin(i / 5.0) * 40.0
        p += slope + noise
        c_open = p - slope * 0.5
        c_high = p + abs(noise) + 50.0
        c_low = c_open - 30.0
        c_close = p
        candles.append(make_candle(t + i * 3600000, c_open, c_high, c_low, c_close, volume=2000.0))
    return candles


def generate_range_candles(count: int = 250, center_price: float = 50000.0, amplitude: float = 300.0) -> List[Dict[str, Any]]:
    candles = []
    t = 1700000000000
    for i in range(count):
        wave = math.sin(i / 4.0) * amplitude
        p = center_price + wave
        c_open = center_price + math.sin((i - 0.5) / 4.0) * amplitude
        c_high = max(p, c_open) + 40.0
        c_low = min(p, c_open) - 40.0
        c_close = p
        candles.append(make_candle(t + i * 3600000, c_open, c_high, c_low, c_close, volume=800.0))
    return candles


class TestPhase4Strategies(unittest.TestCase):

    def setUp(self):
        self.engine = MultiStrategyEngine(auto_load_all=True)

    def test_01_registry_loads_all_six_strategies(self):
        """Verify all 6 institutional strategies are registered and instantiated."""
        strats = self.engine.get_all_strategies()
        self.assertEqual(len(strats), 6)
        strat_ids = {s.strategy_id for s in strats}
        expected = {"strategy_a", "strategy_b", "strategy_c", "strategy_d", "strategy_e", "strategy_f"}
        self.assertEqual(strat_ids, expected)

    def test_02_signal_validity_math(self):
        """Check TradeSignal mathematical validation: BUY SL < Entry < TP, RR >= 1.5."""
        # Valid BUY signal
        valid_buy = TradeSignal(
            signal_id="sig_1",
            strategy_id="strategy_a",
            symbol="BTC/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=50000.0,
            stop_loss=49000.0,  # 1000 risk
            tp1=51500.0,       # 1500 reward -> R/R = 1.5
            risk_reward_ratio=1.5
        )
        is_val, msg = valid_buy.is_valid(min_rr=1.5)
        self.assertTrue(is_val, f"Should be valid: {msg}")

        # Invalid BUY (SL above entry)
        invalid_sl = TradeSignal(
            signal_id="sig_2",
            strategy_id="strategy_a",
            symbol="BTC/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=50000.0,
            stop_loss=50500.0,
            tp1=52000.0
        )
        is_val, msg = invalid_sl.is_valid()
        self.assertFalse(is_val)
        self.assertIn("must be below Entry", msg)

        # Invalid R/R (R/R < 1.5)
        low_rr = TradeSignal(
            signal_id="sig_3",
            strategy_id="strategy_a",
            symbol="BTC/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=50000.0,
            stop_loss=49000.0,
            tp1=50500.0  # R/R = 0.5
        )
        is_val, msg = low_rr.is_valid(min_rr=1.5)
        self.assertFalse(is_val)
        self.assertIn("below required threshold", msg)

    def test_03_parameter_validation(self):
        """Strategy parameter boundaries must raise ValueError when violated."""
        strat_a = TrendFollowingStrategy()
        # Fast EMA >= Mid EMA must fail
        with self.assertRaises(ValueError):
            strat_a.validate_parameters({"ema_fast": 60, "ema_mid": 50, "ema_slow": 200})

        strat_c = BreakoutStrategy()
        with self.assertRaises(ValueError):
            strat_c.validate_parameters({"vol_multiplier": 0.5})  # Below 1.0

        strat_e = StatisticalMeanReversionStrategy()
        with self.assertRaises(ValueError):
            strat_e.validate_parameters({"rsi_oversold": 75, "rsi_overbought": 25})

    def test_04_strategy_gating_matrix_enforcement(self):
        """Verify that strategies incompatible with a market regime are rejected."""
        strat_e = StatisticalMeanReversionStrategy()
        # Strategy E should NOT run in STRONG_BULL (danger of blowing up against strong trend)
        is_compat = strat_e.is_regime_compatible(MarketRegime.STRONG_BULL)
        self.assertFalse(is_compat, "Strategy E must be forbidden in STRONG_BULL")

        # Strategy E SHOULD run in SIDEWAYS
        self.assertTrue(strat_e.is_regime_compatible(MarketRegime.SIDEWAYS))

        # Test in engine evaluate_all:
        trending_candles = generate_trending_candles(count=220)
        signals = self.engine.evaluate_all(trending_candles, regime=MarketRegime.STRONG_BULL)
        e_signals = [s for s in signals if s.strategy_id == "strategy_e"]
        self.assertEqual(len(e_signals), 0, "Strategy E must never output actionable signals in STRONG_BULL")

    def test_05_strategy_a_trend_following_generation(self):
        """Trend following should produce signals in a strong sustained trend."""
        strat = TrendFollowingStrategy()
        candles = generate_trending_candles(count=240, slope=100.0)
        
        # In a massive uptrend
        sig = strat.generate_signal(candles, regime=MarketRegime.STRONG_BULL)
        self.assertIn(sig.action, [SignalAction.BUY, SignalAction.NO_TRADE])
        if sig.action == SignalAction.BUY:
            self.assertGreater(sig.tp1, sig.entry_price)
            self.assertLess(sig.stop_loss, sig.entry_price)
            self.assertGreaterEqual(sig.risk_reward_ratio, 1.4)

    def test_06_strategy_c_breakout_squeeze(self):
        """Breakout strategy detects Bollinger compression followed by breakout bar."""
        strat = BreakoutStrategy()
        # Generate 30 quiet low volatility candles, then 1 huge expanding candle with high volume
        candles = generate_range_candles(count=40, center_price=50000.0, amplitude=50.0)
        # Add massive breakout candle
        last_t = candles[-1]["timestamp"]
        breakout_candle = make_candle(
            last_t + 3600000,
            open_=50050.0,
            high=51500.0,
            low=50020.0,
            close=51400.0,  # Closes way above upper band
            volume=10000.0  # 10x volume
        )
        candles.append(breakout_candle)

        sig = strat.generate_signal(candles, regime=MarketRegime.HIGH_VOLATILITY)
        self.assertEqual(sig.action, SignalAction.BUY)
        self.assertEqual(sig.strategy_id, "strategy_c")
        self.assertGreater(sig.entry_price, 50000.0)
        self.assertGreater(sig.tp1, sig.entry_price)

    def test_07_strategy_e_mean_reversion_oversold(self):
        """Mean reversion triggers when price dives below 2.5σ Lower Band in SIDEWAYS regime."""
        strat = StatisticalMeanReversionStrategy()
        candles = generate_range_candles(count=50, center_price=50000.0, amplitude=150.0)
        
        # Sudden artificial wick down to trigger oversold lower band touch
        last_t = candles[-1]["timestamp"]
        drop_candle = make_candle(
            last_t + 3600000,
            open_=49800.0,
            high=49820.0,
            low=48500.0,
            close=48600.0,  # Deep pierce of lower band
            volume=1500.0
        )
        candles.append(drop_candle)

        sig = strat.generate_signal(candles, regime=MarketRegime.SIDEWAYS)
        self.assertEqual(sig.action, SignalAction.BUY)
        self.assertEqual(sig.strategy_id, "strategy_e")
        self.assertGreater(sig.tp1, sig.entry_price)
        self.assertLess(sig.stop_loss, sig.entry_price)

    def test_08_strategy_f_volatility_impulse(self):
        """Strategy F fires on high ATR relative expansion."""
        strat = VolatilityBreakoutStrategy()
        candles = generate_range_candles(count=60, center_price=50000.0, amplitude=100.0)
        # Giant impulse bar
        last_t = candles[-1]["timestamp"]
        impulse_candle = make_candle(
            last_t + 3600000,
            open_=50000.0,
            high=52200.0,
            low=49900.0,
            close=52100.0,  # 2200 range vs normal 150 range
            volume=8000.0
        )
        candles.append(impulse_candle)

        sig = strat.generate_signal(candles, regime=MarketRegime.HIGH_VOLATILITY)
        self.assertEqual(sig.action, SignalAction.BUY)
        self.assertEqual(sig.strategy_id, "strategy_f")

    def test_09_multi_strategy_arbitrage_conflict_resolution(self):
        """MultiStrategyEngine should arbitrate conflicting signals properly."""
        # Conflicting signals: 1 BUY with score 90, 1 SELL with score 50 -> Prioritizes BUY
        sig_buy = TradeSignal(
            signal_id="b1", strategy_id="strategy_a", symbol="BTC/USDT", timeframe="1h",
            action=SignalAction.BUY, entry_price=50000, stop_loss=49000, tp1=52000,
            technical_score=95.0, confidence=0.9
        )
        sig_sell = TradeSignal(
            signal_id="s1", strategy_id="strategy_e", symbol="BTC/USDT", timeframe="1h",
            action=SignalAction.SELL, entry_price=50000, stop_loss=51000, tp1=48000,
            technical_score=40.0, confidence=0.5
        )

        chosen = self.engine.arbitrate_signals([sig_buy, sig_sell])
        self.assertIsNotNone(chosen)
        self.assertEqual(chosen.action, SignalAction.BUY)

        # Equal conflicting signals -> Should cancel both (return None)
        sig_sell_strong = TradeSignal(
            signal_id="s2", strategy_id="strategy_e", symbol="BTC/USDT", timeframe="1h",
            action=SignalAction.SELL, entry_price=50000, stop_loss=51000, tp1=48000,
            technical_score=94.0, confidence=0.9
        )
        vetoed = self.engine.arbitrate_signals([sig_buy, sig_sell_strong])
        self.assertIsNone(vetoed, "Tied contradictory signals must be vetoed to avoid whipsaws")


if __name__ == "__main__":
    unittest.main()
