"""
Institutional Position Sizing Module.
Implements Fixed Fractional Sizing, ATR Volatility-Adjusted Sizing,
Half-Kelly Criterion, and Absolute Capital Exposure Limits.
"""

from __future__ import annotations

import math
from typing import Dict, Optional, Tuple


class PositionSizer:
    """
    Computes mathematically rigorous position sizes with risk caps and volatility adjustment.
    """

    def __init__(
        self,
        default_risk_pct: float = 1.5,       # 1.5% equity risk per trade
        max_risk_pct: float = 2.5,           # Hard ceiling 2.5% per trade
        min_risk_pct: float = 0.5,           # Floor 0.5%
        max_position_equity_pct: float = 20.0, # Max 20% total equity in single trade notional
        min_notional_usd: float = 10.0,      # Minimum exchange order size
        use_half_kelly: bool = False,
        default_win_rate: float = 0.52,      # Historical win rate for Kelly
        default_payoff_ratio: float = 1.8    # Historical win/loss ratio for Kelly
    ):
        self.default_risk_pct = default_risk_pct
        self.max_risk_pct = max_risk_pct
        self.min_risk_pct = min_risk_pct
        self.max_position_equity_pct = max_position_equity_pct
        self.min_notional_usd = min_notional_usd
        self.use_half_kelly = use_half_kelly
        self.default_win_rate = default_win_rate
        self.default_payoff_ratio = default_payoff_ratio

    def calculate_half_kelly_risk_fraction(
        self,
        win_rate: Optional[float] = None,
        payoff_ratio: Optional[float] = None
    ) -> float:
        """
        Calculates conservative Half-Kelly fraction:
        Kelly = (p * b - (1 - p)) / b
        Half-Kelly = 0.5 * Kelly, capped safely between min_risk_pct and max_risk_pct.
        """
        p = win_rate if win_rate is not None else self.default_win_rate
        b = payoff_ratio if payoff_ratio is not None else self.default_payoff_ratio
        
        if b <= 0 or p <= 0:
            return self.default_risk_pct / 100.0

        q = 1.0 - p
        full_kelly = (p * b - q) / b

        if full_kelly <= 0:
            return self.min_risk_pct / 100.0

        half_kelly = full_kelly * 0.5
        
        # Enforce bounds
        min_frac = self.min_risk_pct / 100.0
        max_frac = self.max_risk_pct / 100.0
        return max(min_frac, min(max_frac, half_kelly))

    def calculate_position_size(
        self,
        equity: float,
        entry_price: float,
        stop_loss: float,
        current_atr: Optional[float] = None,
        median_atr: Optional[float] = None,
        custom_risk_pct: Optional[float] = None,
        step_size: float = 0.0001
    ) -> Tuple[float, float, float, Dict[str, float]]:
        """
        Calculates optimal position size in asset base units.
        Returns:
            (size_units, notional_usd, risk_usd, metrics_dict)
        """
        if equity <= 0:
            raise ValueError(f"Equity must be positive, got {equity}")
        if entry_price <= 0:
            raise ValueError(f"Entry price must be positive, got {entry_price}")
        if stop_loss <= 0:
            raise ValueError(f"Stop loss must be positive, got {stop_loss}")

        stop_distance = abs(entry_price - stop_loss)
        if stop_distance <= 0:
            raise ValueError("Stop loss cannot equal entry price (stop distance is 0)")

        # Determine target risk fraction
        if custom_risk_pct is not None:
            risk_pct = max(self.min_risk_pct, min(self.max_risk_pct, custom_risk_pct))
            risk_fraction = risk_pct / 100.0
        elif self.use_half_kelly:
            risk_fraction = self.calculate_half_kelly_risk_fraction()
        else:
            risk_fraction = self.default_risk_pct / 100.0

        target_risk_usd = equity * risk_fraction

        # Volatility adjustment via ATR scaling
        volatility_multiplier = 1.0
        if current_atr and median_atr and current_atr > 0 and median_atr > 0:
            vol_ratio = current_atr / median_atr
            if vol_ratio > 1.2:
                # Dampen sizing during elevated volatility spikes
                volatility_multiplier = max(0.4, 1.0 / (vol_ratio ** 0.5))

        adjusted_risk_usd = target_risk_usd * volatility_multiplier

        # Raw unit size based on stop distance
        raw_units = adjusted_risk_usd / stop_distance
        raw_notional = raw_units * entry_price

        # Cap max notional by maximum position equity percentage (e.g. 20% of account)
        max_notional_cap = equity * (self.max_position_equity_pct / 100.0)
        actual_notional = min(raw_notional, max_notional_cap)
        capped_units = actual_notional / entry_price

        # Quantize units to step_size
        precision_digits = max(0, -int(math.floor(math.log10(step_size)))) if step_size > 0 else 4
        final_units = round(math.floor(capped_units / step_size) * step_size, precision_digits)
        final_notional = final_units * entry_price
        final_risk_usd = final_units * stop_distance

        metrics = {
            "target_risk_usd": target_risk_usd,
            "volatility_multiplier": volatility_multiplier,
            "max_notional_cap": max_notional_cap,
            "stop_distance": stop_distance,
            "stop_distance_pct": (stop_distance / entry_price) * 100.0,
            "effective_risk_pct": (final_risk_usd / equity) * 100.0 if equity > 0 else 0.0,
            "capital_allocation_pct": (final_notional / equity) * 100.0 if equity > 0 else 0.0
        }

        return final_units, final_notional, final_risk_usd, metrics
