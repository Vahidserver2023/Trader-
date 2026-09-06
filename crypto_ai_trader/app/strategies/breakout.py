"""
Strategy C: Multi-Timeframe Breakout & Squeeze Expansion.
Exploits volatility compression (Bollinger Band Squeeze) and sudden volume surges.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional, Tuple

try:
    from crypto_ai_trader.app.strategies.base import BaseStrategy, SignalAction, TradeSignal
    from crypto_ai_trader.app.indicators.technical import (
        calculate_bollinger_bands, calculate_atr, calculate_sma
    )
    from crypto_ai_trader.app.ai.regime import MarketRegime
except ImportError:
    from app.strategies.base import BaseStrategy, SignalAction, TradeSignal  # type: ignore
    from app.indicators.technical import calculate_bollinger_bands, calculate_atr, calculate_sma  # type: ignore
    from app.ai.regime import MarketRegime  # type: ignore


class BreakoutStrategy(BaseStrategy):
    """
    Multi-Timeframe Breakout Strategy (Strategy C).
    - Identifies squeeze consolidation: Bandwidth < squeeze_threshold (e.g. 5.0%)
    - Breakout trigger: Close breaks outside Upper Band (Long) or Lower Band (Short)
    - Volume filter: Current volume > volume_factor * 20-period Volume SMA
    - Dynamic Stop Loss at opposite Band or 1.5x ATR
    - Multi-stage take profits (TP1=1.5R, TP2=3.0R)
    """

    def __init__(self, params: Optional[Dict[str, Any]] = None):
        default_params = {
            "bb_period": 20,
            "bb_std_dev": 2.0,
            "squeeze_bandwidth": 6.5,
            "vol_period": 20,
            "vol_multiplier": 1.4,
            "atr_period": 14,
            "atr_sl_mult": 1.5,
            "tp1_rr": 1.5,
            "tp2_rr": 3.0,
        }
        if params:
            default_params.update(params)
        super().__init__(
            strategy_id="strategy_c",
            name="Multi-Timeframe Breakout",
            params=default_params
        )

    def validate_parameters(self, params: Dict[str, Any]) -> bool:
        if params.get("bb_period", 20) <= 0:
            raise ValueError("bb_period must be positive")
        if params.get("bb_std_dev", 2.0) <= 0:
            raise ValueError("bb_std_dev must be positive")
        if params.get("vol_multiplier", 1.4) < 1.0:
            raise ValueError("vol_multiplier must be >= 1.0")
        return True

    def get_required_indicators(self) -> List[str]:
        return [
            f"bb_{self.params['bb_period']}_{self.params['bb_std_dev']}",
            f"vol_sma_{self.params['vol_period']}",
            f"atr_{self.params['atr_period']}"
        ]

    def generate_signal(
        self,
        candles: List[Dict[str, Any]],
        regime: Optional[MarketRegime] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> TradeSignal:
        if not candles or len(candles) < self.params["bb_period"] + 5:
            return self.create_no_trade_signal(
                symbol=candles[-1].get("symbol", "UNKNOWN") if candles else "UNKNOWN",
                timeframe=candles[-1].get("timeframe", "1h") if candles else "1h",
                reason="Insufficient candles for Bollinger Bands"
            )

        symbol = candles[-1].get("symbol", "BTC/USDT")
        timeframe = candles[-1].get("timeframe", "1h")

        if regime is not None and not self.is_regime_compatible(regime):
            return self.create_no_trade_signal(
                symbol=symbol,
                timeframe=timeframe,
                reason=f"Strategy {self.strategy_id} gated by regime {regime.value}",
                regime=regime.value
            )

        closes = [c["close"] for c in candles]
        highs = [c["high"] for c in candles]
        lows = [c["low"] for c in candles]
        volumes = [float(c.get("volume", 0.0)) for c in candles]

        latest_c = candles[-1]
        close_t = latest_c["close"]
        vol_t = float(latest_c.get("volume", 0.0))
        ts = latest_c.get("timestamp", 0)

        bb_dict = calculate_bollinger_bands(
            closes, self.params["bb_period"], self.params["bb_std_dev"]
        )
        upper = bb_dict["upper"]
        middle = bb_dict["middle"]
        lower = bb_dict["lower"]
        bandwidth = bb_dict["bandwidth"]
        vol_smas = calculate_sma(volumes, self.params["vol_period"])
        atr_vals = calculate_atr(highs, lows, closes, self.params["atr_period"])

        if (
            upper[-1] is None or lower[-1] is None or middle[-1] is None or
            bandwidth[-1] is None or vol_smas[-1] is None or atr_vals[-1] is None
        ):
            return self.create_no_trade_signal(symbol, timeframe, "Warmup incomplete")

        u, m, l, bw = upper[-1], middle[-1], lower[-1], bandwidth[-1]
        vol_sma = vol_smas[-1] or 1.0
        cur_atr = atr_vals[-1]

        # Look for squeeze in previous 3 bars
        recent_bws = [bw_val for bw_val in bandwidth[-4:-1] if bw_val is not None]
        was_squeezed = any(b <= self.params["squeeze_bandwidth"] for b in recent_bws) if recent_bws else False
        vol_surge = (vol_t >= vol_sma * self.params["vol_multiplier"]) or (vol_sma == 0)

        # Bullish Breakout (Candle closes above Upper Band)
        if close_t > u and (was_squeezed or bw <= self.params["squeeze_bandwidth"] * 1.5) and vol_surge:
            sl_dist = max(cur_atr * self.params["atr_sl_mult"], close_t - m, close_t * 0.01)
            stop_loss = round(close_t - sl_dist, 4)
            tp1 = round(close_t + (sl_dist * self.params["tp1_rr"]), 4)
            tp2 = round(close_t + (sl_dist * self.params["tp2_rr"]), 4)

            return TradeSignal(
                signal_id=f"sig_{uuid.uuid4().hex[:12]}",
                strategy_id=self.strategy_id,
                symbol=symbol,
                timeframe=timeframe,
                action=SignalAction.BUY,
                entry_price=close_t,
                stop_loss=stop_loss,
                tp1=tp1,
                tp2=tp2,
                tp3=round(close_t + (sl_dist * 4.5), 4),
                market_regime=regime.value if regime else "BREAKOUT_EXPANSION",
                technical_score=88.0,
                confidence=0.86,
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"Bollinger Squeeze Breakout: Close {close_t:.2f} > Upper {u:.2f}",
                    f"Bandwidth expansion from squeeze ({bw:.1f}%)",
                    f"Volume surge {vol_t:.1f} vs SMA {vol_sma:.1f} ({vol_t / (vol_sma or 1):.2f}x)"
                ],
                metadata={"bandwidth": bw, "upper_band": u, "middle_band": m, "atr": cur_atr},
                timestamp=ts
            )

        # Bearish Breakdown (Candle closes below Lower Band)
        if close_t < l and (was_squeezed or bw <= self.params["squeeze_bandwidth"] * 1.5) and vol_surge:
            sl_dist = max(cur_atr * self.params["atr_sl_mult"], m - close_t, close_t * 0.01)
            stop_loss = round(close_t + sl_dist, 4)
            tp1 = round(close_t - (sl_dist * self.params["tp1_rr"]), 4)
            tp2 = round(close_t - (sl_dist * self.params["tp2_rr"]), 4)

            return TradeSignal(
                signal_id=f"sig_{uuid.uuid4().hex[:12]}",
                strategy_id=self.strategy_id,
                symbol=symbol,
                timeframe=timeframe,
                action=SignalAction.SELL,
                entry_price=close_t,
                stop_loss=stop_loss,
                tp1=tp1,
                tp2=tp2,
                tp3=round(close_t - (sl_dist * 4.5), 4),
                market_regime=regime.value if regime else "BREAKOUT_EXPANSION",
                technical_score=88.0,
                confidence=0.86,
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"Bollinger Breakdown: Close {close_t:.2f} < Lower {l:.2f}",
                    f"Bandwidth expansion ({bw:.1f}%)",
                    f"Volume confirmation: {vol_t / (vol_sma or 1):.2f}x average"
                ],
                metadata={"bandwidth": bw, "lower_band": l, "middle_band": m, "atr": cur_atr},
                timestamp=ts
            )

        return self.create_no_trade_signal(
            symbol, timeframe,
            f"No breakout (Close={close_t:.1f}, U={u:.1f}, L={l:.1f}, Squeeze={was_squeezed}, VolSurge={vol_surge})"
        )

    def should_exit(
        self,
        position: Dict[str, Any],
        current_candle: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str]:
        side = position.get("side", "BUY")
        close_p = current_candle.get("close", 0.0)
        middle_band = context.get("middle_band") if context else None

        if middle_band:
            if side == "BUY" and close_p < middle_band:
                return True, f"Breakout failed: Close {close_p:.2f} reverted back inside Middle Band ({middle_band:.2f})"
            elif side == "SELL" and close_p > middle_band:
                return True, f"Breakdown failed: Close {close_p:.2f} reverted back inside Middle Band ({middle_band:.2f})"

        return False, "Breakout expansion continuing"
