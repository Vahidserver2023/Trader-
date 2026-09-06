#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Crypto AI Trader - Automated Termux / Android One-Command Installer
# Target: Termux on Android 10+ (aarch64 / armv7l / x86_64)
# ==============================================================================

set -e

echo -e "\033[1;36m=====================================================\033[0m"
echo -e "\033[1;32m   🤖 CRYPTO AI TRADER - TERMUX INSTALLER           \033[0m"
echo -e "\033[1;36m=====================================================\033[0m"

# 1. Update Termux base repos and packages
echo -e "\033[1;33m[1/7] Updating Termux package lists...\033[0m"
pkg update -y && pkg upgrade -y

# 2. Install essential compilation and runtime dependencies
echo -e "\033[1;33m[2/7] Installing Python 3.11+, Git, Clang, OpenSSL, libffi...\033[0m"
pkg install -y python git clang cmake make libffi openssl libxml2 libxslt rust tur-repo

# 3. Setup storage access & wakelock
echo -e "\033[1;33m[3/7] Setting up Termux storage & acquiring wake-lock...\033[0m"
termux-wake-lock || true

# 4. Prepare Application Directory
WORKSPACE_DIR="$HOME/crypto_ai_trader"
mkdir -p "$WORKSPACE_DIR"
cd "$WORKSPACE_DIR"

# 5. Create Isolated Virtual Environment
echo -e "\033[1;33m[4/7] Creating Python Virtual Environment (venv)...\033[0m"
python -m venv venv
source venv/bin/activate

# 6. Upgrade pip and build tools
echo -e "\033[1;33m[5/7] Upgrading pip, setuptools, and wheel...\033[0m"
pip install --upgrade pip setuptools wheel

# 7. Install Python Requirements
echo -e "\033[1;33m[6/7] Installing production dependencies from requirements.txt...\033[0m"
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "Installing core packages directly..."
    pip install pydantic pydantic-settings fastapi uvicorn websockets ccxt pandas numpy scipy ta
fi

# 8. Setup Environment Config & Permissions
echo -e "\033[1;33m[7/7] Configuring .env security permissions...\033[0m"
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    chmod 600 .env
fi

echo -e "\033[1;32m=====================================================\033[0m"
echo -e "\033[1;32m   ✅ INSTALLATION COMPLETE!                         \033[0m"
echo -e "\033[1;32m=====================================================\033[0m"
echo -e "To start the trader in Termux:"
echo -e "  cd ~/crypto_ai_trader"
echo -e "  source venv/bin/activate"
echo -e "  python -m crypto_ai_trader.app.main --mode=PAPER"
echo -e "\nTo run as background daemon:"
echo -e "  ./scripts/termux_daemon.sh start"
