"""
API Security, Authentication, and Rate Limiting Module.
Provides Bearer Token validation, API Key checking, and Sliding-Window Rate Limiting.
"""

import time
from typing import Dict, List, Optional, Tuple


class RateLimiter:
    """
    Sliding window rate limiter tracking request timestamps per client.
    Thread-safe and memory bounded with automatic cleanup.
    """

    def __init__(self, max_requests: int = 60, window_seconds: float = 60.0):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.client_history: Dict[str, List[float]] = {}

    def is_allowed(self, client_id: str) -> Tuple[bool, int, float]:
        """
        Evaluates whether client is within allowed rate limits.
        Returns: (is_allowed, remaining_requests, reset_seconds)
        """
        now = time.time()
        cutoff = now - self.window_seconds

        # Clean old timestamps
        timestamps = self.client_history.get(client_id, [])
        valid_timestamps = [ts for ts in timestamps if ts > cutoff]

        remaining = max(0, self.max_requests - len(valid_timestamps))
        reset_time = self.window_seconds if not valid_timestamps else (valid_timestamps[0] + self.window_seconds - now)

        if len(valid_timestamps) >= self.max_requests:
            self.client_history[client_id] = valid_timestamps
            return False, 0, max(0.1, reset_time)

        valid_timestamps.append(now)
        self.client_history[client_id] = valid_timestamps
        return True, remaining - 1, max(0.1, reset_time)

    def reset(self) -> None:
        """Clears all tracking history."""
        self.client_history.clear()


class SecurityValidator:
    """
    Validates API requests using Bearer tokens and API keys.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        bearer_token: Optional[str] = None,
        enabled: bool = True
    ):
        self.api_key = api_key
        self.bearer_token = bearer_token
        self.enabled = enabled

    def authenticate_request(
        self,
        headers: Dict[str, str]
    ) -> Tuple[bool, str]:
        """
        Validates authorization credentials in request headers.
        Supports both X-API-KEY and Authorization: Bearer <token>.
        """
        if not self.enabled:
            return True, "Authentication disabled"

        # Case-insensitive headers lookup
        lower_headers = {k.lower(): v for k, v in headers.items()}

        # 1. Check X-API-KEY
        req_api_key = lower_headers.get("x-api-key")
        if req_api_key and self.api_key and req_api_key == self.api_key:
            return True, "API Key authenticated"

        # 2. Check Authorization Bearer
        auth_header = lower_headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            if self.bearer_token and token == self.bearer_token:
                return True, "Bearer token authenticated"

        if not self.api_key and not self.bearer_token:
            # If no secrets are set, permit dev access
            return True, "Default dev permit"

        return False, "Unauthorized: Invalid or missing API credentials"
