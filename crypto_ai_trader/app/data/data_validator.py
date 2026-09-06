"""
OHLCV Candlestick & Market Data Validator.
Performs rigorous structural sanity checks, gap detection, duplicate handling,
and flash crash / outlier anomaly filtering to guarantee downstream model safety.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from app.core.exceptions import CandleGapError, DataIntegrityError
from app.core.logger import get_logger

logger = get_logger("data_validator")

# Millisecond durations per standard timeframe
TIMEFRAME_MS_MAP: Dict[str, int] = {
    "1m": 60 * 1000,
    "3m": 3 * 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
}


@dataclass
class CandleAnomaly:
    index: int
    timestamp: int
    anomaly_type: str
    description: str
    values: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ValidationResult:
    is_valid: bool
    total_candles: int
    clean_candles: int
    anomalies: List[CandleAnomaly] = field(default_factory=list)
    missing_gaps: List[Dict[str, Any]] = field(default_factory=list)
    duplicate_count: int = 0
    cleaned_df: Optional[pd.DataFrame] = None

    @property
    def has_critical_errors(self) -> bool:
        critical_types = {"INVALID_HIGH_LOW", "NEGATIVE_PRICE", "NEGATIVE_VOLUME", "TIMESTAMP_REVERSAL"}
        return any(a.anomaly_type in critical_types for a in self.anomalies)

    def summary(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "total_candles": self.total_candles,
            "clean_candles": self.clean_candles,
            "anomalies_count": len(self.anomalies),
            "missing_gaps_count": len(self.missing_gaps),
            "duplicate_count": self.duplicate_count,
            "has_critical_errors": self.has_critical_errors,
        }


class OHLCVValidator:
    """
    Sanitizes, checks integrity, and filters anomalies in raw candlestick data.
    """

    def __init__(
        self,
        symbol: str = "BTC/USDT",
        timeframe: str = "15m",
        max_spike_pct: float = 25.0,  # Max allowable price swing in a single candle (%)
        max_allowed_consecutive_gaps: int = 5,
    ):
        self.symbol = symbol
        self.timeframe = timeframe
        self.expected_interval_ms = TIMEFRAME_MS_MAP.get(timeframe, 15 * 60 * 1000)
        self.max_spike_pct = max_spike_pct
        self.max_allowed_consecutive_gaps = max_allowed_consecutive_gaps

    def validate(self, df: pd.DataFrame, raise_on_gap: bool = False) -> ValidationResult:
        """
        Validate an OHLCV DataFrame.
        DataFrame must contain columns: ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        """
        if df.empty:
            logger.warning(f"Validation aborted: DataFrame for {self.symbol} is empty.")
            return ValidationResult(
                is_valid=False,
                total_candles=0,
                clean_candles=0,
                anomalies=[CandleAnomaly(0, 0, "EMPTY_DATASET", "DataFrame contains no records.")],
            )

        working_df = df.copy()
        anomalies: List[CandleAnomaly] = []
        missing_gaps: List[Dict[str, Any]] = []

        # 1. Required column presence
        required_cols = {"timestamp", "open", "high", "low", "close", "volume"}
        missing_cols = required_cols - set(working_df.columns)
        if missing_cols:
            raise DataIntegrityError(f"Missing required columns in OHLCV DataFrame: {missing_cols}")

        # Ensure numeric types
        for col in ["timestamp", "open", "high", "low", "close", "volume"]:
            working_df[col] = pd.to_numeric(working_df[col], errors="coerce")

        total_rows = len(working_df)

        # 2. Check and remove nulls / NaNs
        nan_mask = working_df.isna().any(axis=1)
        if nan_mask.any():
            nan_indices = working_df[nan_mask].index.tolist()
            for idx in nan_indices:
                anomalies.append(
                    CandleAnomaly(
                        index=int(idx) if isinstance(idx, (int, np.integer)) else 0,
                        timestamp=int(working_df.loc[idx, "timestamp"]) if pd.notna(working_df.loc[idx, "timestamp"]) else 0,
                        anomaly_type="NAN_VALUES_DETECTED",
                        description="Candle contains NaN or missing float values.",
                    )
                )
            working_df = working_df[~nan_mask]

        # 3. Deduplicate timestamps
        init_len = len(working_df)
        working_df = working_df.drop_duplicates(subset=["timestamp"], keep="last")
        duplicate_count = init_len - len(working_df)
        if duplicate_count > 0:
            logger.info(f"Removed {duplicate_count} duplicate timestamp records for {self.symbol}.")

        # 4. Sort strictly ascending by timestamp
        working_df.sort_values("timestamp", ascending=True, inplace=True)
        working_df.reset_index(drop=True, inplace=True)

        # 5. Row-by-row Mathematical Consistency
        clean_rows: List[int] = []
        prev_close: Optional[float] = None
        prev_ts: Optional[int] = None

        for idx, row in working_df.iterrows():
            ts = int(row["timestamp"])
            o, h, l, c, v = float(row["open"]), float(row["high"]), float(row["low"]), float(row["close"]), float(row["volume"])
            is_candle_valid = True

            # Check High >= Low, High >= Open, High >= Close
            if h < l:
                anomalies.append(
                    CandleAnomaly(
                        index=idx,
                        timestamp=ts,
                        anomaly_type="INVALID_HIGH_LOW",
                        description=f"High ({h}) is strictly less than Low ({l}).",
                        values={"high": h, "low": l},
                    )
                )
                is_candle_valid = False

            if h < o or h < c:
                anomalies.append(
                    CandleAnomaly(
                        index=idx,
                        timestamp=ts,
                        anomaly_type="HIGH_NOT_SUPREME",
                        description=f"High ({h}) is lower than Open ({o}) or Close ({c}).",
                        values={"high": h, "open": o, "close": c},
                    )
                )
                is_candle_valid = False

            # Check Low <= Open, Low <= Close
            if l > o or l > c:
                anomalies.append(
                    CandleAnomaly(
                        index=idx,
                        timestamp=ts,
                        anomaly_type="LOW_NOT_INFIMUM",
                        description=f"Low ({l}) is higher than Open ({o}) or Close ({c}).",
                        values={"low": l, "open": o, "close": c},
                    )
                )
                is_candle_valid = False

            # Non-negative prices and volume
            if o <= 0 or h <= 0 or l <= 0 or c <= 0:
                anomalies.append(
                    CandleAnomaly(
                        index=idx,
                        timestamp=ts,
                        anomaly_type="NEGATIVE_PRICE",
                        description="Price value is zero or negative.",
                        values={"open": o, "high": h, "low": l, "close": c},
                    )
                )
                is_candle_valid = False

            if v < 0:
                anomalies.append(
                    CandleAnomaly(
                        index=idx,
                        timestamp=ts,
                        anomaly_type="NEGATIVE_VOLUME",
                        description="Candle trading volume is negative.",
                        values={"volume": v},
                    )
                )
                is_candle_valid = False

            # Spike / flash anomaly filter against previous close
            if prev_close is not None and prev_close > 0:
                pct_change = abs(c - prev_close) / prev_close * 100.0
                if pct_change > self.max_spike_pct:
                    anomalies.append(
                        CandleAnomaly(
                            index=idx,
                            timestamp=ts,
                            anomaly_type="OUTLIER_PRICE_SPIKE",
                            description=f"Single-candle price jump of {pct_change:.2f}% exceeds threshold ({self.max_spike_pct}%).",
                            values={"prev_close": prev_close, "close": c, "pct_change": pct_change},
                        )
                    )
                    # We flag it, but keep or drop based on policy

            # 6. Timestamp continuity and gap detection
            if prev_ts is not None:
                delta_ms = ts - prev_ts
                if delta_ms < 0:
                    anomalies.append(
                        CandleAnomaly(
                            index=idx,
                            timestamp=ts,
                            anomaly_type="TIMESTAMP_REVERSAL",
                            description=f"Timestamp goes backwards: {ts} < {prev_ts}.",
                        )
                    )
                    is_candle_valid = False
                elif delta_ms > self.expected_interval_ms:
                    missing_count = int(round((delta_ms - self.expected_interval_ms) / self.expected_interval_ms))
                    if missing_count >= 1:
                        gap_info = {
                            "from_timestamp": prev_ts,
                            "to_timestamp": ts,
                            "missing_candles": missing_count,
                            "gap_duration_minutes": (delta_ms - self.expected_interval_ms) / 60000.0,
                        }
                        missing_gaps.append(gap_info)
                        anomalies.append(
                            CandleAnomaly(
                                index=idx,
                                timestamp=ts,
                                anomaly_type="CANDLE_GAP_DETECTED",
                                description=f"Detected gap of {missing_count} missing candles between {prev_ts} and {ts}.",
                                values=gap_info,
                            )
                        )
                        if raise_on_gap and missing_count > self.max_allowed_consecutive_gaps:
                            raise CandleGapError(self.symbol, self.timeframe, missing_count)

            if is_candle_valid:
                clean_rows.append(idx)
                prev_close = c
                prev_ts = ts

        cleaned_df = working_df.loc[clean_rows].copy()
        cleaned_df["datetime"] = pd.to_datetime(cleaned_df["timestamp"], unit="ms", utc=True)

        is_overall_valid = len(anomalies) == 0 and len(missing_gaps) == 0

        return ValidationResult(
            is_valid=is_overall_valid,
            total_candles=total_rows,
            clean_candles=len(cleaned_df),
            anomalies=anomalies,
            missing_gaps=missing_gaps,
            duplicate_count=duplicate_count,
            cleaned_df=cleaned_df,
        )

    @classmethod
    def create_synthetic_gap_filler(cls, prev_candle: Dict[str, Any], next_candle: Dict[str, Any], timeframe: str) -> List[Dict[str, Any]]:
        """
        Synthesize neutral interpolation candles (zero-volume, flat price) for temporary gap bridging.
        """
        step_ms = TIMEFRAME_MS_MAP.get(timeframe, 15 * 60 * 1000)
        gap_candles = []
        cur_ts = prev_candle["timestamp"] + step_ms
        bridge_price = prev_candle["close"]

        while cur_ts < next_candle["timestamp"]:
            gap_candles.append({
                "timestamp": cur_ts,
                "open": bridge_price,
                "high": bridge_price,
                "low": bridge_price,
                "close": bridge_price,
                "volume": 0.0,
                "is_synthetic": True,
            })
            cur_ts += step_ms

        return gap_candles
