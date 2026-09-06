"""
Comprehensive Unit & Integration Test Suite for Phase 6: Order Execution & Exchange Layer.
Tests Paper Trading Engine, CCXT Adapter Interfaces, Bracket Orders, Risk Gating, and Panic Kill Switch.
"""

import asyncio
import os
import sys
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from crypto_ai_trader.app.execution.types import (
        BracketOrderSpec,
        ExecutionMode,
        ExecutionReport,
        Order,
        OrderFee,
        OrderSide,
        OrderStatus,
        OrderType,
        TickerData
    )
    from crypto_ai_trader.app.execution.base_exchange import BaseExchangeAdapter
    from crypto_ai_trader.app.execution.paper_exchange import PaperExchangeAdapter
    from crypto_ai_trader.app.execution.order_manager import OrderManager
    from crypto_ai_trader.app.risk.manager import UnifiedRiskManager
    from crypto_ai_trader.app.risk.sizing import PositionSizer
    from crypto_ai_trader.app.risk.circuit_breaker import CircuitBreaker
    from crypto_ai_trader.app.risk.types import (
        ExitReason,
        PortfolioState,
        Position,
        PositionSide,
        PositionStatus
    )
    from crypto_ai_trader.app.strategies.base import SignalAction, TradeSignal
except ImportError:
    from app.execution.types import (  # type: ignore
        BracketOrderSpec,
        ExecutionMode,
        ExecutionReport,
        Order,
        OrderFee,
        OrderSide,
        OrderStatus,
        OrderType,
        TickerData
    )
    from app.execution.base_exchange import BaseExchangeAdapter  # type: ignore
    from app.execution.paper_exchange import PaperExchangeAdapter  # type: ignore
    from app.execution.order_manager import OrderManager  # type: ignore
    from app.risk.manager import UnifiedRiskManager  # type: ignore
    from app.risk.sizing import PositionSizer  # type: ignore
    from app.risk.circuit_breaker import CircuitBreaker  # type: ignore
    from app.risk.types import (  # type: ignore
        ExitReason,
        PortfolioState,
        Position,
        PositionSide,
        PositionStatus
    )
    from app.strategies.base import SignalAction, TradeSignal  # type: ignore


class TestOrderExecution(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.paper_exchange = PaperExchangeAdapter(
            initial_balance_usdt=10000.0,
            maker_fee_pct=0.02,
            taker_fee_pct=0.05,
            simulated_slippage_pct=0.01,
            simulated_latency_ms=1.0
        )
        self.circuit_breaker = CircuitBreaker(consecutive_losses_threshold=3)
        self.risk_manager = UnifiedRiskManager(circuit_breaker=self.circuit_breaker)
        self.order_manager = OrderManager(
            exchange=self.paper_exchange,
            risk_manager=self.risk_manager,
            mode=ExecutionMode.PAPER
        )

    async def test_paper_market_order_fill_and_slippage(self):
        """Verify market order fills immediately with realistic slippage and fee deduction."""
        self.paper_exchange.set_market_price("BTC/USDT", 60000.0)
        initial_usdt = (await self.paper_exchange.fetch_balance())["USDT"]

        order = Order(
            symbol="BTC/USDT",
            side=OrderSide.BUY,
            order_type=OrderType.MARKET,
            amount=0.1
        )
        executed = await self.paper_exchange.create_order(order)

        self.assertEqual(executed.status, OrderStatus.FILLED)
        self.assertEqual(executed.filled, 0.1)
        self.assertGreater(executed.average_price, 60000.0)  # BUY slippage
        self.assertGreater(executed.fee.cost, 0.0)

        # Check balance updated
        bal = await self.paper_exchange.fetch_balance()
        self.assertLess(bal["USDT"], initial_usdt)
        self.assertAlmostEqual(bal.get("BTC", 0.0), 0.1, places=4)

    async def test_paper_limit_order_queue_and_fill(self):
        """Ensure limit orders stay open until market crosses limit price."""
        self.paper_exchange.set_market_price("BTC/USDT", 60000.0)

        limit_order = Order(
            symbol="BTC/USDT",
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            amount=0.05,
            price=59000.0
        )
        placed = await self.paper_exchange.create_order(limit_order)
        self.assertEqual(placed.status, OrderStatus.SUBMITTED)

        # Open orders should contain this
        open_orders = await self.paper_exchange.fetch_open_orders("BTC/USDT")
        self.assertEqual(len(open_orders), 1)

        # Move price down to trigger fill
        self.paper_exchange.set_market_price("BTC/USDT", 58900.0)
        fetched = await self.paper_exchange.fetch_order(placed.order_id, "BTC/USDT")
        self.assertEqual(fetched.status, OrderStatus.FILLED)
        self.assertEqual(fetched.filled, 0.05)

    async def test_risk_gate_blocks_order_when_circuit_breaker_active(self):
        """Order manager must veto execution if risk circuit breaker is tripped."""
        portfolio = PortfolioState(
            total_equity=10000.0,
            available_cash=10000.0,
            peak_equity=10000.0,
            starting_equity_today=10000.0
        )
        self.circuit_breaker.trip(portfolio, "3 consecutive losses")
        signal = TradeSignal(
            signal_id="sig_test_1",
            strategy_id="trend_following",
            symbol="BTC/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=60000.0,
            stop_loss=59000.0,
            tp1=62000.0,
            confidence=0.85,
            risk_reward_ratio=2.0
        )

        report = await self.order_manager.execute_trade_signal(signal, 60000.0, portfolio)

        self.assertFalse(report.success)
        self.assertIn("vetoed", report.message.lower())
        self.assertTrue(report.risk_checked)
        self.assertIn("circuit breaker", report.risk_reason.lower())

    async def test_successful_signal_execution_and_bracket_orders(self):
        """Executing a valid signal must fill entry order and automatically deploy SL & TP1 brackets."""
        self.paper_exchange.set_market_price("BTC/USDT", 60000.0)
        signal = TradeSignal(
            signal_id="sig_test_2",
            strategy_id="trend_following",
            symbol="BTC/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=60000.0,
            stop_loss=58500.0,
            tp1=63000.0,
            tp2=65000.0,
            confidence=0.80,
            risk_reward_ratio=2.0
        )
        portfolio = PortfolioState(
            total_equity=10000.0,
            available_cash=10000.0,
            peak_equity=10000.0,
            starting_equity_today=10000.0
        )

        report = await self.order_manager.execute_trade_signal(signal, 60000.0, portfolio)

        self.assertTrue(report.success)
        self.assertEqual(report.order.status, OrderStatus.FILLED)
        self.assertGreater(len(self.order_manager.managed_positions), 0)

        # Check bracket orders deployed
        pos_id = list(self.order_manager.managed_positions.keys())[0]
        brackets = self.order_manager.bracket_orders.get(pos_id, [])
        self.assertGreaterEqual(len(brackets), 1)

        # There must be a stop loss order
        sl_orders = [o for o in brackets if o.order_type == OrderType.STOP_LOSS]
        self.assertEqual(len(sl_orders), 1)
        self.assertEqual(sl_orders[0].stop_price, 58500.0)

    async def test_panic_kill_switch_closes_all_and_trips_breaker(self):
        """Emergency panic close must cancel all orders, close positions, and trip breaker."""
        self.paper_exchange.set_market_price("BTC/USDT", 60000.0)
        signal = TradeSignal(
            signal_id="sig_test_3",
            strategy_id="trend_following",
            symbol="BTC/USDT",
            timeframe="1h",
            action=SignalAction.BUY,
            entry_price=60000.0,
            stop_loss=58500.0,
            tp1=63000.0,
            confidence=0.80,
            risk_reward_ratio=2.0
        )
        portfolio = PortfolioState(
            total_equity=10000.0,
            available_cash=10000.0,
            peak_equity=10000.0,
            starting_equity_today=10000.0
        )
        await self.order_manager.execute_trade_signal(signal, 60000.0, portfolio)

        self.assertFalse(portfolio.is_trading_halted)

        # Trigger emergency panic close
        panic_res = await self.order_manager.panic_close_all(portfolio)

        self.assertEqual(panic_res["status"], "PANIC_COMPLETED")
        self.assertTrue(portfolio.is_trading_halted)
        self.assertGreaterEqual(panic_res["closed_positions"], 1)

        # Check positions closed in manager
        for pos in self.order_manager.managed_positions.values():
            self.assertEqual(pos.status, PositionStatus.CLOSED)

    async def test_anti_duplicate_safe_query_retry(self):
        """Exchange adapter should not create duplicate order if client_order_id exists."""
        order1 = Order(
            symbol="BTC/USDT",
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            amount=0.01,
            price=55000.0,
            client_order_id="idempotent_test_123"
        )
        await self.paper_exchange.create_order(order1)

        # Query before retry
        existing = await self.paper_exchange.safe_query_before_retry("idempotent_test_123", "BTC/USDT")
        self.assertIsNotNone(existing)
        self.assertEqual(existing.client_order_id, "idempotent_test_123")


if __name__ == "__main__":
    unittest.main()
