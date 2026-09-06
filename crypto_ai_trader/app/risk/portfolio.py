"""
Portfolio Risk & Allocation Manager.
Enforces aggregate portfolio heat limits, concurrent position caps,
single-asset concentration thresholds, and available margin verification.
"""

from __future__ import annotations

from typing import List, Optional, Tuple
try:
    from crypto_ai_trader.app.risk.types import PortfolioState, Position, PositionSide
except ImportError:
    from app.risk.types import PortfolioState, Position, PositionSide  # type: ignore


class PortfolioRiskManager:
    """
    Guarantees aggregate portfolio health and enforces capital allocation limits.
    """

    def __init__(
        self,
        max_open_positions: int = 5,
        max_aggregate_risk_pct: float = 6.0,   # Max 6% total portfolio heat at any moment
        max_asset_exposure_pct: float = 30.0,  # Max 30% notional in single asset
        max_correlated_alts: int = 3,          # Limit concurrent altcoins against USDT
        min_margin_buffer_pct: float = 15.0    # Keep at least 15% cash uncommitted
    ):
        self.max_open_positions = max_open_positions
        self.max_aggregate_risk_pct = max_aggregate_risk_pct
        self.max_asset_exposure_pct = max_asset_exposure_pct
        self.max_correlated_alts = max_correlated_alts
        self.min_margin_buffer_pct = min_margin_buffer_pct

    def evaluate_new_position(
        self,
        symbol: str,
        side: PositionSide,
        proposed_notional: float,
        proposed_risk_usd: float,
        portfolio: PortfolioState
    ) -> Tuple[bool, Optional[str]]:
        """
        Validates whether the proposed position complies with portfolio-wide constraints.
        Returns:
            (is_allowed, rejection_reason)
        """
        # 1. Check maximum concurrent positions
        current_open_count = len(portfolio.open_positions)
        if current_open_count >= self.max_open_positions:
            return False, f"Maximum concurrent positions reached ({current_open_count}/{self.max_open_positions})"

        # 2. Check duplicate symbol position
        if symbol in portfolio.open_positions:
            existing = portfolio.open_positions[symbol]
            return False, f"Active position already open for {symbol} (Side: {existing.side.value})"

        # 3. Check aggregate portfolio risk (Heat Limit)
        current_risk_usd = portfolio.total_open_risk_usd
        projected_risk_usd = current_risk_usd + proposed_risk_usd
        projected_risk_pct = (projected_risk_usd / portfolio.total_equity) * 100.0 if portfolio.total_equity > 0 else 100.0

        if projected_risk_pct > self.max_aggregate_risk_pct:
            return False, (
                f"Aggregate portfolio risk limit exceeded "
                f"({projected_risk_pct:.2f}% > {self.max_aggregate_risk_pct:.2f}% max allowed heat)"
            )

        # 4. Check single asset concentration limit
        symbol_base = symbol.split("/")[0] if "/" in symbol else symbol
        current_symbol_notional = sum(
            pos.notional_value for pos in portfolio.open_positions.values() 
            if pos.symbol.startswith(symbol_base)
        )
        projected_asset_notional = current_symbol_notional + proposed_notional
        projected_asset_pct = (projected_asset_notional / portfolio.total_equity) * 100.0 if portfolio.total_equity > 0 else 100.0

        if projected_asset_pct > self.max_asset_exposure_pct:
            return False, (
                f"Asset concentration limit exceeded for {symbol_base} "
                f"({projected_asset_pct:.2f}% > {self.max_asset_exposure_pct:.2f}% ceiling)"
            )

        # 5. Check altcoin correlation limit (non-BTC/ETH)
        major_coins = {"BTC", "ETH", "USDT", "USDC"}
        if symbol_base not in major_coins:
            current_alts = sum(
                1 for pos in portfolio.open_positions.values()
                if pos.symbol.split("/")[0] not in major_coins
            )
            if current_alts >= self.max_correlated_alts:
                return False, f"Maximum concurrent altcoin limit reached ({current_alts}/{self.max_correlated_alts})"

        # 6. Check available cash / margin buffer
        required_margin = proposed_notional
        min_cash_required = portfolio.total_equity * (self.min_margin_buffer_pct / 100.0)
        remaining_cash = portfolio.available_cash - required_margin

        if remaining_cash < min_cash_required:
            return False, (
                f"Insufficient margin buffer: remaining cash (${remaining_cash:.2f}) "
                f"would fall below required {self.min_margin_buffer_pct}% reserve (${min_cash_required:.2f})"
            )

        return True, None
