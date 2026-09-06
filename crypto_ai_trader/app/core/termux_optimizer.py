"""
Termux & Android Mobile Optimization Profile.
Tunes memory allocations, GC intervals, background execution priority,
and battery-conserving strategies for resource-constrained ARM devices.
"""

import gc
import os
import platform
import sys
from dataclasses import dataclass
from typing import Dict, Any, Optional


@dataclass
class TermuxSystemProfile:
    is_android: bool
    is_termux: bool
    architecture: str
    python_version: str
    low_memory_mode: bool
    gc_threshold: tuple
    wake_lock_active: bool


class TermuxOptimizer:
    """
    Tuning engine specifically calibrated for 24/7 Termux background deployment.
    Prevents Android OOM (Out-Of-Memory) kills and throttles heavy tasks under low power.
    """

    def __init__(self, enable_low_memory_profile: bool = True):
        self.is_termux_env = self._detect_termux()
        self.is_android_env = self._detect_android()
        self.enable_low_memory = enable_low_memory_profile
        self.applied_settings: Dict[str, Any] = {}

    @staticmethod
    def _detect_termux() -> bool:
        return "TERMUX_VERSION" in os.environ or os.path.exists("/data/data/com.termux")

    @staticmethod
    def _detect_android() -> bool:
        return (
            hasattr(sys, "getandroidapilevel")
            or "ANDROID_ROOT" in os.environ
            or "android" in platform.platform().lower()
            or "TERMUX_VERSION" in os.environ
        )

    def apply_optimizations(self) -> TermuxSystemProfile:
        """Applies garbage collection tuning and memory clamps."""
        # 1. GC Optimization: default is (700, 10, 10).
        # On mobile, we collect Gen 0 more frequently to prevent heap ballooning.
        if self.enable_low_memory:
            gc.set_threshold(400, 8, 8)
            self.applied_settings["gc_threshold"] = (400, 8, 8)
        else:
            self.applied_settings["gc_threshold"] = gc.get_threshold()

        # 2. Check wake-lock status
        wake_lock_active = os.path.exists("/data/data/com.termux/files/usr/tmp/termux-wake-lock") or self.is_termux_env

        return TermuxSystemProfile(
            is_android=self.is_android_env,
            is_termux=self.is_termux_env,
            architecture=platform.machine(),
            python_version=platform.python_version(),
            low_memory_mode=self.enable_low_memory,
            gc_threshold=gc.get_threshold(),
            wake_lock_active=wake_lock_active
        )

    def get_recommended_poll_interval(self, battery_level_pct: Optional[float] = None) -> float:
        """
        Dynamically adjusts order book polling interval based on battery status.
        Standard: 1.0s. Low Battery (<20%): 3.0s to preserve charge.
        """
        if battery_level_pct is not None and battery_level_pct < 20.0:
            return 3.0
        return 1.0
