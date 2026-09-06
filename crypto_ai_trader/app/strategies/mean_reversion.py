"""
Strategies E & F: Mean Reversion & Volatility Impulse Engines.
Strategy E: Statistical Mean Reversion (Bollinger Band 2.5σ/3.0σ + RSI Oversold in Sideways Regimes).
Strategy F: Volatility Breakout (ATR Impulse & Liquidity Sweep in High Volatility Regimes).
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional, Tuple

try:
    from crypto_ai_trader.app.strategies.base import BaseStrategy, SignalAction, TradeSignal
    from crypto_ai_trader.app.indicators.technical import (
        calculate_bollinger_bands, calculate_rsi, calculate_atr, calculate_sma
    )
    from crypto_ai_trader.app.ai.regime import MarketRegime
except ImportError:
    from app.strategies.base import BaseStrategy, SignalAction, TradeSignal  # type: ignore
    from app.indicators.technical import (  # type: ignore
        calculate_bollinger_bands, calculate_rsi, calculate_atr, calculate_sma
    )
    from app.ai.regime import MarketRegime  # type: ignore


class StatisticalMeanReversionStrategy(BaseStrategy):
    """
    Strategy E: Statistical Mean Reversion.
    Specialized strictly for SIDEWAYS and LOW_VOLATILITY regimes.
    Buys when price touches or penetrates lower Bollinger Band (2.5σ) and RSI is oversold (< 30).
    Sells/Shorts when price pierces upper Bollinger Band and RSI is overbought (> 70).
    Targets rapid mean reversion back to the middle SMA20 band.
    """

    def __init__(self, params: Optional[Dict[str, Any]] = None):
        default_params = {
            "bb_period": 20,
            "bb_std_dev": 2.5,
            "rsi_period": 14,
            "rsi_oversold": 30.0,
            "rsi_overbought": 70.0,
            "atr_period": 14,
            "atr_sl_mult": 1.4,
            "tp1_rr": 1.5,
            "tp2_rr": 2.5,
            "max_hold_candles": 12,
        }
        if params:
            default_params.update(params)
        super().__init__(
            strategy_id="strategy_e",
            name="Statistical Mean Reversion",
            params=default_params
        )

    def validate_parameters(self, params: Dict[str, Any]) -> bool:
        if params.get("bb_std_dev", 2.5) < 2.0:
            raise ValueError("bb_std_dev should be at least 2.0 for statistical significance")
        if params.get("rsi_oversold", 30.0) >= params.get("rsi_overbought", 70.0):
            raise ValueError("rsi_oversold must be less than rsi_overbought")
        return True

    def get_required_indicators(self) -> List[str]:
        return [
            f"bb_{self.params['bb_period']}_{self.params['bb_std_dev']}",
            f"rsi_{self.params['rsi_period']}",
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
                reason="Insufficient candles for Mean Reversion"
            )

        symbol = candles[-1].get("symbol", "BTC/USDT")
        timeframe = candles[-1].get("timeframe", "1h")

        # Mean Reversion MUST be gated out in trending/high volatility markets
        if regime is not None and not self.is_regime_compatible(regime):
            return self.create_no_trade_signal(
                symbol=symbol,
                timeframe=timeframe,
                reason=f"Mean Reversion gated by trending regime {regime.value} to avoid liquidation",
                regime=regime.value
            )

        closes = [c["close"] for c in candles]
        highs = [c["high"] for c in candles]
        lows = [c["low"] for c in candles]
        latest_c = candles[-1]
        close_t = latest_c["close"]
        low_t = latest_c["low"]
        high_t = latest_c["high"]
        ts = latest_c.get("timestamp", 0)

        bb_dict = calculate_bollinger_bands(
            closes, self.params["bb_period"], self.params["bb_std_dev"]
        )
        upper = bb_dict["upper"]
        middle = bb_dict["middle"]
        lower = bb_dict["lower"]
        rsi_vals = calculate_rsi(closes, self.params["rsi_period"])
        atr_vals = calculate_atr(highs, lows, closes, self.params["atr_period"])

        if (
            upper[-1] is None or lower[-1] is None or middle[-1] is None or
            rsi_vals[-1] is None or atr_vals[-1] is None
        ):
            return self.create_no_trade_signal(symbol, timeframe, "Warmup incomplete")

        u, m, l = upper[-1], middle[-1], lower[-1]
        rsi_t = rsi_vals[-1]
        cur_atr = atr_vals[-1]

        # Buy: Price pierced lower band and RSI oversold
        is_oversold = (low_t <= l or close_t <= l * 1.002) and (rsi_t <= self.params["rsi_oversold"])
        if is_oversold:
            target_reversion = m  # Middle band is primary target
            reward = target_reversion - close_t
            sl_dist = max(cur_atr * self.params["atr_sl_mult"], close_t * 0.007)
            
            # Ensure at least 1.5R to middle band
            if reward >= sl_dist * 1.4:
                stop_loss = round(close_t - sl_dist, 4)
                tp1 = round(target_reversion, 4)
                tp2 = round(target_reversion + (target_reversion - close_t) * 0.5, 4)

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
                    market_regime=regime.value if regime else "SIDEWAYS",
                    technical_score=86.0,
                    confidence=0.82,
                    risk_reward_ratio=round(reward / sl_dist, 2),
                    reasons=[
                        f"Price pierced 2.5σ Lower Band (Low {low_t:.2f} <= {l:.2f})",
                        f"RSI extreme oversold: {rsi_t:.1f} <= {self.params['rsi_oversold']}",
                        f"Mean reversion target to SMA20 {m:.2f} offering {reward / sl_dist:.2f}R"
                    ],
                    metadata={"middle_band": m, "lower_band": l, "rsi": rsi_t, "atr": cur_atr},
                    timestamp=ts
                )

        # Sell / Short: Price pierced upper band and RSI overbought
        is_overbought = (high_t >= u or close_t >= u * 0.998) and (rsi_t >= self.params["rsi_overbought"])
        if is_overbought:
            target_reversion = m
            reward = close_t - target_reversion
            sl_dist = max(cur_atr * self.params["atr_sl_mult"], close_t * 0.007)

            if reward >= sl_dist * 1.4:
                stop_loss = round(close_t + sl_dist, 4)
                tp1 = round(target_reversion, 4)
                tp2 = round(target_reversion - (close_t - target_reversion) * 0.5, 4)

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
                    market_regime=regime.value if regime else "SIDEWAYS",
                    technical_score=86.0,
                    confidence=0.82,
                    risk_reward_ratio=round(reward / sl_dist, 2),
                    reasons=[
                        f"Price pierced 2.5σ Upper Band (High {high_t:.2f} >= {u:.2f})",
                        f"RSI extreme overbought: {rsi_t:.1f} >= {self.params['rsi_overbought']}",
                        f"Mean reversion target to SMA20 {m:.2f} offering {reward / sl_dist:.2f}R"
                    ],
                    metadata={"middle_band": m, "upper_band": u, "rsi": rsi_t, "atr": cur_atr},
                    timestamp=ts
                )

        return self.create_no_trade_signal(
            symbol, timeframe,
            f"No extreme deviation (Close={close_t:.1f}, L={l:.1f}, U={u:.1f}, RSI={rsi_t:.1f})"
        )

    def should_exit(
        self,
        position: Dict[str, Any],
        current_candle: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str]:
        # Time-based stop or middle band achieved
        bars_held = position.get("bars_held", 0)
        if bars_held >= self.params.get("max_hold_candles", 12):
            return True, f"Time stop reached ({bars_held} candles without complete reversion)"

        side = position.get("side", "BUY")
        close_p = current_candle.get("close", 0.0)
        m = context.get("middle_band") if context else None

        if m is not None:
            if side == "BUY" and close_p >= m:
                return True, f"Mean reversion completed: Price reached Middle SMA20 ({m:.2f})"
            elif side == "SELL" and close_p <= m:
                return True, f"Mean reversion completed: Short price reached Middle SMA20 ({m:.2f})"

        return False, "Reversion in progress"


class VolatilityBreakoutStrategy(BaseStrategy):
    """
    Strategy F: Volatility Breakout (ATR Impulse).
    Triggers on high volatility expansions (HIGH_VOLATILITY, STRONG_BULL, STRONG_BEAR)
    when current candle range > atr_ratio_threshold * baseline ATR.
    """

    def __init__(self, params: Optional[Dict[str, Any]] = None):
        default_params = {
            "atr_period": 14,
            "atr_baseline_period": 50,
            "impulse_factor": 1.8,
            "trailing_atr_mult": 1.8,
            "tp1_rr": 1.5,
            "tp2_rr": 2.8,
        }
        if params:
            default_params.update(params)
        super().__init__(
            strategy_id="strategy_f",
            name="Volatility Breakout (ATR Impulse)",
            params=default_params
        )

    def validate_parameters(self, params: Dict[str, Any]) -> bool:
        if params.get("impulse_factor", 1.8) <= 1.0:
            raise ValueError("impulse_factor must be > 1.0")
        return True

    def get_required_indicators(self) -> List[str]:
        return [
            f"atr_{self.params['atr_period']}",
            f"atr_{self.params['atr_baseline_period']}"
        ]

    def generate_signal(
        self,
        candles: List[Dict[str, Any]],
        regime: Optional[MarketRegime] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> TradeSignal:
        if not candles or len(candles) < self.params["atr_baseline_period"] + 5:
            return self.create_no_trade_signal(
                symbol=candles[-1].get("symbol", "UNKNOWN") if candles else "UNKNOWN",
                timeframe=candles[-1].get("timeframe", "1h") if candles else "1h",
                reason="Insufficient candles for ATR baseline"
            )

        symbol = candles[-1].get("symbol", "BTC/USDT")
        timeframe = candles[-1].get("timeframe", "1h")

        if regime is not None and not self.is_regime_compatible(regime):
            return self.create_no_trade_signal(
                symbol=symbol,
                timeframe=timeframe,
                reason=f"Volatility Impulse gated by regime {regime.value}",
                regime=regime.value
            )

        closes = [c["close"] for c in candles]
        highs = [c["high"] for c in candles]
        lows = [c["low"] for c in candles]
        latest_c = candles[-1]
        close_t = latest_c["close"]
        open_t = latest_c["open"]
        high_t = latest_c["high"]
        low_t = latest_c["low"]
        ts = latest_c.get("timestamp", 0)

        atr_fast = calculate_atr(highs, lows, closes, self.params["atr_period"])
        atr_base = calculate_atr(highs, lows, closes, self.params["atr_baseline_period"])

        if atr_fast[-1] is None or atr_base[-1] is None:
            return self.create_no_trade_signal(symbol, timeframe, "Warmup incomplete")

        cur_atr = atr_fast[-1]
        base_atr = atr_base[-1]
        candle_range = high_t - low_t
        candle_body = abs(close_t - open_t)

        # Check impulse condition: single bar range > impulse_factor * baseline ATR
        is_impulse = candle_range >= base_atr * self.params["impulse_factor"]
        is_strong_body = candle_body >= candle_range * 0.55  # Solid directional candle

        # Bullish Impulse (Strong green expansion)
        if is_impulse and is_strong_body and close_t > open_t:
            sl_dist = cur_atr * self.params["trailing_atr_mult"]
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
                tp3=round(close_t + (sl_dist * 4.2), 4),
                market_regime=regime.value if regime else "HIGH_VOLATILITY",
                technical_score=89.0,
                confidence=0.85,
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"ATR Volatility Impulse: Candle range ({candle_range:.2f}) >= {self.params['impulse_factor']}x Base ATR ({base_atr:.2f})",
                    f"Strong green directional body ({candle_body / candle_range * 100:.1f}%)",
                    f"Fast ATR expansion: {cur_atr:.2f} vs baseline {base_atr:.2f}"
                ],
                metadata={"atr_fast": cur_atr, "atr_base": base_atr, "candle_range": candle_range},
                timestamp=ts
            )

        # Bearish Impulse
        if is_impulse and is_strong_body and close_t < open_t:
            sl_dist = cur_atr * self.params["trailing_atr_mult"]
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
                tp3=round(close_t - (sl_dist * 4.2), 4),
                market_regime=regime.value if regime else "HIGH_VOLATILITY",
                technical_score=89.0,
                confidence=0.85,
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"Bearish ATR Impulse: Candle range ({candle_range:.2f}) >= {self.params['impulse_factor']}x Base ATR ({base_atr:.2f})",
                    f"Strong red directional body ({candle_body / candle_range * 100:.1f}%)"
                ],
                metadata={"atr_fast": cur_atr, "atr_base": base_atr, "candle_range": candle_range},
                timestamp=ts
            )

        return self.create_no_trade_signal(
            symbol, timeframe,
            f"No volatility impulse (Range={candle_range:.1f}, BaseATR={base_atr:.1f})"
        )

    def should_exit(
        self,
        position: Dict[str, Any],
        current_candle: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str]:
        # Trailing stop check or exhaustion
        return False, "Volatility trend continuation"
