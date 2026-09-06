"""
Exchange Market Data Client.
Provides unified asynchronous market data fetching (OHLCV, Order Book, Tickers)
via CCXT async support with strict error wrapping, rate limiting, and session lifecycle management.
"""

import asyncio
from typing import Any, Dict, List, Optional, Tuple
import ccxt.async_support as ccxt
import pandas as pd

from app.core.config import ExchangeName, Settings, get_settings
from app.core.exceptions import (
    ExchangeAuthError,
    ExchangeConnectionError,
    ExchangeError,
    ExchangeRateLimitError,
)
from app.core.logger import get_logger

logger = get_logger("market_data")


class MarketDataClient:
    """
    Async CCXT-based client for querying real-time and historical market data.
    Ensures safe rate limiting, clean session lifecycle, and unified error mapping.
    """

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.exchange_name = self.settings.DEFAULT_EXCHANGE
        self._exchange: Optional[ccxt.Exchange] = None
        self._is_initialized = False

    async def initialize(self) -> None:
        """Instantiate CCXT exchange driver with configured credentials and testnet settings."""
        if self._is_initialized and self._exchange is not None:
            return

        exchange_config: Dict[str, Any] = {
            "enableRateLimit": True,
            "timeout": 15000,
            "options": {
                "defaultType": "spot",
            },
        }

        if self.exchange_name == ExchangeName.BINANCE:
            if self.settings.BINANCE_API_KEY and self.settings.BINANCE_API_SECRET:
                exchange_config["apiKey"] = self.settings.BINANCE_API_KEY
                exchange_config["secret"] = self.settings.BINANCE_API_SECRET
            self._exchange = ccxt.binance(exchange_config)
            if self.settings.BINANCE_TESTNET:
                self._exchange.set_sandbox_mode(True)
                logger.info("Binance Sandbox/Testnet mode activated.")

        elif self.exchange_name == ExchangeName.BYBIT:
            if self.settings.BYBIT_API_KEY and self.settings.BYBIT_API_SECRET:
                exchange_config["apiKey"] = self.settings.BYBIT_API_KEY
                exchange_config["secret"] = self.settings.BYBIT_API_SECRET
            self._exchange = ccxt.bybit(exchange_config)
            if self.settings.BYBIT_TESTNET:
                self._exchange.set_sandbox_mode(True)
                logger.info("Bybit Sandbox/Testnet mode activated.")
        else:
            raise ValueError(f"Unsupported exchange identifier: {self.exchange_name}")

        self._is_initialized = True
        logger.info(f"Initialized market data client for exchange: {self.exchange_name}")

    async def close(self) -> None:
        """Gracefully release HTTP sessions and connection pools."""
        if self._exchange is not None:
            try:
                await self._exchange.close()
                logger.info("Closed CCXT exchange HTTP session.")
            except Exception as e:
                logger.warning(f"Error during exchange session close: {e}")
            finally:
                self._exchange = None
                self._is_initialized = False

    async def __aenter__(self) -> "MarketDataClient":
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.close()

    def _ensure_connected(self) -> ccxt.Exchange:
        if not self._is_initialized or self._exchange is None:
            raise ExchangeConnectionError(
                "MarketDataClient is not initialized. Call 'initialize()' or use async context manager."
            )
        return self._exchange

    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch latest ticker for a trading pair with best bid/ask, last price, and 24h volume.
        """
        exchange = self._ensure_connected()
        try:
            ticker = await exchange.fetch_ticker(symbol)
            return {
                "symbol": symbol,
                "timestamp": ticker.get("timestamp"),
                "datetime": ticker.get("datetime"),
                "bid": ticker.get("bid"),
                "ask": ticker.get("ask"),
                "last": ticker.get("last"),
                "high_24h": ticker.get("high"),
                "low_24h": ticker.get("low"),
                "volume_24h": ticker.get("baseVolume"),
                "quote_volume_24h": ticker.get("quoteVolume"),
            }
        except ccxt.AuthenticationError as e:
            logger.error(f"Exchange authentication failure for {symbol}: {e}")
            raise ExchangeAuthError(f"Authentication failed: {e}")
        except ccxt.RateLimitExceeded as e:
            logger.warning(f"Rate limit exceeded while fetching ticker {symbol}: {e}")
            raise ExchangeRateLimitError(f"Rate limit hit: {e}", retry_after_sec=5)
        except (ccxt.NetworkError, ccxt.RequestTimeout) as e:
            logger.error(f"Network error fetching ticker for {symbol}: {e}")
            raise ExchangeConnectionError(f"Network failure: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching ticker {symbol}: {e}")
            raise ExchangeError(f"Failed to fetch ticker: {e}")

    async def fetch_orderbook(self, symbol: str, limit: int = 20) -> Dict[str, Any]:
        """
        Fetch Level 2 orderbook depth for liquidity and slippage estimation.
        """
        exchange = self._ensure_connected()
        try:
            orderbook = await exchange.fetch_order_book(symbol, limit=limit)
            return {
                "symbol": symbol,
                "timestamp": orderbook.get("timestamp"),
                "datetime": orderbook.get("datetime"),
                "bids": orderbook.get("bids", [])[:limit],
                "asks": orderbook.get("asks", [])[:limit],
            }
        except ccxt.RateLimitExceeded as e:
            raise ExchangeRateLimitError(f"Rate limit hit: {e}", retry_after_sec=5)
        except (ccxt.NetworkError, ccxt.RequestTimeout) as e:
            raise ExchangeConnectionError(f"Network failure: {e}")
        except Exception as e:
            raise ExchangeError(f"Failed to fetch orderbook for {symbol}: {e}")

    async def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "15m",
        since: Optional[int] = None,
        limit: int = 100,
        max_retries: int = 3
    ) -> pd.DataFrame:
        """
        Fetch OHLCV candlestick data and return a clean, indexed Pandas DataFrame.
        Columns: ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        """
        exchange = self._ensure_connected()
        attempt = 0
        last_err: Optional[Exception] = None

        while attempt < max_retries:
            try:
                attempt += 1
                raw_candles = await exchange.fetch_ohlcv(
                    symbol=symbol,
                    timeframe=timeframe,
                    since=since,
                    limit=limit
                )

                if not raw_candles:
                    logger.warning(f"No OHLCV candles returned for {symbol} ({timeframe}).")
                    return pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])

                df = pd.DataFrame(
                    raw_candles,
                    columns=["timestamp", "open", "high", "low", "close", "volume"]
                )
                df["datetime"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
                df.set_index("datetime", inplace=True)
                return df

            except ccxt.RateLimitExceeded as e:
                wait_sec = 2 ** attempt
                logger.warning(f"Rate limit reached on fetch_ohlcv (attempt {attempt}/{max_retries}). Sleeping {wait_sec}s...")
                await asyncio.sleep(wait_sec)
                last_err = ExchangeRateLimitError(str(e), retry_after_sec=wait_sec)
            except (ccxt.NetworkError, ccxt.RequestTimeout) as e:
                wait_sec = 1.5 * attempt
                logger.warning(f"Network error on fetch_ohlcv (attempt {attempt}/{max_retries}): {e}. Retrying in {wait_sec}s...")
                await asyncio.sleep(wait_sec)
                last_err = ExchangeConnectionError(str(e))
            except ccxt.AuthenticationError as e:
                raise ExchangeAuthError(f"Exchange authentication rejected: {e}")
            except Exception as e:
                raise ExchangeError(f"Unexpected OHLCV fetch error: {e}")

        raise last_err or ExchangeConnectionError(f"Failed to fetch OHLCV after {max_retries} attempts.")
