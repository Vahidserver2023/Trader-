"""
Unified Risk Manager & Orchestrator.
Serves as the institutional gateway between Trade Signals and Order Execution.
Coordinates Circuit Breakers, Position Sizing, Portfolio Limits, and Trailing Stops.
"""

from __future__ import annotations

import math
import uuid
from typing import Any, Dict, List, Optional

try:
    from crypto_ai_trader.app.strategies.base import TradeSignal, SignalAction
except ImportError:
    try:
        from app.strategies.base import TradeSignal, SignalAction  # type: ignore
    except ImportError:
        pass

try:
    from crypto_ai_trader.app.risk.types import (
        ExitReason,
        PortfolioState,
        Position,
        PositionSide,
        PositionStatus,
        RiskCheckResult,
        TrailingAction
    )
    from crypto_ai_trader.app.risk.sizing import PositionSizer
    from crypto_ai_trader.app.risk.circuit_breaker import CircuitBreaker
    from crypto_ai_trader.app.risk.portfolio import PortfolioRiskManager
    from crypto_ai_trader.app.risk.trailing import TrailingStopManager
except ImportError:
    from app.risk.types import (  # type: ignore
        ExitReason,
        PortfolioState,
        Position,
        PositionSide,
        PositionStatus,
        RiskCheckResult,
        TrailingAction
    )
    from app.risk.sizing import PositionSizer  # type: ignore
    from app.risk.circuit_breaker import CircuitBreaker  # type: ignore
    from app.risk.portfolio import PortfolioRiskManager  # type: ignore
    from app.risk.trailing import TrailingStopManager  # type: ignore


class UnifiedRiskManager:
    """
    Central Risk Gateway enforcing zero-liquidation standards and disciplined capital growth.
    """

    def __init__(
        self,
        position_sizer: Optional[PositionSizer] = None,
        circuit_breaker: Optional[CircuitBreaker] = None,
        portfolio_manager: Optional[PortfolioRiskManager] = None,
        trailing_manager: Optional[TrailingStopManager] = None,
        min_risk_reward_ratio: float = 1.5
    ):
        self.sizer = position_sizer or PositionSizer()
        self.breaker = circuit_breaker or CircuitBreaker()
        self.portfolio_mgr = portfolio_manager or PortfolioRiskManager()
        self.trailing_mgr = trailing_manager or TrailingStopManager()
        self.min_risk_reward_ratio = min_risk_reward_ratio

    def evaluate_signal(
        self,
        signal: TradeSignal,
        portfolio: PortfolioState,
        market_context: Optional[Dict[str, Any]] = None
    ) -> RiskCheckResult:
        """
        Comprehensive multi-layer evaluation of a trading signal before order placement.
        """
        ctx = market_context or {}

        # 1. Reject invalid signal actions (HOLD, NO_TRADE)
        if signal.action not in (SignalAction.BUY, SignalAction.SELL):
            return RiskCheckResult(
                is_approved=False,
                rejection_reason=f"Action '{signal.action.value}' does not require trade execution"
            )

        # 2. Check Risk/Reward ratio constraint
        if signal.risk_reward_ratio < self.min_risk_reward_ratio:
            return RiskCheckResult(
                is_approved=False,
                rejection_reason=(
                    f"R/R ratio {signal.risk_reward_ratio:.2f} is below mandatory "
                    f"institutional minimum of {self.min_risk_reward_ratio:.2f}:1"
                )
            )

        # 3. Check Capital Protection Circuit Breakers (Daily loss, Max Drawdown)
        is_halted, halt_reason, risk_multiplier = self.breaker.check_portfolio(portfolio)
        if is_halted:
            return RiskCheckResult(
                is_approved=False,
                rejection_reason=f"Risk Circuit Breaker Active: {halt_reason}"
            )

        # 4. Determine trade side
        side = PositionSide.LONG if signal.action == SignalAction.BUY else PositionSide.SHORT

        # Validate stop loss geometry
        if side == PositionSide.LONG and signal.stop_loss >= signal.entry_price:
            return RiskCheckResult(
                is_approved=False,
                rejection_reason=f"LONG stop loss ({signal.stop_loss}) must be strictly below entry price ({signal.entry_price})"
            )
        elif side == PositionSide.SHORT and signal.stop_loss <= signal.entry_price:
            return RiskCheckResult(
                is_approved=False,
                rejection_reason=f"SHORT stop loss ({signal.stop_loss}) must be strictly above entry price ({signal.entry_price})"
            )

        # 5. Compute sizing with ATR adjustment & risk multiplier
        current_atr = ctx.get("atr")
        median_atr = ctx.get("median_atr")
        step_size = ctx.get("step_size", 0.0001)

        target_risk_pct = self.sizer.default_risk_pct * risk_multiplier

        try:
            units, notional, risk_usd, metrics = self.sizer.calculate_position_size(
                equity=portfolio.total_equity,
                entry_price=signal.entry_price,
                stop_loss=signal.stop_loss,
                current_atr=current_atr,
                median_atr=median_atr,
                custom_risk_pct=target_risk_pct,
                step_size=step_size
            )
        except Exception as e:
            return RiskCheckResult(
                is_approved=False,
                rejection_reason=f"Position sizing calculation failed: {str(e)}"
            )

        # Check minimum order size
        if notional < self.sizer.min_notional_usd:
            return RiskCheckResult(
                is_approved=False,
                rejection_reason=(
                    f"Position notional value (${notional:.2f}) is below exchange minimum "
                    f"(${self.sizer.min_notional_usd:.2f})"
                )
            )

        # 6. Evaluate Portfolio Allocation Constraints (Heat, concurrent slots, concentration)
        is_allowed, port_reason = self.portfolio_mgr.evaluate_new_position(
            symbol=signal.symbol,
            side=side,
            proposed_notional=notional,
            proposed_risk_usd=risk_usd,
            portfolio=portfolio
        )
        if not is_allowed:
            return RiskCheckResult(
                is_approved=False,
                rejection_reason=f"Portfolio allocation constraint: {port_reason}"
            )

        # Passed all 6 risk layers with flying colors
        warnings: List[str] = []
        if risk_multiplier < 1.0:
            warnings.append(f"Position size damped by {int((1.0 - risk_multiplier) * 100)}% due to consecutive loss guard")

        return RiskCheckResult(
            is_approved=True,
            approved_size=units,
            notional_value=notional,
            risk_usd=risk_usd,
            risk_pct_equity=(risk_usd / portfolio.total_equity) * 100.0,
            leverage=1.0,
            warnings=warnings,
            adjusted_parameters=metrics
        )

    def create_position_from_signal(
        self,
        signal: TradeSignal,
        risk_result: RiskCheckResult
    ) -> Position:
        """Instantiates a monitored Position object from an approved signal."""
        if not risk_result.is_approved or risk_result.approved_size <= 0:
            raise ValueError("Cannot create position from unapproved or zero-sized signal")

        side = PositionSide.LONG if signal.action == SignalAction.BUY else PositionSide.SHORT

        return Position(
            position_id=f"pos_{uuid.uuid4().hex[:8]}",
            symbol=signal.symbol,
            side=side,
            strategy_id=signal.strategy_id,
            entry_price=signal.entry_price,
            size=risk_result.approved_size,
            initial_size=risk_result.approved_size,
            initial_stop_loss=signal.stop_loss,
            current_stop_loss=signal.stop_loss,
            tp1=signal.tp1,
            tp2=signal.tp2,
            tp3=signal.tp3,
            leverage=risk_result.leverage,
            risk_usd=risk_result.risk_usd,
            metadata={"signal_id": signal.signal_id, "regime": signal.market_regime}
        )

    def register_position(self, position: Position, portfolio: Optional[PortfolioState] = None) -> None:
        """Registers an active position into portfolio tracking."""
        if portfolio is not None:
            portfolio.open_positions[position.symbol] = position

    def close_position(
        self,
        position_id: str,
        exit_price: float,
        reason: ExitReason = ExitReason.MANUAL,
        portfolio: Optional[PortfolioState] = None
    ) -> None:
        """Handles position closure accounting and releases margin."""
        if portfolio is not None:
            to_del = [sym for sym, pos in portfolio.open_positions.items() if pos.position_id == position_id]
            for sym in to_del:
                del portfolio.open_positions[sym]

    def process_portfolio_tick(
        self,
        portfolio: PortfolioState,
        current_prices: Dict[str, float],
        atrs: Optional[Dict[str, float]] = None
    ) -> List[TrailingAction]:
        """
        Tick/candle handler evaluating all active open positions for trailing stops or scale-outs.
        """
        all_actions: List[TrailingAction] = []
        atrs_dict = atrs or {}

        for symbol, position in list(portfolio.open_positions.items()):
            if symbol not in current_prices:
                continue

            current_price = current_prices[symbol]
            current_atr = atrs_dict.get(symbol)

            actions = self.trailing_mgr.evaluate_position(
                position=position,
                current_price=current_price,
                current_atr=current_atr
            )
            all_actions.extend(actions)

        return all_actions

    def calculate_parametric_var(
        self,
        portfolio: PortfolioState,
        confidence_level: float = 0.95,
        time_horizon_days: int = 1,
        assumed_daily_volatility: float = 0.035  # 3.5% typical crypto asset daily vol
    ) -> Dict[str, float]:
        """
        Calculates 1-Day Parametric Value at Risk (VaR) and Expected Shortfall (CVaR).
        """
        total_exposure = portfolio.total_exposure_usd
        if total_exposure <= 0:
            return {
                "var_usd": 0.0,
                "var_pct_equity": 0.0,
                "cvar_usd": 0.0,
                "confidence_level": confidence_level,
                "horizon_days": time_horizon_days
            }

        # Z-scores for standard confidence intervals
        z_scores = {0.90: 1.282, 0.95: 1.645, 0.99: 2.326}
        z = z_scores.get(confidence_level, 1.645)

        # Parametric VaR = Exposure * Z * sigma * sqrt(t)
        horizon_factor = math.sqrt(time_horizon_days)
        var_usd = total_exposure * z * assumed_daily_volatility * horizon_factor
        
        # Expected Shortfall (CVaR) approximation for normal distribution
        cvar_usd = var_usd * 1.25

        var_pct_equity = (var_usd / portfolio.total_equity) * 100.0 if portfolio.total_equity > 0 else 0.0

        return {
            "var_usd": round(var_usd, 2),
            "var_pct_equity": round(var_pct_equity, 2),
            "cvar_usd": round(cvar_usd, 2),
            "confidence_level": confidence_level,
            "horizon_days": time_horizon_days,
            "total_exposure_usd": round(total_exposure, 2)
        }
