"""
Telegram Bot Types and Data Contracts.
Defines commands, alert categories, inline markup, and user authorization contexts.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field


class TelegramCommandType(str, Enum):
    STATUS = "status"
    BALANCE = "balance"
    POSITIONS = "positions"
    PNL = "pnl"
    REGIME = "regime"
    PAUSE = "pause"
    RESUME = "resume"
    KILL = "kill"
    HELP = "help"


class TelegramAlertType(str, Enum):
    TRADE_OPENED = "trade_opened"
    TP_HIT = "tp_hit"
    SL_HIT = "sl_hit"
    CIRCUIT_BREAKER = "circuit_breaker"
    DRAWDOWN_WARNING = "drawdown_warning"
    DAILY_SUMMARY = "daily_summary"


@dataclass
class InlineKeyboardButton:
    text: str
    callback_data: str


@dataclass
class TelegramResponse:
    text: str
    parse_mode: str = "HTML"
    reply_markup: Optional[List[List[InlineKeyboardButton]]] = None


@dataclass
class TelegramUserContext:
    user_id: int
    username: Optional[str] = None
    is_admin: bool = False


@dataclass
class TradeAlertPayload:
    symbol: str
    side: str
    size: float
    entry_price: float
    stop_loss: float
    tp1: float
    tp2: float
    tp3: float
    leverage: int = 1
    strategy_name: str = "TrendStrategy"
    ai_confidence: float = 0.85


@dataclass
class TPHitAlertPayload:
    symbol: str
    tp_level: int
    price: float
    realized_pnl: float
    percentage_closed: float


@dataclass
class SLHitAlertPayload:
    symbol: str
    exit_price: float
    realized_loss: float
    drawdown_pct: float
