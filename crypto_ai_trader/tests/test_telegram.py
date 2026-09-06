"""
Unit Tests for Telegram Bot Engine, Commands, Security & Alert Dispatcher.
"""

import asyncio
import unittest
from crypto_ai_trader.app.execution.paper_exchange import PaperExchangeAdapter
from crypto_ai_trader.app.execution.order_manager import OrderManager
from crypto_ai_trader.app.execution.types import ExecutionMode
from crypto_ai_trader.app.risk.manager import UnifiedRiskManager
from crypto_ai_trader.app.risk.circuit_breaker import CircuitBreaker
from crypto_ai_trader.app.risk.types import PortfolioState
from crypto_ai_trader.app.telegram.bot import TelegramBotEngine
from crypto_ai_trader.app.telegram.security import TelegramSecurityManager
from crypto_ai_trader.app.telegram.types import (
    TradeAlertPayload, TPHitAlertPayload, SLHitAlertPayload
)


class TestTelegramBot(unittest.IsolatedAsyncioTestCase):
    """Verifies Telegram command handlers, security gates, and alert dispatcher."""

    def setUp(self):
        self.exchange = PaperExchangeAdapter(initial_balance_usdt=10000.0)
        self.breaker = CircuitBreaker()
        self.risk_manager = UnifiedRiskManager(circuit_breaker=self.breaker)
        self.order_manager = OrderManager(
            exchange=self.exchange,
            risk_manager=self.risk_manager,
            mode=ExecutionMode.PAPER
        )
        self.portfolio = PortfolioState(
            total_equity=12500.0,
            available_cash=8500.0,
            peak_equity=12600.0,
            starting_equity_today=12000.0
        )
        self.admin_id = 99887766
        self.bot = TelegramBotEngine(
            order_manager=self.order_manager,
            portfolio=self.portfolio,
            admin_user_ids=[self.admin_id],
            rate_limit_per_minute=10
        )

    async def test_authorization_gate(self):
        """Unauthorized users must be blocked from sending bot commands."""
        resp = await self.bot.handle_message("/status", user_id=12345, username="intruder")
        self.assertIn("Access Denied", resp.text)

        # Admin user must be allowed
        resp_admin = await self.bot.handle_message("/status", user_id=self.admin_id, username="admin")
        self.assertIn("CRYPTO AI TRADER STATUS", resp_admin.text)

    async def test_rate_limiter(self):
        """Rapid commands must trigger rate limit warning."""
        sec = TelegramSecurityManager(admin_user_ids=[100], rate_limit_per_minute=3)
        self.assertTrue(sec.check_rate_limit(100))
        self.assertTrue(sec.check_rate_limit(100))
        self.assertTrue(sec.check_rate_limit(100))
        self.assertFalse(sec.check_rate_limit(100))

    async def test_command_status_and_balance(self):
        """Checks /status and /balance output contents."""
        resp_status = await self.bot.handle_message("/status", user_id=self.admin_id)
        self.assertIn("Status:", resp_status.text)
        self.assertIn("Active Positions:", resp_status.text)

        resp_balance = await self.bot.handle_message("/balance", user_id=self.admin_id)
        self.assertIn("$12,500.00", resp_balance.text)
        self.assertIn("Today's PnL:", resp_balance.text)

    async def test_command_positions_and_pnl(self):
        """Checks /positions and /pnl formatting."""
        resp_pos = await self.bot.handle_message("/positions", user_id=self.admin_id)
        self.assertIn("ACTIVE POSITIONS", resp_pos.text)

        resp_pnl = await self.bot.handle_message("/pnl", user_id=self.admin_id)
        self.assertIn("PERFORMANCE & PNL METRICS", resp_pnl.text)

    async def test_command_regime_and_help(self):
        """Checks /regime and /help."""
        resp_reg = await self.bot.handle_message("/regime", user_id=self.admin_id)
        self.assertIn("AI REGIME DETECTION ENGINE", resp_reg.text)

        resp_help = await self.bot.handle_message("/help", user_id=self.admin_id)
        self.assertIn("COMMAND REFERENCE", resp_help.text)

    async def test_pause_and_resume_with_2fa(self):
        """Pause is immediate, but resume requires 2FA token confirmation."""
        # 1. Pause
        resp_pause = await self.bot.handle_message("/pause", user_id=self.admin_id)
        self.assertIn("Trading PAUSED", resp_pause.text)
        self.assertEqual(self.bot.bot_state, "PAUSED")

        # 2. Resume without token -> generates prompt with 2FA token
        resp_res_prompt = await self.bot.handle_message("/resume", user_id=self.admin_id)
        self.assertIn("RESUME CONFIRMATION REQUIRED (2FA)", resp_res_prompt.text)
        self.assertEqual(self.bot.bot_state, "PAUSED")

        # Extract token from the prompt or generate through security
        # Let's test with wrong token first
        resp_wrong = await self.bot.handle_message("/resume 000000", user_id=self.admin_id)
        self.assertIn("Invalid or expired token", resp_wrong.text)
        self.assertEqual(self.bot.bot_state, "PAUSED")

        # Now generate valid token and confirm
        valid_token = self.bot.security.generate_confirmation_token("resume", self.admin_id)
        resp_res_ok = await self.bot.handle_message(f"/resume {valid_token}", user_id=self.admin_id)
        self.assertIn("Trading RESUMED", resp_res_ok.text)
        self.assertEqual(self.bot.bot_state, "RUNNING")

    async def test_emergency_kill_with_2fa(self):
        """Kill switch requires 2FA token and closes all open positions."""
        # Request kill without token -> prompt
        resp_kill_prompt = await self.bot.handle_message("/kill", user_id=self.admin_id)
        self.assertIn("EMERGENCY KILL SWITCH CONFIRMATION (2FA)", resp_kill_prompt.text)
        self.assertEqual(self.bot.bot_state, "RUNNING")

        # Provide valid token
        valid_token = self.bot.security.generate_confirmation_token("kill", self.admin_id)
        resp_kill_ok = await self.bot.handle_message(f"/kill {valid_token}", user_id=self.admin_id)
        self.assertIn("EMERGENCY KILL SWITCH COMPLETE", resp_kill_ok.text)
        self.assertEqual(self.bot.bot_state, "HALTED")

    async def test_alert_dispatcher(self):
        """Verifies real-time event dispatcher creates well-formed alerts."""
        # 1. Trade Opened
        trade_payload = TradeAlertPayload(
            symbol="BTC/USDT",
            side="LONG",
            size=0.15,
            entry_price=65800.0,
            stop_loss=64500.0,
            tp1=67200.0,
            tp2=69000.0,
            tp3=71500.0,
            leverage=3,
            strategy_name="TrendMomentumPro",
            ai_confidence=0.92
        )
        resp_trade = await self.bot.dispatch_trade_opened(trade_payload)
        self.assertIn("NEW TRADE OPENED", resp_trade.text)
        self.assertIn("BTC/USDT", resp_trade.text)

        # 2. TP Hit
        tp_payload = TPHitAlertPayload(
            symbol="BTC/USDT",
            tp_level=1,
            price=67200.0,
            realized_pnl=70.0,
            percentage_closed=33.0
        )
        resp_tp = await self.bot.dispatch_tp_hit(tp_payload)
        self.assertIn("TAKE PROFIT 1 HIT", resp_tp.text)

        # 3. SL Hit
        sl_payload = SLHitAlertPayload(
            symbol="ETH/USDT",
            exit_price=3400.0,
            realized_loss=-65.0,
            drawdown_pct=0.52
        )
        resp_sl = await self.bot.dispatch_sl_hit(sl_payload)
        self.assertIn("STOP LOSS TRIGGERED", resp_sl.text)

        # 4. Circuit breaker
        resp_cb = await self.bot.dispatch_circuit_breaker("Daily loss limit exceeded")
        self.assertIn("CIRCUIT BREAKER TRIPPED", resp_cb.text)

        # 5. Daily summary
        resp_sum = await self.bot.dispatch_daily_summary(
            date_str="2026-09-06",
            starting_equity=12000.0,
            ending_equity=12500.0,
            net_pnl=500.0,
            pnl_pct=4.17,
            trades_count=8,
            win_rate=75.0
        )
        self.assertIn("DAILY PERFORMANCE SUMMARY", resp_sum.text)

        self.assertEqual(len(self.bot.dispatched_alerts), 5)


if __name__ == "__main__":
    unittest.main()
