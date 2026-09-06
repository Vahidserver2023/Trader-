export interface CodeFile {
  id: string;
  name: string;
  path: string;
  category: 'core' | 'tests' | 'config';
  description: string;
  code: string;
}

export const PHASE1_FILES: CodeFile[] = [
  {
    id: 'config_py',
    name: 'config.py',
    path: 'app/core/config.py',
    category: 'core',
    description: 'Pydantic v2 BaseSettings: اعتبارسنجی تایپ‌ها، سقف‌های سخت‌گیرانه ریسک، ماسک سکرت‌ها و بررسی ایمنی حالت Live',
    code: `"""
Application Configuration Module.
Loads, validates, and masks environment variables with Pydantic v2.
"""

from enum import Enum
from functools import lru_cache
from typing import Any, Dict, List, Optional
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class EnvironmentType(str, Enum):
    PAPER = "paper"
    LIVE = "live"
    BACKTEST = "backtest"


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class ExchangeName(str, Enum):
    BINANCE = "binance"
    BYBIT = "bybit"


class Settings(BaseSettings):
    """
    Central application settings validated at runtime.
    Strictly prevents hazardous configurations (e.g. excessive risk or missing API keys in live mode).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # 1. System & Runtime
    APP_NAME: str = Field(default="CryptoAITrader", description="System identifier")
    APP_ENV: EnvironmentType = Field(default=EnvironmentType.PAPER, description="Execution environment")
    DEBUG: bool = Field(default=False, description="Enable verbose debugging")
    LOG_LEVEL: LogLevel = Field(default=LogLevel.INFO, description="Logging verbosity level")
    LOG_FILE_PATH: str = Field(default="logs/trader.log", description="Path to log file")
    SECRET_KEY: str = Field(
        default="default-unsafe-dev-secret-key-change-in-production-12345",
        description="JWT/Session secret key"
    )

    # 2. Exchange Credentials
    DEFAULT_EXCHANGE: ExchangeName = Field(default=ExchangeName.BINANCE, description="Primary exchange adapter")

    # Binance credentials
    BINANCE_API_KEY: Optional[str] = Field(default=None, description="Binance API key")
    BINANCE_API_SECRET: Optional[str] = Field(default=None, description="Binance API secret")
    BINANCE_TESTNET: bool = Field(default=True, description="Use Binance testnet for simulated orders")

    # Bybit credentials
    BYBIT_API_KEY: Optional[str] = Field(default=None, description="Bybit API key")
    BYBIT_API_SECRET: Optional[str] = Field(default=None, description="Bybit API secret")
    BYBIT_TESTNET: bool = Field(default=True, description="Use Bybit testnet for simulated orders")

    # 3. Market & Asset Selection
    TRADING_PAIRS: List[str] = Field(
        default=["BTC/USDT", "ETH/USDT", "SOL/USDT"],
        description="Active cryptocurrency symbols"
    )
    DEFAULT_TIMEFRAME: str = Field(default="15m", description="Primary execution timeframe (e.g. 5m, 15m, 1h)")
    MAX_CANDLES_BUFFER: int = Field(default=1000, ge=100, le=5000, description="Memory buffer size per symbol")

    # 4. Strict Risk Management Boundaries
    DEFAULT_RISK_PER_TRADE_PCT: float = Field(
        default=1.0,
        ge=0.1,
        le=5.0,
        description="Max risk per trade as percentage of total equity (0.1% to 5.0%)"
    )
    MAX_POSITION_PERCENT: float = Field(
        default=20.0,
        ge=1.0,
        le=50.0,
        description="Maximum capital allocation to any single position (%)"
    )
    MAX_OPEN_POSITIONS: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Max concurrent open trading positions"
    )
    DAILY_LOSS_LIMIT_PCT: float = Field(
        default=3.0,
        ge=0.5,
        le=10.0,
        description="Daily loss circuit breaker threshold (%)"
    )
    MAX_DRAWDOWN_PCT: float = Field(
        default=10.0,
        ge=1.0,
        le=25.0,
        description="Total peak-to-trough drawdown limit (%)"
    )
    MAX_LEVERAGE: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum allowed leverage multiplier (strict ceiling)"
    )
    EMERGENCY_STOP_ENABLED: bool = Field(
        default=True,
        description="Master switch allowing circuit breakers to freeze orders"
    )

    # 5. Machine Learning & Regime Filter
    AI_CONFIDENCE_THRESHOLD: float = Field(
        default=0.65,
        ge=0.50,
        le=0.95,
        description="Minimum probability required from AI model to accept a candidate signal"
    )
    WALK_FORWARD_SPLIT: str = Field(default="60/20/20", description="Train/Val/Test temporal division")
    RETRAIN_INTERVAL_HOURS: int = Field(default=24, ge=1, le=168, description="Periodic model re-training interval")

    # 6. Database & Persistence
    DATABASE_URL: str = Field(
        default="sqlite:///data/trader.db",
        description="SQLAlchemy database connection URI"
    )

    # 7. Notifications & Monitoring
    TELEGRAM_BOT_TOKEN: Optional[str] = Field(default=None, description="Telegram bot API token")
    TELEGRAM_CHAT_ID: Optional[str] = Field(default=None, description="Telegram target chat identifier")

    # 8. Web API & Telemetry
    API_HOST: str = Field(default="127.0.0.1", description="FastAPI host address")
    API_PORT: int = Field(default=8000, ge=1024, le=65535, description="FastAPI port")
    API_BEARER_TOKEN: Optional[str] = Field(default=None, description="Authentication token for REST endpoints")

    @field_validator("TRADING_PAIRS", mode="before")
    @classmethod
    def parse_trading_pairs(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [p.strip().upper() for p in v.split(",") if p.strip()]
        return v

    @model_validator(mode="after")
    def validate_live_mode_security(self) -> "Settings":
        if self.APP_ENV == EnvironmentType.LIVE:
            if self.DEFAULT_EXCHANGE == ExchangeName.BINANCE:
                if not self.BINANCE_API_KEY or len(self.BINANCE_API_KEY) < 16:
                    raise ValueError("LIVE trading requires valid BINANCE_API_KEY (min 16 chars).")
                if not self.BINANCE_API_SECRET or len(self.BINANCE_API_SECRET) < 16:
                    raise ValueError("LIVE trading requires valid BINANCE_API_SECRET (min 16 chars).")
            elif self.DEFAULT_EXCHANGE == ExchangeName.BYBIT:
                if not self.BYBIT_API_KEY or len(self.BYBIT_API_KEY) < 16:
                    raise ValueError("LIVE trading requires valid BYBIT_API_KEY (min 16 chars).")
                if not self.BYBIT_API_SECRET or len(self.BYBIT_API_SECRET) < 16:
                    raise ValueError("LIVE trading requires valid BYBIT_API_SECRET (min 16 chars).")
        return self

    def get_masked_dict(self) -> Dict[str, Any]:
        secret_keys = {
            "SECRET_KEY", "BINANCE_API_KEY", "BINANCE_API_SECRET",
            "BYBIT_API_KEY", "BYBIT_API_SECRET", "TELEGRAM_BOT_TOKEN", "API_BEARER_TOKEN"
        }
        dumped = self.model_dump()
        masked: Dict[str, Any] = {}
        for k, v in dumped.items():
            if k in secret_keys and v is not None:
                str_val = str(v)
                if len(str_val) > 8:
                    masked[k] = f"{str_val[:4]}***{str_val[-4:]}"
                else:
                    masked[k] = "***REDACTED***"
            else:
                masked[k] = v
        return masked

@lru_cache()
def get_settings() -> Settings:
    return Settings()`
  },
  {
    id: 'logger_py',
    name: 'logger.py',
    path: 'app/core/logger.py',
    category: 'core',
    description: 'لاگر ساختاریافته چندسطحی، ماسک‌کننده خودکار رگکس SecretScrubberFilter، خروجی رنگی ANSI ترمینال و فایل روتین ۵ مگابایتی',
    code: `"""
Structured, Security-First Logging Module.
Automatically masks secrets, API keys, passwords, and tokens via SecretScrubberFilter.
Supports rotating file logs and ANSI colored console output for Termux / Linux terminals.
"""

import os
import re
import sys
import logging
from logging.handlers import RotatingFileHandler
from typing import Optional

SECRET_PATTERNS = [
    re.compile(r'(?i)(api[_-]?key|secret|token|password|bearer|auth|private[_-]?key)\\s*[:=]\\s*["\\']?([a-zA-Z0-9_\\-\\.]{8,})["\\']?'),
    re.compile(r'\\b([0-9a-fA-F]{32,64})\\b'),
    re.compile(r'\\b(\\d{9,10}:[a-zA-Z0-9_-]{35})\\b'),
]

class SecretScrubberFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.scrub_text(record.msg)
        if record.args:
            if isinstance(record.args, tuple):
                record.args = tuple(self.scrub_text(str(a)) if isinstance(a, str) else a for a in record.args)
            elif isinstance(record.args, dict):
                record.args = {k: (self.scrub_text(str(v)) if isinstance(v, str) else v) for k, v in record.args.items()}
        return True

    @classmethod
    def scrub_text(cls, text: str) -> str:
        scrubbed = text
        for pattern in SECRET_PATTERNS:
            def _replace_kv(m):
                if len(m.groups()) == 2:
                    k, val = m.group(1), m.group(2)
                    if len(val) > 8:
                        masked_val = f"{val[:3]}***{val[-3:]}"
                    else:
                        masked_val = "***REDACTED***"
                    return f"{k}={masked_val}"
                elif len(m.groups()) == 1:
                    val = m.group(1)
                    return f"{val[:3]}***{val[-3:]}"
                return "***REDACTED***"
            scrubbed = pattern.sub(_replace_kv, scrubbed)
        return scrubbed

class ColoredConsoleFormatter(logging.Formatter):
    RESET = "\\033[0m"
    COLORS = {
        logging.DEBUG: "\\033[38;5;244m",
        logging.INFO: "\\033[38;5;82m",
        logging.WARNING: "\\033[38;5;214m",
        logging.ERROR: "\\033[38;5;196m",
        logging.CRITICAL: "\\033[1;48;5;196m",
    }

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelno, self.RESET)
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        levelname = f"{record.levelname:<8}"
        logger_name = f"[{record.name}]"
        colored_prefix = f"{color}[{timestamp}] [{levelname}] {logger_name:<18}{self.RESET}"
        return f"{colored_prefix} {record.getMessage()}"

def setup_logging(
    log_level: str = "INFO",
    log_file_path: Optional[str] = "logs/trader.log",
    max_bytes: int = 5 * 1024 * 1024,
    backup_count: int = 5
) -> logging.Logger:
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    scrubber = SecretScrubberFilter()
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(ColoredConsoleFormatter())
    console_handler.addFilter(scrubber)
    root_logger.addHandler(console_handler)

    if log_file_path:
        os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
        file_handler = RotatingFileHandler(log_file_path, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8")
        file_handler.setLevel(numeric_level)
        file_formatter = logging.Formatter(fmt="%(asctime)s | %(levelname)-8s | %(name)-18s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
        file_handler.setFormatter(file_formatter)
        file_handler.addFilter(scrubber)
        root_logger.addHandler(file_handler)

    return logging.getLogger("crypto_ai_trader")

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"crypto_ai_trader.{name}")`
  },
  {
    id: 'exceptions_py',
    name: 'exceptions.py',
    path: 'app/core/exceptions.py',
    category: 'core',
    description: 'ساختار سلسله‌مراتبی خطاهای سیستم با کدهای یکتا، برچسب Recoverable/Fatal و متد خروجی دیکشنری برای گزارش‌دهی خودکار',
    code: `"""
Hierarchical Custom Exception Architecture.
Every system exception carries an explicit error_code, recoverable status,
and timestamp to support automated circuit breakers and graceful recovery.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

class CryptoTraderError(Exception):
    def __init__(self, message: str, error_code: str = "ERR_INTERNAL", details: Optional[Dict[str, Any]] = None, is_recoverable: bool = False):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.is_recoverable = is_recoverable
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.error_code,
            "message": self.message,
            "is_recoverable": self.is_recoverable,
            "timestamp": self.timestamp,
            "details": self.details,
        }

    def __str__(self) -> str:
        rec_label = "RECOVERABLE" if self.is_recoverable else "FATAL"
        return f"[{self.error_code}] ({rec_label}) {self.message}"

class ConfigurationError(CryptoTraderError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="ERR_CONFIG_INVALID", details=details, is_recoverable=False)

class SecurityError(CryptoTraderError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="ERR_SECURITY_VIOLATION", details=details, is_recoverable=False)

class ExchangeError(CryptoTraderError):
    def __init__(self, message: str, error_code: str = "ERR_EXCHANGE", details: Optional[Dict[str, Any]] = None, is_recoverable: bool = True):
        super().__init__(message=message, error_code=error_code, details=details, is_recoverable=is_recoverable)

class ExchangeConnectionError(ExchangeError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="ERR_EXCHANGE_CONNECTION", details=details, is_recoverable=True)

class ExchangeAuthError(ExchangeError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="ERR_EXCHANGE_AUTH", details=details, is_recoverable=False)

class ExchangeRateLimitError(ExchangeError):
    def __init__(self, message: str, retry_after_sec: int = 60, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        d["retry_after_sec"] = retry_after_sec
        super().__init__(message=message, error_code="ERR_EXCHANGE_RATE_LIMIT", details=d, is_recoverable=True)

class OrderExecutionError(ExchangeError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="ERR_ORDER_REJECTED", details=details, is_recoverable=False)

class InsufficientBalanceError(OrderExecutionError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, details=details)
        self.error_code = "ERR_INSUFFICIENT_BALANCE"

class RiskViolationError(CryptoTraderError):
    def __init__(self, message: str, error_code: str = "ERR_RISK_VIOLATION", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code=error_code, details=details, is_recoverable=False)

class DailyLossLimitExceeded(RiskViolationError):
    def __init__(self, message: str, current_loss_pct: float, limit_pct: float):
        super().__init__(message=message, error_code="ERR_RISK_DAILY_LOSS_LIMIT", details={"current_loss_pct": current_loss_pct, "limit_pct": limit_pct})

class MaxDrawdownExceeded(RiskViolationError):
    def __init__(self, message: str, current_dd_pct: float, limit_pct: float):
        super().__init__(message=message, error_code="ERR_RISK_MAX_DRAWDOWN", details={"current_dd_pct": current_dd_pct, "limit_pct": limit_pct})

class KillSwitchActiveError(RiskViolationError):
    def __init__(self, message: str = "Emergency Kill Switch is active. All trades aborted."):
        super().__init__(message=message, error_code="ERR_RISK_KILL_SWITCH_ACTIVE")

class DataIntegrityError(CryptoTraderError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="ERR_DATA_INTEGRITY", details=details, is_recoverable=True)

class CandleGapError(DataIntegrityError):
    def __init__(self, symbol: str, timeframe: str, missing_count: int):
        super().__init__(message=f"Detected {missing_count} missing candles for {symbol} ({timeframe}).", details={"symbol": symbol, "timeframe": timeframe, "missing_count": missing_count})
        self.error_code = "ERR_DATA_CANDLE_GAP"

class AIModelError(CryptoTraderError):
    def __init__(self, message: str, error_code: str = "ERR_AI_MODEL", details: Optional[Dict[str, Any]] = None, is_recoverable: bool = False):
        super().__init__(message=message, error_code=error_code, details=details, is_recoverable=is_recoverable)

class DatabaseError(CryptoTraderError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, error_code="ERR_DATABASE", details=details, is_recoverable=True)`
  },
  {
    id: 'test_core_py',
    name: 'test_core.py',
    path: 'tests/test_core.py',
    category: 'tests',
    description: 'مجموعه تست‌های واحد Pytest برای اعتبارسنجی تنظیمات، مرزهای ریسک، فیلتر رگکس سکرت‌ها و درخت خطاهای سیستم',
    code: `"""
Unit tests for Core Engine: Settings, Validation, Logging & Secret Scrubber, Exceptions.
"""

import pytest
from pydantic import ValidationError
from app.core.config import Settings, EnvironmentType, ExchangeName
from app.core.logger import SecretScrubberFilter
from app.core.exceptions import (
    CryptoTraderError,
    ConfigurationError,
    ExchangeConnectionError,
    ExchangeAuthError,
    DailyLossLimitExceeded,
    KillSwitchActiveError
)

def test_settings_defaults():
    settings = Settings()
    assert settings.APP_ENV == EnvironmentType.PAPER
    assert settings.DEFAULT_RISK_PER_TRADE_PCT == 1.0
    assert settings.MAX_POSITION_PERCENT == 20.0
    assert settings.DAILY_LOSS_LIMIT_PCT == 3.0
    assert settings.MAX_DRAWDOWN_PCT == 10.0
    assert settings.MAX_LEVERAGE == 3
    assert "BTC/USDT" in settings.TRADING_PAIRS
    assert settings.DEFAULT_EXCHANGE == ExchangeName.BINANCE

def test_settings_risk_validation_upper_bound():
    with pytest.raises(ValidationError) as exc_info:
        Settings(DEFAULT_RISK_PER_TRADE_PCT=7.5)
    assert "DEFAULT_RISK_PER_TRADE_PCT" in str(exc_info.value)

def test_settings_live_mode_requires_keys():
    with pytest.raises(ValueError) as exc_info:
        Settings(
            APP_ENV=EnvironmentType.LIVE,
            DEFAULT_EXCHANGE=ExchangeName.BINANCE,
            BINANCE_API_KEY=None,
            BINANCE_API_SECRET=None
        )
    assert "LIVE trading requires valid BINANCE_API_KEY" in str(exc_info.value)

def test_settings_masked_dict():
    test_key = "abcdef1234567890abcdef1234567890"
    settings = Settings(
        BINANCE_API_KEY=test_key,
        BINANCE_API_SECRET="secret998877665544332211"
    )
    masked = settings.get_masked_dict()
    assert masked["BINANCE_API_KEY"] != test_key
    assert "***" in masked["BINANCE_API_KEY"]
    assert masked["BINANCE_API_SECRET"] != "secret998877665544332211"
    assert "***" in masked["BINANCE_API_SECRET"]

def test_secret_scrubber_filter():
    raw_message = "Failed to place order: api_key='a1b2c3d4e5f6g7h8' with secret='sk_live_1234567890abcdef'"
    scrubbed = SecretScrubberFilter.scrub_text(raw_message)
    assert "a1b2c3d4e5f6g7h8" not in scrubbed
    assert "sk_live_1234567890abcdef" not in scrubbed
    assert "***" in scrubbed

def test_exceptions_hierarchy():
    net_err = ExchangeConnectionError("Socket timeout on Binance ping")
    assert isinstance(net_err, CryptoTraderError)
    assert net_err.error_code == "ERR_EXCHANGE_CONNECTION"
    assert net_err.is_recoverable is True

    auth_err = ExchangeAuthError("API Key IP not whitelisted")
    assert auth_err.error_code == "ERR_EXCHANGE_AUTH"
    assert auth_err.is_recoverable is False

    loss_err = DailyLossLimitExceeded("3% daily limit hit", current_loss_pct=3.1, limit_pct=3.0)
    assert loss_err.error_code == "ERR_RISK_DAILY_LOSS_LIMIT"
    assert loss_err.details["current_loss_pct"] == 3.1
    assert loss_err.is_recoverable is False

    kill_err = KillSwitchActiveError()
    assert kill_err.error_code == "ERR_RISK_KILL_SWITCH_ACTIVE"`
  },
  {
    id: 'requirements_txt',
    name: 'requirements.txt',
    path: 'requirements.txt',
    category: 'config',
    description: 'وابستگی‌های فریز شده پایتون سازگار با پایتون ۳.۱۱+ و معماری اندروید aarch64 در ترموکس',
    code: `# Crypto AI Trader - Production Dependencies (Python 3.11+ / Termux ARM64)
pydantic>=2.7.0,<3.0.0
pydantic-settings>=2.2.1,<3.0.0
python-dotenv>=1.0.1
ccxt>=4.3.0
aiohttp>=3.9.5
websockets>=12.0
numpy>=1.26.4,<2.0.0
pandas>=2.2.2
scipy>=1.13.0
scikit-learn>=1.4.2
joblib>=1.4.0
sqlalchemy>=2.0.30
aiosqlite>=0.20.0
fastapi>=0.111.0
uvicorn>=0.29.0
pytest>=8.2.0
pytest-asyncio>=0.23.6
pytest-cov>=5.0.0`
  },
  {
    id: 'env_example',
    name: '.env.example',
    path: '.env.example',
    category: 'config',
    description: 'قالب جامع متغیرهای محیطی با حالت‌های پیش‌فرض ایمن و توضیحات کامل فارسی و انگلیسی',
    code: `# Crypto AI Trader - Environment Configuration Template
APP_NAME=CryptoAITrader
APP_ENV=paper                  # paper | live | backtest
DEBUG=false
LOG_LEVEL=INFO                 # DEBUG | INFO | WARNING | ERROR | CRITICAL
LOG_FILE_PATH=logs/trader.log
SECRET_KEY=change-this-to-a-secure-random-64-character-string-in-production

DEFAULT_EXCHANGE=binance       # binance | bybit
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_API_SECRET=your_binance_api_secret_here
BINANCE_TESTNET=true

BYBIT_API_KEY=your_bybit_api_key_here
BYBIT_API_SECRET=your_bybit_api_secret_here
BYBIT_TESTNET=true

TRADING_PAIRS=BTC/USDT,ETH/USDT,SOL/USDT
DEFAULT_TIMEFRAME=15m
MAX_CANDLES_BUFFER=1000

DEFAULT_RISK_PER_TRADE_PCT=1.0 # 0.1% to 5.0% max
MAX_POSITION_PERCENT=20.0
MAX_OPEN_POSITIONS=3
DAILY_LOSS_LIMIT_PCT=3.0
MAX_DRAWDOWN_PCT=10.0
MAX_LEVERAGE=3
EMERGENCY_STOP_ENABLED=true

AI_CONFIDENCE_THRESHOLD=0.65
WALK_FORWARD_SPLIT=60/20/20
RETRAIN_INTERVAL_HOURS=24
DATABASE_URL=sqlite:///data/trader.db
API_HOST=127.0.0.1
API_PORT=8000`
  }
];

export interface TestCaseResult {
  id: string;
  name: string;
  funcName: string;
  description: string;
  status: 'passed' | 'failed' | 'running' | 'idle';
  durationMs: number;
  assertion: string;
}

export const INITIAL_TEST_CASES: TestCaseResult[] = [
  {
    id: 'test_1',
    name: 'Default Settings & Paper Mode Safety',
    funcName: 'test_settings_defaults()',
    description: 'اطمینان از بارگذاری پیش‌فرض در حالت شبیه‌ساز (Paper Mode)، ریسک ۱٪، سقف ضرر ۳٪ و اهرم ۳x',
    status: 'passed',
    durationMs: 42,
    assertion: 'assert settings.APP_ENV == "paper" and settings.DEFAULT_RISK_PER_TRADE_PCT == 1.0'
  },
  {
    id: 'test_2',
    name: 'Strict Risk Boundary Enforcement (> 5.0%)',
    funcName: 'test_settings_risk_validation_upper_bound()',
    description: 'رد قطعی و ترمز اضطراری اعتبارسنجی در صورت تلاش برای تعیین ریسک معامله بالاتر از ۵.۰٪',
    status: 'passed',
    durationMs: 38,
    assertion: 'with pytest.raises(ValidationError): Settings(DEFAULT_RISK_PER_TRADE_PCT=7.5)'
  },
  {
    id: 'test_3',
    name: 'Live Mode Security: Enforces API Credentials',
    funcName: 'test_settings_live_mode_requires_keys()',
    description: 'عدم اجازه فعال‌سازی حالت معاملات واقعی (Live) بدون کلید معتبر و سکرت صرافی',
    status: 'passed',
    durationMs: 31,
    assertion: 'with pytest.raises(ValueError): Settings(APP_ENV="live", BINANCE_API_KEY=None)'
  },
  {
    id: 'test_4',
    name: 'Zero Leakage: Masked Dictionary Serialization',
    funcName: 'test_settings_masked_dict()',
    description: 'تضمین ماسک شدن کلیدهای سکرت و توکن‌ها در خروجی get_masked_dict() بدون نشت اطلاعات',
    status: 'passed',
    durationMs: 27,
    assertion: 'assert "***" in masked["BINANCE_API_KEY"] and "***" in masked["BINANCE_API_SECRET"]'
  },
  {
    id: 'test_5',
    name: 'Regex Log Scrubber: Auto Redacts Credentials',
    funcName: 'test_secret_scrubber_filter()',
    description: 'تست فیلتر SecretScrubberFilter برای پاکسازی خودکار API Keyها، هش‌ها و توکن‌ها از لاگ‌ها',
    status: 'passed',
    durationMs: 53,
    assertion: 'assert "a1b2c3d4e5f6g7h8" not in scrubbed and "***" in scrubbed'
  },
  {
    id: 'test_6',
    name: 'Exception Tree & Circuit Breaker Recoverability',
    funcName: 'test_exceptions_hierarchy()',
    description: 'تأیید سلسله‌مراتب خطاها، خطاهای قابل بازیابی (مانند قطعی شبکه) در برابر خطاهای بحرانی (مانند سقف ضرر)',
    status: 'passed',
    durationMs: 35,
    assertion: 'assert net_err.is_recoverable is True and loss_err.is_recoverable is False'
  }
];
