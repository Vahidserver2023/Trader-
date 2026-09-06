"""Core modules: configuration, logging, and custom exception definitions."""
try:
    try:
        from crypto_ai_trader.app.core.config import Settings, get_settings
    except ImportError:
        from app.core.config import Settings, get_settings  # type: ignore
except ImportError:
    Settings = None  # type: ignore
    get_settings = None  # type: ignore

try:
    try:
        from crypto_ai_trader.app.core.logger import get_logger, setup_logging
    except ImportError:
        from app.core.logger import get_logger, setup_logging  # type: ignore
except ImportError:
    get_logger = None  # type: ignore
    setup_logging = None  # type: ignore

try:
    try:
        from crypto_ai_trader.app.core.exceptions import (
            CryptoTraderError,
            ConfigurationError,
            SecurityError,
            ExchangeError,
            RiskViolationError,
            DataIntegrityError,
            AIModelError,
            DatabaseError
        )
    except ImportError:
        from app.core.exceptions import (  # type: ignore
            CryptoTraderError,
            ConfigurationError,
            SecurityError,
            ExchangeError,
            RiskViolationError,
            DataIntegrityError,
            AIModelError,
            DatabaseError
        )
except ImportError:
    CryptoTraderError = Exception  # type: ignore
    ConfigurationError = Exception  # type: ignore
    SecurityError = Exception  # type: ignore
    ExchangeError = Exception  # type: ignore
    RiskViolationError = Exception  # type: ignore
    DataIntegrityError = Exception  # type: ignore
    AIModelError = Exception  # type: ignore
    DatabaseError = Exception  # type: ignore

__all__ = [
    "Settings",
    "get_settings",
    "get_logger",
    "setup_logging",
    "CryptoTraderError",
    "ConfigurationError",
    "SecurityError",
    "ExchangeError",
    "RiskViolationError",
    "DataIntegrityError",
    "AIModelError",
    "DatabaseError",
]

