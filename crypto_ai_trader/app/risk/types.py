"""
Risk, Position, and Portfolio Data Models.
Defines Position lifecycle, Portfolio state, Risk evaluation results, and Trailing actions.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class PositionSide(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"


class PositionStatus(str, Enum):
    OPEN = "OPEN"
    PARTIALLY_CLOSED = "PARTIALLY_CLOSED"
    CLOSED = "CLOSED"


class ExitReason(str, Enum):
    STOP_LOSS = "STOP_LOSS"
    TRAILING_STOP = "TRAILING_STOP"
    TAKE_PROFIT_1 = "TAKE_PROFIT_1"
    TAKE_PROFIT_2 = "TAKE_PROFIT_2"
    TAKE_PROFIT_3 = "TAKE_PROFIT_3"
    CIRCUIT_BREAKER = "CIRCUIT_BREAKER"
    TIME_STOP = "TIME_STOP"
    SIGNAL_REVERSAL = "SIGNAL_REVERSAL"
    MANUAL = "MANUAL"


@dataclass
class Position:
    """
    Tracks an active open trading position with real-time risk metrics.
    """
    position_id: str
    symbol: str
    side: PositionSide
    strategy_id: str
    entry_price: float
    size: float                         # Current open quantity
    initial_size: float                 # Original quantity at entry
    initial_stop_loss: float
    current_stop_loss: float
    tp1: float
    tp2: Optional[float] = None
    tp3: Optional[float] = None
    leverage: float = 1.0
    entry_time: float = field(default_factory=time.time)
    status: PositionStatus = PositionStatus.OPEN
    highest_price: float = 0.0          # For LONG trailing stops
    lowest_price: float = float("inf")  # For SHORT trailing stops
    tp1_hit: bool = False
    tp2_hit: bool = False
    breakeven_activated: bool = False
    realized_pnl: float = 0.0
    fees_paid: float = 0.0
    risk_usd: float = 0.0               # Original capital at risk in USD
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.highest_price == 0.0:
            self.highest_price = self.entry_price
        if self.lowest_price == float("inf"):
            self.lowest_price = self.entry_price
        if self.initial_size == 0.0:
            self.initial_size = self.size

    @property
    def notional_value(self) -> float:
        """Current notional value of open position."""
        return self.size * self.entry_price

    def calculate_unrealized_pnl(self, current_price: float) -> float:
        """Calculates unrealized PnL based on current market price."""
        if self.side == PositionSide.LONG:
            return (current_price - self.entry_price) * self.size
        else:
            return (self.entry_price - current_price) * self.size

    def calculate_pnl_percentage(self, current_price: float) -> float:
        """Calculates unrealized PnL percentage on invested margin."""
        if self.entry_price <= 0:
            return 0.0
        if self.side == PositionSide.LONG:
            return ((current_price - self.entry_price) / self.entry_price) * 100.0 * self.leverage
        else:
            return ((self.entry_price - current_price) / self.entry_price) * 100.0 * self.leverage


@dataclass
class PortfolioState:
    """
    Captures current account equity, open exposures, and daily drawdown metrics.
    """
    total_equity: float                 # Cash + Unrealized PnL
    available_cash: float               # Free cash available for margin
    peak_equity: float                  # Peak equity for drawdown tracking
    starting_equity_today: float        # Equity at start of day for daily loss circuit breaker
    realized_pnl_today: float = 0.0
    open_positions: Dict[str, Position] = field(default_factory=dict)
    consecutive_losses: int = 0
    trade_count_today: int = 0
    is_trading_halted: bool = False
    halt_reason: Optional[str] = None
    halt_expiry_time: float = 0.0

    @property
    def current_drawdown_pct(self) -> float:
        """Drawdown percentage from all-time peak equity."""
        if self.peak_equity <= 0:
            return 0.0
        dd = (self.peak_equity - self.total_equity) / self.peak_equity
        return max(0.0, dd * 100.0)

    @property
    def daily_loss_pct(self) -> float:
        """Daily loss percentage relative to starting equity today."""
        if self.starting_equity_today <= 0:
            return 0.0
        loss = (self.starting_equity_today - self.total_equity) / self.starting_equity_today
        return loss * 100.0

    @property
    def total_open_risk_usd(self) -> float:
        """Sum of capital at risk across all open positions."""
        return sum(pos.risk_usd for pos in self.open_positions.values())

    @property
    def total_open_risk_pct(self) -> float:
        """Total portfolio risk as percentage of total equity."""
        if self.total_equity <= 0:
            return 0.0
        return (self.total_open_risk_usd / self.total_equity) * 100.0

    @property
    def total_exposure_usd(self) -> float:
        """Total gross notional exposure of all open positions."""
        return sum(pos.notional_value for pos in self.open_positions.values())


@dataclass
class RiskCheckResult:
    """
    Result of evaluating a TradeSignal through all risk layers.
    """
    is_approved: bool
    approved_size: float = 0.0
    notional_value: float = 0.0
    risk_usd: float = 0.0
    risk_pct_equity: float = 0.0
    leverage: float = 1.0
    rejection_reason: Optional[str] = None
    warnings: List[str] = field(default_factory=list)
    adjusted_parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TrailingAction:
    """
    Action recommendation emitted by TrailingStopManager.
    """
    position_id: str
    symbol: str
    action_type: str                    # 'UPDATE_STOP', 'SCALE_OUT', 'CLOSE'
    new_stop_loss: Optional[float] = None
    scale_out_fraction: float = 0.0     # 0.5 for 50% scale-out
    exit_price: float = 0.0
    reason: str = ""
