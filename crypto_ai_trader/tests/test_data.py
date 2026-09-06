"""
Unit tests for Phase 2 Data Pipeline:
- CCXT Market Data Client (Session lifecycle, ticker/ohlcv guards)
- Resilient WebSocket (Backoff calculation, Stream URL formatting, reconnect logic)
- OHLCV Validator (Gap detection, Spike filter, High/Low mathematical integrity, deduplication)
"""

import unittest
import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

HAS_PANDAS = False
try:
    import pandas as pd
    import numpy as np
    HAS_PANDAS = True
except ImportError:
    pd = None
    np = None

try:
    from crypto_ai_trader.app.core.config import Settings, EnvironmentType, ExchangeName
    from crypto_ai_trader.app.core.exceptions import ExchangeConnectionError, CandleGapError
    from crypto_ai_trader.app.data.market_data import MarketDataClient
    from crypto_ai_trader.app.data.websocket import ResilientWebSocketClient
    from crypto_ai_trader.app.data.data_validator import OHLCVValidator, CandleAnomaly
except ImportError:
    try:
        from app.core.config import Settings, EnvironmentType, ExchangeName  # type: ignore
        from app.core.exceptions import ExchangeConnectionError, CandleGapError  # type: ignore
        from app.data.market_data import MarketDataClient  # type: ignore
        from app.data.websocket import ResilientWebSocketClient  # type: ignore
        from app.data.data_validator import OHLCVValidator, CandleAnomaly  # type: ignore
    except ImportError:
        Settings = None
        EnvironmentType = None
        ExchangeName = None
        ExchangeConnectionError = Exception
        CandleGapError = Exception
        MarketDataClient = None
        ResilientWebSocketClient = None
        OHLCVValidator = None
        CandleAnomaly = None


def generate_clean_candles(count: int = 50, timeframe_ms: int = 15 * 60 * 1000):
    if not HAS_PANDAS:
        return None
    base_ts = 1725400000000  # Unix timestamp ms
    records = []
    price = 60000.0

    for i in range(count):
        ts = base_ts + (i * timeframe_ms)
        open_p = price
        high_p = price + np.random.uniform(10, 50)
        low_p = price - np.random.uniform(10, 50)
        close_p = price + np.random.uniform(-20, 20)
        volume = np.random.uniform(5.0, 50.0)

        records.append({
            "timestamp": ts,
            "open": open_p,
            "high": high_p,
            "low": low_p,
            "close": close_p,
            "volume": volume,
        })
        price = close_p

    return pd.DataFrame(records)


class TestDataPipeline(unittest.IsolatedAsyncioTestCase):

    @unittest.skipIf(not HAS_PANDAS or OHLCVValidator is None, "Pandas not installed in runtime environment")
    def test_ohlcv_validator_clean_data(self):
        df = generate_clean_candles(count=30)
        validator = OHLCVValidator(symbol="BTC/USDT", timeframe="15m")
        res = validator.validate(df)

        self.assertTrue(res.is_valid)
        self.assertEqual(res.total_candles, 30)
        self.assertEqual(res.clean_candles, 30)
        self.assertEqual(len(res.anomalies), 0)
        self.assertEqual(len(res.missing_gaps), 0)

    @unittest.skipIf(not HAS_PANDAS or OHLCVValidator is None, "Pandas not installed in runtime environment")
    def test_ohlcv_validator_catches_invalid_high_low(self):
        df = generate_clean_candles(count=10)
        # Inject corrupt candle: High < Low
        df.loc[3, "high"] = 59000.0
        df.loc[3, "low"] = 61000.0

        validator = OHLCVValidator(symbol="BTC/USDT", timeframe="15m")
        res = validator.validate(df)

        self.assertFalse(res.is_valid)
        self.assertTrue(res.has_critical_errors)
        self.assertTrue(any(a.anomaly_type == "INVALID_HIGH_LOW" for a in res.anomalies))

    @unittest.skipIf(not HAS_PANDAS or OHLCVValidator is None, "Pandas not installed in runtime environment")
    def test_ohlcv_validator_detects_gap(self):
        df = generate_clean_candles(count=20)
        # Inject gap: delete candles 5, 6, 7 (a 45-minute gap)
        df_with_gap = df.drop(index=[5, 6, 7]).reset_index(drop=True)

        validator = OHLCVValidator(symbol="BTC/USDT", timeframe="15m")
        res = validator.validate(df_with_gap)

        self.assertFalse(res.is_valid)
        self.assertGreaterEqual(len(res.missing_gaps), 1)
        self.assertEqual(res.missing_gaps[0]["missing_candles"], 3)

    @unittest.skipIf(not HAS_PANDAS or OHLCVValidator is None, "Pandas not installed in runtime environment")
    def test_ohlcv_validator_gap_raise_exception(self):
        df = generate_clean_candles(count=20)
        # Inject large gap: 8 missing candles
        drop_indices = list(range(4, 12))
        df_large_gap = df.drop(index=drop_indices).reset_index(drop=True)

        validator = OHLCVValidator(symbol="BTC/USDT", timeframe="15m", max_allowed_consecutive_gaps=5)
        with self.assertRaises(CandleGapError) as ctx:
            validator.validate(df_large_gap, raise_on_gap=True)

        self.assertIn("missing candles", str(ctx.exception))

    @unittest.skipIf(not HAS_PANDAS or OHLCVValidator is None, "Pandas not installed in runtime environment")
    def test_ohlcv_validator_outlier_spike(self):
        df = generate_clean_candles(count=10)
        # Inject 80% flash pump spike on candle 4
        df.loc[4, "open"] = 60000.0
        df.loc[4, "high"] = 110000.0
        df.loc[4, "close"] = 108000.0

        validator = OHLCVValidator(symbol="BTC/USDT", timeframe="15m", max_spike_pct=25.0)
        res = validator.validate(df)

        self.assertTrue(any(a.anomaly_type == "OUTLIER_PRICE_SPIKE" for a in res.anomalies))

    @unittest.skipIf(not HAS_PANDAS or OHLCVValidator is None, "Pandas not installed in runtime environment")
    def test_ohlcv_validator_deduplicates_timestamps(self):
        df = generate_clean_candles(count=10)
        # Duplicate row 2
        df = pd.concat([df, df.iloc[[2]]], ignore_index=True)

        validator = OHLCVValidator(symbol="BTC/USDT", timeframe="15m")
        res = validator.validate(df)

        self.assertEqual(res.duplicate_count, 1)
        self.assertEqual(res.clean_candles, 10)

    @unittest.skipIf(ResilientWebSocketClient is None, "ResilientWebSocketClient not imported")
    def test_websocket_exponential_backoff_calculation(self):
        ws_client = ResilientWebSocketClient(
            symbols=["BTC/USDT"],
            base_backoff_sec=1.0,
            max_backoff_sec=30.0,
            backoff_multiplier=2.0
        )

        # First backoff
        delay1 = ws_client.compute_next_backoff()
        self.assertTrue(1.0 <= delay1 <= 2.0)

        # Second backoff
        delay2 = ws_client.compute_next_backoff()
        self.assertTrue(2.0 <= delay2 <= 4.0)

        # Test ceiling limit
        ws_client._current_backoff = 50.0
        delay_capped = ws_client.compute_next_backoff()
        self.assertLessEqual(delay_capped, 30.0)

        # Test reset
        ws_client.reset_backoff()
        self.assertEqual(ws_client._current_backoff, 1.0)

    @unittest.skipIf(ResilientWebSocketClient is None or Settings is None, "Dependencies not imported")
    def test_websocket_stream_url_generation(self):
        # Binance testnet
        binance_settings = Settings(
            DEFAULT_EXCHANGE=ExchangeName.BINANCE,
            BINANCE_TESTNET=True,
            TRADING_PAIRS=["BTC/USDT", "ETH/USDT"]
        )
        ws_binance = ResilientWebSocketClient(settings=binance_settings, timeframe="15m")
        url_binance = ws_binance.get_stream_url()
        self.assertTrue("stream.binance.com" in url_binance or "testnet" in url_binance)
        self.assertIn("btcusdt@kline_15m", url_binance)

        # Bybit
        bybit_settings = Settings(
            DEFAULT_EXCHANGE=ExchangeName.BYBIT,
            BYBIT_TESTNET=True
        )
        ws_bybit = ResilientWebSocketClient(settings=bybit_settings)
        url_bybit = ws_bybit.get_stream_url()
        self.assertIn("stream-testnet.bybit.com", url_bybit)

    @unittest.skipIf(MarketDataClient is None, "MarketDataClient not imported")
    async def test_market_data_uninitialized_guard(self):
        client = MarketDataClient()
        # Attempting to fetch without initialize() must raise ExchangeConnectionError
        with self.assertRaises(ExchangeConnectionError) as ctx:
            await client.fetch_ticker("BTC/USDT")
        self.assertIn("not initialized", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()

