# ==============================================================================
# Crypto AI Trader - Production Container Dockerfile
# ==============================================================================
FROM python:3.11-slim as base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install native compilation dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libffi-dev \
    libssl-dev \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specifications
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Copy application source code
COPY . /app

# Create non-root user and persistent directories
RUN useradd -m -u 1000 trader && \
    mkdir -p /app/data /app/logs /app/data/backups && \
    chown -R trader:trader /app

USER trader

# Expose API and WebSocket port
EXPOSE 3000

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["python", "-m", "crypto_ai_trader.app.main"]
CMD ["--mode=PAPER"]
