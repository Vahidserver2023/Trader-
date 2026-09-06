"""
Institutional Unit and Integration Tests for Phase 5: Risk & Position Management.
Tests sizing math, circuit breakers, portfolio allocation limits, trailing stops, and VaR.
"""

from __future__ import annotations

import unittest
import time
import sys
import os
from typing import Dict

# Ensure repository root and app directory are in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BASE_DIR)
for p in [BASE_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from crypto_ai_trader.app.strategies.base import TradeSignal, SignalAction
    from crypto_ai_trader.app.risk.types import (
        ExitReason,
        PortfolioState,
        Position,
        PositionSide,
        PositionStatus,
        RiskCheckResult,
        TrailingAction
    )
    from crypto_ai_trader.app.risk.sizing import PositionSizer
    from crypto_ai_trader.app.risk.circuit_breaker import CircuitBreaker
    from crypto_ai_trader.app.risk.portfolio import PortfolioRiskManager
    from crypto_ai_trader.app.risk.trailing import TrailingStopManager
    from crypto_ai_trader.app.risk.manager import UnifiedRiskManager
except ImportError:
    from app.strategies.base import TradeSignal, SignalAction  # type: ignore
    from app.risk.types import (  # type: ignore
        ExitReason,
        PortfolioState,
        Position,
        PositionSide,
        PositionStatus,
        RiskCheckResult,
        TrailingAction
    )
    from app.risk.sizing import PositionSizer  # type: ignore
    from app.risk.circuit_breaker import CircuitBreaker  # type: ignore
    from app.risk.portfolio import PortfolioRiskManager  # type: ignore
    from app.risk.trailing import TrailingStopManager  # type: ignore
    from app.risk.manager import UnifiedRiskManager  # type: ignore


class TestRiskAndPositionManagement(unittest.TestCase):
    """Test suite covering all institutional risk management constraints."""

    def setUp(self):
        self.equity = 10000.0  # $10,000 USD portfolio
        self.portfolio = PortfolioState(
            total_equity=self.equity,
            available_cash=self.equity,
            peak_equity=self.equity,
            starting_equity_today=self.equity,
            open_positions={}
        )
        self.sizer = PositionSizer(default_risk_pct=1.5, max_risk_pct=2.5, max_position_equity_pct=20.0)
        self.breaker = CircuitBreaker(max_daily_loss_pct=3.0, max_drawdown_pct=6.0, consecutive_losses_threshold=3)
        self.port_mgr = PortfolioRiskManager(max_open_positions=5, max_aggregate_risk_pct=6.0, max_asset_exposure_pct=30.0)
        self.trailing_mgr = TrailingStopManager(breakeven_r_multiple=1.0, tp1_scale_out_fraction=0.5, atr_trail_multiplier=2.0)
        self.unified_mgr = UnifiedRiskManager(
            position_sizer=self.sizer,
            circuit_breaker=self.breaker,
            portfolio_manager=self.port_mgr,
            trailing_manager=self.trailing_mgr
        )

    def test_01_fixed_fractional_position_sizing(self):
        """Test that position size correctly risks exactly 1.5% ($150) of $10,000 equity without hitting cap."""
        entry = 100.0
        stop_loss = 90.0  # $10 stop distance (10% stop distance)
        
        units, notional, risk_usd, metrics = self.sizer.calculate_position_size(
            equity=self.equity,
            entry_price=entry,
            stop_loss=stop_loss
        )

        # Expected risk = 1.5% of $10,000 = $150
        # Expected units = 150 / 10 = 15.0 units
        # Notional = 15 * 100 = $1,500 (15% <= 20% cap)
        self.assertAlmostEqual(risk_usd, 150.0, places=1)
        self.assertAlmostEqual(units, 15.0, places=3)
        self.assertAlmostEqual(notional, 1500.0, places=1)

    def test_02_atr_volatility_dampening(self):
        """Test that elevated ATR dampens position size to prevent volatility blowout."""
        entry = 100.0
        stop = 95.0
        # Normal sizing without volatility shock
        units_normal, _, risk_normal, _ = self.sizer.calculate_position_size(
            equity=self.equity,
            entry_price=entry,
            stop_loss=stop,
            current_atr=2.0,
            median_atr=2.0
        )

        # Volatility shock (current ATR is 3.5x median ATR)
        units_volatile, _, risk_volatile, _ = self.sizer.calculate_position_size(
            equity=self.equity,
            entry_price=entry,
            stop_loss=stop,
            current_atr=7.0,
            median_atr=2.0
        )

        self.assertLess(units_volatile, units_normal)
        self.assertLess(risk_volatile, risk_normal)

    def test_03_max_position_capital_cap(self):
        """Test that single position cannot exceed max_position_equity_pct (20% = $2,000)."""
        entry = 100.0
        stop = 99.8  # Very tight stop ($0.20 stop distance), which would normally produce huge notional
        
        units, notional, risk_usd, metrics = self.sizer.calculate_position_size(
            equity=self.equity,
            entry_price=entry,
            stop_loss=stop
        )

        max_cap = self.equity * 0.20  # $2,000
        self.assertLessEqual(notional, max_cap + 1.0)
        self.assertLessEqual(units, 20.0)

    def test_04_half_kelly_criterion_bounds(self):
        """Test conservative Half-Kelly calculation and safe boundary enforcement."""
        # 55% win rate, 2:1 win/loss payoff
        risk_fraction = self.sizer.calculate_half_kelly_risk_fraction(win_rate=0.55, payoff_ratio=2.0)
        
        # Kelly = (0.55 * 2 - 0.45) / 2 = (1.10 - 0.45) / 2 = 0.325
        # Half-Kelly = 0.1625 (16.25%), but should be capped at max_risk_pct (2.5%)
        self.assertLessEqual(risk_fraction, 0.025)
        self.assertGreaterEqual(risk_fraction, 0.005)

    def test_05_circuit_breaker_daily_loss_halt(self):
        """Test circuit breaker halts trading when daily loss >= 3.0%."""
        # Simulate portfolio starting today at $10,000, now dropped to $9,680 (3.2% loss)
        self.portfolio.total_equity = 9680.0
        self.portfolio.starting_equity_today = 10000.0

        is_halted, reason, mult = self.breaker.check_portfolio(self.portfolio)
        self.assertTrue(is_halted)
        self.assertIn("Daily loss limit breached", reason)

        # Signal evaluation should be rejected
        dummy_signal = TradeSignal(
            signal_id="sig_test_1",
            strategy_id="strategy_a",
            symbol="BTC/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=60000.0,
            stop_loss=58000.0,
            tp1=63000.0,
            risk_reward_ratio=1.5
        )
        res = self.unified_mgr.evaluate_signal(dummy_signal, self.portfolio)
        self.assertFalse(res.is_approved)
        self.assertIn("Circuit Breaker Active", res.rejection_reason)

    def test_06_circuit_breaker_max_drawdown_halt(self):
        """Test circuit breaker halts trading when total drawdown >= 6.0%."""
        self.portfolio.peak_equity = 10000.0
        self.portfolio.total_equity = 9350.0  # 6.5% drawdown from peak
        self.portfolio.starting_equity_today = 9350.0  # Daily loss is 0% to isolate drawdown check

        is_halted, reason, _ = self.breaker.check_portfolio(self.portfolio)
        self.assertTrue(is_halted)
        self.assertIn("Maximum drawdown threshold reached", reason)

    def test_07_consecutive_loss_risk_halving(self):
        """Test that 3 consecutive losses automatically cuts position risk by 50%."""
        self.portfolio.consecutive_losses = 3
        is_halted, reason, mult = self.breaker.check_portfolio(self.portfolio)
        
        self.assertFalse(is_halted)
        self.assertEqual(mult, 0.5)  # 50% risk dampener

        dummy_signal = TradeSignal(
            signal_id="sig_test_2",
            strategy_id="strategy_a",
            symbol="BTC/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=50000.0,
            stop_loss=48000.0,
            tp1=53000.0,
            risk_reward_ratio=1.5
        )
        res = self.unified_mgr.evaluate_signal(dummy_signal, self.portfolio)
        self.assertTrue(res.is_approved)
        # Normal risk would be $150 (1.5%), with 0.5 multiplier it should be ~$75
        self.assertAlmostEqual(res.risk_usd, 75.0, delta=1.0)
        self.assertTrue(any("consecutive loss" in w for w in res.warnings))

    def test_08_portfolio_max_concurrent_positions(self):
        """Test rejection when portfolio already holds 5 maximum concurrent positions."""
        for i in range(5):
            sym = f"SYM{i}/USDT"
            self.portfolio.open_positions[sym] = Position(
                position_id=f"pos_{i}",
                symbol=sym,
                side=PositionSide.LONG,
                strategy_id="strategy_a",
                entry_price=100.0,
                size=5.0,
                initial_size=5.0,
                initial_stop_loss=90.0,
                current_stop_loss=90.0,
                tp1=115.0,
                risk_usd=50.0
            )

        new_signal = TradeSignal(
            signal_id="sig_test_6th",
            strategy_id="strategy_b",
            symbol="ETH/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=3000.0,
            stop_loss=2900.0,
            tp1=3150.0,
            risk_reward_ratio=1.5
        )
        res = self.unified_mgr.evaluate_signal(new_signal, self.portfolio)
        self.assertFalse(res.is_approved)
        self.assertIn("Maximum concurrent positions reached", res.rejection_reason)

    def test_09_portfolio_aggregate_heat_limit(self):
        """Test rejection when proposed trade would push total portfolio risk beyond 6% ($600)."""
        # Place 3 positions already risking $500 total (5.0% of $10k)
        self.portfolio.open_positions["BTC/USDT"] = Position(
            position_id="p1", symbol="BTC/USDT", side=PositionSide.LONG, strategy_id="s1",
            entry_price=60000.0, size=0.25, initial_size=0.25, initial_stop_loss=58000.0, current_stop_loss=58000.0,
            tp1=63000.0, risk_usd=500.0
        )

        # Proposing new trade risking $150 would push total risk to $650 (6.5% > 6.0%)
        new_signal = TradeSignal(
            signal_id="sig_overflow",
            strategy_id="strategy_c",
            symbol="SOL/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=150.0,
            stop_loss=140.0,
            tp1=165.0,
            risk_reward_ratio=1.5
        )
        res = self.unified_mgr.evaluate_signal(new_signal, self.portfolio)
        self.assertFalse(res.is_approved)
        self.assertIn("Aggregate portfolio risk limit exceeded", res.rejection_reason)

    def test_10_portfolio_asset_concentration(self):
        """Test that single asset notional exposure cannot exceed 30% ($3,000)."""
        # Existing BTC position of $2,500 notional
        self.portfolio.open_positions["BTC/USDT"] = Position(
            position_id="p_btc", symbol="BTC/USDT", side=PositionSide.LONG, strategy_id="s1",
            entry_price=50000.0, size=0.05, initial_size=0.05, initial_stop_loss=49000.0, current_stop_loss=49000.0,
            tp1=52000.0, risk_usd=50.0
        )

        is_allowed, reason = self.port_mgr.evaluate_new_position(
            symbol="BTC/USDT",
            side=PositionSide.LONG,
            proposed_notional=1000.0, # 2500 + 1000 = 3500 (35% > 30%)
            proposed_risk_usd=30.0,
            portfolio=self.portfolio
        )
        self.assertFalse(is_allowed)

    def test_11_breakeven_stop_ratchet(self):
        """Test that reaching 1.0R profit triggers moving Stop Loss to entry price."""
        pos = Position(
            position_id="pos_be",
            symbol="BTC/USDT",
            side=PositionSide.LONG,
            strategy_id="strategy_a",
            entry_price=60000.0,
            size=0.1,
            initial_size=0.1,
            initial_stop_loss=58000.0,  # 1R = $2,000
            current_stop_loss=58000.0,
            tp1=63000.0,
            risk_usd=200.0
        )

        # Price rises to $62,050 (1.025R gain)
        actions = self.trailing_mgr.evaluate_position(pos, current_price=62050.0)
        
        self.assertTrue(pos.breakeven_activated)
        self.assertGreater(pos.current_stop_loss, 60000.0)
        self.assertTrue(any(a.action_type == "UPDATE_STOP" for a in actions))

    def test_12_partial_scale_out_tp1(self):
        """Test that hitting TP1 generates a 50% scale-out action and locks breakeven."""
        pos = Position(
            position_id="pos_tp1",
            symbol="SOL/USDT",
            side=PositionSide.LONG,
            strategy_id="strategy_c",
            entry_price=100.0,
            size=10.0,
            initial_size=10.0,
            initial_stop_loss=90.0,
            current_stop_loss=90.0,
            tp1=115.0,  # 1.5R target
            risk_usd=100.0
        )

        # Price touches $115.50 (TP1 reached)
        actions = self.trailing_mgr.evaluate_position(pos, current_price=115.50, candle_high=115.50)

        self.assertTrue(pos.tp1_hit)
        scale_actions = [a for a in actions if a.action_type == "SCALE_OUT"]
        self.assertEqual(len(scale_actions), 1)
        self.assertEqual(scale_actions[0].scale_out_fraction, 0.5)

    def test_13_chandelier_atr_trailing_stop(self):
        """Test that ATR chandelier stop continuously ratchets upward as price creates new highs."""
        pos = Position(
            position_id="pos_atr",
            symbol="ETH/USDT",
            side=PositionSide.LONG,
            strategy_id="strategy_a",
            entry_price=2000.0,
            size=1.0,
            initial_size=1.0,
            initial_stop_loss=1900.0,
            current_stop_loss=2000.0, # Breakeven active
            tp1=2150.0,
            risk_usd=100.0,
            breakeven_activated=True
        )

        # Price rallies to $2400 with ATR = 50.
        # Chandelier Trail = 2400 - (2 * 50) = $2300.
        actions = self.trailing_mgr.evaluate_position(
            pos,
            current_price=2400.0,
            current_atr=50.0,
            candle_high=2400.0
        )

        self.assertAlmostEqual(pos.current_stop_loss, 2300.0, places=1)
        self.assertGreater(pos.current_stop_loss, 2000.0)

    def test_14_var_and_expected_shortfall_calculation(self):
        """Test parametric Value at Risk and Expected Shortfall calculation."""
        # Hold $4,000 of open exposure
        self.portfolio.open_positions["BTC/USDT"] = Position(
            position_id="pos_var", symbol="BTC/USDT", side=PositionSide.LONG, strategy_id="s1",
            entry_price=40000.0, size=0.1, initial_size=0.1, initial_stop_loss=38000.0, current_stop_loss=38000.0,
            tp1=43000.0, risk_usd=200.0
        )

        var_metrics = self.unified_mgr.calculate_parametric_var(self.portfolio, confidence_level=0.95)
        
        self.assertGreater(var_metrics["var_usd"], 0.0)
        self.assertGreater(var_metrics["cvar_usd"], var_metrics["var_usd"])
        self.assertEqual(var_metrics["total_exposure_usd"], 4000.0)


if __name__ == "__main__":
    unittest.main()
