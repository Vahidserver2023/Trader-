"""
Order Execution and Exchange Layer Data Types.
Defines Order types, lifecycle states, execution modes, fill reports, and bracket specifications.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP_LOSS = "STOP_LOSS"
    STOP_LOSS_LIMIT = "STOP_LOSS_LIMIT"
    TAKE_PROFIT = "TAKE_PROFIT"
    TAKE_PROFIT_LIMIT = "TAKE_PROFIT_LIMIT"


class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELED = "CANCELED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class TimeInForce(str, Enum):
    GTC = "GTC"          # Good Till Canceled
    IOC = "IOC"          # Immediate Or Cancel
    FOK = "FOK"          # Fill Or Kill
    POST_ONLY = "POST_ONLY"


class ExecutionMode(str, Enum):
    PAPER = "PAPER"
    LIVE = "LIVE"


@dataclass
class OrderFee:
    cost: float = 0.0
    currency: str = "USDT"
    rate: float = 0.0


@dataclass
class Order:
    """
    Standardized trading order data model across all exchange adapters and paper engine.
    """
    symbol: str
    side: OrderSide
    order_type: OrderType
    amount: float                       # Base currency quantity
    price: Optional[float] = None       # Limit or reference price
    stop_price: Optional[float] = None  # Trigger price for stop/TP orders
    order_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    client_order_id: str = field(default_factory=lambda: f"ord_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}")
    exchange_order_id: Optional[str] = None
    time_in_force: TimeInForce = TimeInForce.GTC
    status: OrderStatus = OrderStatus.PENDING
    filled: float = 0.0
    remaining: float = 0.0
    average_price: float = 0.0
    fee: OrderFee = field(default_factory=OrderFee)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    strategy_id: Optional[str] = None
    parent_position_id: Optional[str] = None
    is_reduce_only: bool = False
    error_message: Optional[str] = None

    def __post_init__(self):
        if self.remaining == 0.0 and self.filled == 0.0:
            self.remaining = self.amount

    @property
    def is_active(self) -> bool:
        return self.status in (OrderStatus.PENDING, OrderStatus.SUBMITTED, OrderStatus.PARTIALLY_FILLED)

    @property
    def is_complete(self) -> bool:
        return self.status in (OrderStatus.FILLED, OrderStatus.CANCELED, OrderStatus.REJECTED, OrderStatus.EXPIRED)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "order_id": self.order_id,
            "client_order_id": self.client_order_id,
            "exchange_order_id": self.exchange_order_id,
            "symbol": self.symbol,
            "side": self.side.value,
            "order_type": self.order_type.value,
            "amount": self.amount,
            "price": self.price,
            "stop_price": self.stop_price,
            "status": self.status.value,
            "filled": self.filled,
            "remaining": self.remaining,
            "average_price": self.average_price,
            "fee": {"cost": self.fee.cost, "currency": self.fee.currency},
            "created_at": self.created_at,
            "strategy_id": self.strategy_id,
            "is_reduce_only": self.is_reduce_only
        }


@dataclass
class BracketOrderSpec:
    """
    Specification for Entry Order and its associated protective Stop-Loss & Take-Profit bracket.
    """
    symbol: str
    side: OrderSide
    amount: float
    entry_price: Optional[float] = None
    stop_loss_price: float = 0.0
    tp1_price: float = 0.0
    tp1_pct_size: float = 0.50          # e.g. 50% exit at TP1
    tp2_price: Optional[float] = None
    tp2_pct_size: float = 0.25          # e.g. 25% exit at TP2
    tp3_price: Optional[float] = None
    tp3_pct_size: float = 0.25          # e.g. 25% exit at TP3
    trailing_stop: bool = True
    strategy_id: Optional[str] = None


@dataclass
class ExecutionReport:
    """
    Comprehensive execution outcome returned to the trading loop.
    """
    success: bool
    order: Optional[Order]
    message: str
    latency_ms: float = 0.0
    risk_checked: bool = True
    risk_reason: Optional[str] = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class TickerData:
    symbol: str
    bid: float
    ask: float
    last: float
    timestamp: float = field(default_factory=time.time)
    volume_24h: float = 0.0
