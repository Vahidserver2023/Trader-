"""
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

    # ----------------------------------------------------------------------
    # 1. System & Runtime
    # ----------------------------------------------------------------------
    APP_NAME: str = Field(default="CryptoAITrader", description="System identifier")
    APP_ENV: EnvironmentType = Field(default=EnvironmentType.PAPER, description="Execution environment")
    DEBUG: bool = Field(default=False, description="Enable verbose debugging")
    LOG_LEVEL: LogLevel = Field(default=LogLevel.INFO, description="Logging verbosity level")
    LOG_FILE_PATH: str = Field(default="logs/trader.log", description="Path to log file")
    SECRET_KEY: str = Field(
        default="default-unsafe-dev-secret-key-change-in-production-12345",
        description="JWT/Session secret key"
    )

    # ----------------------------------------------------------------------
    # 2. Exchange Credentials
    # ----------------------------------------------------------------------
    DEFAULT_EXCHANGE: ExchangeName = Field(default=ExchangeName.BINANCE, description="Primary exchange adapter")

    # Binance credentials
    BINANCE_API_KEY: Optional[str] = Field(default=None, description="Binance API key")
    BINANCE_API_SECRET: Optional[str] = Field(default=None, description="Binance API secret")
    BINANCE_TESTNET: bool = Field(default=True, description="Use Binance testnet for simulated orders")

    # Bybit credentials
    BYBIT_API_KEY: Optional[str] = Field(default=None, description="Bybit API key")
    BYBIT_API_SECRET: Optional[str] = Field(default=None, description="Bybit API secret")
    BYBIT_TESTNET: bool = Field(default=True, description="Use Bybit testnet for simulated orders")

    # ----------------------------------------------------------------------
    # 3. Market & Asset Selection
    # ----------------------------------------------------------------------
    TRADING_PAIRS: List[str] = Field(
        default=["BTC/USDT", "ETH/USDT", "SOL/USDT"],
        description="Active cryptocurrency symbols"
    )
    DEFAULT_TIMEFRAME: str = Field(default="15m", description="Primary execution timeframe (e.g. 5m, 15m, 1h)")
    MAX_CANDLES_BUFFER: int = Field(default=1000, ge=100, le=5000, description="Memory buffer size per symbol")

    # ----------------------------------------------------------------------
    # 4. Strict Risk Management Boundaries
    # ----------------------------------------------------------------------
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

    # ----------------------------------------------------------------------
    # 5. Machine Learning & Regime Filter
    # ----------------------------------------------------------------------
    AI_CONFIDENCE_THRESHOLD: float = Field(
        default=0.65,
        ge=0.50,
        le=0.95,
        description="Minimum probability required from AI model to accept a candidate signal"
    )
    WALK_FORWARD_SPLIT: str = Field(default="60/20/20", description="Train/Val/Test temporal division")
    RETRAIN_INTERVAL_HOURS: int = Field(default=24, ge=1, le=168, description="Periodic model re-training interval")

    # ----------------------------------------------------------------------
    # 6. Database & Persistence
    # ----------------------------------------------------------------------
    DATABASE_URL: str = Field(
        default="sqlite:///data/trader.db",
        description="SQLAlchemy database connection URI"
    )

    # ----------------------------------------------------------------------
    # 7. Notifications & Monitoring
    # ----------------------------------------------------------------------
    TELEGRAM_BOT_TOKEN: Optional[str] = Field(default=None, description="Telegram bot API token")
    TELEGRAM_CHAT_ID: Optional[str] = Field(default=None, description="Telegram target chat identifier")

    # ----------------------------------------------------------------------
    # 8. Web API & Telemetry
    # ----------------------------------------------------------------------
    API_HOST: str = Field(default="127.0.0.1", description="FastAPI host address")
    API_PORT: int = Field(default=8000, ge=1024, le=65535, description="FastAPI port")
    API_BEARER_TOKEN: Optional[str] = Field(default=None, description="Authentication token for REST endpoints")

    @field_validator("TRADING_PAIRS", mode="before")
    @classmethod
    def parse_trading_pairs(cls, v: Any) -> List[str]:
        """Support comma-separated strings from .env files or lists."""
        if isinstance(v, str):
            return [p.strip().upper() for p in v.split(",") if p.strip()]
        return v

    @model_validator(mode="after")
    def validate_live_mode_security(self) -> "Settings":
        """
        Critical safety check: Live mode cannot be activated with missing or placeholder credentials.
        """
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
        """
        Returns all configuration settings with sensitive keys masked.
        Safe for writing to logs, telemetry endpoints, or diagnostic dumps.
        """
        secret_keys = {
            "SECRET_KEY",
            "BINANCE_API_KEY",
            "BINANCE_API_SECRET",
            "BYBIT_API_KEY",
            "BYBIT_API_SECRET",
            "TELEGRAM_BOT_TOKEN",
            "API_BEARER_TOKEN"
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
    """Cached singleton instance of application settings."""
    return Settings()
