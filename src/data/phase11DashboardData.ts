/**
 * Phase 11: Real-Time Responsive Web Dashboard Data & Configurations.
 * Provides complete operational telemetry, positions, live ticker streams,
 * performance charts, signals, and bot controls.
 */

export interface LiveTicker {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  lastUpdate: string;
}

export interface LivePosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  markPrice: number;
  size: number;
  notionalUsd: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
  leverage: number;
  openTime: string;
}

export interface LiveOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'TAKE_PROFIT';
  price: number;
  amount: number;
  filled: number;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED';
  createdAt: string;
}

export interface LiveSignalItem {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  timeframe: string;
  score: number;
  confidencePct: number;
  regime: string;
  isAllowedByMatrix: boolean;
  timestamp: string;
  reason: string;
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
  balance: number;
  drawdownPct: number;
  dailyReturnPct: number;
}

export interface StrategyPerformanceStat {
  strategyId: string;
  name: string;
  tradesCount: number;
  winRate: number;
  profitFactor: number;
  totalPnlUsd: number;
  maxDrawdownPct: number;
  status: 'ACTIVE' | 'PAUSED';
}

export interface BotLogItem {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SIGNAL' | 'ORDER' | 'RISK' | 'CRITICAL';
  module: string;
  message: string;
}

// --------------------------------------------------------------------------------
// INITIAL DATA
// --------------------------------------------------------------------------------

export const INITIAL_TICKERS: LiveTicker[] = [
  {
    symbol: 'BTC/USDT',
    price: 67420.50,
    change24h: 2.84,
    high24h: 68150.00,
    low24h: 65200.00,
    volume24h: '1.42B USDT',
    lastUpdate: 'Just now'
  },
  {
    symbol: 'ETH/USDT',
    price: 3540.20,
    change24h: 1.95,
    high24h: 3590.00,
    low24h: 3460.00,
    volume24h: '780M USDT',
    lastUpdate: 'Just now'
  },
  {
    symbol: 'SOL/USDT',
    price: 148.60,
    change24h: 5.12,
    high24h: 151.20,
    low24h: 140.80,
    volume24h: '410M USDT',
    lastUpdate: 'Just now'
  },
  {
    symbol: 'BNB/USDT',
    price: 584.10,
    change24h: 0.42,
    high24h: 592.00,
    low24h: 578.00,
    volume24h: '195M USDT',
    lastUpdate: 'Just now'
  }
];

export const INITIAL_POSITIONS: LivePosition[] = [
  {
    id: 'pos-btc-01',
    symbol: 'BTC/USDT',
    side: 'LONG',
    entryPrice: 65800.00,
    markPrice: 67420.50,
    size: 0.15,
    notionalUsd: 10113.08,
    unrealizedPnl: 243.08,
    unrealizedPnlPct: 2.46,
    stopLoss: 64500.00,
    tp1: 67200.00,
    tp2: 69000.00,
    tp3: 71500.00,
    tp1Hit: true,
    tp2Hit: false,
    tp3Hit: false,
    leverage: 3,
    openTime: '2026-09-05 18:24'
  },
  {
    id: 'pos-eth-02',
    symbol: 'ETH/USDT',
    side: 'SHORT',
    entryPrice: 3580.00,
    markPrice: 3540.20,
    size: 2.50,
    notionalUsd: 8850.50,
    unrealizedPnl: 99.50,
    unrealizedPnlPct: 1.11,
    stopLoss: 3640.00,
    tp1: 3520.00,
    tp2: 3450.00,
    tp3: 3380.00,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    leverage: 2,
    openTime: '2026-09-05 21:05'
  },
  {
    id: 'pos-sol-03',
    symbol: 'SOL/USDT',
    side: 'LONG',
    entryPrice: 142.50,
    markPrice: 148.60,
    size: 25.0,
    notionalUsd: 3715.00,
    unrealizedPnl: 152.50,
    unrealizedPnlPct: 4.28,
    stopLoss: 139.00,
    tp1: 148.00,
    tp2: 154.00,
    tp3: 162.00,
    tp1Hit: true,
    tp2Hit: false,
    tp3Hit: false,
    leverage: 3,
    openTime: '2026-09-06 02:10'
  }
];

export const INITIAL_ORDERS: LiveOrder[] = [
  {
    id: 'ord-101',
    symbol: 'BTC/USDT',
    side: 'SELL',
    type: 'LIMIT',
    price: 69000.00,
    amount: 0.05,
    filled: 0.0,
    status: 'NEW',
    createdAt: '2026-09-06 01:15'
  },
  {
    id: 'ord-102',
    symbol: 'ETH/USDT',
    side: 'BUY',
    type: 'LIMIT',
    price: 3520.00,
    amount: 1.0,
    filled: 0.0,
    status: 'NEW',
    createdAt: '2026-09-06 02:40'
  },
  {
    id: 'ord-103',
    symbol: 'SOL/USDT',
    side: 'SELL',
    type: 'LIMIT',
    price: 154.00,
    amount: 10.0,
    filled: 0.0,
    status: 'NEW',
    createdAt: '2026-09-06 03:00'
  }
];

export const INITIAL_SIGNALS: LiveSignalItem[] = [
  {
    id: 'sig-01',
    strategyId: 'strat_trend',
    strategyName: 'Trend Momentum Pro',
    symbol: 'BTC/USDT',
    direction: 'BUY',
    timeframe: '1h',
    score: 88,
    confidencePct: 92,
    regime: 'STRONG_BULL',
    isAllowedByMatrix: true,
    timestamp: '03:42:15',
    reason: 'EMA 20/50 Golden Cross + ADX 32.4 + Bullish Volume Spike'
  },
  {
    id: 'sig-02',
    strategyId: 'strat_breakout',
    strategyName: 'Volatility Breakout (Keltner)',
    symbol: 'SOL/USDT',
    direction: 'BUY',
    timeframe: '15m',
    score: 84,
    confidencePct: 88,
    regime: 'STRONG_BULL',
    isAllowedByMatrix: true,
    timestamp: '03:38:50',
    reason: 'Upper Band breakout with 2.8x 20-period volume expansion'
  },
  {
    id: 'sig-03',
    strategyId: 'strat_mean_rev',
    strategyName: 'RSI / Bollinger Reversion',
    symbol: 'ETH/USDT',
    direction: 'SELL',
    timeframe: '15m',
    score: 76,
    confidencePct: 79,
    regime: 'SIDEWAYS',
    isAllowedByMatrix: true,
    timestamp: '03:22:10',
    reason: 'Overbought RSI (74.2) at +2.5σ upper Bollinger envelope'
  },
  {
    id: 'sig-04',
    strategyId: 'strat_grid',
    strategyName: 'Adaptive Neutral Grid',
    symbol: 'BNB/USDT',
    direction: 'NEUTRAL',
    timeframe: '4h',
    score: 55,
    confidencePct: 62,
    regime: 'SIDEWAYS',
    isAllowedByMatrix: true,
    timestamp: '02:50:00',
    reason: 'Range-bound between 570 - 595, executing limit oscillations'
  }
];

export const EQUITY_CURVE_DATA: EquityCurvePoint[] = [
  { date: 'Aug 08', balance: 10000, equity: 10000, drawdownPct: 0.0, dailyReturnPct: 0.0 },
  { date: 'Aug 11', balance: 10180, equity: 10220, drawdownPct: 0.0, dailyReturnPct: 2.2 },
  { date: 'Aug 14', balance: 10350, equity: 10410, drawdownPct: 0.0, dailyReturnPct: 1.9 },
  { date: 'Aug 17', balance: 10290, equity: 10250, drawdownPct: 1.5, dailyReturnPct: -1.5 },
  { date: 'Aug 20', balance: 10520, equity: 10600, drawdownPct: 0.0, dailyReturnPct: 3.4 },
  { date: 'Aug 23', balance: 10840, equity: 10920, drawdownPct: 0.0, dailyReturnPct: 3.0 },
  { date: 'Aug 26', balance: 11100, equity: 11050, drawdownPct: 0.8, dailyReturnPct: 1.2 },
  { date: 'Aug 29', balance: 11450, equity: 11520, drawdownPct: 0.0, dailyReturnPct: 4.2 },
  { date: 'Sep 01', balance: 11800, equity: 11950, drawdownPct: 0.0, dailyReturnPct: 3.7 },
  { date: 'Sep 03', balance: 12150, equity: 12100, drawdownPct: 0.5, dailyReturnPct: 1.3 },
  { date: 'Sep 05', balance: 12380, equity: 12450, drawdownPct: 0.0, dailyReturnPct: 2.9 },
  { date: 'Sep 06', balance: 12450, equity: 12945, drawdownPct: 0.0, dailyReturnPct: 4.0 }
];

export const STRATEGY_STATS: StrategyPerformanceStat[] = [
  {
    strategyId: 'strat_a',
    name: 'Strategy A: Trend-Following Multi-EMA',
    tradesCount: 42,
    winRate: 71.4,
    profitFactor: 2.45,
    totalPnlUsd: 1420.50,
    maxDrawdownPct: 2.8,
    status: 'ACTIVE'
  },
  {
    strategyId: 'strat_b',
    name: 'Strategy B: Mean Reversion Bollinger',
    tradesCount: 31,
    winRate: 64.5,
    profitFactor: 1.88,
    totalPnlUsd: 840.20,
    maxDrawdownPct: 3.2,
    status: 'ACTIVE'
  },
  {
    strategyId: 'strat_c',
    name: 'Strategy C: Dynamic Volatility Breakout',
    tradesCount: 24,
    winRate: 66.7,
    profitFactor: 2.10,
    totalPnlUsd: 610.80,
    maxDrawdownPct: 2.1,
    status: 'ACTIVE'
  },
  {
    strategyId: 'strat_d',
    name: 'Strategy D: Fast Scalp Order Flow',
    tradesCount: 18,
    winRate: 61.1,
    profitFactor: 1.62,
    totalPnlUsd: 380.00,
    maxDrawdownPct: 1.8,
    status: 'ACTIVE'
  }
];

export const INITIAL_LOGS: BotLogItem[] = [
  {
    id: 'log-1',
    timestamp: '03:42:15',
    level: 'SIGNAL',
    module: 'StrategyRouter',
    message: 'Strategy A triggered BUY signal for BTC/USDT. Score: 88, AI Confidence: 92%.'
  },
  {
    id: 'log-2',
    timestamp: '03:42:16',
    level: 'RISK',
    module: 'RiskManager',
    message: 'Pre-Trade Risk Check PASSED: VaR within limits (0.84%), leverage 3x approved.'
  },
  {
    id: 'log-3',
    timestamp: '03:42:17',
    level: 'ORDER',
    module: 'OrderManager',
    message: 'Paper Order #ord-101 placed: BUY 0.15 BTC/USDT @ 65,800.00. Filled instantly.'
  },
  {
    id: 'log-4',
    timestamp: '03:43:00',
    level: 'INFO',
    module: 'WebSocketHub',
    message: 'Heartbeat ack received from exchange ticker feed. Latency: 24ms.'
  },
  {
    id: 'log-5',
    timestamp: '03:44:20',
    level: 'ORDER',
    module: 'ExecutionEngine',
    message: 'BTC/USDT Take-Profit 1 hit at 67,200.00. Partial close 33% locked +$70.00.'
  },
  {
    id: 'log-6',
    timestamp: '03:45:10',
    level: 'INFO',
    module: 'RegimeDetector',
    message: 'Current market regime classified as STRONG_BULL (Confidence 89.2%).'
  }
];

export const PHASE11_CODE_SNIPPETS = [
  {
    name: 'DashboardWebSocketClient.ts',
    description: 'Real-time WebSocket client with exponential backoff auto-reconnection and event dispatching.',
    code: `import { useState, useEffect, useRef, useCallback } from 'react';

export interface WSMessage {
  type: 'TICKER' | 'ORDER_UPDATE' | 'POSITION_UPDATE' | 'SIGNAL_UPDATE' | 'RISK_ALERT';
  payload: any;
  timestamp: number;
}

export function useTradingTelemetryWebSocket(endpointUrl: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(24);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const reconnectAttempts = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(endpointUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        console.log('[Telemetry WS] Connected to backend trading engine');
      };

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          setLastMessage(data);
        } catch (e) {
          console.error('[Telemetry WS] Failed to parse message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        reconnectAttempts.current += 1;
        setTimeout(connect, delay);
      };
    } catch (err) {
      console.error('[Telemetry WS] Connection error', err);
    }
  }, [endpointUrl]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, latencyMs, lastMessage };
}`
  },
  {
    name: 'EmergencyBotControl.py',
    description: 'FastAPI REST Controller with panic liquidation and circuit breaker trip.',
    code: `@app.post("/api/v1/bot/kill-switch")
async def emergency_kill_switch(payload: BotControlRequest):
    """
    Emergency Panic Kill Switch:
    1. Cancels all pending exchange orders immediately.
    2. Market flattens all open leveraged positions.
    3. Trips hardware circuit breaker to prevent re-entry.
    4. Emits high-priority WebSocket telemetry alert.
    """
    logger.critical("EMERGENCY KILL SWITCH ACTIVATED VIA DASHBOARD")
    report = await order_manager.panic_close_all(portfolio)
    await ws_hub.broadcast(WebSocketMessage(
        type=WebSocketMessageType.RISK_ALERT,
        payload={"event": "KILL_SWITCH_TRIPPED", "details": report}
    ))
    return APIResponse(success=True, data=report, message="PANIC FLATTEN COMPLETE")`
  }
];
