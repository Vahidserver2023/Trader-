"""
High-Fidelity Paper Trading Simulation Exchange Adapter.
Simulates realistic order matching, order book crossing, maker/taker fees, and slippage.
"""

from __future__ import annotations

import asyncio
import copy
import time
import uuid
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


class PaperExchangeAdapter(BaseExchangeAdapter):
    """
    In-memory virtual exchange matching engine replicating real crypto exchange behavior.
    """

    def __init__(
        self,
        initial_balance_usdt: float = 10000.0,
        maker_fee_pct: float = 0.02,
        taker_fee_pct: float = 0.05,
        simulated_slippage_pct: float = 0.02,
        simulated_latency_ms: float = 15.0
    ):
        super().__init__(name="PaperExchange", is_testnet=True)
        self.initial_balance = initial_balance_usdt
        self.balances: Dict[str, float] = {"USDT": initial_balance_usdt}
        self.maker_fee_rate = maker_fee_pct / 100.0
        self.taker_fee_rate = taker_fee_pct / 100.0
        self.slippage_rate = simulated_slippage_pct / 100.0
        self.simulated_latency_ms = simulated_latency_ms

        # Market prices cache
        self.current_prices: Dict[str, float] = {
            "BTC/USDT": 62500.0,
            "ETH/USDT": 3450.0,
            "SOL/USDT": 145.0,
            "BNB/USDT": 580.0
        }

        # Storage
        self.orders: Dict[str, Order] = {}                     # order_id -> Order
        self.client_order_map: Dict[str, str] = {}             # client_order_id -> order_id
        self.open_orders: Dict[str, Order] = {}                # order_id -> Order
        self.positions: Dict[str, Dict[str, Any]] = {}         # symbol -> position dict
        self._connected = True

    async def connect(self) -> None:
        self._connected = True

    async def disconnect(self) -> None:
        self._connected = False

    def set_market_price(self, symbol: str, price: float) -> None:
        """Update market price and trigger any pending stop or limit orders."""
        self.current_prices[symbol] = price
        self._evaluate_pending_orders(symbol, price)

    async def fetch_balance(self) -> Dict[str, float]:
        await asyncio.sleep(self.simulated_latency_ms / 1000.0)
        return copy.deepcopy(self.balances)

    async def fetch_ticker(self, symbol: str) -> TickerData:
        await asyncio.sleep(self.simulated_latency_ms / 1000.0)
        price = self.current_prices.get(symbol, 60000.0)
        spread = price * 0.0001
        return TickerData(
            symbol=symbol,
            bid=price - spread,
            ask=price + spread,
            last=price,
            timestamp=time.time()
        )

    async def create_order(self, order: Order) -> Order:
        """
        Submit and evaluate order execution in simulated matching engine.
        """
        await asyncio.sleep(self.simulated_latency_ms / 1000.0)
        order.exchange_order_id = f"sim_{uuid.uuid4().hex[:10]}"
        order.created_at = time.time()
        order.updated_at = time.time()

        # Format amount and price according to rules
        order.amount = self.round_amount(order.symbol, order.amount)
        if order.price:
            order.price = self.round_price(order.symbol, order.price)
        if order.stop_price:
            order.stop_price = self.round_price(order.symbol, order.stop_price)

        current_price = self.current_prices.get(order.symbol, 60000.0)

        # Market Order -> Instant Fill with Slippage
        if order.order_type == OrderType.MARKET:
            self._fill_market_order(order, current_price)
        # Limit Order
        elif order.order_type == OrderType.LIMIT:
            if order.price is None:
                order.status = OrderStatus.REJECTED
                order.error_message = "Limit order requires price"
            elif (order.side == OrderSide.BUY and current_price <= order.price) or \
                 (order.side == OrderSide.SELL and current_price >= order.price):
                # Crossed the spread immediately -> fill as taker
                self._fill_order(order, order.price, is_maker=False)
            else:
                # Placed on order book
                order.status = OrderStatus.SUBMITTED
                self.open_orders[order.order_id] = order
        # Stop Orders
        elif order.order_type in (OrderType.STOP_LOSS, OrderType.STOP_LOSS_LIMIT, OrderType.TAKE_PROFIT):
            order.status = OrderStatus.SUBMITTED
            self.open_orders[order.order_id] = order

        self.orders[order.order_id] = order
        self.client_order_map[order.client_order_id] = order.order_id
        return order

    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        await asyncio.sleep(self.simulated_latency_ms / 1000.0)
        if order_id in self.open_orders:
            order = self.open_orders.pop(order_id)
            order.status = OrderStatus.CANCELED
            order.updated_at = time.time()
            return True
        return False

    async def fetch_order(self, order_id: str, symbol: str, client_order_id: Optional[str] = None) -> Optional[Order]:
        await asyncio.sleep(self.simulated_latency_ms / 1000.0)
        if order_id and order_id in self.orders:
            return copy.deepcopy(self.orders[order_id])
        if client_order_id and client_order_id in self.client_order_map:
            internal_id = self.client_order_map[client_order_id]
            return copy.deepcopy(self.orders.get(internal_id))
        return None

    async def fetch_open_orders(self, symbol: Optional[str] = None) -> List[Order]:
        await asyncio.sleep(self.simulated_latency_ms / 1000.0)
        if symbol:
            return [copy.deepcopy(o) for o in self.open_orders.values() if o.symbol == symbol]
        return [copy.deepcopy(o) for o in self.open_orders.values()]

    async def fetch_positions(self, symbols: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        await asyncio.sleep(self.simulated_latency_ms / 1000.0)
        res = []
        for sym, pos in self.positions.items():
            if symbols is None or sym in symbols:
                curr_price = self.current_prices.get(sym, pos["entry_price"])
                size = pos["size"]
                entry = pos["entry_price"]
                unrealized = (curr_price - entry) * size if pos["side"] == "LONG" else (entry - curr_price) * size
                p_copy = copy.deepcopy(pos)
                p_copy["mark_price"] = curr_price
                p_copy["unrealized_pnl"] = unrealized
                res.append(p_copy)
        return res

    def _fill_market_order(self, order: Order, current_price: float) -> None:
        # Apply slippage: BUY gets slightly higher, SELL gets slightly lower
        slippage = current_price * self.slippage_rate
        fill_price = current_price + slippage if order.side == OrderSide.BUY else current_price - slippage
        self._fill_order(order, fill_price, is_maker=False)

    def _fill_order(self, order: Order, fill_price: float, is_maker: bool) -> None:
        order.filled = order.amount
        order.remaining = 0.0
        order.average_price = fill_price
        order.status = OrderStatus.FILLED
        order.updated_at = time.time()

        # Fee calculation
        fee_rate = self.maker_fee_rate if is_maker else self.taker_fee_rate
        fee_cost = (order.amount * fill_price) * fee_rate
        order.fee = OrderFee(cost=fee_cost, currency="USDT", rate=fee_rate)

        # Update balance & positions
        notional = order.amount * fill_price
        if order.side == OrderSide.BUY:
            self.balances["USDT"] = self.balances.get("USDT", 0.0) - notional - fee_cost
            base_curr = order.symbol.split("/")[0]
            self.balances[base_curr] = self.balances.get(base_curr, 0.0) + order.amount
            self._update_position(order.symbol, "LONG", order.amount, fill_price)
        else:
            base_curr = order.symbol.split("/")[0]
            self.balances[base_curr] = max(0.0, self.balances.get(base_curr, 0.0) - order.amount)
            self.balances["USDT"] = self.balances.get("USDT", 0.0) + notional - fee_cost
            self._update_position(order.symbol, "SHORT", order.amount, fill_price)

        if order.order_id in self.open_orders:
            del self.open_orders[order.order_id]

    def _update_position(self, symbol: str, side: str, amount: float, price: float) -> None:
        if symbol not in self.positions:
            self.positions[symbol] = {
                "symbol": symbol,
                "side": side,
                "size": amount,
                "entry_price": price,
                "created_at": time.time()
            }
        else:
            pos = self.positions[symbol]
            if pos["side"] == side:
                # Increase position
                total_size = pos["size"] + amount
                pos["entry_price"] = (pos["entry_price"] * pos["size"] + price * amount) / total_size
                pos["size"] = total_size
            else:
                # Reduce or flip position
                if pos["size"] <= amount:
                    del self.positions[symbol]
                else:
                    pos["size"] -= amount

    def _evaluate_pending_orders(self, symbol: str, price: float) -> None:
        """Scan open orders on price tick and fill triggered orders."""
        to_fill = []
        for order in list(self.open_orders.values()):
            if order.symbol != symbol:
                continue

            # Limit orders
            if order.order_type == OrderType.LIMIT and order.price is not None:
                if (order.side == OrderSide.BUY and price <= order.price) or \
                   (order.side == OrderSide.SELL and price >= order.price):
                    to_fill.append((order, order.price, True))

            # Stop-Loss orders
            elif order.order_type in (OrderType.STOP_LOSS, OrderType.STOP_LOSS_LIMIT) and order.stop_price is not None:
                if (order.side == OrderSide.SELL and price <= order.stop_price) or \
                   (order.side == OrderSide.BUY and price >= order.stop_price):
                    to_fill.append((order, price, False))

            # Take-Profit orders
            elif order.order_type == OrderType.TAKE_PROFIT and order.stop_price is not None:
                if (order.side == OrderSide.SELL and price >= order.stop_price) or \
                   (order.side == OrderSide.BUY and price <= order.stop_price):
                    to_fill.append((order, price, False))

        for order, fill_px, is_maker in to_fill:
            self._fill_order(order, fill_px, is_maker)
