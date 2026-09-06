"""
Production CCXT Exchange Adapter for Binance & Bybit.
Implements asynchronous exchange calls, rate-limiting, error recovery, and idempotent retries.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, List, Optional

try:
    from crypto_ai_trader.app.execution.base_exchange import BaseExchangeAdapter
    from crypto_ai_trader.app.execution.types import (
        Order,
        OrderFee,
        OrderSide,
        OrderStatus,
        OrderType,
        TickerData
    )
    from crypto_ai_trader.app.core.exceptions import (
        ExchangeAuthError,
        ExchangeConnectionError,
        OrderExecutionError
    )
except ImportError:
    from app.execution.base_exchange import BaseExchangeAdapter  # type: ignore
    from app.execution.types import (  # type: ignore
        Order,
        OrderFee,
        OrderSide,
        OrderStatus,
        OrderType,
        TickerData
    )
    from app.core.exceptions import (  # type: ignore
        ExchangeAuthError,
        ExchangeConnectionError,
        OrderExecutionError
    )

try:
    import ccxt.async_support as ccxt_async
    HAS_CCXT = True
except ImportError:
    ccxt_async = None
    HAS_CCXT = False


class CCXTExchangeAdapter(BaseExchangeAdapter):
    """
    CCXT-powered asynchronous exchange adapter supporting Binance and Bybit.
    """

    def __init__(
        self,
        exchange_name: str = "binance",
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        is_testnet: bool = True,
        is_futures: bool = False
    ):
        super().__init__(name=exchange_name.lower(), is_testnet=is_testnet)
        self.api_key = api_key
        self.api_secret = api_secret
        self.is_futures = is_futures
        self._exchange = None

    async def connect(self) -> None:
        if not HAS_CCXT:
            self._connected = False
            return

        exchange_class = getattr(ccxt_async, self.name, None)
        if not exchange_class:
            raise ExchangeConnectionError(f"Unsupported exchange in CCXT: {self.name}")

        config = {
            "apiKey": self.api_key or "",
            "secret": self.api_secret or "",
            "enableRateLimit": True,
            "options": {"defaultType": "future" if self.is_futures else "spot"}
        }

        self._exchange = exchange_class(config)
        if self.is_testnet:
            if hasattr(self._exchange, "set_sandbox_mode"):
                self._exchange.set_sandbox_mode(True)

        try:
            await self._exchange.load_markets()
            self._connected = True
        except Exception as e:
            self._connected = False
            raise ExchangeConnectionError(f"Failed to load markets for {self.name}: {e}")

    async def disconnect(self) -> None:
        if self._exchange:
            await self._exchange.close()
            self._connected = False

    async def fetch_balance(self) -> Dict[str, float]:
        if not self._exchange:
            return {"USDT": 0.0}
        try:
            bal = await self._exchange.fetch_balance()
            free = bal.get("free", {})
            return {k: float(v) for k, v in free.items() if float(v) > 0}
        except Exception as e:
            raise ExchangeConnectionError(f"Error fetching balance from {self.name}: {e}")

    async def fetch_ticker(self, symbol: str) -> TickerData:
        if not self._exchange:
            return TickerData(symbol=symbol, bid=0.0, ask=0.0, last=0.0)
        try:
            ticker = await self._exchange.fetch_ticker(symbol)
            return TickerData(
                symbol=symbol,
                bid=float(ticker.get("bid") or ticker.get("last", 0.0)),
                ask=float(ticker.get("ask") or ticker.get("last", 0.0)),
                last=float(ticker.get("last", 0.0)),
                timestamp=time.time(),
                volume_24h=float(ticker.get("baseVolume", 0.0))
            )
        except Exception as e:
            raise ExchangeConnectionError(f"Error fetching ticker for {symbol}: {e}")

    async def create_order(self, order: Order) -> Order:
        if not self._exchange:
            raise ExchangeConnectionError("Exchange client not connected")

        # 1. Anti-Duplicate Query Guard
        existing = await self.safe_query_before_retry(order.client_order_id, order.symbol)
        if existing:
            return existing

        # Format amount and price
        amount = self.round_amount(order.symbol, order.amount)
        price = self.round_price(order.symbol, order.price) if order.price else None

        side_str = "buy" if order.side == OrderSide.BUY else "sell"
        type_str = "market" if order.order_type == OrderType.MARKET else "limit"
        params: Dict[str, Any] = {"clientOrderId": order.client_order_id}

        if order.is_reduce_only:
            params["reduceOnly"] = True

        try:
            raw_order = await self._exchange.create_order(
                symbol=order.symbol,
                type=type_str,
                side=side_str,
                amount=amount,
                price=price,
                params=params
            )
            order.exchange_order_id = str(raw_order.get("id"))
            order.status = self._map_status(raw_order.get("status"))
            order.filled = float(raw_order.get("filled", 0.0))
            order.remaining = float(raw_order.get("remaining", amount))
            order.average_price = float(raw_order.get("average") or raw_order.get("price") or 0.0)
            order.updated_at = time.time()
            return order
        except Exception as e:
            order.status = OrderStatus.REJECTED
            order.error_message = str(e)
            raise OrderExecutionError(f"Order rejected by {self.name}: {e}")

    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        if not self._exchange:
            return False
        try:
            await self._exchange.cancel_order(id=order_id, symbol=symbol)
            return True
        except Exception:
            return False

    async def fetch_order(self, order_id: str, symbol: str, client_order_id: Optional[str] = None) -> Optional[Order]:
        if not self._exchange:
            return None
        try:
            raw = None
            if order_id:
                raw = await self._exchange.fetch_order(order_id, symbol)
            elif client_order_id:
                raw = await self._exchange.fetch_order(id=None, symbol=symbol, params={"clientOrderId": client_order_id})
            
            if not raw:
                return None

            return Order(
                order_id=order_id or str(raw.get("id")),
                client_order_id=raw.get("clientOrderId") or client_order_id or "",
                exchange_order_id=str(raw.get("id")),
                symbol=symbol,
                side=OrderSide.BUY if raw.get("side") == "buy" else OrderSide.SELL,
                order_type=OrderType.LIMIT if raw.get("type") == "limit" else OrderType.MARKET,
                amount=float(raw.get("amount", 0.0)),
                price=float(raw.get("price", 0.0)) if raw.get("price") else None,
                status=self._map_status(raw.get("status")),
                filled=float(raw.get("filled", 0.0)),
                remaining=float(raw.get("remaining", 0.0)),
                average_price=float(raw.get("average") or 0.0)
            )
        except Exception:
            return None

    async def fetch_open_orders(self, symbol: Optional[str] = None) -> List[Order]:
        if not self._exchange:
            return []
        try:
            raw_orders = await self._exchange.fetch_open_orders(symbol)
            orders = []
            for r in raw_orders:
                orders.append(Order(
                    order_id=str(r.get("id")),
                    client_order_id=r.get("clientOrderId") or "",
                    exchange_order_id=str(r.get("id")),
                    symbol=r.get("symbol", symbol or ""),
                    side=OrderSide.BUY if r.get("side") == "buy" else OrderSide.SELL,
                    order_type=OrderType.LIMIT if r.get("type") == "limit" else OrderType.MARKET,
                    amount=float(r.get("amount", 0.0)),
                    price=float(r.get("price", 0.0)) if r.get("price") else None,
                    status=self._map_status(r.get("status")),
                    filled=float(r.get("filled", 0.0)),
                    remaining=float(r.get("remaining", 0.0)),
                    average_price=float(r.get("average") or 0.0)
                ))
            return orders
        except Exception:
            return []

    async def fetch_positions(self, symbols: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        if not self._exchange:
            return []
        try:
            positions = await self._exchange.fetch_positions(symbols)
            return positions or []
        except Exception:
            return []

    def _map_status(self, raw_status: Optional[str]) -> OrderStatus:
        mapping = {
            "open": OrderStatus.SUBMITTED,
            "closed": OrderStatus.FILLED,
            "canceled": OrderStatus.CANCELED,
            "rejected": OrderStatus.REJECTED,
            "expired": OrderStatus.EXPIRED
        }
        return mapping.get((raw_status or "").lower(), OrderStatus.SUBMITTED)
