"""
Dynamic Trailing Stop & Scale-Out Management.
Implements Breakeven activation, Multi-Stage Partial Profit Taking,
ATR Chandelier Trailing Stops, and Stagnation Exits.
"""

from __future__ import annotations

import time
from typing import List, Optional, Tuple
try:
    from crypto_ai_trader.app.risk.types import (
        ExitReason,
        Position,
        PositionSide,
        PositionStatus,
        TrailingAction
    )
except ImportError:
    from app.risk.types import (  # type: ignore
        ExitReason,
        Position,
        PositionSide,
        PositionStatus,
        TrailingAction
    )


class TrailingStopManager:
    """
    Manages active position stops and executes dynamic profit capture.
    """

    def __init__(
        self,
        breakeven_r_multiple: float = 1.0,     # Move SL to breakeven when profit reaches 1.0R
        tp1_scale_out_fraction: float = 0.5,   # Scale out 50% at TP1
        tp2_scale_out_fraction: float = 0.5,   # Scale out 50% of remaining at TP2
        atr_trail_multiplier: float = 2.0,     # Chandelier trail distance (2.0x ATR)
        max_holding_seconds: float = 172800.0  # 48 hours stagnation limit
    ):
        self.breakeven_r_multiple = breakeven_r_multiple
        self.tp1_scale_out_fraction = tp1_scale_out_fraction
        self.tp2_scale_out_fraction = tp2_scale_out_fraction
        self.atr_trail_multiplier = atr_trail_multiplier
        self.max_holding_seconds = max_holding_seconds

    def evaluate_position(
        self,
        position: Position,
        current_price: float,
        current_atr: Optional[float] = None,
        candle_high: Optional[float] = None,
        candle_low: Optional[float] = None
    ) -> List[TrailingAction]:
        """
        Evaluates an active position against current price/ATR to generate risk actions.
        Returns a list of TrailingActions to execute (e.g. adjust stop, scale out, or stop out).
        """
        if position.status == PositionStatus.CLOSED or position.size <= 0:
            return []

        actions: List[TrailingAction] = []
        high = candle_high if candle_high is not None else current_price
        low = candle_low if candle_low is not None else current_price

        # Update high/low tracking
        position.highest_price = max(position.highest_price, high)
        position.lowest_price = min(position.lowest_price, low)

        initial_risk_per_unit = abs(position.entry_price - position.initial_stop_loss)

        if position.side == PositionSide.LONG:
            # 1. Check Hard Stop Loss hit
            if low <= position.current_stop_loss:
                actions.append(TrailingAction(
                    position_id=position.position_id,
                    symbol=position.symbol,
                    action_type="CLOSE",
                    exit_price=position.current_stop_loss,
                    scale_out_fraction=1.0,
                    reason=ExitReason.STOP_LOSS.value
                ))
                return actions

            # 2. Check TP1 Partial Profit Take
            if not position.tp1_hit and high >= position.tp1:
                actions.append(TrailingAction(
                    position_id=position.position_id,
                    symbol=position.symbol,
                    action_type="SCALE_OUT",
                    exit_price=position.tp1,
                    scale_out_fraction=self.tp1_scale_out_fraction,
                    reason=ExitReason.TAKE_PROFIT_1.value
                ))
                position.tp1_hit = True
                
                # Automatically lock breakeven upon hitting TP1
                if not position.breakeven_activated:
                    be_price = position.entry_price * 1.0005  # Slight offset to cover trading fees
                    if be_price > position.current_stop_loss:
                        position.current_stop_loss = be_price
                        position.breakeven_activated = True
                        actions.append(TrailingAction(
                            position_id=position.position_id,
                            symbol=position.symbol,
                            action_type="UPDATE_STOP",
                            new_stop_loss=be_price,
                            reason="Breakeven Stop locked after TP1"
                        ))

            # 3. Check TP2 Partial Profit Take
            if position.tp2 and not position.tp2_hit and high >= position.tp2:
                actions.append(TrailingAction(
                    position_id=position.position_id,
                    symbol=position.symbol,
                    action_type="SCALE_OUT",
                    exit_price=position.tp2,
                    scale_out_fraction=self.tp2_scale_out_fraction,
                    reason=ExitReason.TAKE_PROFIT_2.value
                ))
                position.tp2_hit = True

            # 4. Breakeven Trigger based on R-multiple
            if not position.breakeven_activated and initial_risk_per_unit > 0:
                current_r = (current_price - position.entry_price) / initial_risk_per_unit
                if current_r >= self.breakeven_r_multiple:
                    be_price = position.entry_price * 1.0005
                    if be_price > position.current_stop_loss:
                        position.current_stop_loss = be_price
                        position.breakeven_activated = True
                        actions.append(TrailingAction(
                            position_id=position.position_id,
                            symbol=position.symbol,
                            action_type="UPDATE_STOP",
                            new_stop_loss=be_price,
                            reason=f"Breakeven Stop triggered at {current_r:.1f}R"
                        ))

            # 5. Dynamic ATR Trailing Stop (Chandelier Exit)
            if current_atr and current_atr > 0 and (position.tp1_hit or position.breakeven_activated):
                candidate_stop = position.highest_price - (self.atr_trail_multiplier * current_atr)
                # Ensure stop only ratchets UP for LONG
                if candidate_stop > position.current_stop_loss:
                    position.current_stop_loss = candidate_stop
                    actions.append(TrailingAction(
                        position_id=position.position_id,
                        symbol=position.symbol,
                        action_type="UPDATE_STOP",
                        new_stop_loss=candidate_stop,
                        reason=f"ATR Chandelier Trail ({self.atr_trail_multiplier}x ATR)"
                    ))

        else: # SHORT Position
            # 1. Check Hard Stop Loss hit
            if high >= position.current_stop_loss:
                actions.append(TrailingAction(
                    position_id=position.position_id,
                    symbol=position.symbol,
                    action_type="CLOSE",
                    exit_price=position.current_stop_loss,
                    scale_out_fraction=1.0,
                    reason=ExitReason.STOP_LOSS.value
                ))
                return actions

            # 2. Check TP1 Partial Profit Take
            if not position.tp1_hit and low <= position.tp1:
                actions.append(TrailingAction(
                    position_id=position.position_id,
                    symbol=position.symbol,
                    action_type="SCALE_OUT",
                    exit_price=position.tp1,
                    scale_out_fraction=self.tp1_scale_out_fraction,
                    reason=ExitReason.TAKE_PROFIT_1.value
                ))
                position.tp1_hit = True

                # Breakeven for SHORT
                if not position.breakeven_activated:
                    be_price = position.entry_price * 0.9995
                    if be_price < position.current_stop_loss:
                        position.current_stop_loss = be_price
                        position.breakeven_activated = True
                        actions.append(TrailingAction(
                            position_id=position.position_id,
                            symbol=position.symbol,
                            action_type="UPDATE_STOP",
                            new_stop_loss=be_price,
                            reason="Breakeven Stop locked after TP1"
                        ))

            # 3. Check TP2 Partial Profit Take
            if position.tp2 and not position.tp2_hit and low <= position.tp2:
                actions.append(TrailingAction(
                    position_id=position.position_id,
                    symbol=position.symbol,
                    action_type="SCALE_OUT",
                    exit_price=position.tp2,
                    scale_out_fraction=self.tp2_scale_out_fraction,
                    reason=ExitReason.TAKE_PROFIT_2.value
                ))
                position.tp2_hit = True

            # 4. Breakeven Trigger based on R-multiple
            if not position.breakeven_activated and initial_risk_per_unit > 0:
                current_r = (position.entry_price - current_price) / initial_risk_per_unit
                if current_r >= self.breakeven_r_multiple:
                    be_price = position.entry_price * 0.9995
                    if be_price < position.current_stop_loss:
                        position.current_stop_loss = be_price
                        position.breakeven_activated = True
                        actions.append(TrailingAction(
                            position_id=position.position_id,
                            symbol=position.symbol,
                            action_type="UPDATE_STOP",
                            new_stop_loss=be_price,
                            reason=f"Breakeven Stop triggered at {current_r:.1f}R"
                        ))

            # 5. Dynamic ATR Trailing Stop (Chandelier Exit)
            if current_atr and current_atr > 0 and (position.tp1_hit or position.breakeven_activated):
                candidate_stop = position.lowest_price + (self.atr_trail_multiplier * current_atr)
                # Ensure stop only ratchets DOWN for SHORT
                if candidate_stop < position.current_stop_loss:
                    position.current_stop_loss = candidate_stop
                    actions.append(TrailingAction(
                        position_id=position.position_id,
                        symbol=position.symbol,
                        action_type="UPDATE_STOP",
                        new_stop_loss=candidate_stop,
                        reason=f"ATR Chandelier Trail ({self.atr_trail_multiplier}x ATR)"
                    ))

        # 6. Stagnation / Time-Based Exit check
        open_duration = time.time() - position.entry_time
        if open_duration > self.max_holding_seconds and not position.tp1_hit:
            pnl_pct = position.calculate_pnl_percentage(current_price)
            if abs(pnl_pct) < 1.0: # Sideways dead capital
                actions.append(TrailingAction(
                    position_id=position.position_id,
                    symbol=position.symbol,
                    action_type="CLOSE",
                    exit_price=current_price,
                    scale_out_fraction=1.0,
                    reason=ExitReason.TIME_STOP.value
                ))

        return actions
