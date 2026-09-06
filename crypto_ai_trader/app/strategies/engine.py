"""
Multi-Strategy Execution Engine.
Orchestrates registered strategies, evaluates real-time market data across symbols/timeframes,
enforces Regime Gating boundaries, eliminates conflicting signals, and outputs verified signals.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Type

try:
    from crypto_ai_trader.app.strategies.base import BaseStrategy, SignalAction, TradeSignal
    from crypto_ai_trader.app.strategies.trend import TrendFollowingStrategy
    from crypto_ai_trader.app.strategies.breakout import BreakoutStrategy
    from crypto_ai_trader.app.strategies.momentum import (
        EMAMomentumRSIStrategy, AdaptiveMomentumPulseStrategy
    )
    from crypto_ai_trader.app.strategies.mean_reversion import (
        StatisticalMeanReversionStrategy, VolatilityBreakoutStrategy
    )
    from crypto_ai_trader.app.ai.regime import MarketRegime, StrategyGatingMatrix
except ImportError:
    from app.strategies.base import BaseStrategy, SignalAction, TradeSignal  # type: ignore
    from app.strategies.trend import TrendFollowingStrategy  # type: ignore
    from app.strategies.breakout import BreakoutStrategy  # type: ignore
    from app.strategies.momentum import (  # type: ignore
        EMAMomentumRSIStrategy, AdaptiveMomentumPulseStrategy
    )
    from app.strategies.mean_reversion import (  # type: ignore
        StatisticalMeanReversionStrategy, VolatilityBreakoutStrategy
    )
    from app.ai.regime import MarketRegime, StrategyGatingMatrix  # type: ignore


logger = logging.getLogger("crypto_ai.strategies")


class StrategyRegistry:
    """Registry maintaining active and available strategy classes."""

    STRATEGY_MAP: Dict[str, Type[BaseStrategy]] = {
        "strategy_a": TrendFollowingStrategy,
        "strategy_b": EMAMomentumRSIStrategy,
        "strategy_c": BreakoutStrategy,
        "strategy_d": AdaptiveMomentumPulseStrategy,
        "strategy_e": StatisticalMeanReversionStrategy,
        "strategy_f": VolatilityBreakoutStrategy,
    }

    @classmethod
    def get_strategy_class(cls, strategy_id: str) -> Optional[Type[BaseStrategy]]:
        return cls.STRATEGY_MAP.get(strategy_id)


class MultiStrategyEngine:
    """
    Core engine managing all strategy instances.
    Coordinates parallel evaluation, conflict arbitration, regime compatibility,
    and signal validation.
    """

    def __init__(self, auto_load_all: bool = True):
        self.strategies: Dict[str, BaseStrategy] = {}
        if auto_load_all:
            self._register_default_strategies()

    def _register_default_strategies(self) -> None:
        """Instantiates and registers all 6 institutional strategies."""
        for strat_id, strat_cls in StrategyRegistry.STRATEGY_MAP.items():
            instance = strat_cls()
            self.strategies[strat_id] = instance

    def register_strategy(self, strategy: BaseStrategy) -> None:
        """Registers a custom strategy instance."""
        self.strategies[strategy.strategy_id] = strategy

    def get_strategy(self, strategy_id: str) -> Optional[BaseStrategy]:
        return self.strategies.get(strategy_id)

    def get_all_strategies(self) -> List[BaseStrategy]:
        return list(self.strategies.values())

    def evaluate_all(
        self,
        candles: List[Dict[str, Any]],
        regime: Optional[MarketRegime] = None,
        context: Optional[Dict[str, Any]] = None,
        filter_actionable: bool = True
    ) -> List[TradeSignal]:
        """
        Runs all registered strategies on the current market data.
        Enforces Regime Gating, validates risk-reward constraints,
        and optionally filters out NO_TRADE / HOLD signals.
        """
        all_signals: List[TradeSignal] = []

        for strat_id, strat in self.strategies.items():
            if not strat.is_enabled:
                continue

            # Check regime gating early
            if regime is not None and not strat.is_regime_compatible(regime):
                # Gated out by regime matrix
                continue

            try:
                sig = strat.generate_signal(candles, regime=regime, context=context)
                
                # Check validity of actionable signals
                if sig.action in (SignalAction.BUY, SignalAction.SELL):
                    is_val, val_msg = sig.is_valid(min_rr=1.4)
                    if not is_val:
                        logger.warning(f"Signal from {strat_id} failed R/R check: {val_msg}")
                        continue

                if filter_actionable:
                    if sig.action in (SignalAction.BUY, SignalAction.SELL):
                        all_signals.append(sig)
                else:
                    all_signals.append(sig)

            except Exception as e:
                logger.error(f"Error evaluating strategy {strat_id}: {e}", exc_info=True)

        return all_signals

    def arbitrate_signals(self, signals: List[TradeSignal]) -> Optional[TradeSignal]:
        """
        Resolves conflicts if multiple strategies produce conflicting signals (e.g. BUY vs SELL).
        Prioritizes by highest technical_score and confidence.
        If opposite directions exist with equal weight, rejects both to prevent whipsaws.
        """
        if not signals:
            return None

        buys = [s for s in signals if s.action == SignalAction.BUY]
        sells = [s for s in signals if s.action == SignalAction.SELL]

        if buys and sells:
            # Conflicting signals across strategies
            buy_score = sum(s.technical_score * s.confidence for s in buys)
            sell_score = sum(s.technical_score * s.confidence for s in sells)

            # Require significant margin (e.g. 1.5x) to take one over the other
            if buy_score > sell_score * 1.5:
                # Prioritize strongest BUY
                return max(buys, key=lambda s: s.technical_score * s.confidence)
            elif sell_score > buy_score * 1.5:
                return max(sells, key=lambda s: s.technical_score * s.confidence)
            else:
                # Conflicted: do not trade
                logger.warning(
                    f"Conflicting signals cancelled: {len(buys)} BUY vs {len(sells)} SELL. Arbitrage vetoed."
                )
                return None

        if buys:
            return max(buys, key=lambda s: s.technical_score * s.confidence)
        if sells:
            return max(sells, key=lambda s: s.technical_score * s.confidence)

        return None
