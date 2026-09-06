"""
Strategies B & D: Momentum-Based Algorithmic Engines.
Strategy B: EMA Dynamic Crossover + RSI Divergence Filter.
Strategy D: Adaptive Momentum Pulse (MACD Histogram Expansion + StochRSI Cross).
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional, Tuple

try:
    from crypto_ai_trader.app.strategies.base import BaseStrategy, SignalAction, TradeSignal
    from crypto_ai_trader.app.indicators.technical import (
        calculate_ema, calculate_rsi, calculate_macd, calculate_stochastic_rsi,
        calculate_atr, calculate_sma
    )
    from crypto_ai_trader.app.ai.regime import MarketRegime
except ImportError:
    from app.strategies.base import BaseStrategy, SignalAction, TradeSignal  # type: ignore
    from app.indicators.technical import (  # type: ignore
        calculate_ema, calculate_rsi, calculate_macd, calculate_stochastic_rsi,
        calculate_atr, calculate_sma
    )
    from app.ai.regime import MarketRegime  # type: ignore


class EMAMomentumRSIStrategy(BaseStrategy):
    """
    Strategy B: EMA Dynamic Crossover + RSI Divergence.
    Triggers when fast EMA crosses slow EMA while RSI confirms momentum inflection
    with volume confirmation.
    """

    def __init__(self, params: Optional[Dict[str, Any]] = None):
        default_params = {
            "ema_fast": 9,
            "ema_slow": 21,
            "rsi_period": 14,
            "rsi_bull_min": 45.0,
            "rsi_bull_max": 70.0,
            "rsi_bear_min": 30.0,
            "rsi_bear_max": 55.0,
            "vol_multiplier": 1.1,
            "atr_period": 14,
            "atr_sl_mult": 1.75,
            "tp1_rr": 1.5,
            "tp2_rr": 3.0,
        }
        if params:
            default_params.update(params)
        super().__init__(
            strategy_id="strategy_b",
            name="EMA Dynamic + RSI Divergence",
            params=default_params
        )

    def validate_parameters(self, params: Dict[str, Any]) -> bool:
        if params.get("ema_fast", 9) >= params.get("ema_slow", 21):
            raise ValueError("ema_fast must be strictly less than ema_slow")
        return True

    def get_required_indicators(self) -> List[str]:
        return [
            f"ema_{self.params['ema_fast']}",
            f"ema_{self.params['ema_slow']}",
            f"rsi_{self.params['rsi_period']}",
            f"atr_{self.params['atr_period']}"
        ]

    def generate_signal(
        self,
        candles: List[Dict[str, Any]],
        regime: Optional[MarketRegime] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> TradeSignal:
        if not candles or len(candles) < self.params["ema_slow"] + 5:
            return self.create_no_trade_signal(
                symbol=candles[-1].get("symbol", "UNKNOWN") if candles else "UNKNOWN",
                timeframe=candles[-1].get("timeframe", "1h") if candles else "1h",
                reason="Insufficient candles for Strategy B"
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

        ema_f = calculate_ema(closes, self.params["ema_fast"])
        ema_s = calculate_ema(closes, self.params["ema_slow"])
        rsi_vals = calculate_rsi(closes, self.params["rsi_period"])
        atr_vals = calculate_atr(highs, lows, closes, self.params["atr_period"])
        vol_sma = calculate_sma(volumes, 20)

        if (
            ema_f[-1] is None or ema_s[-1] is None or ema_f[-2] is None or ema_s[-2] is None or
            rsi_vals[-1] is None or atr_vals[-1] is None
        ):
            return self.create_no_trade_signal(symbol, timeframe, "Warmup incomplete")

        ef_t, es_t = ema_f[-1], ema_s[-1]
        ef_prev, es_prev = ema_f[-2], ema_s[-2]
        rsi_t = rsi_vals[-1]
        cur_atr = atr_vals[-1]
        vsma_t = vol_sma[-1] if vol_sma[-1] else 1.0

        # Bullish Crossover: EMA fast crosses above EMA slow
        bull_cross = (ef_prev <= es_prev) and (ef_t > es_t)
        bull_rsi = self.params["rsi_bull_min"] <= rsi_t <= self.params["rsi_bull_max"]
        vol_ok = vol_t >= vsma_t * self.params["vol_multiplier"] or vsma_t == 0

        if bull_cross and bull_rsi and vol_ok:
            sl_dist = max(cur_atr * self.params["atr_sl_mult"], close_t * 0.008)
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
                market_regime=regime.value if regime else "MOMENTUM_TREND",
                technical_score=84.0,
                confidence=0.81,
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"EMA {self.params['ema_fast']} bullish crossover EMA {self.params['ema_slow']}",
                    f"RSI={rsi_t:.1f} in sweet spot [{self.params['rsi_bull_min']}, {self.params['rsi_bull_max']}]",
                    f"Volume confirmation {vol_t:.1f} vs SMA {vsma_t:.1f}"
                ],
                metadata={"rsi": rsi_t, "ema_fast": ef_t, "ema_slow": es_t, "atr": cur_atr},
                timestamp=ts
            )

        # Bearish Crossunder
        bear_cross = (ef_prev >= es_prev) and (ef_t < es_t)
        bear_rsi = self.params["rsi_bear_min"] <= rsi_t <= self.params["rsi_bear_max"]

        if bear_cross and bear_rsi and vol_ok:
            sl_dist = max(cur_atr * self.params["atr_sl_mult"], close_t * 0.008)
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
                market_regime=regime.value if regime else "MOMENTUM_TREND",
                technical_score=84.0,
                confidence=0.81,
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"EMA {self.params['ema_fast']} bearish crossunder EMA {self.params['ema_slow']}",
                    f"RSI={rsi_t:.1f} confirms downward momentum",
                    f"Volume confirmation: {vol_t:.1f}"
                ],
                metadata={"rsi": rsi_t, "ema_fast": ef_t, "ema_slow": es_t, "atr": cur_atr},
                timestamp=ts
            )

        return self.create_no_trade_signal(
            symbol, timeframe,
            f"No cross (ef={ef_t:.1f}, es={es_t:.1f}, rsi={rsi_t:.1f})"
        )

    def should_exit(
        self,
        position: Dict[str, Any],
        current_candle: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str]:
        side = position.get("side", "BUY")
        rsi = context.get("rsi") if context else None

        if rsi is not None:
            if side == "BUY" and rsi >= 82.0:
                return True, f"RSI extreme overbought ({rsi:.1f}) - secure momentum profits"
            elif side == "SELL" and rsi <= 18.0:
                return True, f"RSI extreme oversold ({rsi:.1f}) - close short momentum"

        return False, "Momentum holding"


class AdaptiveMomentumPulseStrategy(BaseStrategy):
    """
    Strategy D: Adaptive Momentum Pulse (MACD Expansion + StochRSI Cross).
    Captures aggressive mid-trend momentum pulses in strong bull/bear trends.
    """

    def __init__(self, params: Optional[Dict[str, Any]] = None):
        default_params = {
            "macd_fast": 12,
            "macd_slow": 26,
            "macd_signal": 9,
            "stoch_rsi_period": 14,
            "stoch_rsi_k": 3,
            "stoch_rsi_d": 3,
            "atr_period": 14,
            "atr_sl_mult": 1.6,
            "tp1_rr": 1.5,
            "tp2_rr": 3.0,
        }
        if params:
            default_params.update(params)
        super().__init__(
            strategy_id="strategy_d",
            name="Adaptive Momentum Pulse",
            params=default_params
        )

    def validate_parameters(self, params: Dict[str, Any]) -> bool:
        if params.get("macd_fast", 12) >= params.get("macd_slow", 26):
            raise ValueError("macd_fast must be less than macd_slow")
        return True

    def get_required_indicators(self) -> List[str]:
        return [
            "macd_12_26_9",
            "stochastic_rsi_14",
            "atr_14"
        ]

    def generate_signal(
        self,
        candles: List[Dict[str, Any]],
        regime: Optional[MarketRegime] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> TradeSignal:
        if not candles or len(candles) < self.params["macd_slow"] + 15:
            return self.create_no_trade_signal(
                symbol=candles[-1].get("symbol", "UNKNOWN") if candles else "UNKNOWN",
                timeframe=candles[-1].get("timeframe", "1h") if candles else "1h",
                reason="Insufficient candles for MACD / StochRSI"
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
        latest_c = candles[-1]
        close_t = latest_c["close"]
        ts = latest_c.get("timestamp", 0)

        macd_res = calculate_macd(
            closes, self.params["macd_fast"], self.params["macd_slow"], self.params["macd_signal"]
        )
        hist = macd_res.get("hist", [])
        stoch_res = calculate_stochastic_rsi(
            closes, self.params["stoch_rsi_period"], self.params["stoch_rsi_period"],
            self.params["stoch_rsi_k"], self.params["stoch_rsi_d"]
        )
        stoch_k = stoch_res.get("k", [])
        stoch_d = stoch_res.get("d", [])
        atr_vals = calculate_atr(highs, lows, closes, self.params["atr_period"])

        if (
            not hist or len(hist) < 2 or hist[-1] is None or hist[-2] is None or
            not stoch_k or len(stoch_k) < 2 or stoch_k[-1] is None or stoch_k[-2] is None or
            not stoch_d or len(stoch_d) < 2 or stoch_d[-1] is None or stoch_d[-2] is None or
            not atr_vals or atr_vals[-1] is None
        ):
            return self.create_no_trade_signal(symbol, timeframe, "Indicator warmup incomplete")

        h_t = hist[-1] or 0.0
        h_prev = hist[-2] or 0.0
        k_t = stoch_k[-1] or 50.0
        d_t = stoch_d[-1] or 50.0
        k_prev = stoch_k[-2] or 50.0
        d_prev = stoch_d[-2] or 50.0
        cur_atr = atr_vals[-1] or (close_t * 0.015)

        # Bullish Pulse: MACD Histogram positive & growing, StochRSI K crosses above D below 80
        bull_hist = (h_t > 0) and (h_t > h_prev)
        bull_stoch = (k_prev <= d_prev) and (k_t > d_t) and (k_t <= 80.0)

        if bull_hist and bull_stoch:
            sl_dist = max(cur_atr * self.params["atr_sl_mult"], close_t * 0.008)
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
                market_regime=regime.value if regime else "MOMENTUM_PULSE",
                technical_score=87.0,
                confidence=0.83,
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"MACD Histogram accelerating positive: {h_prev:.2f} -> {h_t:.2f}",
                    f"StochRSI Bullish cross below 80: K={k_t:.1f}, D={d_t:.1f}"
                ],
                metadata={"hist": h_t, "stoch_k": k_t, "stoch_d": d_t, "atr": cur_atr},
                timestamp=ts
            )

        # Bearish Pulse
        bear_hist = (h_t < 0) and (h_t < h_prev)
        bear_stoch = (k_prev >= d_prev) and (k_t < d_t) and (k_t >= 20.0)

        if bear_hist and bear_stoch:
            sl_dist = max(cur_atr * self.params["atr_sl_mult"], close_t * 0.008)
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
                market_regime=regime.value if regime else "MOMENTUM_PULSE",
                technical_score=87.0,
                confidence=0.83,
                risk_reward_ratio=self.params["tp1_rr"],
                reasons=[
                    f"MACD Histogram accelerating negative: {h_prev:.2f} -> {h_t:.2f}",
                    f"StochRSI Bearish cross: K={k_t:.1f}, D={d_t:.1f}"
                ],
                metadata={"hist": h_t, "stoch_k": k_t, "stoch_d": d_t, "atr": cur_atr},
                timestamp=ts
            )

        return self.create_no_trade_signal(
            symbol, timeframe,
            f"No pulse (hist={h_t:.2f}, k={k_t:.1f}, d={d_t:.1f})"
        )

    def should_exit(
        self,
        position: Dict[str, Any],
        current_candle: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str]:
        side = position.get("side", "BUY")
        hist = context.get("macd_hist") if context else None
        prev_hist = context.get("prev_macd_hist") if context else None

        if hist is not None and prev_hist is not None:
            if side == "BUY" and hist < prev_hist and hist < 0:
                return True, "MACD histogram flipped negative, momentum expired"
            elif side == "SELL" and hist > prev_hist and hist > 0:
                return True, "MACD histogram flipped positive, short pulse expired"

        return False, "Pulse intact"
