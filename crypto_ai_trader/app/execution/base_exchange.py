"""
Abstract Base Exchange Adapter.
Defines standard exchange interfaces, symbol lot size formatting, and idempotent query-before-retry protection.
"""

from __future__ import annotations

import abc
import math
from typing import Any, Dict, List, Optional

try:
    from crypto_ai_trader.app.execution.types import Order, OrderSide, OrderStatus, OrderType, TickerData
except ImportError:
    from app.execution.types import Order, OrderSide, OrderStatus, OrderType, TickerData  # type: ignore


class BaseExchangeAdapter(abc.ABC):
    """
    Standardized interface for all crypto exchange adapters (CCXT Binance, Bybit, Paper Trading).
    """

    def __init__(self, name: str, is_testnet: bool = True):
        self.name = name
        self.is_testnet = is_testnet
        self._connected = False
        # Market precision cache: symbol -> {'amount_precision': int, 'price_precision': int, 'min_amount': float, 'min_notional': float}
        self._market_rules: Dict[str, Dict[str, Any]] = {
            "BTC/USDT": {"amount_precision": 5, "price_precision": 2, "min_amount": 0.0001, "min_notional": 5.0},
            "ETH/USDT": {"amount_precision": 4, "price_precision": 2, "min_amount": 0.001, "min_notional": 5.0},
            "SOL/USDT": {"amount_precision": 2, "price_precision": 2, "min_amount": 0.01, "min_notional": 5.0},
            "BNB/USDT": {"amount_precision": 3, "price_precision": 2, "min_amount": 0.005, "min_notional": 5.0},
        }

    @property
    def is_connected(self) -> bool:
        return self._connected

    @abc.abstractmethod
    async def connect(self) -> None:
        """Establish connection or initialize API clients."""
        pass

    @abc.abstractmethod
    async def disconnect(self) -> None:
        """Gracefully close all network sockets and CCXT clients."""
        pass

    @abc.abstractmethod
    async def fetch_balance(self) -> Dict[str, float]:
        """Returns dict of free balance by currency (e.g. {'USDT': 10000.0, 'BTC': 0.5})."""
        pass

    @abc.abstractmethod
    async def fetch_ticker(self, symbol: str) -> TickerData:
        """Fetch current bid, ask, last price for a symbol."""
        pass

    @abc.abstractmethod
    async def create_order(self, order: Order) -> Order:
        """
        Execute an order on the exchange.
        Must be protected by safe idempotent query before retrying.
        """
        pass

    @abc.abstractmethod
    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        """Cancel an open working order."""
        pass

    @abc.abstractmethod
    async def fetch_order(self, order_id: str, symbol: str, client_order_id: Optional[str] = None) -> Optional[Order]:
        """Query the status of an existing order by ID or client_order_id."""
        pass

    @abc.abstractmethod
    async def fetch_open_orders(self, symbol: Optional[str] = None) -> List[Order]:
        """Fetch all currently open/unfilled orders."""
        pass

    @abc.abstractmethod
    async def fetch_positions(self, symbols: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Fetch active exchange positions with mark price and unrealized PnL."""
        pass

    def get_symbol_rules(self, symbol: str) -> Dict[str, Any]:
        """Retrieve min amount, precision, and min notional rules."""
        return self._market_rules.get(
            symbol,
            {"amount_precision": 4, "price_precision": 2, "min_amount": 0.0001, "min_notional": 5.0}
        )

    def round_amount(self, symbol: str, amount: float) -> float:
        """Round order quantity down to exchange precision step to prevent lot-size rejections."""
        rules = self.get_symbol_rules(symbol)
        precision = rules.get("amount_precision", 4)
        factor = 10 ** precision
        # Floor rounding to never exceed intended risk sizing
        rounded = math.floor(amount * factor) / factor
        return max(rules.get("min_amount", 0.0001), rounded)

    def round_price(self, symbol: str, price: float) -> float:
        """Round price to exchange tick precision."""
        rules = self.get_symbol_rules(symbol)
        precision = rules.get("price_precision", 2)
        return round(price, precision)

    async def safe_query_before_retry(self, client_order_id: str, symbol: str) -> Optional[Order]:
        """
        Critical Anti-Duplicate Guard:
        Before retrying an order placement after a network timeout or disconnect,
        query the exchange with the client_order_id to verify if it was already filled or accepted.
        """
        try:
            existing = await self.fetch_order(order_id="", symbol=symbol, client_order_id=client_order_id)
            if existing and existing.status in (OrderStatus.SUBMITTED, OrderStatus.PARTIALLY_FILLED, OrderStatus.FILLED):
                return existing
        except Exception:
            pass
        return None
