"""
FastAPI & High-Performance API Server Module.
Provides RESTful endpoints, live WebSocket telemetry streaming, and security guards.
"""

from crypto_ai_trader.app.api.types import (
    APIResponse,
    BotControlRequest,
    BotState,
    BotStatusReport,
    WebSocketMessage,
    WebSocketMessageType
)
from crypto_ai_trader.app.api.security import RateLimiter, SecurityValidator
from crypto_ai_trader.app.api.server import TradingBotAPIServer, WebSocketTelemetryHub

__all__ = [
    "APIResponse",
    "BotControlRequest",
    "BotState",
    "BotStatusReport",
    "WebSocketMessage",
    "WebSocketMessageType",
    "RateLimiter",
    "SecurityValidator",
    "TradingBotAPIServer",
    "WebSocketTelemetryHub"
]
