# Crypto AI Trader - Phase 1: Core Engine & Configuration

Automated quantitative cryptocurrency trading engine with strict mathematical risk management, machine learning regime filtering, and dual-target deployment (Android/Termux & Linux Cloud).

---

## Phase 1 Deliverables Summary

1. **`app/core/config.py`**: Pydantic v2 `BaseSettings` engine. Type validation, strict bounds on risk (0.1% to 5.0%), live-trading safety checks, and secure masked dictionary output.
2. **`app/core/logger.py`**: Structured logging with ANSI terminal colors, file rotation, and `SecretScrubberFilter` ensuring zero credential leaks.
3. **`app/core/exceptions.py`**: Hierarchical exception architecture with standardized error codes and recoverable flags for automated circuit-breakers.
4. **`requirements.txt`**: Pinned, tested dependencies compatible with Python 3.11+ on ARM64 / Termux.
5. **`.env.example`**: Complete environment configuration template with default paper mode.
6. **`tests/test_core.py`**: Pytest test suite covering config loading, bounds validation, secret scrubber, and exception hierarchy.

---

## Quickstart Guide (Termux / Linux)

### 1. Setup Virtual Environment
```bash
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run Test Suite
```bash
pytest tests/test_core.py -v --cov=app/core
```
