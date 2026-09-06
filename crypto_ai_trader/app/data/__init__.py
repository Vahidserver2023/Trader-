"""
Data Pipeline Module.
Contains CCXT exchange data client, resilient WebSocket stream, and OHLCV validation filters.
"""

try:
    from app.data.market_data import MarketDataClient
    from app.data.websocket import ResilientWebSocketClient
    from app.data.data_validator import OHLCVValidator, ValidationResult
    __all__ = [
        "MarketDataClient",
        "ResilientWebSocketClient",
        "OHLCVValidator",
        "ValidationResult",
    ]
except ImportError:
    # Graceful degradation when optional external exchange libs (like ccxt) are not present
    __all__ = []

