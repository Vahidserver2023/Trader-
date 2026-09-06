"""
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


# Regular expressions targeting common API keys, secrets, bearer tokens, and credentials
SECRET_PATTERNS = [
    # API key & secret assignment patterns (e.g. api_key=..., secret="...")
    re.compile(r'(?i)(api[_-]?key|secret|token|password|bearer|auth|private[_-]?key)\s*[:=]\s*["\']?([a-zA-Z0-9_\-\.]{8,})["\']?'),
    # Generic high-entropy hex or base64 token strings (length >= 32)
    re.compile(r'\b([0-9a-fA-F]{32,64})\b'),
    # Telegram Bot Token pattern (e.g. 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
    re.compile(r'\b(\d{9,10}:[a-zA-Z0-9_-]{35})\b'),
]


class SecretScrubberFilter(logging.Filter):
    """
    Interprets and scrubs sensitive credentials from every log record.
    Prevents unintentional secret leaks in log files and stdout.
    """

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
        """Replace detected secrets with redacted masks."""
        scrubbed = text
        for pattern in SECRET_PATTERNS:
            # For key-value patterns: preserve key name, mask value
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
    """ANSI colored formatter for Termux / Terminal readability."""

    RESET = "\033[0m"
    COLORS = {
        logging.DEBUG: "\033[38;5;244m",       # Gray
        logging.INFO: "\033[38;5;82m",          # Neon Green
        logging.WARNING: "\033[38;5;214m",      # Amber / Orange
        logging.ERROR: "\033[38;5;196m",        # Bright Red
        logging.CRITICAL: "\033[1;48;5;196m",   # Red Background Bold
    }

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelno, self.RESET)
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        levelname = f"{record.levelname:<8}"
        logger_name = f"[{record.name}]"
        
        # Color the level name and prefix
        colored_prefix = f"{color}[{timestamp}] [{levelname}] {logger_name:<18}{self.RESET}"
        return f"{colored_prefix} {record.getMessage()}"


def setup_logging(
    log_level: str = "INFO",
    log_file_path: Optional[str] = "logs/trader.log",
    max_bytes: int = 5 * 1024 * 1024,  # 5 MB
    backup_count: int = 5
) -> logging.Logger:
    """
    Initializes the root and application logger with security filters,
    rotating file handlers, and ANSI terminal formatters.
    """
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Remove existing handlers to avoid duplicates
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    scrubber = SecretScrubberFilter()

    # 1. Console Handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(ColoredConsoleFormatter())
    console_handler.addFilter(scrubber)
    root_logger.addHandler(console_handler)

    # 2. Rotating File Handler
    if log_file_path:
        os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
        file_handler = RotatingFileHandler(
            log_file_path,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding="utf-8"
        )
        file_handler.setLevel(numeric_level)
        file_formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)-18s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        file_handler.setFormatter(file_formatter)
        file_handler.addFilter(scrubber)
        root_logger.addHandler(file_handler)

    return logging.getLogger("crypto_ai_trader")


def get_logger(name: str) -> logging.Logger:
    """Convenience factory for child loggers."""
    return logging.getLogger(f"crypto_ai_trader.{name}")
