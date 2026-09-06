"""
Resilient Real-time WebSocket Client.
Maintains persistent streaming feeds (Klines/Candles, Mini-Tickers, Trades) with
exponential backoff reconnection, heartbeat watchdogs, and asynchronous dispatch.
"""

import asyncio
import json
import random
import time
from typing import Any, Callable, Coroutine, Dict, List, Optional
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

from app.core.config import ExchangeName, Settings, get_settings
from app.core.logger import get_logger

logger = get_logger("websocket")

MessageHandler = Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]


class ResilientWebSocketClient:
    """
    Robust WebSocket manager featuring exponential backoff, jitter,
    heartbeat/ping-pong monitoring, and dynamic channel subscriptions.
    """

    # Binance WebSocket Base Endpoints
    BINANCE_PROD_WS = "wss://stream.binance.com:9443/ws"
    BINANCE_TESTNET_WS = "wss://testnet.binance.vision/ws"

    # Bybit WebSocket Base Endpoints
    BYBIT_PROD_WS = "wss://stream.bybit.com/v5/public/spot"
    BYBIT_TESTNET_WS = "wss://stream-testnet.bybit.com/v5/public/spot"

    def __init__(
        self,
        symbols: Optional[List[str]] = None,
        timeframe: str = "15m",
        settings: Optional[Settings] = None,
        on_message: Optional[MessageHandler] = None,
        base_backoff_sec: float = 1.0,
        max_backoff_sec: float = 60.0,
        backoff_multiplier: float = 2.0,
        heartbeat_interval_sec: float = 20.0,
        heartbeat_timeout_sec: float = 10.0,
    ):
        self.settings = settings or get_settings()
        self.symbols = [s.strip().upper() for s in (symbols or self.settings.TRADING_PAIRS)]
        self.timeframe = timeframe
        self.on_message = on_message

        # Reconnection parameters
        self.base_backoff_sec = base_backoff_sec
        self.max_backoff_sec = max_backoff_sec
        self.backoff_multiplier = backoff_multiplier
        self.heartbeat_interval_sec = heartbeat_interval_sec
        self.heartbeat_timeout_sec = heartbeat_timeout_sec

        # State tracking
        self._current_backoff = self.base_backoff_sec
        self._reconnect_attempts = 0
        self._is_running = False
        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self._loop_task: Optional[asyncio.Task] = None
        self._watchdog_task: Optional[asyncio.Task] = None
        self._last_heartbeat_ack = time.time()
        self._message_queue: asyncio.Queue = asyncio.Queue(maxsize=1000)

    @property
    def is_connected(self) -> bool:
        return self._ws is not None and not self._ws.closed

    @property
    def reconnect_attempts(self) -> int:
        return self._reconnect_attempts

    def get_stream_url(self) -> str:
        """Derive the appropriate WebSocket URI based on exchange and testnet configuration."""
        exchange = self.settings.DEFAULT_EXCHANGE
        if exchange == ExchangeName.BINANCE:
            base = self.BINANCE_TESTNET_WS if self.settings.BINANCE_TESTNET else self.BINANCE_PROD_WS
            # Construct combined stream query for Binance
            streams = []
            for s in self.symbols:
                fmt_symbol = s.replace("/", "").lower()
                streams.append(f"{fmt_symbol}@kline_{self.timeframe}")
                streams.append(f"{fmt_symbol}@miniTicker")
            stream_path = "/".join(streams)
            return f"{base}/{stream_path}" if len(streams) == 1 else f"wss://stream.binance.com:9443/stream?streams={stream_path}"

        elif exchange == ExchangeName.BYBIT:
            return self.BYBIT_TESTNET_WS if self.settings.BYBIT_TESTNET else self.BYBIT_PROD_WS

        raise ValueError(f"Unsupported exchange for WebSocket: {exchange}")

    async def _send_bybit_subscriptions(self) -> None:
        """Send explicit subscription payload for Bybit v5 public topic."""
        if not self._ws:
            return
        args = []
        for s in self.symbols:
            fmt_symbol = s.replace("/", "").upper()
            # Map 15m to Bybit interval format (e.g., 15)
            interval = self.timeframe.replace("m", "").replace("h", "60").replace("d", "D")
            args.append(f"kline.{interval}.{fmt_symbol}")
            args.append(f"tickers.{fmt_symbol}")

        sub_msg = {"op": "subscribe", "args": args}
        await self._ws.send(json.dumps(sub_msg))
        logger.info(f"Sent Bybit WebSocket subscription payload: {sub_msg}")

    async def start(self) -> None:
        """Start WebSocket listener and watchdog as asynchronous background tasks."""
        if self._is_running:
            return
        self._is_running = True
        self._loop_task = asyncio.create_task(self._connect_and_listen_loop(), name="ws_listen_loop")
        logger.info("Resilient WebSocket client started.")

    async def stop(self) -> None:
        """Gracefully stop stream, cancel tasks, and close active socket."""
        self._is_running = False
        if self._watchdog_task and not self._watchdog_task.done():
            self._watchdog_task.cancel()
        if self._ws:
            try:
                await self._ws.close()
            except Exception as e:
                logger.debug(f"Error closing socket: {e}")
        if self._loop_task and not self._loop_task.done():
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
        logger.info("Resilient WebSocket client gracefully stopped.")

    def compute_next_backoff(self) -> float:
        """
        Calculate exponential backoff with full jitter to avoid Thundering Herd problem.
        Formula: sleep = min(max_backoff, current_backoff * (1 + random.uniform(0, 0.5)))
        """
        jitter = random.uniform(0.1, 0.4)
        delay = min(self.max_backoff_sec, self._current_backoff * (1 + jitter))
        self._current_backoff = min(self.max_backoff_sec, self._current_backoff * self.backoff_multiplier)
        return delay

    def reset_backoff(self) -> None:
        """Reset exponential backoff to initial baseline upon successful connection."""
        self._current_backoff = self.base_backoff_sec
        self._reconnect_attempts = 0

    async def _heartbeat_watchdog(self) -> None:
        """
        Background watchdog sending ping frames and ensuring latency acknowledgments.
        Closes socket to trigger reconnect if timeout exceeded.
        """
        try:
            while self._is_running and self.is_connected:
                await asyncio.sleep(self.heartbeat_interval_sec)
                if not self.is_connected or self._ws is None:
                    break

                try:
                    # Ping / Pong check
                    ping_waiter = await self._ws.ping()
                    await asyncio.wait_for(ping_waiter, timeout=self.heartbeat_timeout_sec)
                    self._last_heartbeat_ack = time.time()
                except (asyncio.TimeoutError, WebSocketException) as e:
                    logger.warning(f"Heartbeat watchdog failed (ping timeout): {e}. Terminating socket to reconnect.")
                    await self._ws.close(code=1006, reason="Ping ACK timeout")
                    break
        except asyncio.CancelledError:
            pass

    async def _connect_and_listen_loop(self) -> None:
        """Main resilient connection loop with automatic reconnection."""
        while self._is_running:
            url = self.get_stream_url()
            try:
                logger.info(f"Connecting to WebSocket endpoint: {url} (Attempt {self._reconnect_attempts + 1})")
                async with websockets.connect(
                    url,
                    ping_interval=None,  # We manage application-level watchdog
                    close_timeout=5,
                    max_size=10 * 1024 * 1024
                ) as ws:
                    self._ws = ws
                    self.reset_backoff()
                    self._last_heartbeat_ack = time.time()

                    # Exchange specific subscribe handshake
                    if self.settings.DEFAULT_EXCHANGE == ExchangeName.BYBIT:
                        await self._send_bybit_subscriptions()

                    # Start watchdog for this connection
                    if self._watchdog_task and not self._watchdog_task.done():
                        self._watchdog_task.cancel()
                    self._watchdog_task = asyncio.create_task(self._heartbeat_watchdog(), name="ws_heartbeat")

                    logger.info("WebSocket connection established. Streaming live market data...")

                    # Incoming message stream
                    async for raw_msg in ws:
                        if not self._is_running:
                            break
                        try:
                            data = json.loads(raw_msg)
                            await self._dispatch_message(data)
                        except json.JSONDecodeError:
                            logger.warning(f"Malformed JSON frame received on WebSocket: {raw_msg[:100]}")

            except (ConnectionClosed, WebSocketException, OSError) as e:
                if not self._is_running:
                    break
                self._reconnect_attempts += 1
                backoff_delay = self.compute_next_backoff()
                logger.warning(
                    f"WebSocket disconnected ({e}). Reconnecting in {backoff_delay:.2f}s "
                    f"(Total attempts: {self._reconnect_attempts})..."
                )
                await asyncio.sleep(backoff_delay)

            except Exception as e:
                if not self._is_running:
                    break
                self._reconnect_attempts += 1
                backoff_delay = self.compute_next_backoff()
                logger.error(f"Unexpected WebSocket error: {e}. Backing off for {backoff_delay:.2f}s...")
                await asyncio.sleep(backoff_delay)

    async def _dispatch_message(self, data: Dict[str, Any]) -> None:
        """Deliver normalized message to user callback or internal queue."""
        if self.on_message:
            try:
                await self.on_message(data)
            except Exception as e:
                logger.error(f"Error executing user on_message callback: {e}")

        # Enqueue for buffer consumer
        if not self._message_queue.full():
            self._message_queue.put_nowait(data)

    async def get_next_message(self, timeout: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """Fetch next received message from FIFO internal queue with optional timeout."""
        try:
            return await asyncio.wait_for(self._message_queue.get(), timeout=timeout)
        except asyncio.TimeoutError:
            return None
