"""
Unit tests for Core Engine: Settings, Validation, Logging & Secret Scrubber, Exceptions.
"""

import unittest
import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

HAS_PYDANTIC = False
try:
    from pydantic import ValidationError
    try:
        from crypto_ai_trader.app.core.config import Settings, EnvironmentType, ExchangeName
    except ImportError:
        from app.core.config import Settings, EnvironmentType, ExchangeName  # type: ignore
    HAS_PYDANTIC = True
except ImportError:
    ValidationError = Exception
    Settings = None
    EnvironmentType = None
    ExchangeName = None

try:
    from crypto_ai_trader.app.core.logger import SecretScrubberFilter
    from crypto_ai_trader.app.core.exceptions import (
        CryptoTraderError,
        ConfigurationError,
        ExchangeConnectionError,
        ExchangeAuthError,
        DailyLossLimitExceeded,
        KillSwitchActiveError
    )
except ImportError:
    from app.core.logger import SecretScrubberFilter  # type: ignore
    from app.core.exceptions import (  # type: ignore
        CryptoTraderError,
        ConfigurationError,
        ExchangeConnectionError,
        ExchangeAuthError,
        DailyLossLimitExceeded,
        KillSwitchActiveError
    )


class TestCoreEngine(unittest.TestCase):

    @unittest.skipIf(not HAS_PYDANTIC, "Pydantic not installed in runtime environment")
    def test_settings_defaults(self):
        """Verify default configurations are safe for paper trading."""
        settings = Settings()
        self.assertEqual(settings.APP_ENV, EnvironmentType.PAPER)
        self.assertEqual(settings.DEFAULT_RISK_PER_TRADE_PCT, 1.0)
        self.assertEqual(settings.MAX_POSITION_PERCENT, 20.0)
        self.assertEqual(settings.DAILY_LOSS_LIMIT_PCT, 3.0)
        self.assertEqual(settings.MAX_DRAWDOWN_PCT, 10.0)
        self.assertEqual(settings.MAX_LEVERAGE, 3)
        self.assertIn("BTC/USDT", settings.TRADING_PAIRS)
        self.assertEqual(settings.DEFAULT_EXCHANGE, ExchangeName.BINANCE)

    @unittest.skipIf(not HAS_PYDANTIC, "Pydantic not installed in runtime environment")
    def test_settings_risk_validation_upper_bound(self):
        """Ensure risk per trade cannot exceed the institutional 5.0% safety boundary."""
        with self.assertRaises(ValidationError) as ctx:
            Settings(DEFAULT_RISK_PER_TRADE_PCT=7.5)
        self.assertIn("DEFAULT_RISK_PER_TRADE_PCT", str(ctx.exception))

    @unittest.skipIf(not HAS_PYDANTIC, "Pydantic not installed in runtime environment")
    def test_settings_live_mode_requires_keys(self):
        """Ensure live mode cannot be initialized without active exchange credentials."""
        with self.assertRaises(ValueError) as ctx:
            Settings(
                APP_ENV=EnvironmentType.LIVE,
                DEFAULT_EXCHANGE=ExchangeName.BINANCE,
                BINANCE_API_KEY=None,
                BINANCE_API_SECRET=None
            )
        self.assertIn("LIVE trading requires valid BINANCE_API_KEY", str(ctx.exception))

    @unittest.skipIf(not HAS_PYDANTIC, "Pydantic not installed in runtime environment")
    def test_settings_masked_dict(self):
        """Ensure credentials are scrubbed when dumped via get_masked_dict()."""
        test_key = "abcdef1234567890abcdef1234567890"
        settings = Settings(
            BINANCE_API_KEY=test_key,
            BINANCE_API_SECRET="secret998877665544332211"
        )
        masked = settings.get_masked_dict()
        self.assertNotEqual(masked["BINANCE_API_KEY"], test_key)
        self.assertIn("***", masked["BINANCE_API_KEY"])
        self.assertNotEqual(masked["BINANCE_API_SECRET"], "secret998877665544332211")
        self.assertIn("***", masked["BINANCE_API_SECRET"])

    def test_secret_scrubber_filter(self):
        """Test regex log filter masks api keys, tokens, and credentials from log strings."""
        raw_message = "Failed to place order: api_key='a1b2c3d4e5f6g7h8' with secret='sk_live_1234567890abcdef'"
        scrubbed = SecretScrubberFilter.scrub_text(raw_message)
        self.assertNotIn("a1b2c3d4e5f6g7h8", scrubbed)
        self.assertNotIn("sk_live_1234567890abcdef", scrubbed)
        self.assertIn("***", scrubbed)

    def test_exceptions_hierarchy(self):
        """Verify exception inheritance, error codes, and recoverable flag semantics."""
        net_err = ExchangeConnectionError("Socket timeout on Binance ping")
        self.assertIsInstance(net_err, CryptoTraderError)
        self.assertEqual(net_err.error_code, "ERR_EXCHANGE_CONNECTION")
        self.assertTrue(net_err.is_recoverable)

        auth_err = ExchangeAuthError("API Key IP not whitelisted")
        self.assertEqual(auth_err.error_code, "ERR_EXCHANGE_AUTH")
        self.assertFalse(auth_err.is_recoverable)

        loss_err = DailyLossLimitExceeded("3% daily limit hit", current_loss_pct=3.1, limit_pct=3.0)
        self.assertEqual(loss_err.error_code, "ERR_RISK_DAILY_LOSS_LIMIT")
        self.assertEqual(loss_err.details["current_loss_pct"], 3.1)
        self.assertFalse(loss_err.is_recoverable)

        kill_err = KillSwitchActiveError()
        self.assertEqual(kill_err.error_code, "ERR_RISK_KILL_SWITCH_ACTIVE")


if __name__ == "__main__":
    unittest.main()


