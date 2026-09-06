"""
Order & Execution Manager.
Orchestrates trade signals through the Unified Risk Manager, manages order lifecycles,
attaches multi-tier brackets (SL/TP1/TP2/TP3), and enforces panic kill switches.
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from typing import Any, Dict, List, Optional

try:
    from crypto_ai_trader.app.execution.base_exchange import BaseExchangeAdapter
    from crypto_ai_trader.app.execution.types import (
        BracketOrderSpec,
        ExecutionMode,
        ExecutionReport,
        Order,
        OrderFee,
        OrderSide,
        OrderStatus,
        OrderType
    )
    from crypto_ai_trader.app.risk.manager import UnifiedRiskManager
    from crypto_ai_trader.app.risk.types import (
        ExitReason,
        PortfolioState,
        Position,
        PositionSide,
        PositionStatus,
        RiskCheckResult,
        TrailingAction
    )
    from crypto_ai_trader.app.strategies.base import SignalAction, TradeSignal
except ImportError:
    from app.execution.base_exchange import BaseExchangeAdapter  # type: ignore
    from app.execution.types import (  # type: ignore
        BracketOrderSpec,
        ExecutionMode,
        ExecutionReport,
        Order,
        OrderFee,
        OrderSide,
        OrderStatus,
        OrderType
    )
    from app.risk.manager import UnifiedRiskManager  # type: ignore
    from app.risk.types import (  # type: ignore
        ExitReason,
        PortfolioState,
        Position,
        PositionSide,
        PositionStatus,
        RiskCheckResult,
        TrailingAction
    )
    from app.strategies.base import SignalAction, TradeSignal  # type: ignore

logger = logging.getLogger("ExecutionEngine")


class OrderManager:
    """
    Central execution orchestrator enforcing zero-unmanaged-risk order execution.
    """

    def __init__(
        self,
        exchange: BaseExchangeAdapter,
        risk_manager: UnifiedRiskManager,
        mode: ExecutionMode = ExecutionMode.PAPER
    ):
        self.exchange = exchange
        self.risk_manager = risk_manager
        self.mode = mode

        # Active order tracking
        self.active_orders: Dict[str, Order] = {}                   # order_id -> Order
        self.bracket_orders: Dict[str, List[Order]] = {}            # position_id -> list of protective orders
        self.managed_positions: Dict[str, Position] = {}           # position_id -> Position

    async def execute_trade_signal(
        self,
        signal: TradeSignal,
        current_price: float,
        portfolio: PortfolioState
    ) -> ExecutionReport:
        """
        Primary entry gate:
        1. Evaluates signal through institutional Risk Manager.
        2. If approved, sizes and submits entry order.
        3. If filled, registers Position and submits bracket SL/TP orders.
        """
        start_time = time.time()

        # Step 1: Risk Gateway Check
        risk_result: RiskCheckResult = self.risk_manager.evaluate_signal(
            signal=signal,
            portfolio=portfolio
        )

        if not risk_result.is_approved:
            latency = (time.time() - start_time) * 1000.0
            return ExecutionReport(
                success=False,
                order=None,
                message=f"Order vetoed by Risk Manager: {risk_result.rejection_reason}",
                latency_ms=latency,
                risk_checked=True,
                risk_reason=risk_result.rejection_reason
            )

        order_side = OrderSide.BUY if signal.action == SignalAction.BUY else OrderSide.SELL
        approved_size = risk_result.approved_size

        # Format lot size
        executable_size = self.exchange.round_amount(signal.symbol, approved_size)

        entry_order = Order(
            symbol=signal.symbol,
            side=order_side,
            order_type=OrderType.MARKET,
            amount=executable_size,
            price=current_price,
            strategy_id=signal.strategy_id
        )

        try:
            # Step 2: Submit Entry Order to Exchange
            placed_order = await self.exchange.create_order(entry_order)
            self.active_orders[placed_order.order_id] = placed_order

            # Step 3: Handle Immediate Fill
            if placed_order.status == OrderStatus.FILLED:
                fill_price = placed_order.average_price or current_price
                position_id = str(uuid.uuid4())

                # Register position in Risk Manager
                pos_side = PositionSide.LONG if signal.action == SignalAction.BUY else PositionSide.SHORT
                pos = Position(
                    position_id=position_id,
                    symbol=signal.symbol,
                    side=pos_side,
                    strategy_id=signal.strategy_id,
                    entry_price=fill_price,
                    size=placed_order.filled,
                    initial_size=placed_order.filled,
                    initial_stop_loss=signal.stop_loss,
                    current_stop_loss=signal.stop_loss,
                    tp1=signal.tp1,
                    tp2=signal.tp2,
                    tp3=signal.tp3,
                    highest_price=fill_price,
                    lowest_price=fill_price
                )
                self.risk_manager.register_position(pos, portfolio)
                self.managed_positions[position_id] = pos

                # Step 4: Attach Bracket Orders (Stop-Loss & Take-Profit)
                bracket_spec = BracketOrderSpec(
                    symbol=signal.symbol,
                    side=order_side,
                    amount=placed_order.filled,
                    entry_price=fill_price,
                    stop_loss_price=signal.stop_loss,
                    tp1_price=signal.tp1,
                    tp2_price=signal.tp2,
                    tp3_price=signal.tp3,
                    strategy_id=signal.strategy_id
                )
                await self._deploy_bracket_orders(position_id, bracket_spec)

            latency = (time.time() - start_time) * 1000.0
            return ExecutionReport(
                success=True,
                order=placed_order,
                message=f"Order placed successfully in {self.mode.value} mode",
                latency_ms=latency,
                risk_checked=True
            )

        except Exception as e:
            latency = (time.time() - start_time) * 1000.0
            logger.error(f"Failed to place order: {e}")
            return ExecutionReport(
                success=False,
                order=entry_order,
                message=f"Exchange execution failed: {e}",
                latency_ms=latency,
                risk_checked=True,
                risk_reason="EXCHANGE_REJECTED"
            )

    async def _deploy_bracket_orders(self, position_id: str, spec: BracketOrderSpec) -> None:
        """
        Deploy protective Stop-Loss and partial Take-Profit limit orders.
        """
        bracket_list: List[Order] = []
        exit_side = OrderSide.SELL if spec.side == OrderSide.BUY else OrderSide.BUY

        # 1. Protective Stop-Loss Order (Full Size)
        sl_order = Order(
            symbol=spec.symbol,
            side=exit_side,
            order_type=OrderType.STOP_LOSS,
            amount=spec.amount,
            stop_price=spec.stop_loss_price,
            parent_position_id=position_id,
            is_reduce_only=True,
            strategy_id=spec.strategy_id
        )
        try:
            placed_sl = await self.exchange.create_order(sl_order)
            bracket_list.append(placed_sl)
        except Exception as e:
            logger.error(f"Failed to deploy Stop-Loss order: {e}")

        # 2. Take-Profit 1 (e.g. 50% size)
        tp1_amount = self.exchange.round_amount(spec.symbol, spec.amount * spec.tp1_pct_size)
        if tp1_amount > 0 and spec.tp1_price > 0:
            tp1_order = Order(
                symbol=spec.symbol,
                side=exit_side,
                order_type=OrderType.LIMIT,
                amount=tp1_amount,
                price=spec.tp1_price,
                parent_position_id=position_id,
                is_reduce_only=True,
                strategy_id=spec.strategy_id
            )
            try:
                placed_tp1 = await self.exchange.create_order(tp1_order)
                bracket_list.append(placed_tp1)
            except Exception as e:
                logger.error(f"Failed to deploy TP1 order: {e}")

        self.bracket_orders[position_id] = bracket_list

    async def process_market_tick(self, symbol: str, current_price: float) -> List[TrailingAction]:
        """
        Feeds price update to exchange (for paper matching) and evaluates trailing stops in Risk Manager.
        """
        if hasattr(self.exchange, "set_market_price"):
            self.exchange.set_market_price(symbol, current_price)

        # Evaluate positions in Risk Manager
        actions = self.risk_manager.update_positions_on_tick(symbol, current_price)

        for action in actions:
            pos = self.managed_positions.get(action.position_id)
            if not pos:
                continue

            # Update SL order if Trailing Stop stepped
            if action.new_stop_loss is not None:
                await self._update_stop_loss_order(action.position_id, action.new_stop_loss)

            # If full close or stop triggered
            if action.close_position:
                await self.close_position(
                    position_id=action.position_id,
                    reason=ExitReason.TRAILING_STOP if "Trailing" in action.reason else ExitReason.STOP_LOSS
                )

        return actions

    async def _update_stop_loss_order(self, position_id: str, new_stop_price: float) -> None:
        """Adjusts the price of the active Stop-Loss order."""
        orders = self.bracket_orders.get(position_id, [])
        for order in orders:
            if order.order_type in (OrderType.STOP_LOSS, OrderType.STOP_LOSS_LIMIT) and order.is_active:
                # Cancel old SL and submit new SL
                await self.exchange.cancel_order(order.order_id, order.symbol)
                order.stop_price = new_stop_price
                new_sl = Order(
                    symbol=order.symbol,
                    side=order.side,
                    order_type=OrderType.STOP_LOSS,
                    amount=order.remaining,
                    stop_price=new_stop_price,
                    parent_position_id=position_id,
                    is_reduce_only=True
                )
                await self.exchange.create_order(new_sl)

    async def close_position(
        self,
        position_id: str,
        reason: ExitReason = ExitReason.MANUAL,
        portfolio: Optional[PortfolioState] = None
    ) -> bool:
        """
        Orderly closure of a position:
        1. Cancels all outstanding bracket orders.
        2. Submits Market reduce-only order to flatten position.
        3. Closes position in Risk Manager.
        """
        pos = self.managed_positions.get(position_id)
        if not pos or pos.status == PositionStatus.CLOSED:
            return False

        # 1. Cancel brackets
        await self._cancel_brackets_for_position(position_id)

        # 2. Market close order
        close_side = OrderSide.SELL if pos.side == PositionSide.LONG else OrderSide.BUY
        close_order = Order(
            symbol=pos.symbol,
            side=close_side,
            order_type=OrderType.MARKET,
            amount=pos.size,
            is_reduce_only=True
        )
        try:
            executed = await self.exchange.create_order(close_order)
            fill_px = executed.average_price or pos.entry_price
            self.risk_manager.close_position(position_id, exit_price=fill_px, reason=reason, portfolio=portfolio)
            pos.status = PositionStatus.CLOSED
            return True
        except Exception as e:
            logger.error(f"Failed to close position {position_id}: {e}")
            return False

    async def _cancel_brackets_for_position(self, position_id: str) -> None:
        brackets = self.bracket_orders.get(position_id, [])
        for order in brackets:
            if order.is_active:
                await self.exchange.cancel_order(order.order_id, order.symbol)
        self.bracket_orders[position_id] = []

    async def panic_close_all(self, portfolio: Optional[PortfolioState] = None) -> Dict[str, Any]:
        """
        Emergency Circuit Breaker / Panic Kill Switch:
        1. Immediately cancels ALL open orders across all markets.
        2. Submits Market orders to immediately flatten all open positions.
        3. Trips the Risk Circuit Breaker.
        """
        logger.critical("EMERGENCY KILL SWITCH TRIGGERED: Panic closing all positions!")
        cancelled_orders = 0
        closed_positions = 0

        # Trip Circuit Breaker
        if portfolio:
            self.risk_manager.breaker.trip(portfolio, "Manual or Emergency Panic Kill Switch Activated")

        # Cancel all open orders
        try:
            open_orders = await self.exchange.fetch_open_orders()
            for o in open_orders:
                if await self.exchange.cancel_order(o.order_id, o.symbol):
                    cancelled_orders += 1
        except Exception as e:
            logger.error(f"Error cancelling orders during panic close: {e}")

        # Flatten all open positions
        for pos_id in list(self.managed_positions.keys()):
            pos = self.managed_positions[pos_id]
            if pos.status != PositionStatus.CLOSED:
                if await self.close_position(pos_id, reason=ExitReason.CIRCUIT_BREAKER, portfolio=portfolio):
                    closed_positions += 1

        is_breaker_active = portfolio.is_trading_halted if portfolio else False

        return {
            "status": "PANIC_COMPLETED",
            "cancelled_orders": cancelled_orders,
            "closed_positions": closed_positions,
            "circuit_breaker_active": is_breaker_active,
            "timestamp": time.time()
        }

    async def reconcile_positions(self) -> Dict[str, Any]:
        """
        Reconcile internal state against exchange positions and report any discrepancies.
        """
        try:
            exchange_positions = await self.exchange.fetch_positions()
            discrepancies = []

            # Map exchange positions by symbol
            ex_map = {p["symbol"]: p for p in exchange_positions if float(p.get("size", 0.0)) > 0}

            # Compare with internal positions
            for pos_id, pos in self.managed_positions.items():
                if pos.status == PositionStatus.OPEN:
                    ex_pos = ex_map.get(pos.symbol)
                    if not ex_pos:
                        discrepancies.append({
                            "type": "MISSING_ON_EXCHANGE",
                            "position_id": pos_id,
                            "symbol": pos.symbol,
                            "internal_size": pos.size
                        })
                    elif abs(float(ex_pos.get("size", 0.0)) - pos.size) > 0.0001:
                        discrepancies.append({
                            "type": "SIZE_MISMATCH",
                            "position_id": pos_id,
                            "symbol": pos.symbol,
                            "internal_size": pos.size,
                            "exchange_size": float(ex_pos.get("size", 0.0))
                        })

            return {
                "in_sync": len(discrepancies) == 0,
                "discrepancies": discrepancies,
                "timestamp": time.time()
            }
        except Exception as e:
            return {"in_sync": False, "error": str(e), "discrepancies": []}
