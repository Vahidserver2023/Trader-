"""
Market Regime Classification & Strategy Gating Engine.
Categorizes current market dynamics into 7 distinct regimes using
vectorized indicators, volatility compression/expansion, and trend matrices.
Enforces strict strategy gating to disable incompatible strategies.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple


class MarketRegime(str, Enum):
    """Formal market regime classifications."""
    STRONG_BULL = "STRONG_BULL"
    BULL = "BULL"
    SIDEWAYS = "SIDEWAYS"
    BEAR = "BEAR"
    STRONG_BEAR = "STRONG_BEAR"
    HIGH_VOLATILITY = "HIGH_VOLATILITY"
    LOW_VOLATILITY = "LOW_VOLATILITY"


@dataclass
class MarketRegimeReport:
    """Comprehensive diagnostic payload for market regime analysis."""
    regime: MarketRegime
    confidence: float  # 0.0 to 1.0
    adx: float
    atr_ratio: float  # Current ATR / Baseline ATR
    trend_alignment: str  # "BULLISH_STACK", "BEARISH_STACK", "MIXED"
    price_to_ema50_pct: float
    price_to_ema200_pct: float
    rsi: float
    volume_ratio: float  # Current Volume / Mean Volume
    bb_bandwidth: float
    compatible_strategies: List[str]
    deactivated_strategies: List[str]
    rationale: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class StrategyGatingMatrix:
    """
    Defines hard architectural boundaries between market regimes
    and the 6 standard trading strategies.
    """

    STRATEGY_REGIME_MAP: Dict[MarketRegime, Tuple[List[str], List[str]]] = {
        MarketRegime.STRONG_BULL: (
            ["strategy_a", "strategy_b", "strategy_c", "strategy_d", "strategy_f"],
            ["strategy_e"]  # Mean Reversion forbidden in parabolic bull run
        ),
        MarketRegime.BULL: (
            ["strategy_a", "strategy_b", "strategy_c", "strategy_d"],
            ["strategy_e"]
        ),
        MarketRegime.SIDEWAYS: (
            ["strategy_e"],  # Mean Reversion / Range Trading active
            ["strategy_a", "strategy_c", "strategy_d"]  # Trend & Breakout get chopped
        ),
        MarketRegime.BEAR: (
            ["strategy_a", "strategy_b", "strategy_d"],
            ["strategy_e"]
        ),
        MarketRegime.STRONG_BEAR: (
            ["strategy_a", "strategy_d", "strategy_f"],
            ["strategy_e", "strategy_b"]  # Counter-trend / pullbacks get crushed
        ),
        MarketRegime.HIGH_VOLATILITY: (
            ["strategy_f", "strategy_c"],  # ATR Impulse and Volatility Breakout
            ["strategy_e", "strategy_b"]  # Tight stop strategies will be wiped
        ),
        MarketRegime.LOW_VOLATILITY: (
            ["strategy_c", "strategy_e"],  # Range scalping and Squeeze anticipation
            ["strategy_f", "strategy_d"]
        )
    }

    @classmethod
    def get_allowed_strategies(cls, regime: MarketRegime) -> List[str]:
        return cls.STRATEGY_REGIME_MAP.get(regime, ([], []))[0]

    @classmethod
    def get_forbidden_strategies(cls, regime: MarketRegime) -> List[str]:
        return cls.STRATEGY_REGIME_MAP.get(regime, ([], []))[1]


class MarketRegimeClassifier:
    """
    Rule-based & statistical classifier determining current regime
    from raw OHLCV and technical indicator series.
    """

    def __init__(
        self,
        adx_trend_threshold: float = 25.0,
        adx_strong_threshold: float = 35.0,
        high_volatility_atr_ratio: float = 1.65,
        low_volatility_atr_ratio: float = 0.70,
        bb_squeeze_bandwidth: float = 4.0
    ):
        self.adx_trend_threshold = adx_trend_threshold
        self.adx_strong_threshold = adx_strong_threshold
        self.high_vol_ratio = high_volatility_atr_ratio
        self.low_vol_ratio = low_volatility_atr_ratio
        self.bb_squeeze_bandwidth = bb_squeeze_bandwidth

    def classify(
        self,
        close: float,
        ema_50: Optional[float],
        ema_200: Optional[float],
        adx: Optional[float],
        atr: Optional[float],
        baseline_atr: Optional[float],
        rsi: Optional[float] = 50.0,
        volume: Optional[float] = 1.0,
        baseline_volume: Optional[float] = 1.0,
        bb_bandwidth: Optional[float] = 6.0
    ) -> MarketRegimeReport:
        """
        Evaluates the latest bar's parameters and yields a structured MarketRegimeReport.
        """
        # Safe fallbacks for missing indicator points
        curr_adx = adx if adx is not None and not math.isnan(adx) else 20.0
        curr_rsi = rsi if rsi is not None and not math.isnan(rsi) else 50.0
        curr_bw = bb_bandwidth if bb_bandwidth is not None and not math.isnan(bb_bandwidth) else 6.0
        
        atr_ratio = 1.0
        if atr is not None and baseline_atr is not None and baseline_atr > 0:
            atr_ratio = atr / baseline_atr
            
        vol_ratio = 1.0
        if volume is not None and baseline_volume is not None and baseline_volume > 0:
            vol_ratio = volume / baseline_volume

        # Determine Trend Alignment
        price_to_ema50 = 0.0
        price_to_ema200 = 0.0
        trend_alignment = "MIXED"
        
        if ema_50 is not None and ema_50 > 0:
            price_to_ema50 = ((close - ema_50) / ema_50) * 100.0
            
        if ema_200 is not None and ema_200 > 0:
            price_to_ema200 = ((close - ema_200) / ema_200) * 100.0
            
        if ema_50 is not None and ema_200 is not None:
            if close > ema_50 and ema_50 > ema_200:
                trend_alignment = "BULLISH_STACK"
            elif close < ema_50 and ema_50 < ema_200:
                trend_alignment = "BEARISH_STACK"

        # Classification Hierarchy
        regime: MarketRegime
        confidence: float
        rationale: str

        # 1. High Volatility Check (Spike in ATR or massive volatility expansion)
        if atr_ratio >= self.high_vol_ratio:
            regime = MarketRegime.HIGH_VOLATILITY
            confidence = min(0.95, 0.65 + (atr_ratio - self.high_vol_ratio) * 0.4)
            rationale = (
                f"ATR Ratio ({atr_ratio:.2f}x) exceeds high-volatility threshold ({self.high_vol_ratio}x). "
                f"Bandwidth is {curr_bw:.1f}%. High risk of slippage."
            )

        # 2. Strong Bull Regime
        elif trend_alignment == "BULLISH_STACK" and curr_adx >= self.adx_strong_threshold and curr_rsi >= 55.0:
            regime = MarketRegime.STRONG_BULL
            confidence = min(0.98, 0.70 + (curr_adx / 100.0) * 0.3)
            rationale = (
                f"Bullish stack (Close > EMA50 > EMA200) with strong directional momentum: "
                f"ADX={curr_adx:.1f}, RSI={curr_rsi:.1f}."
            )

        # 3. Strong Bear Regime
        elif trend_alignment == "BEARISH_STACK" and curr_adx >= self.adx_strong_threshold and curr_rsi <= 45.0:
            regime = MarketRegime.STRONG_BEAR
            confidence = min(0.98, 0.70 + (curr_adx / 100.0) * 0.3)
            rationale = (
                f"Bearish stack (Close < EMA50 < EMA200) with powerful downward momentum: "
                f"ADX={curr_adx:.1f}, RSI={curr_rsi:.1f}."
            )

        # 4. Standard Bull Regime
        elif trend_alignment == "BULLISH_STACK" or (close > (ema_50 or close) and curr_rsi >= 50.0 and curr_adx >= self.adx_trend_threshold):
            regime = MarketRegime.BULL
            confidence = 0.80
            rationale = (
                f"Upward trend established: Price above EMA50, ADX={curr_adx:.1f} indicates healthy trend strength."
            )

        # 5. Standard Bear Regime
        elif trend_alignment == "BEARISH_STACK" or (close < (ema_50 or close) and curr_rsi <= 50.0 and curr_adx >= self.adx_trend_threshold):
            regime = MarketRegime.BEAR
            confidence = 0.80
            rationale = (
                f"Downward trend established: Price below EMA50, ADX={curr_adx:.1f} confirms downward momentum."
            )

        # 6. Low Volatility Compression (Bollinger Squeeze)
        elif atr_ratio <= self.low_vol_ratio or curr_bw <= self.bb_squeeze_bandwidth:
            regime = MarketRegime.LOW_VOLATILITY
            confidence = 0.85
            rationale = (
                f"Volatility compression: ATR ratio {atr_ratio:.2f}x <= {self.low_vol_ratio}x "
                f"or Bollinger Bandwidth {curr_bw:.1f}% <= {self.bb_squeeze_bandwidth}%."
            )

        # 7. Default: Sideways / Range-Bound
        else:
            regime = MarketRegime.SIDEWAYS
            confidence = 0.78
            rationale = (
                f"Non-trending market: ADX={curr_adx:.1f} is below trend threshold ({self.adx_trend_threshold}). "
                f"Oscillating around EMAs with neutral RSI ({curr_rsi:.1f})."
            )

        compatible = StrategyGatingMatrix.get_allowed_strategies(regime)
        deactivated = StrategyGatingMatrix.get_forbidden_strategies(regime)

        return MarketRegimeReport(
            regime=regime,
            confidence=round(confidence, 2),
            adx=round(curr_adx, 2),
            atr_ratio=round(atr_ratio, 2),
            trend_alignment=trend_alignment,
            price_to_ema50_pct=round(price_to_ema50, 2),
            price_to_ema200_pct=round(price_to_ema200, 2),
            rsi=round(curr_rsi, 2),
            volume_ratio=round(vol_ratio, 2),
            bb_bandwidth=round(curr_bw, 2),
            compatible_strategies=compatible,
            deactivated_strategies=deactivated,
            rationale=rationale
        )
