"""
Order Execution and Exchange Layer Module.
Provides Exchange Adapters, Paper Trading Engine, and Order Management Orchestrator.
"""

try:
    from crypto_ai_trader.app.execution.types import (
        Order,
        OrderType,
        OrderSide,
        OrderStatus,
        ExecutionMode,
        ExecutionReport,
        BracketOrderSpec,
        TickerData,
        OrderFee
    )
    from crypto_ai_trader.app.execution.base_exchange import BaseExchangeAdapter
    from crypto_ai_trader.app.execution.paper_exchange import PaperExchangeAdapter
    from crypto_ai_trader.app.execution.ccxt_adapter import CCXTExchangeAdapter
    from crypto_ai_trader.app.execution.order_manager import OrderManager
except ImportError:
    from app.execution.types import (  # type: ignore
        Order,
        OrderType,
        OrderSide,
        OrderStatus,
        ExecutionMode,
        ExecutionReport,
        BracketOrderSpec,
        TickerData,
        OrderFee
    )
    from app.execution.base_exchange import BaseExchangeAdapter  # type: ignore
    from app.execution.paper_exchange import PaperExchangeAdapter  # type: ignore
    from app.execution.ccxt_adapter import CCXTExchangeAdapter  # type: ignore
    from app.execution.order_manager import OrderManager  # type: ignore

__all__ = [
    "Order",
    "OrderType",
    "OrderSide",
    "OrderStatus",
    "ExecutionMode",
    "ExecutionReport",
    "BracketOrderSpec",
    "TickerData",
    "OrderFee",
    "BaseExchangeAdapter",
    "PaperExchangeAdapter",
    "CCXTExchangeAdapter",
    "OrderManager"
]
