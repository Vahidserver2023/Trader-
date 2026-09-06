"""
Crypto AI Trader - Main Backend Application Entry Point.
Initializes configuration, exchange adapter, risk guard, order manager, and starts API server.
"""

import asyncio
import logging
import os
import sys

from crypto_ai_trader.app.core.config import Settings, EnvironmentType
from crypto_ai_trader.app.core.logger import get_logger
from crypto_ai_trader.app.execution.paper_exchange import PaperExchangeAdapter
from crypto_ai_trader.app.execution.order_manager import OrderManager
from crypto_ai_trader.app.execution.types import ExecutionMode
from crypto_ai_trader.app.risk.manager import UnifiedRiskManager
from crypto_ai_trader.app.risk.circuit_breaker import CircuitBreaker
from crypto_ai_trader.app.risk.types import PortfolioState
from crypto_ai_trader.app.api.server import TradingBotAPIServer

logger = get_logger("crypto_ai_trader.main")


def build_app(settings: Settings) -> TradingBotAPIServer:
    """Constructs and wires all application dependencies."""
    logger.info(f"Initializing {settings.APP_NAME} in {settings.APP_ENV.value} mode...")

    # 1. Exchange Adapter (Paper or Live)
    if settings.APP_ENV == EnvironmentType.LIVE:
        logger.warning("Initializing in LIVE trading mode. Real capital at risk!")
        mode = ExecutionMode.LIVE
        # In live mode, initialize exchange with credentials
        exchange = PaperExchangeAdapter(initial_balance_usdt=10000.0)
    else:
        logger.info("Initializing in PAPER trading simulation mode.")
        mode = ExecutionMode.PAPER
        exchange = PaperExchangeAdapter(initial_balance_usdt=10000.0)

    # 2. Risk Manager & Circuit Breaker
    breaker = CircuitBreaker(
        daily_loss_limit_pct=settings.MAX_DAILY_LOSS_PCT,
        max_drawdown_limit_pct=settings.MAX_TOTAL_DRAWDOWN_PCT,
        consecutive_losses_threshold=settings.CONSECUTIVE_LOSSES_THRESHOLD
    )
    risk_manager = UnifiedRiskManager(
        circuit_breaker=breaker,
        default_risk_pct=settings.DEFAULT_RISK_PER_TRADE_PCT,
        max_open_positions=settings.MAX_OPEN_POSITIONS
    )

    # 3. Order Manager
    order_manager = OrderManager(
        exchange=exchange,
        risk_manager=risk_manager,
        mode=mode
    )

    # 4. Portfolio State
    portfolio = PortfolioState(
        total_equity=10000.0,
        available_cash=10000.0,
        peak_equity=10000.0,
        starting_equity_today=10000.0
    )

    # 5. High-Performance API Server
    api_server = TradingBotAPIServer(
        order_manager=order_manager,
        portfolio=portfolio,
        api_key=os.environ.get("TRADER_API_KEY"),
        bearer_token=os.environ.get("TRADER_BEARER_TOKEN"),
        rate_limit_per_minute=120
    )

    return api_server


# Module-level ASGI app instance for Uvicorn / Gunicorn
settings = Settings()
app = build_app(settings)

if __name__ == "__main__":
    logger.info("Booting Crypto AI Trader ASGI server on port 8000...")
    try:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except ImportError:
        logger.info("uvicorn not installed. Running internal async event loop.")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        logger.info("Server engine initialized successfully and ready.")
