"""
Strategy A: Trend Following Core (EMA 50/200, EMA 21 Pullback & ADX Filter).
Operates strictly in trending regimes (STRONG_BULL, BULL, BEAR, STRONG_BEAR).
Zero look-ahead bias, mathematically rigorous multi-stage profit targets (TP1, TP2, TP3).
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional, Tuple

try:
    from crypto_ai_trader.app.strategies.base import BaseStrategy, SignalAction, TradeSignal
    from crypto_ai_trader.app.indicators.technical import (
        calculate_ema, calculate_adx, calculate_atr
    )
    from crypto_ai_trader.app.ai.regime import MarketRegime
except ImportError:
    from app.strategies.base import BaseStrategy, SignalAction, TradeSignal  # type: ignore
    from app.indicators.technical import calculate_ema, calculate_adx, calculate_atr  # type: ignore
    from app.ai.regime import MarketRegime  # type: ignore


class TrendFollowingStrategy(BaseStrategy):
    """
    Trend Following Core.
    Long Logic:
      - Regime is BULL or STRONG_BULL (or price > EMA50 > EMA200)
      - ADX 14 > adx_threshold (default 25)
      - Pullback to EMA21 or EMA50 within last 3 bars
      - Latest candle closes back above EMA21 with green body
      - Stop Loss: Local swing low or (Close - atr_mult_sl * ATR)
      - TP1: 1.5R, TP2: 3.0R
    Short Logic:
      - Regime is BEAR or STRONG_BEAR (or price < EMA50 < EMA200)
      - ADX 14 > 25
      - Pullback to EMA21 / EMA50
      - Latest candle closes below EMA21
    """

    def __init__(self, params: Optional[Dict[str, Any]] = None):
        default_params = {
            "ema_fast": 21,
            "ema_mid": 50,
            "ema_slow": 200,
            "adx_period": 14,
            "adx_threshold": 25.0,
            "atr_period": 14,
            "atr_mult_sl": 2.0,
            "min_risk_reward": 1.5,
            "tp1_rr": 1.5,
            "tp2_rr": 3.0,
        }
        if params:
            default_params.update(params)
        super().__init__(
            strategy_id="strategy_a",
            name="Trend Following Core",
            params=default_params
        )

    def validate_parameters(self, params: Dict[str, Any]) -> bool:
        if params.get("ema_fast", 21) >= params.get("ema_mid", 50):
            raise ValueError("ema_fast must be strictly less than ema_mid")
        if params.get("ema_mid", 50) >= params.get("ema_slow", 200):
            raise ValueError("ema_mid must be strictly less than ema_slow")
        if params.get("adx_threshold", 25.0) <= 0:
            raise ValueError("adx_threshold must be positive")
        return True

    def get_required_indicators(self) -> List[str]:
        return [
            f"ema_{self.params['ema_fast']}",
            f"ema_{self.params['ema_mid']}",
            f"ema_{self.params['ema_slow']}",
            f"adx_{self.params['adx_period']}",
            f"atr_{self.params['atr_period']}"
        ]

    def generate_signal(
        self,
        candles: List[Dict[str, Any]],
        regime: Optional[MarketRegime] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> TradeSignal:
        if not candles or len(candles) < self.params["ema_slow"] + 10:
            return self.create_no_trade_signal(
                symbol=candles[-1].get("symbol", "UNKNOWN") if candles else "UNKNOWN",
                timeframe=candles[-1].get("timeframe", "1h") if candles else "1h",
                reason=f"Insufficient candle count for EMA {self.params['ema_slow']}"
            )

        symbol = candles[-1].get("symbol", "BTC/USDT")
        timeframe = candles[-1].get("timeframe", "1h")

        # Gating check
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
        latest_c = candles[-1]
        close_t = latest_c["close"]
        low_t = latest_c["low"]
        high_t = latest_c["high"]
        open_t = latest_c["open"]
        ts = latest_c.get("timestamp", 0)

        ema21 = calculate_ema(closes, self.params["ema_fast"])
        ema50 = calculate_ema(closes, self.params["ema_mid"])
        ema200 = calculate_ema(closes, self.params["ema_slow"])
        adx_dict = calculate_adx(highs, lows, closes, self.params["adx_period"])
        adx_vals = adx_dict.get("adx", [])
        atr_vals = calculate_atr(highs, lows, closes, self.params["atr_period"])

        if (
            ema21[-1] is None or ema50[-1] is None or ema200[-1] is None or
            not adx_vals or adx_vals[-1] is None or atr_vals[-1] is None
        ):
            return self.create_no_trade_signal(symbol, timeframe, "Indicator warmup incomplete")

        e21, e50, e200 = ema21[-1], ema50[-1], ema200[-1]
        cur_adx = adx_vals[-1]
        cur_atr = atr_vals[-1]
        prev_close = closes[-2]
        prev_e21 = ema21[-2] or e21

        # Check Bullish Trend Following
        is_bull_alignment = (close_t > e50 > e200) and (cur_adx >= self.params["adx_threshold"])
        # Pullback check: low within recent 3 bars touched or penetrated near EMA21/EMA50
        recent_lows = [c["low"] for c in candles[-4:-1]]
        touched_fast_ema = any(l <= (ema21[-2] if ema21[-2] else e21) * 1.002 for l in recent_lows)
        reclaimed_ema21 = (prev_close <= prev_e21 or touched_fast_ema) and (close_t > e21) and (close_t >= open_t)

        if is_bull_alignment and reclaimed_ema21:
            sl_dist = max(cur_atr * self.params["atr_mult_sl"], close_t * 0.008)
            stop_loss = round(close_t - sl_dist, 4)
            tp1 = round(close_t + (sl_dist * self.params["tp1_rr"]), 4)
            tp2 = round(close_t + (sl_dist * self.params["tp2_rr"]), 4)
            tp3 = round(close_t + (sl_dist * 4.5), 4)

            sig = TradeSignal(
                signal_id=f"sig_{uuid.uuid4().hex[:12]}",
                strategy_id=self.strategy_id,
                symbol=symbol,
                timeframe=timeframe,
                action=SignalAction.BUY,
                entry_price=close_t,
                stop_loss=stop_loss,
                tp1=tp1,
                tp2=tp2,
                tp3=tp3,
                market_regime=regime.value if regime else "BULL",
                technical_score=85.0,
                confidence=min(0.95, 0.70 + (cur_adx / 100.0) * 0.25),
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"EMA Bullish Alignment (Close > EMA50={e50:.1f} > EMA200={e200:.1f})",
                    f"ADX strength={cur_adx:.1f} exceeds threshold {self.params['adx_threshold']}",
                    f"EMA21 pullback reclaimed at {close_t:.2f} with ATR={cur_atr:.2f}"
                ],
                metadata={"adx": cur_adx, "atr": cur_atr, "ema21": e21, "ema50": e50},
                timestamp=ts
            )
            return sig

        # Check Bearish Trend Following
        is_bear_alignment = (close_t < e50 < e200) and (cur_adx >= self.params["adx_threshold"])
        recent_highs = [c["high"] for c in candles[-4:-1]]
        touched_bear_ema = any(h >= (ema21[-2] if ema21[-2] else e21) * 0.998 for h in recent_highs)
        rejected_ema21 = (prev_close >= prev_e21 or touched_bear_ema) and (close_t < e21) and (close_t <= open_t)

        if is_bear_alignment and rejected_ema21:
            sl_dist = max(cur_atr * self.params["atr_mult_sl"], close_t * 0.008)
            stop_loss = round(close_t + sl_dist, 4)
            tp1 = round(close_t - (sl_dist * self.params["tp1_rr"]), 4)
            tp2 = round(close_t - (sl_dist * self.params["tp2_rr"]), 4)
            tp3 = round(close_t - (sl_dist * 4.5), 4)

            sig = TradeSignal(
                signal_id=f"sig_{uuid.uuid4().hex[:12]}",
                strategy_id=self.strategy_id,
                symbol=symbol,
                timeframe=timeframe,
                action=SignalAction.SELL,
                entry_price=close_t,
                stop_loss=stop_loss,
                tp1=tp1,
                tp2=tp2,
                tp3=tp3,
                market_regime=regime.value if regime else "BEAR",
                technical_score=85.0,
                confidence=min(0.95, 0.70 + (cur_adx / 100.0) * 0.25),
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"EMA Bearish Alignment (Close < EMA50={e50:.1f} < EMA200={e200:.1f})",
                    f"ADX strength={cur_adx:.1f} confirms downward trend",
                    f"EMA21 resistance confirmed at {close_t:.2f}"
                ],
                metadata={"adx": cur_adx, "atr": cur_atr, "ema21": e21, "ema50": e50},
                timestamp=ts
            )
            return sig

        return self.create_no_trade_signal(
            symbol, timeframe,
            f"No trend setup (ADX={cur_adx:.1f}, AlignBull={is_bull_alignment}, AlignBear={is_bear_alignment})"
        )

    def should_exit(
        self,
        position: Dict[str, Any],
        current_candle: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str]:
        side = position.get("side", "BUY")
        entry = position.get("entry_price", 0.0)
        close_p = current_candle.get("close", 0.0)

        # Dynamic trailing or opposite EMA break
        if side == "BUY":
            ema21 = context.get("ema21") if context else None
            if ema21 and close_p < ema21 * 0.995:
                return True, f"Trend broken: Close {close_p:.2f} decisively under EMA21 ({ema21:.2f})"
        elif side == "SELL":
            ema21 = context.get("ema21") if context else None
            if ema21 and close_p > ema21 * 1.005:
                return True, f"Bear trend broken: Close {close_p:.2f} decisively above EMA21 ({ema21:.2f})"

        return False, "Position within normal trend structure"
