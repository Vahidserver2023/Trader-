"""
Capital Protection Circuit Breaker Module.
Halts trading during severe drawdowns, daily loss threshold breaches,
or consecutive loss clusters to prevent account ruin.
"""

from __future__ import annotations

import time
from typing import Optional, Tuple
try:
    from crypto_ai_trader.app.risk.types import PortfolioState
except ImportError:
    from app.risk.types import PortfolioState  # type: ignore


class CircuitBreaker:
    """
    Automated risk circuit breaker protecting portfolio equity from catastrophic losses.
    """

    def __init__(
        self,
        max_daily_loss_pct: float = 3.0,       # Halt trading if daily loss exceeds 3%
        max_drawdown_pct: float = 6.0,         # Halt trading if total drawdown exceeds 6%
        consecutive_losses_threshold: int = 3, # Halve risk after 3 consecutive losses
        emergency_halt_cooldown_hours: float = 24.0
    ):
        self.max_daily_loss_pct = max_daily_loss_pct
        self.max_drawdown_pct = max_drawdown_pct
        self.consecutive_losses_threshold = consecutive_losses_threshold
        self.emergency_halt_cooldown_hours = emergency_halt_cooldown_hours

    def check_portfolio(self, portfolio: PortfolioState) -> Tuple[bool, Optional[str], float]:
        """
        Validates whether trading should continue or be halted.
        Returns:
            (is_halted, halt_reason, risk_reduction_factor)
        """
        current_time = time.time()

        # Check if already in an active halt
        if portfolio.is_trading_halted:
            if portfolio.halt_expiry_time > 0 and current_time < portfolio.halt_expiry_time:
                remaining_hours = (portfolio.halt_expiry_time - current_time) / 3600.0
                return True, f"{portfolio.halt_reason} (Active cooldown: {remaining_hours:.1f}h remaining)", 0.0
            elif portfolio.halt_expiry_time > 0 and current_time >= portfolio.halt_expiry_time:
                # Cooldown expired, lift temporary halt
                portfolio.is_trading_halted = False
                portfolio.halt_reason = None
                portfolio.halt_expiry_time = 0.0

        # 1. Daily Loss Limit Check
        daily_loss = portfolio.daily_loss_pct
        if daily_loss >= self.max_daily_loss_pct:
            reason = f"Daily loss limit breached ({daily_loss:.2f}% >= {self.max_daily_loss_pct}% max allowable)"
            portfolio.is_trading_halted = True
            portfolio.halt_reason = reason
            portfolio.halt_expiry_time = current_time + (self.emergency_halt_cooldown_hours * 3600.0)
            return True, reason, 0.0

        # 2. Maximum Drawdown Check
        max_dd = portfolio.current_drawdown_pct
        if max_dd >= self.max_drawdown_pct:
            reason = f"Maximum drawdown threshold reached ({max_dd:.2f}% >= {self.max_drawdown_pct}% ceiling)"
            portfolio.is_trading_halted = True
            portfolio.halt_reason = reason
            portfolio.halt_expiry_time = current_time + (self.emergency_halt_cooldown_hours * 3600.0)
            return True, reason, 0.0

        # 3. Consecutive Loss Guard (Adaptive Risk Reduction)
        risk_multiplier = 1.0
        if portfolio.consecutive_losses >= self.consecutive_losses_threshold:
            # Dampen position risk by 50% to prevent revenge trading or negative clustering
            risk_multiplier = 0.5

        return False, None, risk_multiplier

    def trip(self, portfolio: PortfolioState, reason: str = "Manual emergency halt") -> None:
        """Immediately trip and activate emergency trading halt."""
        portfolio.is_trading_halted = True
        portfolio.halt_reason = reason
        portfolio.halt_expiry_time = time.time() + (self.emergency_halt_cooldown_hours * 3600.0)

    def is_halted(self, portfolio: PortfolioState) -> bool:
        """Check if trading is currently halted."""
        return portfolio.is_trading_halted

    def reset_halt(self, portfolio: PortfolioState, reason: str = "Manual admin reset"):
        """Admin override to reset active circuit breaker halt."""
        portfolio.is_trading_halted = False
        portfolio.halt_reason = None
        portfolio.halt_expiry_time = 0.0
