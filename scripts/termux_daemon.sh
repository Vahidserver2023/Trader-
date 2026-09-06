#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Crypto AI Trader - Termux Background Daemon Controller
# ==============================================================================

WORKSPACE_DIR="$HOME/crypto_ai_trader"
PID_FILE="$WORKSPACE_DIR/data/trader.pid"
LOG_FILE="$WORKSPACE_DIR/logs/trader.log"

mkdir -p "$WORKSPACE_DIR/data" "$WORKSPACE_DIR/logs"

case "$1" in
    start)
        if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
            echo "Bot daemon is already running (PID: $(cat $PID_FILE))"
            exit 1
        fi
        echo "Starting Crypto AI Trader daemon..."
        cd "$WORKSPACE_DIR"
        source venv/bin/activate
        nohup python -m crypto_ai_trader.app.main --mode=PAPER > "$LOG_FILE" 2>&1 &
        echo $! > "$PID_FILE"
        echo "Trader started with PID: $(cat $PID_FILE)"
        ;;
    stop)
        if [ ! -f "$PID_FILE" ]; then
            echo "No PID file found. Bot may not be running."
            exit 1
        fi
        PID=$(cat "$PID_FILE")
        echo "Stopping trader process (PID: $PID)..."
        kill -15 "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null
        rm -f "$PID_FILE"
        echo "Trader stopped successfully."
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
            echo "Trader daemon is RUNNING (PID: $(cat $PID_FILE))"
        else
            echo "Trader daemon is STOPPED"
        fi
        ;;
    logs)
        tail -n 50 -f "$LOG_FILE"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
