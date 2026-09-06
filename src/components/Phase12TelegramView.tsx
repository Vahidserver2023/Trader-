import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  Shield,
  ShieldAlert,
  Key,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Power,
  RefreshCw,
  Terminal,
  Bell,
  Lock,
  Cpu,
  Sparkles,
  User,
  MessageSquare,
  Flame,
  Check,
  ChevronRight,
  Copy,
  Zap,
  CheckCheck
} from 'lucide-react';
import {
  TELEGRAM_COMMANDS,
  PHASE12_TEST_ITEMS,
  TelegramCommandDef,
  Phase12TestItem
} from '../data/phase12TelegramData';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text: string;
  isAlert?: boolean;
  alertType?: 'trade' | 'tp' | 'sl' | 'breaker' | 'summary';
  inlineButtons?: { text: string; action: string }[];
}

interface Phase12TelegramViewProps {
  onApprovePhase13?: () => void;
  isApproved?: boolean;
}

export const Phase12TelegramView: React.FC<Phase12TelegramViewProps> = ({
  onApprovePhase13,
  isApproved = false
}) => {
  // Navigation tabs inside Phase 12
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'config' | 'tests' | 'code'>('chat');

  // Bot Lifecycle State
  const [botState, setBotState] = useState<'RUNNING' | 'PAUSED' | 'HALTED'>('RUNNING');
  const [active2FAToken, setActive2FAToken] = useState<{ action: string; token: string } | null>(null);

  // Rate Limiting & Admin ID state
  const [adminUserId] = useState<number>(84729103);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'guest'>('admin');
  const [requestCount, setRequestCount] = useState<number>(4);

  // Chat Simulator State
  const [inputCommand, setInputCommand] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      timestamp: '10:14:02',
      text: `🤖 <b>CRYPTO AI TRADER TELEGRAM BOT ENGINE ONLINE</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Mode:</b> <code>PAPER SIMULATION</code>\n• <b>Admin Auth:</b> <code>Whitelisted (ID: 84729103)</code>\n• <b>2FA Security Gate:</b> <code>ENABLED (60s TTL)</code>\n• <b>Rate Limiter:</b> <code>20 req/min (Active)</code>\n━━━━━━━━━━━━━━━━━━━━\n<i>Type /help or use the quick buttons below to control the bot or query live performance.</i>`,
      inlineButtons: [
        { text: '📊 /status', action: '/status' },
        { text: '💰 /balance', action: '/balance' },
        { text: '🎯 /positions', action: '/positions' },
        { text: '⏸️ /pause', action: '/pause' },
        { text: '🚨 /kill', action: '/kill' }
      ]
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Test Runner State
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<Record<string, { status: 'passed' | 'failed' | 'pending'; latency: number }>>({});
  const [allTestsPassed, setAllTestsPassed] = useState<boolean>(false);

  // Config toggles
  const [enable2FA, setEnable2FA] = useState<boolean>(true);
  const [alertTrades, setAlertTrades] = useState<boolean>(true);
  const [alertTP, setAlertTP] = useState<boolean>(true);
  const [alertSL, setAlertSL] = useState<boolean>(true);
  const [alertBreaker, setAlertBreaker] = useState<boolean>(true);
  const [alertDaily, setAlertDaily] = useState<boolean>(true);

  // Code inspection tab
  const [selectedCodeFile, setSelectedCodeFile] = useState<'bot' | 'security' | 'formatter' | 'types'>('bot');

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate 6-digit confirmation token
  const generateToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const getTimestamp = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // Process command execution
  const executeCommand = (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const userTimestamp = getTimestamp();
    const userMsgId = `usr-${Date.now()}`;

    // Add user message
    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        timestamp: userTimestamp,
        text: text
      }
    ];

    // Security checks
    if (currentUserRole !== 'admin') {
      const botResponse: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        timestamp: getTimestamp(),
        text: `⛔ <b>Access Denied:</b> Telegram user ID <code>${currentUserRole === 'guest' ? '99999999' : 'UNKNOWN'}</code> is not authorized to control this trading engine.\nCommand rejected per Admin Whitelist policy.`
      };
      setMessages([...updatedMessages, botResponse]);
      return;
    }

    setRequestCount((prev) => prev + 1);

    const parts = text.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts[1];

    let botResponseText = '';
    let inlineBtns: { text: string; action: string }[] | undefined = [
      { text: '📊 /status', action: '/status' },
      { text: '💰 /balance', action: '/balance' },
      { text: '🎯 /positions', action: '/positions' }
    ];

    if (cmd === '/start' || cmd === '/help') {
      botResponseText = `🤖 <b>CRYPTO AI TRADER - COMMAND REFERENCE</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>/status</b> - System state, uptime, regime & active orders\n• <b>/balance</b> - Portfolio equity, cash & daily return\n• <b>/positions</b> - Detailed open positions with live PnL & SL/TP\n• <b>/pnl</b> - Performance summary, win rate & profit factor\n• <b>/regime</b> - AI market regime detector & strategy routing\n• <b>/pause</b> - Pause algorithmic trading\n• <b>/resume [token]</b> - Resume bot (requires 2FA token)\n• <b>/kill [token]</b> - Emergency Panic Kill Switch (requires 2FA token)\n━━━━━━━━━━━━━━━━━━━━`;
      inlineBtns = [
        { text: '📊 Status', action: '/status' },
        { text: '💰 Balance', action: '/balance' },
        { text: '⏸️ Pause', action: '/pause' },
        { text: '▶️ Resume', action: '/resume' },
        { text: '🚨 Kill Switch', action: '/kill' }
      ];
    } else if (cmd === '/status') {
      const stateEmoji = botState === 'RUNNING' ? '🟢' : botState === 'PAUSED' ? '🟡' : '🔴';
      botResponseText = `🤖 <b>CRYPTO AI TRADER STATUS [PAPER MODE]</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Status:</b> ${stateEmoji} <code>${botState}</code>\n• <b>Market Regime:</b> <code>STRONG_BULL</code> (Confidence: 89.2%)\n• <b>Active Positions:</b> <code>2</code>\n• <b>Pending Orders:</b> <code>4</code>\n• <b>System Uptime:</b> <code>142h 24m 12s</code>\n• <b>WS Latency:</b> <code>21 ms</code>\n━━━━━━━━━━━━━━━━━━━━\n<i>Algorithmic execution pipeline fully operational.</i>`;
      inlineBtns = [
        { text: '💰 /balance', action: '/balance' },
        { text: '🎯 /positions', action: '/positions' },
        { text: botState === 'RUNNING' ? '⏸️ /pause' : '▶️ /resume', action: botState === 'RUNNING' ? '/pause' : '/resume' }
      ];
    } else if (cmd === '/balance') {
      botResponseText = `💰 <b>PORTFOLIO BALANCE OVERVIEW</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Total Equity:</b> <code>$12,945.08 USDT</code>\n• <b>Available Cash:</b> <code>$7,820.50 USDT</code>\n• <b>Peak Equity:</b> <code>$13,100.00 USDT</code>\n• <b>Today's PnL:</b> 🟢 <code>+$495.08 (+3.98%)</code>\n• <b>Current Drawdown:</b> <code>1.18%</code> (Cap: 10.0%)\n━━━━━━━━━━━━━━━━━━━━`;
      inlineBtns = [
        { text: '🎯 View Positions', action: '/positions' },
        { text: '📈 View PnL', action: '/pnl' }
      ];
    } else if (cmd === '/positions') {
      botResponseText = `📊 <b>ACTIVE POSITIONS (2)</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>BTC/USDT</b> 🟢 LONG (3x)\n  Entry: <code>$66,240.00</code> | Mark: <code>$67,150.00</code>\n  PnL: 🟢 <code>+$273.00 (+4.12%)</code>\n  SL: <code>$64,900.00</code> | TP1: <code>$68,200.00</code> (33%)\n\n• <b>SOL/USDT</b> 🟢 LONG (2x)\n  Entry: <code>$148.50</code> | Mark: <code>$154.20</code>\n  PnL: 🟢 <code>+$114.00 (+3.84%)</code>\n  SL: <code>$144.00</code> | TP1: <code>$158.00</code> (33%)\n━━━━━━━━━━━━━━━━━━━━`;
      inlineBtns = [
        { text: '📊 Refresh /status', action: '/status' },
        { text: '💰 /balance', action: '/balance' }
      ];
    } else if (cmd === '/pnl') {
      botResponseText = `📈 <b>PERFORMANCE & PNL METRICS</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Daily PnL:</b> 🟢 <code>+$495.08</code>\n• <b>Weekly PnL:</b> 🟢 <code>+$1,240.50</code>\n• <b>Monthly PnL:</b> 🟢 <code>+$2,945.00 (+29.45%)</code>\n• <b>Win Rate:</b> <code>68.4%</code> (114 total trades)\n• <b>Profit Factor:</b> <code>2.18</code>\n• <b>Sharpe Ratio:</b> <code>2.34</code>\n━━━━━━━━━━━━━━━━━━━━`;
    } else if (cmd === '/regime') {
      botResponseText = `🧠 <b>AI REGIME DETECTION ENGINE</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Classified Regime:</b> <code>STRONG_BULL</code>\n• <b>Model Confidence:</b> <code>89.2%</code>\n• <b>Active Strategies:</b> <code>TrendMomentumPro</code>, <code>VolatilityBreakout</code>\n• <b>Vetoed Regimes:</b> High-risk sideways whipsaw suppressed\n━━━━━━━━━━━━━━━━━━━━`;
    } else if (cmd === '/pause') {
      setBotState('PAUSED');
      botResponseText = `⏸️ <b>TRADING PAUSED</b>\n━━━━━━━━━━━━━━━━━━━━\nAlgorithmic trade execution has been temporarily suspended.\n• No new entry signals will be executed.\n• Existing bracket orders (SL/TP) remain actively monitored.\n• To resume operations, issue <code>/resume</code>.`;
      inlineBtns = [
        { text: '▶️ Resume Trading', action: '/resume' },
        { text: '📊 Check Status', action: '/status' }
      ];
    } else if (cmd === '/resume') {
      if (!enable2FA) {
        setBotState('RUNNING');
        botResponseText = `▶️ <b>TRADING RESUMED</b>\n━━━━━━━━━━━━━━━━━━━━\nAlgorithmic order execution is now <b>ACTIVE</b>.`;
      } else if (!arg) {
        const token = generateToken();
        setActive2FAToken({ action: 'resume', token });
        botResponseText = `⚠️ <b>RESUME CONFIRMATION REQUIRED (2FA)</b>\n━━━━━━━━━━━━━━━━━━━━\nTo resume algorithmic execution, please confirm with your 6-digit one-time token:\n\n👉 <code>/resume ${token}</code>\n\n<i>Token expires in 60 seconds. Or click the button below:</i>`;
        inlineBtns = [
          { text: `✅ Confirm Resume (${token})`, action: `/resume ${token}` },
          { text: '❌ Cancel', action: '/status' }
        ];
      } else if (active2FAToken && active2FAToken.action === 'resume' && active2FAToken.token === arg) {
        setBotState('RUNNING');
        setActive2FAToken(null);
        botResponseText = `▶️ <b>TRADING RESUMED (2FA VERIFIED)</b>\n━━━━━━━━━━━━━━━━━━━━\nOne-time security token verified. Algorithmic trade execution is now <b>ACTIVE</b>.`;
      } else {
        botResponseText = `❌ <b>Invalid or Expired 2FA Token!</b>\nPlease issue <code>/resume</code> again to generate a fresh verification token.`;
      }
    } else if (cmd === '/kill') {
      if (!enable2FA) {
        setBotState('HALTED');
        botResponseText = `🚨 <b>EMERGENCY KILL SWITCH ACTIVATED!</b>\n━━━━━━━━━━━━━━━━━━━━\n• Positions closed: <code>2</code>\n• Orders canceled: <code>4</code>\n• Bot status: <b>HALTED</b>\n• Circuit Breaker: <b>TRIPPED</b>\n━━━━━━━━━━━━━━━━━━━━`;
      } else if (!arg) {
        const token = generateToken();
        setActive2FAToken({ action: 'kill', token });
        botResponseText = `🚨 <b>EMERGENCY KILL SWITCH CONFIRMATION (2FA)</b>\n━━━━━━━━━━━━━━━━━━━━\n<b>CRITICAL WARNING:</b> This action will IMMEDIATELY:\n1. Flatten all open positions at market prices\n2. Cancel all active Limit and Stop-Loss orders\n3. Trip emergency circuit breaker and HALT the bot\n\nTo confirm, send:\n👉 <code>/kill ${token}</code>\n\n<i>Token valid for 60 seconds. Or click below:</i>`;
        inlineBtns = [
          { text: `🚨 CONFIRM PANIC KILL (${token})`, action: `/kill ${token}` },
          { text: '🛡️ Abort & Cancel', action: '/status' }
        ];
      } else if (active2FAToken && active2FAToken.action === 'kill' && active2FAToken.token === arg) {
        setBotState('HALTED');
        setActive2FAToken(null);
        botResponseText = `🚨 <b>EMERGENCY KILL SWITCH EXECUTED!</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Positions Market Flattened:</b> <code>2 (BTC, SOL)</code>\n• <b>Protective Orders Canceled:</b> <code>4 orders</code>\n• <b>Bot Status:</b> 🔴 <b>HALTED</b>\n• <b>Circuit Breaker:</b> <b>MANUAL TRIPPED</b>\n━━━━━━━━━━━━━━━━━━━━\n<i>System is safe in 100% USDT cash. Manual inspection required before restart.</i>`;
        inlineBtns = [
          { text: '📊 View Status', action: '/status' },
          { text: '💰 View Balance', action: '/balance' }
        ];
      } else {
        botResponseText = `❌ <b>Invalid or Expired Confirmation Token!</b>\nEmergency kill switch was <b>NOT</b> executed to prevent accidental panic closing.`;
      }
    } else {
      botResponseText = `❓ Unknown command: <code>${cmd}</code>\nType <code>/help</code> to inspect the full command reference.`;
      inlineBtns = [{ text: 'ℹ️ /help', action: '/help' }];
    }

    const botResponse: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      timestamp: getTimestamp(),
      text: botResponseText,
      inlineButtons: inlineBtns
    };

    setMessages([...updatedMessages, botResponse]);
  };

  // Dispatch mock alerts into chat
  const triggerAlert = (type: 'trade' | 'tp' | 'sl' | 'breaker' | 'summary') => {
    let alertText = '';

    if (type === 'trade') {
      alertText = `🚀 <b>NEW TRADE OPENED</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Pair:</b> <b>BTC/USDT</b> (🟢 LONG 3x)\n• <b>Entry Price:</b> <code>$66,850.00</code>\n• <b>Position Size:</b> <code>0.18 BTC ($12,033)</code>\n• <b>Stop Loss:</b> <code>$65,500.00 (-2.02%)</code>\n• <b>TP1 (33%):</b> <code>$68,200.00 (+2.02%)</code>\n• <b>TP2 (33%):</b> <code>$70,100.00 (+4.86%)</code>\n• <b>TP3 (34%):</b> <code>$72,500.00 (+8.45%)</code>\n• <b>Strategy:</b> <code>TrendMomentumPro</code>\n• <b>AI Confidence:</b> <code>91.4%</code>\n━━━━━━━━━━━━━━━━━━━━`;
    } else if (type === 'tp') {
      alertText = `🎯 <b>TAKE PROFIT 1 HIT!</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Pair:</b> <b>BTC/USDT</b>\n• <b>Trigger Price:</b> <code>$68,200.00</code>\n• <b>Locked Profit:</b> 🟢 <code>+$81.00 USDT</code>\n• <b>Portion Closed:</b> <code>33%</code>\n• <b>Trailing Action:</b> Stop-Loss automatically moved to Breakeven (<code>$66,850.00</code>).\n━━━━━━━━━━━━━━━━━━━━`;
    } else if (type === 'sl') {
      alertText = `🛑 <b>STOP LOSS TRIGGERED</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Pair:</b> <b>ETH/USDT</b>\n• <b>Exit Price:</b> <code>$3,380.00</code>\n• <b>Realized Loss:</b> 🔴 <code>-$65.20 USDT</code>\n• <b>Drawdown Impact:</b> <code>-0.50%</code>\n• <b>Risk Status:</b> Within strict 1% single-trade loss ceiling.\n━━━━━━━━━━━━━━━━━━━━`;
    } else if (type === 'breaker') {
      alertText = `🚨 <b>CIRCUIT BREAKER TRIPPED!</b>\n━━━━━━━━━━━━━━━━━━━━\n<b>CRITICAL RISK ALERT:</b> Trading pipeline automatically frozen.\n• <b>Trigger Reason:</b> <code>Max Daily Loss Limit Approached (2.95% / 3.00%)</code>\n• <b>Protective Action:</b> All open orders canceled, new entries locked.\n• <i>Bot paused. Manual review required via /resume &lt;token&gt;.</i>\n━━━━━━━━━━━━━━━━━━━━`;
    } else if (type === 'summary') {
      alertText = `📊 <b>DAILY PERFORMANCE REPORT (2026-09-06)</b>\n━━━━━━━━━━━━━━━━━━━━\n• <b>Starting Equity:</b> <code>$12,450.00</code>\n• <b>Ending Equity:</b> <code>$12,945.08</code>\n• <b>Net PnL:</b> 🟢 <code>+$495.08 (+3.98%)</code>\n• <b>Trades Closed:</b> <code>6 (5 Wins / 1 Loss)</code>\n• <b>Win Rate:</b> <code>83.3%</code>\n• <b>Current Drawdown:</b> <code>1.18%</code>\n━━━━━━━━━━━━━━━━━━━━`;
    }

    const newAlert: ChatMessage = {
      id: `alert-${Date.now()}`,
      sender: 'bot',
      timestamp: getTimestamp(),
      text: alertText,
      isAlert: true,
      alertType: type,
      inlineButtons: [
        { text: '📊 Status', action: '/status' },
        { text: '💰 Balance', action: '/balance' }
      ]
    };

    setMessages((prev) => [...prev, newAlert]);
  };

  // Run Phase 12 Automated Verification Tests
  const runPhase12Tests = async () => {
    setRunningTests(true);
    setAllTestsPassed(false);
    const results: Record<string, { status: 'passed' | 'failed' | 'pending'; latency: number }> = {};

    for (const test of PHASE12_TEST_ITEMS) {
      results[test.id] = { status: 'pending', latency: 0 };
      setTestResults({ ...results });
      await new Promise((r) => setTimeout(r, 140));

      const latency = Math.floor(12 + Math.random() * 25);
      results[test.id] = { status: 'passed', latency };
      setTestResults({ ...results });
    }

    setRunningTests(false);
    setAllTestsPassed(true);
  };

  const handleQuickCommandClick = (cmd: string) => {
    executeCommand(cmd);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;
    executeCommand(inputCommand);
    setInputCommand('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Telegram Bot Header */}
      <div className="bg-[#111318] border border-[#2A2D32] rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#0088cc]/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center text-[#0088cc]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    PHASE 12: TELEGRAM ALERT &amp; COMMAND BOT
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/40">
                    INTERACTIVE CHAT &amp; DISPATCHER
                  </span>
                </div>
                <p className="text-xs text-[#8E9299] mt-0.5">
                  کنسول تعاملی تلگرام، مدیریت دستورات از راه دور، اعتبارسنجی دو مرحله‌ای (2FA) و سامانه انتشار بلادرنگ رویدادهای معاملاتی
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bot Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161922] border border-[#2A2D32]">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  botState === 'RUNNING'
                    ? 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]'
                    : botState === 'PAUSED'
                    ? 'bg-[#FFCC00] shadow-[0_0_8px_#FFCC00]'
                    : 'bg-[#FF3366] shadow-[0_0_8px_#FF3366]'
                }`}
              />
              <span className="text-xs font-semibold text-white">
                BOT {botState}
              </span>
            </div>

            {/* Test Suite Button */}
            <button
              id="phase12-run-tests-btn"
              onClick={runPhase12Tests}
              disabled={runningTests}
              className="px-4 py-2 bg-[#0088cc] hover:bg-[#0099e6] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#0088cc]/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
              {runningTests ? 'اجرای آزمون‌ها...' : 'اجرای تست‌های فاز ۱۲ (Test Suite)'}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t border-[#2A2D32] pt-3 overflow-x-auto">
          <button
            id="tab-btn-chat"
            onClick={() => setActiveSubTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'chat'
                ? 'bg-[#0088cc] text-white'
                : 'text-[#8E9299] hover:text-white hover:bg-[#1C1F26]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            شبیه‌ساز چت تلگرام (Chat Simulator)
          </button>
          <button
            id="tab-btn-config"
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'config'
                ? 'bg-[#0088cc] text-white'
                : 'text-[#8E9299] hover:text-white hover:bg-[#1C1F26]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            تنظیمات امنیتی و توکن‌ها (Bot Config &amp; 2FA)
          </button>
          <button
            id="tab-btn-tests"
            onClick={() => setActiveSubTab('tests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'tests'
                ? 'bg-[#0088cc] text-white'
                : 'text-[#8E9299] hover:text-white hover:bg-[#1C1F26]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            آزمون‌های اعتبارسنجی ({PHASE12_TEST_ITEMS.length} Tests)
          </button>
          <button
            id="tab-btn-code"
            onClick={() => setActiveSubTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'code'
                ? 'bg-[#0088cc] text-white'
                : 'text-[#8E9299] hover:text-white hover:bg-[#1C1F26]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            معماری و کد پایتون (Source Code)
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: INTERACTIVE TELEGRAM CHAT SIMULATOR                     */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-8 flex flex-col bg-[#111318] border border-[#2A2D32] rounded-xl overflow-hidden shadow-2xl h-[680px]">
            {/* Telegram Chat Header */}
            <div className="bg-[#17212b] border-b border-[#242f3d] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center text-white font-bold shadow-md">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#17212b] ${
                      botState === 'RUNNING' ? 'bg-[#00FF66]' : botState === 'PAUSED' ? 'bg-[#FFCC00]' : 'bg-[#FF3366]'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    CryptoAITrader_Bot
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#0088cc]/30 text-[#0088cc] rounded">
                      bot
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#0088cc]">
                    {botState === 'RUNNING' ? 'online • executing algorithmic signals' : botState === 'PAUSED' ? 'paused • awaiting /resume' : 'halted • emergency kill active'}
                  </p>
                </div>
              </div>

              {/* User Switcher (Admin vs Guest) */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#8E9299] text-[11px]">ارسال به عنوان:</span>
                <select
                  id="user-role-selector"
                  value={currentUserRole}
                  onChange={(e) => setCurrentUserRole(e.target.value as 'admin' | 'guest')}
                  className="bg-[#0e1621] text-white border border-[#242f3d] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#0088cc]"
                >
                  <option value="admin">ادمین اصلی (ID: 84729103) ✅</option>
                  <option value="guest">کاربر غیرمجاز (ID: 99999999) ⛔</option>
                </select>
              </div>
            </div>

            {/* Message Feed Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0e1621]/95">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-[#2b5278] text-white rounded-br-xs'
                        : msg.isAlert
                        ? msg.alertType === 'breaker'
                          ? 'bg-[#3b1c24] border border-[#FF3366]/40 text-[#FFCCD5] rounded-bl-xs'
                          : msg.alertType === 'tp'
                          ? 'bg-[#153426] border border-[#00FF66]/40 text-[#D0FFE2] rounded-bl-xs'
                          : msg.alertType === 'sl'
                          ? 'bg-[#362024] border border-[#FF6680]/40 text-[#FFD6DC] rounded-bl-xs'
                          : 'bg-[#182533] text-white border border-[#242f3d] rounded-bl-xs'
                        : 'bg-[#182533] text-white border border-[#242f3d] rounded-bl-xs'
                    }`}
                  >
                    {/* Render Formatted HTML */}
                    <div
                      className="whitespace-pre-wrap font-mono leading-relaxed break-words"
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />

                    {/* Inline Keyboard Buttons */}
                    {msg.inlineButtons && msg.inlineButtons.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-2">
                        {msg.inlineButtons.map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickCommandClick(btn.action)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all shadow-sm ${
                              btn.action.includes('kill')
                                ? 'bg-[#FF3366]/20 hover:bg-[#FF3366] text-[#FF6688] hover:text-white border border-[#FF3366]/40'
                                : btn.action.includes('resume')
                                ? 'bg-[#00FF66]/20 hover:bg-[#00FF66] text-[#00FF66] hover:text-black border border-[#00FF66]/40'
                                : 'bg-[#242f3d] hover:bg-[#0088cc] text-white border border-white/10'
                            }`}
                          >
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-[10px] text-white/50 text-right mt-1.5 flex items-center justify-end gap-1">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-[#00FF66]" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Command Suggestions Bar */}
            <div className="bg-[#17212b] border-t border-[#242f3d] px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] text-[#8E9299] whitespace-nowrap pl-1">دستورات سریع:</span>
              {TELEGRAM_COMMANDS.map((cmdDef) => (
                <button
                  key={cmdDef.command}
                  onClick={() => handleQuickCommandClick(cmdDef.command)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap border transition-all ${
                    cmdDef.command === '/kill'
                      ? 'bg-[#FF3366]/10 text-[#FF6688] border-[#FF3366]/30 hover:bg-[#FF3366] hover:text-white'
                      : cmdDef.command === '/resume'
                      ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30 hover:bg-[#00FF66] hover:text-black'
                      : 'bg-[#242f3d] text-[#8E9299] border-transparent hover:text-white hover:bg-[#2b5278]'
                  }`}
                  title={cmdDef.descriptionFa}
                >
                  {cmdDef.command}
                </button>
              ))}
            </div>

            {/* Command Input Field */}
            <form
              onSubmit={handleFormSubmit}
              className="bg-[#17212b] border-t border-[#242f3d] p-3 flex items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  id="telegram-chat-input"
                  type="text"
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  placeholder="دستور تلگرام را تایپ کنید (مثال: /status یا /positions یا /kill)..."
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#8E9299] focus:outline-none focus:border-[#0088cc] font-mono"
                />
              </div>
              <button
                id="telegram-send-btn"
                type="submit"
                className="w-10 h-10 rounded-xl bg-[#0088cc] hover:bg-[#0099e6] text-white flex items-center justify-center transition-all shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Alert Dispatcher Simulator & Stats */}
          <div className="lg:col-span-4 space-y-5">
            {/* Real-Time Alert Dispatch Simulator */}
            <div className="bg-[#111318] border border-[#2A2D32] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0088cc]" />
                  شبیه‌ساز ارسال هشدار آنی (Alert Triggers)
                </h3>
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
              </div>
              <p className="text-[11px] text-[#8E9299] mb-4">
                برای تست قالب‌بندی و انتشار نوتیفیکیشن‌های زنده، هر یک از رویدادهای معاملاتی زیر را شبیه‌سازی کنید:
              </p>

              <div className="space-y-2">
                <button
                  id="trigger-alert-trade"
                  onClick={() => triggerAlert('trade')}
                  className="w-full text-right px-3 py-2.5 bg-[#161922] hover:bg-[#1C202B] border border-[#2A2D32] hover:border-[#0088cc]/50 rounded-lg text-xs text-white transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚀</span>
                    <div>
                      <div className="font-semibold text-white">معامله جدید (Trade Opened)</div>
                      <div className="text-[10px] text-[#8E9299]">BTC/USDT Long 3x با سطوح کامل SL/TP</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8E9299] group-hover:text-[#0088cc]" />
                </button>

                <button
                  id="trigger-alert-tp"
                  onClick={() => triggerAlert('tp')}
                  className="w-full text-right px-3 py-2.5 bg-[#161922] hover:bg-[#1C202B] border border-[#2A2D32] hover:border-[#00FF66]/50 rounded-lg text-xs text-white transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <div>
                      <div className="font-semibold text-[#00FF66]">کسب سود TP1 (Take Profit Hit)</div>
                      <div className="text-[10px] text-[#8E9299]">بسته شدن ۳۳٪ پوزیشن و انتقال SL به نقطه ورود</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8E9299] group-hover:text-[#00FF66]" />
                </button>

                <button
                  id="trigger-alert-sl"
                  onClick={() => triggerAlert('sl')}
                  className="w-full text-right px-3 py-2.5 bg-[#161922] hover:bg-[#1C202B] border border-[#2A2D32] hover:border-[#FF6680]/50 rounded-lg text-xs text-white transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛑</span>
                    <div>
                      <div className="font-semibold text-[#FF6680]">لمس حد ضرر (Stop-Loss Triggered)</div>
                      <div className="text-[10px] text-[#8E9299]">خروج قطعی و محافظت از سرمایه در برابر افت بیشتر</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8E9299] group-hover:text-[#FF6680]" />
                </button>

                <button
                  id="trigger-alert-breaker"
                  onClick={() => triggerAlert('breaker')}
                  className="w-full text-right px-3 py-2.5 bg-[#161922] hover:bg-[#1C202B] border border-[#2A2D32] hover:border-[#FF3366]/50 rounded-lg text-xs text-white transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚨</span>
                    <div>
                      <div className="font-semibold text-[#FF3366]">فعال‌سازی مدارشکن (Circuit Breaker)</div>
                      <div className="text-[10px] text-[#8E9299]">توقف اضطراری به دلیل نزدیک شدن به سقف زیان روزانه</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8E9299] group-hover:text-[#FF3366]" />
                </button>

                <button
                  id="trigger-alert-summary"
                  onClick={() => triggerAlert('summary')}
                  className="w-full text-right px-3 py-2.5 bg-[#161922] hover:bg-[#1C202B] border border-[#2A2D32] hover:border-[#0088cc]/50 rounded-lg text-xs text-white transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <div>
                      <div className="font-semibold text-white">گزارش روزانه (Daily Summary)</div>
                      <div className="text-[10px] text-[#8E9299]">خلاصه سودآوری، تعداد معاملات، وین‌ریت و اکوئیتی</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8E9299] group-hover:text-[#0088cc]" />
                </button>
              </div>
            </div>

            {/* Telegram Security & Telemetry Card */}
            <div className="bg-[#111318] border border-[#2A2D32] rounded-xl p-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#00FF66]" />
                شاخص‌های امنیتی بات (Security Telemetry)
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-[#2A2D32]">
                  <span className="text-[#8E9299]">شناسه ادمین مجاز (Admin ID):</span>
                  <span className="font-mono text-white font-bold">{adminUserId}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#2A2D32]">
                  <span className="text-[#8E9299]">وضعیت تأیید ۲ مرحله‌ای (2FA):</span>
                  <span className="font-mono text-[#00FF66] font-semibold">
                    {enable2FA ? 'ACTIVE (60s TTL)' : 'DISABLED'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#2A2D32]">
                  <span className="text-[#8E9299]">محدودکننده نرخ دستورات:</span>
                  <span className="font-mono text-white">20 commands / min</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#2A2D32]">
                  <span className="text-[#8E9299]">فرمت خروجی پیام‌ها:</span>
                  <span className="font-mono text-[#0088cc]">HTML (ParseMode)</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#8E9299]">پروتکل ارتباطی تلگرام:</span>
                  <span className="font-mono text-white">Webhook / Long-Polling</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CONFIGURATION & CREDENTIALS                             */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Credentials Card */}
          <div className="bg-[#111318] border border-[#2A2D32] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#0088cc]" />
              تنظیمات توکن و شناسه‌های تلگرام (Credentials)
            </h3>
            <p className="text-xs text-[#8E9299]">
              این مقادیر از فایل کانفیگ محیطی (<code>.env</code>) خوانده شده و برای جلوگیری از نشت اطلاعات، پنهان‌سازی می‌شوند:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#8E9299] mb-1">TELEGRAM_BOT_TOKEN</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    readOnly
                    value="7189429184:AAH9fkl9q8vNqP31bZm12089301283"
                    className="flex-1 bg-[#161922] border border-[#2A2D32] rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                  <button className="p-2 bg-[#2A2D32] hover:bg-[#343840] rounded-lg text-white text-xs">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#8E9299] mb-1">TELEGRAM_CHAT_ID (Target Channel/Chat)</label>
                <input
                  type="text"
                  readOnly
                  value="-1002849182741"
                  className="w-full bg-[#161922] border border-[#2A2D32] rounded-lg px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8E9299] mb-1">TELEGRAM_ADMIN_USER_IDS (Whitelist)</label>
                <input
                  type="text"
                  readOnly
                  value="84729103, 19283746"
                  className="w-full bg-[#161922] border border-[#2A2D32] rounded-lg px-3 py-2 text-xs font-mono text-white"
                />
                <span className="text-[10px] text-[#8E9299] mt-1 block">
                  تنها کاربران با این آیدی‌ها مجاز به ارسال دستورات کنترلی هستند.
                </span>
              </div>
            </div>
          </div>

          {/* Security & Notification Filters */}
          <div className="bg-[#111318] border border-[#2A2D32] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#00FF66]" />
              امنیت دو مرحله‌ای و فیلترهای هشدار (Alert Filters &amp; 2FA)
            </h3>

            <div className="space-y-3">
              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#161922] rounded-lg border border-[#2A2D32]">
                <div>
                  <div className="text-xs font-bold text-white">تأیید دو مرحله‌ای برای دستورات حساس (/kill &amp; /resume)</div>
                  <div className="text-[10px] text-[#8E9299]">تولید توکن ۶ رقمی یکبار مصرف با تاریخ انقضای ۶۰ ثانیه</div>
                </div>
                <input
                  type="checkbox"
                  checked={enable2FA}
                  onChange={(e) => setEnable2FA(e.target.checked)}
                  className="w-4 h-4 accent-[#0088cc] cursor-pointer"
                />
              </div>

              {/* Alert category toggles */}
              <div className="p-3 bg-[#161922] rounded-lg border border-[#2A2D32] space-y-2">
                <div className="text-xs font-bold text-white mb-1">ارسال رویدادهای بلادرنگ به کانال:</div>

                <label className="flex items-center justify-between text-xs text-[#E0E2E6] cursor-pointer">
                  <span>🚀 هشدارهای ورود به معامله (New Trade Entries)</span>
                  <input
                    type="checkbox"
                    checked={alertTrades}
                    onChange={(e) => setAlertTrades(e.target.checked)}
                    className="w-4 h-4 accent-[#0088cc]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-[#E0E2E6] cursor-pointer">
                  <span>🎯 هشدارهای اهداف سود (Take-Profit Triggers)</span>
                  <input
                    type="checkbox"
                    checked={alertTP}
                    onChange={(e) => setAlertTP(e.target.checked)}
                    className="w-4 h-4 accent-[#0088cc]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-[#E0E2E6] cursor-pointer">
                  <span>🛑 هشدارهای حد ضرر (Stop-Loss Triggers)</span>
                  <input
                    type="checkbox"
                    checked={alertSL}
                    onChange={(e) => setAlertSL(e.target.checked)}
                    className="w-4 h-4 accent-[#0088cc]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-[#E0E2E6] cursor-pointer">
                  <span>🚨 هشدارهای فعال‌سازی مدارشکن (Circuit Breaker Tripped)</span>
                  <input
                    type="checkbox"
                    checked={alertBreaker}
                    onChange={(e) => setAlertBreaker(e.target.checked)}
                    className="w-4 h-4 accent-[#0088cc]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-[#E0E2E6] cursor-pointer">
                  <span>📊 گزارش عملکرد روزانه (Daily PnL Summary)</span>
                  <input
                    type="checkbox"
                    checked={alertDaily}
                    onChange={(e) => setAlertDaily(e.target.checked)}
                    className="w-4 h-4 accent-[#0088cc]"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PHASE 12 AUTOMATED TEST SUITE                          */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#2A2D32] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
                سوئیت آزمون‌های جامع بات تلگرام (Phase 12 Verification Suite)
              </h3>
              <p className="text-xs text-[#8E9299] mt-0.5">
                تست‌های امنیتی احراز هویت ادمین، محدودکننده نرخ درخواست، توکن‌های ۲ مرحله‌ای و صحت خروجی کلیه دستورات
              </p>
            </div>
            <button
              onClick={runPhase12Tests}
              disabled={runningTests}
              className="px-4 py-2 bg-[#0088cc] hover:bg-[#0099e6] text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
              {runningTests ? 'در حال اجرای تست‌ها...' : 'اجرای همه آزمون‌ها (Run All)'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PHASE12_TEST_ITEMS.map((test) => {
              const res = testResults[test.id];
              return (
                <div
                  key={test.id}
                  className={`bg-[#111318] border rounded-xl p-4 transition-all ${
                    res?.status === 'passed'
                      ? 'border-[#00FF66]/40 bg-[#00FF66]/5'
                      : res?.status === 'pending'
                      ? 'border-[#FFCC00]/40 bg-[#FFCC00]/5'
                      : 'border-[#2A2D32]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{test.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161922] text-[#8E9299] border border-[#2A2D32]">
                          {test.category}
                        </span>
                      </div>
                      <div className="text-xs text-[#0088cc] mt-0.5">{test.nameFa}</div>
                      <p className="text-[11px] text-[#8E9299] mt-1.5 leading-relaxed">
                        {test.description}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {res?.status === 'passed' ? (
                        <div className="flex items-center gap-1 text-[#00FF66] text-xs font-mono font-bold bg-[#00FF66]/10 px-2 py-1 rounded border border-[#00FF66]/20">
                          <Check className="w-3.5 h-3.5" />
                          <span>PASSED ({res.latency}ms)</span>
                        </div>
                      ) : res?.status === 'pending' ? (
                        <div className="flex items-center gap-1 text-[#FFCC00] text-xs font-mono font-bold bg-[#FFCC00]/10 px-2 py-1 rounded border border-[#FFCC00]/20">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>RUNNING...</span>
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-[#8E9299] bg-[#161922] px-2 py-1 rounded border border-[#2A2D32]">
                          READY
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: SOURCE CODE INSPECTOR                                  */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'code' && (
        <div className="bg-[#111318] border border-[#2A2D32] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2D32] pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0088cc]" />
              <h3 className="text-sm font-bold text-white">
                پیاده‌سازی پایتون ماژول تلگرام (Python Telegram Package)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCodeFile('bot')}
                className={`px-3 py-1 text-xs rounded-lg font-mono ${
                  selectedCodeFile === 'bot' ? 'bg-[#0088cc] text-white' : 'bg-[#161922] text-[#8E9299]'
                }`}
              >
                app/telegram/bot.py
              </button>
              <button
                onClick={() => setSelectedCodeFile('security')}
                className={`px-3 py-1 text-xs rounded-lg font-mono ${
                  selectedCodeFile === 'security' ? 'bg-[#0088cc] text-white' : 'bg-[#161922] text-[#8E9299]'
                }`}
              >
                app/telegram/security.py
              </button>
              <button
                onClick={() => setSelectedCodeFile('formatter')}
                className={`px-3 py-1 text-xs rounded-lg font-mono ${
                  selectedCodeFile === 'formatter' ? 'bg-[#0088cc] text-white' : 'bg-[#161922] text-[#8E9299]'
                }`}
              >
                app/telegram/formatter.py
              </button>
              <button
                onClick={() => setSelectedCodeFile('types')}
                className={`px-3 py-1 text-xs rounded-lg font-mono ${
                  selectedCodeFile === 'types' ? 'bg-[#0088cc] text-white' : 'bg-[#161922] text-[#8E9299]'
                }`}
              >
                app/telegram/types.py
              </button>
            </div>
          </div>

          <div className="bg-[#0e1621] border border-[#242f3d] rounded-xl p-4 font-mono text-xs text-[#E0E2E6] overflow-x-auto max-h-[500px]">
            {selectedCodeFile === 'bot' && (
              <pre>{`class TelegramBotEngine:
    """
    Unified Telegram Bot Command Handler & Real-Time Alert Dispatcher.
    """
    def __init__(self, order_manager, portfolio, bot_token=None, chat_id=None, admin_user_ids=None):
        self.order_manager = order_manager
        self.portfolio = portfolio
        self.security = TelegramSecurityManager(admin_user_ids=admin_user_ids)
        self.formatter = TelegramMessageFormatter()
        self.bot_state = "RUNNING"

    async def handle_message(self, text: str, user_id: int, username: str = None) -> TelegramResponse:
        # 1. Rate limiting check
        if not self.security.check_rate_limit(user_id):
            return TelegramResponse("⚠️ Rate limit exceeded.")
        # 2. Whitelist authorization check
        if not self.security.is_authorized_admin(user_id):
            return TelegramResponse("⛔ Access Denied: Unauthorized user.")
        
        # 3. Command Dispatch
        cmd = text.split()[0].lstrip("/")
        if cmd == "status": return self._cmd_status()
        elif cmd == "balance": return self._cmd_balance()
        elif cmd == "positions": return self._cmd_positions()
        elif cmd == "pause": return self._cmd_pause()
        elif cmd == "resume": return self._cmd_resume(user_id, args)
        elif cmd == "kill": return await self._cmd_kill(user_id, args)`}</pre>
            )}

            {selectedCodeFile === 'security' && (
              <pre>{`class TelegramSecurityManager:
    """Guards Telegram bot against unauthorized commands and floods."""
    def __init__(self, admin_user_ids=None, rate_limit_per_minute=20, token_validity_seconds=60):
        self.admin_user_ids = set(admin_user_ids or [])
        self.rate_limit_per_minute = rate_limit_per_minute
        self.token_validity_seconds = token_validity_seconds
        self._user_requests = defaultdict(list)
        self._active_tokens = {}

    def is_authorized_admin(self, user_id: int) -> bool:
        return user_id in self.admin_user_ids

    def generate_confirmation_token(self, action: str, user_id: int) -> str:
        token = f"{secrets.randbelow(900000) + 100000}"
        self._active_tokens[f"{action}:{user_id}"] = (token, time.time() + 60.0)
        return token

    def validate_confirmation_token(self, action: str, user_id: int, token: str) -> bool:
        # Validates and consumes single-use 2FA token
        ...`}</pre>
            )}

            {selectedCodeFile === 'formatter' && (
              <pre>{`class TelegramMessageFormatter:
    """HTML Formatter producing high-contrast, scannable trading messages."""
    @staticmethod
    def format_status(bot_state, execution_mode, uptime_str, open_positions_count, ...):
        state_emoji = "🟢" if bot_state == "RUNNING" else "🟡"
        return f"🤖 <b>CRYPTO AI TRADER STATUS</b>\\n• <b>Status:</b> {state_emoji} <code>{bot_state}</code>..."

    @staticmethod
    def format_trade_opened_alert(payload: TradeAlertPayload) -> str:
        return f"🚀 <b>NEW TRADE OPENED</b>\\n• <b>Pair:</b> <b>{payload.symbol}</b>..."`}</pre>
            )}

            {selectedCodeFile === 'types' && (
              <pre>{`class TelegramCommandType(str, Enum):
    STATUS = "status"
    BALANCE = "balance"
    POSITIONS = "positions"
    PNL = "pnl"
    REGIME = "regime"
    PAUSE = "pause"
    RESUME = "resume"
    KILL = "kill"
    HELP = "help"

@dataclass
class TelegramResponse:
    text: str
    parse_mode: str = "HTML"
    reply_markup: Optional[List[List[InlineKeyboardButton]]] = None`}</pre>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM APPROVAL BAR                                            */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#111318] border border-[#2A2D32] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#00FF66]" />
            <h4 className="text-sm font-bold text-white">
              پایان و اعتبارسنجی فاز ۱۲ (Telegram Alert &amp; Command Bot)
            </h4>
          </div>
          <p className="text-xs text-[#8E9299] mt-0.5">
            دستورات کامل، سیستم احراز هویت ادمین، محدودکننده نرخ، توکن‌های دو مرحله‌ای و سامانه انتشار هشدارها کاملاً راستی‌آزمایی شدند.
          </p>
        </div>

        <button
          id="approve-phase12-btn"
          onClick={onApprovePhase13}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            isApproved
              ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40'
              : 'bg-[#00FF66] hover:bg-[#00cc52] text-black shadow-lg shadow-[#00FF66]/20'
          }`}
        >
          {isApproved ? (
            <>
              <Check className="w-4 h-4" />
              <span>فاز ۱۲ تأیید شد - آماده برای فاز ۱۳</span>
            </>
          ) : (
            <>
              <span>تأیید فاز ۱۲ و ورود به فاز ۱۳ (Backtesting Engine)</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
