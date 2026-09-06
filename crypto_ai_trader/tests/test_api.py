"""
Unit and Integration Tests for Phase 10: FastAPI / High-Performance Backend API.
Tests REST endpoints, authentication, rate limiting, bot controls, and WebSocket telemetry.
"""

import asyncio
import unittest
from typing import Any, Dict

from crypto_ai_trader.app.api.types import BotState, WebSocketMessage, WebSocketMessageType
from crypto_ai_trader.app.api.security import RateLimiter, SecurityValidator
from crypto_ai_trader.app.api.server import TradingBotAPIServer, WebSocketTelemetryHub
from crypto_ai_trader.app.execution.paper_exchange import PaperExchangeAdapter
from crypto_ai_trader.app.execution.order_manager import OrderManager
from crypto_ai_trader.app.execution.types import ExecutionMode, Order, OrderSide, OrderType
from crypto_ai_trader.app.risk.manager import UnifiedRiskManager
from crypto_ai_trader.app.risk.circuit_breaker import CircuitBreaker
from crypto_ai_trader.app.risk.types import PortfolioState


class MockWebSocketClient:
    """Mock WebSocket client for telemetry tests."""

    def __init__(self):
        self.sent_messages = []

    async def send_text(self, text: str) -> None:
        self.sent_messages.append(text)


class TestAPIServer(unittest.IsolatedAsyncioTestCase):
    """Test suite for REST endpoints and bot lifecycle."""

    async def asyncSetUp(self):
        self.exchange = PaperExchangeAdapter(initial_balance_usdt=10000.0)
        self.breaker = CircuitBreaker(consecutive_losses_threshold=3)
        self.risk_manager = UnifiedRiskManager(circuit_breaker=self.breaker)
        self.order_manager = OrderManager(
            exchange=self.exchange,
            risk_manager=self.risk_manager,
            mode=ExecutionMode.PAPER
        )
        self.portfolio = PortfolioState(
            total_equity=10000.0,
            available_cash=10000.0,
            peak_equity=10000.0,
            starting_equity_today=10000.0
        )
        self.auth_headers = {"x-api-key": "test_secret_api_key_123"}
        self.api = TradingBotAPIServer(
            order_manager=self.order_manager,
            portfolio=self.portfolio,
            api_key="test_secret_api_key_123",
            bearer_token="test_bearer_token_xyz",
            rate_limit_per_minute=10
        )

    async def test_get_status_endpoint(self):
        """GET /api/v1/status should return operational status report."""
        resp = await self.api.dispatch_request("GET", "/api/v1/status", headers=self.auth_headers)
        self.assertTrue(resp.success)
        self.assertEqual(resp.data["state"], BotState.RUNNING.value)
        self.assertEqual(resp.data["mode"], "PAPER")
        self.assertEqual(resp.data["version"], "1.0.0")
        self.assertFalse(resp.data["circuit_breaker_active"])

    async def test_get_balance_and_equity(self):
        """GET /api/v1/balance should report portfolio metrics and exchange holdings."""
        resp = await self.api.dispatch_request("GET", "/api/v1/balance", headers=self.auth_headers)
        self.assertTrue(resp.success)
        self.assertEqual(resp.data["total_equity"], 10000.0)
        self.assertIn("USDT", resp.data["exchange_balances"])
        self.assertEqual(resp.data["exchange_balances"]["USDT"], 10000.0)

    async def test_get_risk_metrics_and_var(self):
        """GET /api/v1/risk should compute 1-day VaR and circuit breaker state."""
        resp = await self.api.dispatch_request("GET", "/api/v1/risk", headers=self.auth_headers)
        self.assertTrue(resp.success)
        self.assertFalse(resp.data["circuit_breaker_active"])
        self.assertIn("value_at_risk_95", resp.data)
        self.assertIn("max_daily_loss_limit", resp.data)

    async def test_bot_pause_resume_lifecycle(self):
        """POST /api/v1/bot/pause and resume must transition bot states."""
        # Pause
        resp_pause = await self.api.dispatch_request("POST", "/api/v1/bot/pause", headers=self.auth_headers)
        self.assertTrue(resp_pause.success)
        self.assertEqual(self.api.state, BotState.PAUSED)

        # Verify status endpoint reflects pause
        resp_status = await self.api.dispatch_request("GET", "/api/v1/status", headers=self.auth_headers)
        self.assertEqual(resp_status.data["state"], "PAUSED")

        # Resume
        resp_resume = await self.api.dispatch_request("POST", "/api/v1/bot/resume", headers=self.auth_headers)
        self.assertTrue(resp_resume.success)
        self.assertEqual(self.api.state, BotState.RUNNING)

    async def test_bot_emergency_kill_switch_endpoint(self):
        """POST /api/v1/bot/kill-switch must panic close and halt bot."""
        # Create an open order first
        self.exchange.set_market_price("BTC/USDT", 60000.0)
        order = Order(
            symbol="BTC/USDT",
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            amount=0.05,
            price=59000.0
        )
        await self.exchange.create_order(order)
        open_orders = await self.exchange.fetch_open_orders()
        self.assertEqual(len(open_orders), 1)

        # Trigger Kill Switch
        resp_kill = await self.api.dispatch_request(
            "POST",
            "/api/v1/bot/kill-switch",
            headers=self.auth_headers,
            body={"reason": "Test Panic"}
        )
        self.assertTrue(resp_kill.success)
        self.assertEqual(resp_kill.data["status"], "PANIC_COMPLETED")
        self.assertEqual(self.api.state, BotState.HALTED)
        self.assertTrue(self.portfolio.is_trading_halted)

        # Verify open orders cancelled
        remaining_orders = await self.exchange.fetch_open_orders()
        self.assertEqual(len(remaining_orders), 0)

    async def test_security_authentication_gating(self):
        """Requests with missing credentials must be rejected when security enabled."""
        # No credentials -> Rejected
        resp_bad = await self.api.dispatch_request("GET", "/api/v1/status")
        # In setup, api_key was provided so security is enabled
        self.assertFalse(resp_bad.success)
        self.assertEqual(resp_bad.error, "Unauthorized")

        # Valid X-API-KEY -> Accepted
        resp_api_key = await self.api.dispatch_request(
            "GET",
            "/api/v1/status",
            headers={"x-api-key": "test_secret_api_key_123"}
        )
        self.assertTrue(resp_api_key.success)

        # Valid Bearer Token -> Accepted
        resp_bearer = await self.api.dispatch_request(
            "GET",
            "/api/v1/status",
            headers={"Authorization": "Bearer test_bearer_token_xyz"}
        )
        self.assertTrue(resp_bearer.success)

    async def test_sliding_window_rate_limiter(self):
        """Exceeding requests per minute must return rate limit exceeded error."""
        limiter = RateLimiter(max_requests=3, window_seconds=10.0)
        client = "192.168.1.100"

        # 3 requests allowed
        for _ in range(3):
            allowed, _, _ = limiter.is_allowed(client)
            self.assertTrue(allowed)

        # 4th request blocked
        allowed, rem, reset = limiter.is_allowed(client)
        self.assertFalse(allowed)
        self.assertEqual(rem, 0)
        self.assertGreater(reset, 0.0)

    async def test_websocket_telemetry_broadcast(self):
        """WebSocket Hub must broadcast events to all active mock clients."""
        hub = WebSocketTelemetryHub()
        client1 = MockWebSocketClient()
        client2 = MockWebSocketClient()

        await hub.connect(client1)
        await hub.connect(client2)

        msg = WebSocketMessage(
            type=WebSocketMessageType.TICKER,
            payload={"symbol": "BTC/USDT", "price": 60500.0}
        )
        sent = await hub.broadcast(msg)
        self.assertEqual(sent, 2)
        self.assertEqual(len(client1.sent_messages), 1)
        self.assertIn("60500.0", client1.sent_messages[0])

        # Disconnect client1
        hub.disconnect(client1)
        sent_after = await hub.broadcast(msg)
        self.assertEqual(sent_after, 1)


if __name__ == "__main__":
    unittest.main()
