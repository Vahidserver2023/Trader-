"""
API Layer Data Types and Models.
Defines request/response schemas, bot control states, and WebSocket messages.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
import time


class BotState(str, Enum):
    """Operational states of the trading bot."""
    STOPPED = "STOPPED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    HALTED = "HALTED"  # Circuit breaker tripped


class WebSocketMessageType(str, Enum):
    """Types of streaming WebSocket messages."""
    TICKER = "TICKER"
    ORDER_UPDATE = "ORDER_UPDATE"
    POSITION_UPDATE = "POSITION_UPDATE"
    SIGNAL_UPDATE = "SIGNAL_UPDATE"
    RISK_ALERT = "RISK_ALERT"
    PING = "PING"
    PONG = "PONG"


@dataclass
class APIResponse:
    """Standardized JSON API response structure."""
    success: bool
    data: Optional[Any] = None
    message: str = ""
    error: Optional[str] = None
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "data": self.data,
            "message": self.message,
            "error": self.error,
            "timestamp": self.timestamp
        }


@dataclass
class BotControlRequest:
    """Payload for bot control commands."""
    action: str
    reason: Optional[str] = None
    force: bool = False


@dataclass
class BotStatusReport:
    """Full operational status payload."""
    state: BotState
    mode: str
    uptime_seconds: float
    active_positions_count: int
    open_orders_count: int
    circuit_breaker_active: bool
    current_regime: str
    last_signal_time: Optional[float] = None
    version: str = "1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "state": self.state.value,
            "mode": self.mode,
            "uptime_seconds": round(self.uptime_seconds, 1),
            "active_positions_count": self.active_positions_count,
            "open_orders_count": self.open_orders_count,
            "circuit_breaker_active": self.circuit_breaker_active,
            "current_regime": self.current_regime,
            "last_signal_time": self.last_signal_time,
            "version": self.version
        }


@dataclass
class WebSocketMessage:
    """WebSocket message payload."""
    type: WebSocketMessageType
    payload: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "payload": self.payload,
            "timestamp": self.timestamp
        }
