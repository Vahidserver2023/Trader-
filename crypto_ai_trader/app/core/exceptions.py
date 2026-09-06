"""
Hierarchical Custom Exception Architecture.
Every system exception carries an explicit error_code, recoverable status,
and timestamp to support automated circuit breakers and graceful recovery.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional


class CryptoTraderError(Exception):
    """Base exception for all trading engine errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "ERR_INTERNAL",
        details: Optional[Dict[str, Any]] = None,
        is_recoverable: bool = False
    ):
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


# --------------------------------------------------------------------------
# 1. Configuration & Security
# --------------------------------------------------------------------------

class ConfigurationError(CryptoTraderError):
    """Raised when environment settings or validation fail."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="ERR_CONFIG_INVALID",
            details=details,
            is_recoverable=False
        )


class SecurityError(CryptoTraderError):
    """Raised when unauthorized access, bad bearer tokens, or leak attempts occur."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="ERR_SECURITY_VIOLATION",
            details=details,
            is_recoverable=False
        )


# --------------------------------------------------------------------------
# 2. Exchange & Execution Layer
# --------------------------------------------------------------------------

class ExchangeError(CryptoTraderError):
    """Base error for broker and exchange interactions."""

    def __init__(
        self,
        message: str,
        error_code: str = "ERR_EXCHANGE",
        details: Optional[Dict[str, Any]] = None,
        is_recoverable: bool = True
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            is_recoverable=is_recoverable
        )


class ExchangeConnectionError(ExchangeError):
    """Network connection timeout, socket dropped, or DNS failure."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="ERR_EXCHANGE_CONNECTION",
            details=details,
            is_recoverable=True
        )


class ExchangeAuthError(ExchangeError):
    """Invalid API key, expired signature, or IP restriction."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="ERR_EXCHANGE_AUTH",
            details=details,
            is_recoverable=False
        )


class ExchangeRateLimitError(ExchangeError):
    """HTTP 429 Too Many Requests or exchange rate-limit ban."""

    def __init__(self, message: str, retry_after_sec: int = 60, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        d["retry_after_sec"] = retry_after_sec
        super().__init__(
            message=message,
            error_code="ERR_EXCHANGE_RATE_LIMIT",
            details=d,
            is_recoverable=True
        )


class OrderExecutionError(ExchangeError):
    """Order rejected by exchange due to margin, min notional, or price filter."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="ERR_ORDER_REJECTED",
            details=details,
            is_recoverable=False
        )


class InsufficientBalanceError(OrderExecutionError):
    """Account free collateral is lower than requested order size."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            details=details
        )
        self.error_code = "ERR_INSUFFICIENT_BALANCE"


# --------------------------------------------------------------------------
# 3. Risk Engine Exceptions
# --------------------------------------------------------------------------

class RiskViolationError(CryptoTraderError):
    """Base error raised when trade parameters violate risk management boundaries."""

    def __init__(
        self,
        message: str,
        error_code: str = "ERR_RISK_VIOLATION",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            is_recoverable=False
        )


class DailyLossLimitExceeded(RiskViolationError):
    """Raised when 24h loss hits the circuit breaker threshold (e.g. 3%)."""

    def __init__(self, message: str, current_loss_pct: float, limit_pct: float):
        super().__init__(
            message=message,
            error_code="ERR_RISK_DAILY_LOSS_LIMIT",
            details={"current_loss_pct": current_loss_pct, "limit_pct": limit_pct}
        )


class MaxDrawdownExceeded(RiskViolationError):
    """Raised when peak-to-trough account drawdown exceeds threshold (e.g. 10%)."""

    def __init__(self, message: str, current_dd_pct: float, limit_pct: float):
        super().__init__(
            message=message,
            error_code="ERR_RISK_MAX_DRAWDOWN",
            details={"current_dd_pct": current_dd_pct, "limit_pct": limit_pct}
        )


class KillSwitchActiveError(RiskViolationError):
    """Raised when any trade execution is attempted while emergency switch is engaged."""

    def __init__(self, message: str = "Emergency Kill Switch is active. All trades aborted."):
        super().__init__(
            message=message,
            error_code="ERR_RISK_KILL_SWITCH_ACTIVE"
        )


# --------------------------------------------------------------------------
# 4. Data & Market Integrity
# --------------------------------------------------------------------------

class DataIntegrityError(CryptoTraderError):
    """Raised when market data fails validation tests (gaps, duplicate timestamps)."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="ERR_DATA_INTEGRITY",
            details=details,
            is_recoverable=True
        )


class CandleGapError(DataIntegrityError):
    """Missing chronological candles in OHLCV stream."""

    def __init__(self, symbol: str, timeframe: str, missing_count: int):
        super().__init__(
            message=f"Detected {missing_count} missing candles for {symbol} ({timeframe}).",
            details={"symbol": symbol, "timeframe": timeframe, "missing_count": missing_count}
        )
        self.error_code = "ERR_DATA_CANDLE_GAP"


# --------------------------------------------------------------------------
# 5. Machine Learning & Models
# --------------------------------------------------------------------------

class AIModelError(CryptoTraderError):
    """Raised when AI inference or model pipeline fails."""

    def __init__(
        self,
        message: str,
        error_code: str = "ERR_AI_MODEL",
        details: Optional[Dict[str, Any]] = None,
        is_recoverable: bool = False
    ):
        super().__init__(
            message=message,
            error_code=error_code,
            details=details,
            is_recoverable=is_recoverable
        )


class ModelNotTrainedError(AIModelError):
    """Attempted inference on untrained or missing weights."""

    def __init__(self, model_name: str):
        super().__init__(
            message=f"Model '{model_name}' weights not found or not trained.",
            error_code="ERR_AI_MODEL_UNTRAINED",
            details={"model_name": model_name}
        )


# --------------------------------------------------------------------------
# 6. Database Layer
# --------------------------------------------------------------------------

class DatabaseError(CryptoTraderError):
    """Raised when SQL query, ORM commit, or connection fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="ERR_DATABASE",
            details=details,
            is_recoverable=True
        )
