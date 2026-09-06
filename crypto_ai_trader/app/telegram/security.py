"""
Telegram Bot Security and Authorization.
Implements admin whitelist enforcement, rate limiting, and two-factor confirmation tokens for sensitive actions.
"""

import time
import secrets
from typing import Dict, List, Optional, Set
from collections import defaultdict


class TelegramSecurityManager:
    """
    Guards Telegram bot against unauthorized access, command flooding,
    and accidental execution of dangerous actions like panic kill.
    """

    def __init__(
        self,
        admin_user_ids: Optional[List[int]] = None,
        rate_limit_per_minute: int = 20,
        token_validity_seconds: int = 60
    ):
        self.admin_user_ids: Set[int] = set(admin_user_ids or [])
        self.rate_limit_per_minute = rate_limit_per_minute
        self.token_validity_seconds = token_validity_seconds

        # user_id -> list of timestamps
        self._user_requests: Dict[int, List[float]] = defaultdict(list)

        # action_type:user_id -> (token, expiry_time)
        self._active_tokens: Dict[str, tuple[str, float]] = {}

    def is_authorized_admin(self, user_id: int) -> bool:
        """Checks if a Telegram user_id is in the admin whitelist."""
        if not self.admin_user_ids:
            # If no admin whitelist specified, allow (development fallback)
            return True
        return user_id in self.admin_user_ids

    def check_rate_limit(self, user_id: int) -> bool:
        """
        Sliding-window rate limiter per user_id.
        Returns True if request is allowed, False if exceeded.
        """
        now = time.time()
        window_start = now - 60.0

        # Prune old timestamps
        self._user_requests[user_id] = [
            ts for ts in self._user_requests[user_id] if ts > window_start
        ]

        if len(self._user_requests[user_id]) >= self.rate_limit_per_minute:
            return False

        self._user_requests[user_id].append(now)
        return True

    def generate_confirmation_token(self, action: str, user_id: int) -> str:
        """
        Generates a secure 6-digit confirmation token for critical operations (/kill, /resume).
        Expires in token_validity_seconds.
        """
        token = f"{secrets.randbelow(900000) + 100000}"
        key = f"{action}:{user_id}"
        expiry = time.time() + self.token_validity_seconds
        self._active_tokens[key] = (token, expiry)
        return token

    def validate_confirmation_token(self, action: str, user_id: int, token: str) -> bool:
        """
        Verifies if the provided confirmation token matches and is not expired.
        Consumes the token upon successful validation.
        """
        key = f"{action}:{user_id}"
        if key not in self._active_tokens:
            return False

        stored_token, expiry = self._active_tokens[key]
        now = time.time()

        if now > expiry:
            del self._active_tokens[key]
            return False

        if secrets.compare_digest(stored_token, token.strip()):
            del self._active_tokens[key]
            return True

        return False
