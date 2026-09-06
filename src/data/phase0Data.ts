import { DatabaseTable, StrategySpec, RoadmapPhase } from '../types';

export const SYSTEM_MODULES = [
  {
    id: 'presentation',
    name: 'Presentation & Client Layer',
    nameFa: 'لایه کلاینت و رابط کاربری',
    color: 'emerald',
    components: [
      { name: 'Android Termux CLI', tech: 'Bash / Python Prompt / Rich CLI', desc: 'Lightweight CLI with status display for low-resource Android devices' },
      { name: 'FastAPI Web Dashboard', tech: 'React / Tailwind / Chart.js', desc: 'Real-time WebSocket & REST dashboard for portfolio, active trades, logs' },
      { name: 'PWA & Mobile Wrapper', tech: 'Progressive Web App / Capacitor ready', desc: 'Zero-credential mobile interface connecting to backend via tokenized REST' }
    ]
  },
  {
    id: 'gateway',
    name: 'API & Orchestration Layer',
    nameFa: 'لایه API و زمانبندی عملیات',
    color: 'blue',
    components: [
      { name: 'FastAPI Async Server', tech: 'FastAPI + Uvicorn (ASGI)', desc: 'Secure endpoints with Bearer auth, rate limiting, and event streaming' },
      { name: 'APScheduler Engine', tech: 'AsyncIOScheduler', desc: 'Sub-minute candle ingestion cron, candle close triggers, health pings' },
      { name: 'Telegram Notification Hub', tech: 'python-telegram-bot / HTTP', desc: 'Instant alerts on signals, fills, TP/SL, drawdown warnings, and kill switch' }
    ]
  },
  {
    id: 'trading_core',
    name: 'Trading & Execution Engine',
    nameFa: 'موتور اصلی معاملات و استراتژی',
    color: 'violet',
    components: [
      { name: 'Market Data Engine', tech: 'CCXT + Async WebSocket + Reconnect', desc: 'Streams OHLCV (1m to 1d), order book, spread, liquidations, and open interest' },
      { name: 'Data Validation Sentinel', tech: 'Statistical Outlier / Gap Checker', desc: 'Verifies continuity, missing candles, duplicate timestamps; vetoes bad feeds' },
      { name: 'Multi-Strategy Engine', tech: 'Polymorphic BaseStrategy', desc: 'Evaluates Trend, Breakout, Momentum, Mean Reversion, Volatility breakouts' },
      { name: 'Portfolio & Position Manager', tech: 'Real-time PnL & Margin Tracker', desc: 'Manages multi-asset balance, margin limits, unrealized gains, partial exits' }
    ]
  },
  {
    id: 'intelligence',
    name: 'AI & Market Intelligence Layer',
    nameFa: 'لایه هوش مصنوعی و تحلیل رژیم بازار',
    color: 'amber',
    components: [
      { name: 'Market Regime Classifier', tech: 'Rule-Based + ADX/ATR/EMA/Volume Matrix', desc: 'Categorizes market into Strong Bull, Bull, Sideways, Bear, Volatile' },
      { name: 'Feature Engineering Core', tech: '11+ Indicators without Look-Ahead Bias', desc: 'RSI, MACD, ATR, EMA distance, Volume ratio, momentum, price structure' },
      { name: 'AI Probability Estimator', tech: 'Scikit-Learn / LightGBM / XGBoost', desc: 'Estimates Long/Short success probability; enforces AI Confidence threshold' },
      { name: 'AI Governance Guard', tech: 'Hardcoded Strict Veto Boundary', desc: 'AI cannot execute orders, override SL/TP, or bypass Risk Manager' }
    ]
  },
  {
    id: 'risk_execution',
    name: 'Risk Management & Broker Adapter Layer',
    nameFa: 'لایه مدیریت ریسک و اتصال به صرافیها',
    color: 'rose',
    components: [
      { name: 'Risk Management Guard', tech: 'Fixed Fractional (1% default) + Kelly/ATR', desc: 'Calculates exact position sizes; enforces max daily loss, weekly loss, max DD' },
      { name: 'Correlation & Overtrading Filter', tech: 'Pearson Matrix + Daily Trade Cooldown', desc: 'Prevents correlated over-exposure across BTC/ETH/SOL; throttles churn' },
      { name: 'Automated Kill Switch', tech: 'Circuit Breaker Pattern', desc: 'Halts all trading instantly on anomalous API errors or drawdown breaches' },
      { name: 'Exchange Adapter Layer', tech: 'Abstract ExchangeAdapter -> Binance / Bybit', desc: 'Standardizes order execution, reconciles missed fills, runs Paper or Live' }
    ]
  }
];

export const DATA_FLOW_STEPS = [
  {
    step: 1,
    title: 'Market Data Ingestion',
    titleFa: 'دریافت داده‌های زنده بازار',
    description: 'WebSocket feeds from Binance/Bybit stream real-time tick, orderbook, and closed OHLCV candles (1m, 5m, 15m, 1h, 4h, 1d) with automatic reconnection.'
  },
  {
    step: 2,
    title: 'Data Validation & Sanitization',
    titleFa: 'اعتبارسنجی و پالایش داده‌ها',
    description: 'Sentinel scans for missing candles, duplicate timestamps, spread spikes, and price outliers. If data integrity fails, NO_TRADE is immediately enforced.'
  },
  {
    step: 3,
    title: 'Indicator & Price Action Computation',
    titleFa: 'محاسبه اندیکاتورها و پرایس اکشن',
    description: 'EMA (9, 21, 50, 200), RSI, MACD, ATR, ADX, Bollinger Bands, Stochastic RSI, VWAP, and Price Action swing points (HH/HL/LH/LL) computed incrementally.'
  },
  {
    step: 4,
    title: 'Market Regime Classification',
    titleFa: 'تشخیص رژیم و وضعیت بازار',
    description: 'Classifies current market into STRONG_BULL, BULL, SIDEWAYS, BEAR, STRONG_BEAR, HIGH_VOLATILITY, or LOW_VOLATILITY. Incompatible strategies are deactivated.'
  },
  {
    step: 5,
    title: 'Multi-Strategy Signal Generation',
    titleFa: 'تولید سیگنال از استراتژی‌های فعال',
    description: 'Active strategies (Trend Following, EMA+RSI, Breakout, Momentum, Mean Reversion) independently evaluate setup conditions and propose entry and candidate SL/TP.'
  },
  {
    step: 6,
    title: 'AI Signal Filter & Probability Scoring',
    titleFa: 'فیلتر هوش مصنوعی و برآورد احتمال موفقیت',
    description: 'AI extracts features without look-ahead bias and calculates scenario confidence (LONG/SHORT/NO_TRADE). Signals below confidence threshold (e.g. 65%) or score < 70 are rejected.'
  },
  {
    step: 7,
    title: 'Risk Manager Veto & Position Sizing',
    titleFa: 'تأییدیه مدیر ریسک و محاسبه حجم مجاز',
    description: 'Risk Manager computes position size = (Balance × 1%) / SL_Distance. Checks daily loss limit, drawdown, asset correlations, and overtrading cooldown. Can VETO any trade.'
  },
  {
    step: 8,
    title: 'Execution & Order Lifecycle (Paper / Live)',
    titleFa: 'ارسال سفارش و مدیریت چرخه پوزیشن',
    description: 'Dispatches limit/market orders via ExchangeAdapter. In PAPER mode, simulates slippage and fees. Position manager trails stop loss to Breakeven after TP1, executes partial exits at TP2/TP3.'
  }
];

export const PROJECT_TREE = [
  {
    path: 'app/core/',
    purpose: 'تنظیمات ایزوله، لاگر امنیتی بدون نشت سکرت‌ها و ساختار خطاهای سیستم',
    files: [
      { name: 'config.py', desc: 'Pydantic BaseSettings برای اعتبارسنجی متغیرهای .env' },
      { name: 'logger.py', desc: 'لاگر ساختاریافته چندسطحی با ماسک خودکار سکرت‌ها' },
      { name: 'exceptions.py', desc: 'ساختار خطاهای سلسله‌مراتبی و استراتژی ریکاوری' }
    ]
  },
  {
    path: 'app/data/',
    purpose: 'دریافت داده‌های تیک، وب‌سوکت بلادرنگ و سنبل فیلتر خطاهای کندل',
    files: [
      { name: 'market_data.py', desc: 'کلاینت دریافت OHLCV، اوردربوک و اسپرد با CCXT' },
      { name: 'websocket.py', desc: 'کلاینت وب‌سوکت با اتصال مجدد تصاعدی (Exponential Backoff)' },
      { name: 'data_validator.py', desc: 'اعتبارسنجی کندل‌های گم‌شده، مهرهای تکراری و قیمت پرت' }
    ]
  },
  {
    path: 'app/indicators/',
    purpose: 'محاسبه بهینه و کش افزایشی اندیکاتورهای تکنیکال',
    files: [
      { name: 'technical.py', desc: 'محاسبه EMA، RSI، MACD، ATR، ADX، باندهای بولینگر و VWAP' }
    ]
  },
  {
    path: 'app/strategies/',
    purpose: 'موتور چند استراتژی با اینترفیس تجریدی و ۶ استراتژی رسمی',
    files: [
      { name: 'base.py', desc: 'کلاس پایه BaseStrategy با قرارداد متدهای ۵گانه' },
      { name: 'trend.py', desc: 'استراتژی A: Trend Following با EMA 50/200 و ADX' },
      { name: 'breakout.py', desc: 'استراتژی C: شکست سطوح با فشردگی بولینگر باند' },
      { name: 'momentum.py', desc: 'استراتژی B و D: مومنتوم پالس و واگرایی RSI' },
      { name: 'mean_reversion.py', desc: 'استراتژی E و F: بازگشت به میانگین و شکست نوسان' }
    ]
  },
  {
    path: 'app/ai/',
    purpose: 'مهندسی ویژگی‌ها بدون Look-Ahead Bias و برآورد احتمالات',
    files: [
      { name: 'features.py', desc: 'استخراج ۱۱+ ویژگی آماری بدون نشت داده‌های آینده' },
      { name: 'regime.py', desc: 'طبقه‌بندی رژیم بازار به ۶ وضعیت با متدهای یادگیری' },
      { name: 'model.py', desc: 'معماری و لودرهای مدل‌های یادگیری ماشین' },
      { name: 'trainer.py', desc: 'پایپ‌لاین آموزش با تفکیک زمانی Walk-Forward 60/20/20' },
      { name: 'predictor.py', desc: 'برآورد احتمال Long/Short و فیلتر سیگنال‌های ضعیف' }
    ]
  },
  {
    path: 'app/risk/',
    purpose: 'مدیریت ریسک ریاضیاتی، پوزیشن سایزینگ، سقف ضرر و کیل‌سوئیچ',
    files: [
      { name: 'risk_manager.py', desc: 'کنترل سقف ضرر روزانه، سقف دراوداون و فرمان Kill Switch' },
      { name: 'position_sizing.py', desc: 'محاسبه دقیق حجم بر اساس ۱٪ بالانس و فاصله تا SL' },
      { name: 'portfolio_risk.py', desc: 'ماتریس همبستگی پیرسون دارایی‌ها و مهار Overtrading' }
    ]
  },
  {
    path: 'app/execution/',
    purpose: 'آداپتورهای بایننس و بای‌بیت با پروتکل ضدخطای سفارشات',
    files: [
      { name: 'base_exchange.py', desc: 'اینترفیس تجریدی ExchangeAdapter' },
      { name: 'binance.py', desc: 'آداپتور رسمی صرافی بایننس (Spot / Futures)' },
      { name: 'bybit.py', desc: 'آداپتور رسمی صرافی بای‌بیت (Linear / Inverse)' },
      { name: 'order_manager.py', desc: 'استعلام قطعی وضعیت اوردر قبل از تلاش مجدد' }
    ]
  },
  {
    path: 'app/database/',
    purpose: 'طرح دیتابیس ۱۴ جدول با پشتیبانی مشترک SQLite و PostgreSQL',
    files: [
      { name: 'models.py', desc: 'مدل‌های ۱۴ جدول دیتابیس با SQLAlchemy 2.0 ORM' },
      { name: 'repository.py', desc: 'متدهای پایگاه داده برای تراکنش‌های امن و کوئری‌ها' }
    ]
  },
  {
    path: 'app/api/',
    purpose: 'وب‌سرویس REST و وب‌سوکت تلمتری با احراز هویت توکنی',
    files: [
      { name: 'main.py', desc: 'برنامه اصلی FastAPI با میدلورهای امنیتی' },
      { name: 'routes.py', desc: 'مسیرهای /status, /balance, /orders, /signals, /bot' }
    ]
  }
];

export const DATABASE_TABLES: DatabaseTable[] = [
  {
    name: 'users',
    description: 'System administrators and API token owners',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PK, AUTOINCREMENT', description: 'Unique user identifier' },
      { name: 'username', type: 'VARCHAR(64)', constraints: 'UNIQUE, NOT NULL', description: 'Admin username' },
      { name: 'password_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Argon2 / bcrypt hash' },
      { name: 'role', type: 'VARCHAR(20)', constraints: 'DEFAULT "trader"', description: 'Role (admin, viewer)' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Creation time' }
    ],
    indexes: ['idx_users_username']
  },
  {
    name: 'exchanges',
    description: 'Configured exchanges (Binance, Bybit, etc.)',
    columns: [
      { name: 'id', type: 'VARCHAR(32)', constraints: 'PK', description: 'e.g. "binance", "bybit"' },
      { name: 'name', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'Display name' },
      { name: 'is_active', type: 'BOOLEAN', constraints: 'DEFAULT 1', description: 'Exchange active status' },
      { name: 'testnet', type: 'BOOLEAN', constraints: 'DEFAULT 0', description: 'Whether in sandbox mode' }
    ],
    indexes: ['idx_exchanges_active']
  },
  {
    name: 'symbols',
    description: 'Tradable instruments with market rules',
    columns: [
      { name: 'id', type: 'VARCHAR(32)', constraints: 'PK', description: 'e.g. "BTC/USDT"' },
      { name: 'base_asset', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'e.g. "BTC"' },
      { name: 'quote_asset', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'e.g. "USDT"' },
      { name: 'min_qty', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Minimum lot size' },
      { name: 'step_size', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Quantity precision step' },
      { name: 'tick_size', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Price precision step' },
      { name: 'is_enabled', type: 'BOOLEAN', constraints: 'DEFAULT 1', description: 'Trading enabled toggle' }
    ],
    indexes: ['idx_symbols_enabled']
  },
  {
    name: 'candles',
    description: 'Historical and real-time validated OHLCV candles',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PK, AUTOINCREMENT', description: 'Record ID' },
      { name: 'symbol_id', type: 'VARCHAR(32)', constraints: 'FK -> symbols.id', description: 'Instrument' },
      { name: 'timeframe', type: 'VARCHAR(8)', constraints: 'NOT NULL', description: '1m, 5m, 15m, 1h, 4h, 1d' },
      { name: 'timestamp', type: 'BIGINT', constraints: 'NOT NULL', description: 'Open timestamp in ms' },
      { name: 'open', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Open price' },
      { name: 'high', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'High price' },
      { name: 'low', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Low price' },
      { name: 'close', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Close price' },
      { name: 'volume', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Base volume' },
      { name: 'is_closed', type: 'BOOLEAN', constraints: 'DEFAULT 1', description: 'Candle finalized flag' }
    ],
    indexes: ['idx_candles_sym_tf_ts (UNIQUE symbol_id, timeframe, timestamp)']
  },
  {
    name: 'strategies',
    description: 'Registered trading strategies and configurations',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PK', description: 'e.g. "trend_following_v1"' },
      { name: 'name', type: 'VARCHAR(128)', constraints: 'NOT NULL', description: 'Display name' },
      { name: 'category', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'trend, momentum, mean_reversion' },
      { name: 'is_active', type: 'BOOLEAN', constraints: 'DEFAULT 1', description: 'Active toggle' },
      { name: 'parameters', type: 'JSON / TEXT', constraints: 'NOT NULL', description: 'JSON config parameters' }
    ],
    indexes: ['idx_strategies_active']
  },
  {
    name: 'signals',
    description: 'Signals generated by strategies with AI filter scores',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PK', description: 'UUID string' },
      { name: 'strategy_id', type: 'VARCHAR(64)', constraints: 'FK -> strategies.id', description: 'Originating strategy' },
      { name: 'symbol_id', type: 'VARCHAR(32)', constraints: 'FK -> symbols.id', description: 'Instrument' },
      { name: 'timeframe', type: 'VARCHAR(8)', constraints: 'NOT NULL', description: 'Signal timeframe' },
      { name: 'action', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'BUY / SELL / NO_TRADE' },
      { name: 'suggested_entry', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Target entry price' },
      { name: 'suggested_sl', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Proposed stop loss' },
      { name: 'suggested_tp1', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Target 1' },
      { name: 'suggested_tp2', type: 'DECIMAL(18,8)', constraints: 'NULLABLE', description: 'Target 2' },
      { name: 'suggested_tp3', type: 'DECIMAL(18,8)', constraints: 'NULLABLE', description: 'Target 3' },
      { name: 'market_regime', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'Detected regime' },
      { name: 'technical_score', type: 'FLOAT', constraints: 'NOT NULL', description: '0 to 100' },
      { name: 'ai_score', type: 'FLOAT', constraints: 'NOT NULL', description: '0 to 100' },
      { name: 'ai_confidence', type: 'FLOAT', constraints: 'NOT NULL', description: '0.0 to 1.0' },
      { name: 'final_score', type: 'FLOAT', constraints: 'NOT NULL', description: 'Composite score' },
      { name: 'risk_approved', type: 'BOOLEAN', constraints: 'DEFAULT 0', description: 'Risk manager clearance' },
      { name: 'veto_reason', type: 'VARCHAR(255)', constraints: 'NULLABLE', description: 'Reason if vetoed' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Signal generation time' }
    ],
    indexes: ['idx_signals_sym_time', 'idx_signals_approved']
  },
  {
    name: 'orders',
    description: 'Individual exchange orders (entry, SL, TP, partial fills)',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PK', description: 'Client Order ID (UUID)' },
      { name: 'exchange_order_id', type: 'VARCHAR(128)', constraints: 'NULLABLE', description: 'Broker-assigned order ID' },
      { name: 'exchange_id', type: 'VARCHAR(32)', constraints: 'FK -> exchanges.id', description: 'Exchange used' },
      { name: 'symbol_id', type: 'VARCHAR(32)', constraints: 'FK -> symbols.id', description: 'Instrument' },
      { name: 'position_id', type: 'VARCHAR(64)', constraints: 'NULLABLE', description: 'Parent position link' },
      { name: 'trading_mode', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'PAPER or LIVE' },
      { name: 'type', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'MARKET / LIMIT / STOP_LOSS' },
      { name: 'side', type: 'VARCHAR(8)', constraints: 'NOT NULL', description: 'BUY / SELL' },
      { name: 'status', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'PENDING, FILLED, CANCELED, REJECTED' },
      { name: 'price', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Order price' },
      { name: 'amount', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Requested quantity' },
      { name: 'filled_amount', type: 'DECIMAL(18,8)', constraints: 'DEFAULT 0', description: 'Executed quantity' },
      { name: 'avg_fill_price', type: 'DECIMAL(18,8)', constraints: 'DEFAULT 0', description: 'Weighted execution price' },
      { name: 'fee_paid', type: 'DECIMAL(18,8)', constraints: 'DEFAULT 0', description: 'Fee cost' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Created timestamp' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Last state change' }
    ],
    indexes: ['idx_orders_pos_id', 'idx_orders_status', 'idx_orders_exchange_oid']
  },
  {
    name: 'positions',
    description: 'Open and closed trading positions with lifecycle tracking',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PK', description: 'UUID' },
      { name: 'symbol_id', type: 'VARCHAR(32)', constraints: 'FK -> symbols.id', description: 'Trading pair' },
      { name: 'strategy_id', type: 'VARCHAR(64)', constraints: 'FK -> strategies.id', description: 'Strategy author' },
      { name: 'trading_mode', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'PAPER or LIVE' },
      { name: 'side', type: 'VARCHAR(8)', constraints: 'NOT NULL', description: 'LONG or SHORT' },
      { name: 'status', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'OPEN, CLOSED, PARTIALLY_CLOSED' },
      { name: 'entry_price', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Average entry price' },
      { name: 'quantity', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Total quantity' },
      { name: 'remaining_qty', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Remaining active quantity' },
      { name: 'stop_loss', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Current active SL' },
      { name: 'tp1', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Target 1 price' },
      { name: 'tp2', type: 'DECIMAL(18,8)', constraints: 'NULLABLE', description: 'Target 2 price' },
      { name: 'tp3', type: 'DECIMAL(18,8)', constraints: 'NULLABLE', description: 'Target 3 price' },
      { name: 'is_breakeven_moved', type: 'BOOLEAN', constraints: 'DEFAULT 0', description: 'Whether SL set to BE' },
      { name: 'realized_pnl', type: 'DECIMAL(18,8)', constraints: 'DEFAULT 0', description: 'Closed gain/loss' },
      { name: 'opened_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Position opening time' },
      { name: 'closed_at', type: 'TIMESTAMP', constraints: 'NULLABLE', description: 'Position closing time' }
    ],
    indexes: ['idx_positions_status_mode', 'idx_positions_symbol']
  },
  {
    name: 'trades',
    description: 'Realized trade executions with detailed accounting',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PK', description: 'Execution ID' },
      { name: 'position_id', type: 'VARCHAR(64)', constraints: 'FK -> positions.id', description: 'Parent position' },
      { name: 'order_id', type: 'VARCHAR(64)', constraints: 'FK -> orders.id', description: 'Execution order' },
      { name: 'symbol_id', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'Asset' },
      { name: 'side', type: 'VARCHAR(8)', constraints: 'NOT NULL', description: 'BUY / SELL' },
      { name: 'price', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Execution price' },
      { name: 'quantity', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Executed quantity' },
      { name: 'fee', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Exchange fee' },
      { name: 'pnl', type: 'DECIMAL(18,8)', constraints: 'DEFAULT 0', description: 'Net PnL realized' },
      { name: 'exit_reason', type: 'VARCHAR(32)', constraints: 'NULLABLE', description: 'TP1, TP2, TP3, SL, TRAIL, KILL_SWITCH' },
      { name: 'executed_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Execution timestamp' }
    ],
    indexes: ['idx_trades_pos_id', 'idx_trades_symbol_time']
  },
  {
    name: 'portfolio',
    description: 'Balance snapshots for equity curve & drawdown tracking',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PK, AUTOINCREMENT', description: 'Snapshot ID' },
      { name: 'trading_mode', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'PAPER or LIVE' },
      { name: 'balance', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Cash balance' },
      { name: 'equity', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Balance + Unrealized PnL' },
      { name: 'used_margin', type: 'DECIMAL(18,8)', constraints: 'DEFAULT 0', description: 'Capital in positions' },
      { name: 'available_margin', type: 'DECIMAL(18,8)', constraints: 'NOT NULL', description: 'Free capital' },
      { name: 'daily_pnl', type: 'DECIMAL(18,8)', constraints: 'DEFAULT 0', description: 'Today total PnL' },
      { name: 'drawdown_pct', type: 'FLOAT', constraints: 'DEFAULT 0', description: 'Current peak DD %' },
      { name: 'timestamp', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Snapshot time' }
    ],
    indexes: ['idx_portfolio_mode_ts']
  },
  {
    name: 'risk_events',
    description: 'Audit log of all risk limit triggers, rejections, and kill switches',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PK, AUTOINCREMENT', description: 'Event ID' },
      { name: 'event_type', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'DAILY_LOSS_EXCEEDED, CORRELATION_VETO, KILL_SWITCH' },
      { name: 'severity', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'WARNING, ERROR, CRITICAL' },
      { name: 'details', type: 'TEXT', constraints: 'NOT NULL', description: 'Event context and JSON payload' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Event timestamp' }
    ],
    indexes: ['idx_risk_events_type_time']
  },
  {
    name: 'bot_logs',
    description: 'Structured system execution logs (secrets scrubbed)',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PK, AUTOINCREMENT', description: 'Log ID' },
      { name: 'level', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'INFO, WARNING, ERROR, CRITICAL' },
      { name: 'module', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'Originating Python module' },
      { name: 'message', type: 'TEXT', constraints: 'NOT NULL', description: 'Log statement' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Log time' }
    ],
    indexes: ['idx_logs_level_time']
  },
  {
    name: 'performance',
    description: 'Aggregated daily, weekly, and monthly statistical metrics',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PK, AUTOINCREMENT', description: 'Record ID' },
      { name: 'period_type', type: 'VARCHAR(16)', constraints: 'NOT NULL', description: 'DAILY, WEEKLY, MONTHLY' },
      { name: 'period_date', type: 'DATE', constraints: 'NOT NULL', description: 'Reference date' },
      { name: 'total_trades', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Number of closed trades' },
      { name: 'win_rate', type: 'FLOAT', constraints: 'DEFAULT 0', description: 'Percentage winning trades' },
      { name: 'profit_factor', type: 'FLOAT', constraints: 'DEFAULT 0', description: 'Gross profits / gross losses' },
      { name: 'sharpe_ratio', type: 'FLOAT', constraints: 'DEFAULT 0', description: 'Risk-adjusted return' },
      { name: 'max_drawdown', type: 'FLOAT', constraints: 'DEFAULT 0', description: 'Maximum period DD' },
      { name: 'net_pnl', type: 'DECIMAL(18,8)', constraints: 'DEFAULT 0', description: 'Total dollar gain/loss' }
    ],
    indexes: ['idx_perf_period_date']
  },
  {
    name: 'ai_predictions',
    description: 'Historical audit trail of all AI feature vectors and inference outputs',
    columns: [
      { name: 'id', type: 'VARCHAR(64)', constraints: 'PK', description: 'Prediction UUID' },
      { name: 'symbol_id', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'Target symbol' },
      { name: 'model_version', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'Model identifier' },
      { name: 'long_prob', type: 'FLOAT', constraints: 'NOT NULL', description: 'Estimated P(Long Win)' },
      { name: 'short_prob', type: 'FLOAT', constraints: 'NOT NULL', description: 'Estimated P(Short Win)' },
      { name: 'neutral_prob', type: 'FLOAT', constraints: 'NOT NULL', description: 'Estimated P(No Edge)' },
      { name: 'predicted_regime', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'Predicted regime' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Inference time' }
    ],
    indexes: ['idx_ai_pred_time']
  }
];

export const STRATEGY_CATALOG: StrategySpec[] = [
  {
    id: 'strategy_a',
    name: 'Trend Following Core',
    type: 'Trend Following',
    description: 'Aligns trades with 4-hour and daily EMA structure (EMA 50 > EMA 200) and enters on 15m/1h pullbacks.',
    bestRegimes: ['STRONG_BULL', 'BULL', 'BEAR', 'STRONG_BEAR'],
    indicatorsUsed: ['EMA 9', 'EMA 21', 'EMA 50', 'EMA 200', 'ADX (Threshold > 25)', 'ATR'],
    entryCondition: 'Price closes above EMA 21 following pullback to EMA 50 with EMA 50 > EMA 200 and ADX > 25.',
    exitCondition: 'Trailing Stop 2.0x ATR or EMA 21 cross under with TP1 at 1.5R (50% exit) and TP2 at 3R.'
  },
  {
    id: 'strategy_b',
    name: 'EMA Dynamic + RSI Divergence',
    type: 'Momentum Filtered',
    description: 'Combines dynamic EMA 9/21 crossovers with RSI regular divergence detection and volume confirmation.',
    bestRegimes: ['BULL', 'BEAR', 'HIGH_VOLATILITY'],
    indicatorsUsed: ['EMA 9', 'EMA 21', 'RSI 14', 'Volume SMA 20'],
    entryCondition: 'Bullish EMA 9 cross over EMA 21 while RSI is rising out of oversold (RSI > 45) with Volume > 1.2x Volume SMA.',
    exitCondition: 'Opposite EMA crossover or RSI entering extreme overbought (> 75), TP1 at 1.5R.'
  },
  {
    id: 'strategy_c',
    name: 'Multi-Timeframe Breakout',
    type: 'Breakout Expansion',
    description: 'Detects consolidation ranges (narrow Bollinger Band squeeze) followed by aggressive high-volume bar expansion.',
    bestRegimes: ['SIDEWAYS', 'HIGH_VOLATILITY'],
    indicatorsUsed: ['Bollinger Bands (20, 2)', 'ATR 14', 'Volume SMA 20', 'Donchian Channels'],
    entryCondition: 'Candle closes outside 20-period Bollinger Upper Band with BandWidth expanding > 2x and Volume > 1.8x SMA.',
    exitCondition: 'Candle closes back inside Bollinger Middle Band (SMA 20), SL pegged at opposite Band / swing low.'
  },
  {
    id: 'strategy_d',
    name: 'Adaptive Momentum Pulse',
    type: 'Trend Momentum',
    description: 'Captures mid-trend momentum surges using MACD histogram acceleration confirmed by Stochastic RSI crosses.',
    bestRegimes: ['STRONG_BULL', 'STRONG_BEAR'],
    indicatorsUsed: ['MACD (12, 26, 9)', 'Stochastic RSI (14, 14, 3, 3)', 'VWAP'],
    entryCondition: 'Price above VWAP + MACD histogram expanding positive for 2 consecutive bars + StochRSI %K crosses above %D below 80.',
    exitCondition: 'MACD histogram tick down or price falls below VWAP. Strict 1:2 Minimum Risk/Reward.'
  },
  {
    id: 'strategy_e',
    name: 'Statistical Mean Reversion',
    type: 'Counter-Trend Mean Reversion',
    description: 'Exploits extreme over-extensions away from institutional VWAP and 3-standard-deviation Bollinger Bands during range-bound regimes.',
    bestRegimes: ['SIDEWAYS', 'LOW_VOLATILITY'],
    indicatorsUsed: ['Bollinger Bands (3.0 SD)', 'RSI 14', 'VWAP', 'ATR 14'],
    entryCondition: 'Price touches 3.0 SD Lower Band + RSI < 25 + Hammer/Reversal candle structure formed while ADX < 20 (no trend).',
    exitCondition: 'Price reverts to VWAP or Middle Bollinger Band. Fast time-stop if not reverted within 6 candles.'
  },
  {
    id: 'strategy_f',
    name: 'Volatility Breakout (ATR Impulse)',
    type: 'Volatility Expansion',
    description: 'Captures explosive market opening impulses and liquidity sweep reactions measured by relative ATR expansion.',
    bestRegimes: ['HIGH_VOLATILITY', 'STRONG_BULL', 'STRONG_BEAR'],
    indicatorsUsed: ['ATR 14', 'ATR Ratio (Current ATR / 50-period ATR)', 'Price Action Swing Points'],
    entryCondition: 'Current bar range > 2.2x ATR 14 + Price breaks previous session 24h High with volume confirmation.',
    exitCondition: 'Trailing ATR stop (1.8x ATR). Partial profit lock at TP1 (1R) and TP2 (2.5R).'
  }
];

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 0,
    title: 'Phase 0: System Architecture & Specification',
    titleFa: 'فاز ۰: تدوین معماری، ساختار دیتابیس، استراتژی‌ها و نقشه راه',
    status: 'in_review',
    deliverables: [
      'Comprehensive system architecture blueprint (12 modules)',
      '14-table SQLite/PostgreSQL database schema specification',
      'Unified BaseStrategy interface and 6 algorithm specifications',
      'Mathematical risk management formulas (1% rule, anti-overtrading, kill switch)',
      'AI pipeline architecture without look-ahead bias and walk-forward protocol',
      'Termux Android command suite and directory hierarchy',
      'Production-oriented dependency matrix'
    ],
    testRequirements: ['Architectural approval from user before code generation']
  },
  {
    phase: 1,
    title: 'Phase 1: Project Skeleton & Configuration Engine',
    titleFa: 'فاز ۱: اسکلت پروژه، سیستم تنظیمات امن و لاگر ایزوله',
    status: 'pending',
    deliverables: [
      'Directory tree creation (app/core, data, strategies, ai, risk, execution, api, tests)',
      'app/core/config.py with Pydantic BaseSettings & .env validation',
      'app/core/logger.py with automated secret scrubbing (never logs API keys)',
      'app/core/exceptions.py with structured recovery hierarchy',
      'Termux setup verification and requirements.txt'
    ],
    testRequirements: ['pytest unit tests for config validation and secret redaction']
  },
  {
    phase: 2,
    title: 'Phase 2: Market Data Engine & Validation Sentinel',
    titleFa: 'فاز ۲: موتور دریافت داده‌های بازار و فیلتر اعتبارسنجی',
    status: 'pending',
    deliverables: [
      'Async CCXT market data client for Binance and Bybit',
      'WebSocket real-time streamer with automatic reconnect and exponential backoff',
      'OHLCV multi-timeframe fetcher (1m, 3m, 5m, 15m, 30m, 1h, 4h, 1d)',
      'data_validator.py for missing candles, duplicate timestamps, and gap detection'
    ],
    testRequirements: ['Mock websocket disconnect and reconnection recovery test', 'Corrupt candle veto test']
  },
  {
    phase: 3,
    title: 'Phase 3: Technical Analysis & Market Regime Engine',
    titleFa: 'فاز ۳: اندیکاتورهای تکنیکال و موتور تشخیص رژیم بازار',
    status: 'pending',
    deliverables: [
      'High-performance technical indicator library (EMA, RSI, MACD, ATR, ADX, BB, StochRSI, VWAP, OBV)',
      'Incremental indicator calculation caching (no redundant recomputations)',
      'Price action structure identifier (Higher High, Higher Low, Lower High, Lower Low)',
      'Market Regime Classifier (Strong Bull, Bull, Sideways, Bear, Strong Bear, Volatile)'
    ],
    testRequirements: ['Mathematical precision benchmark against ta library and standard pandas-ta']
  },
  {
    phase: 4,
    title: 'Phase 4: Multi-Strategy Engine',
    titleFa: 'فاز ۴: موتور چند استراتژی با اینترفیس استاندارد',
    status: 'pending',
    deliverables: [
      'Abstract BaseStrategy interface (generate_signal, calculate_entry, SL, TP, sizing)',
      'Strategy A (Trend Following)',
      'Strategy B (EMA + RSI)',
      'Strategy C (Breakout)',
      'Strategy D (Momentum)',
      'Strategy E (Mean Reversion)',
      'Strategy F (Volatility Breakout)',
      'Strategy-to-Regime gating logic'
    ],
    testRequirements: ['Deterministic signal generation unit tests with synthetic price series']
  },
  {
    phase: 5,
    title: 'Phase 5: Institutional Backtesting Engine',
    titleFa: 'فاز ۵: موتور بک‌تست واقعی با اسپرد، اسلیپیج و کارمزد',
    status: 'pending',
    deliverables: [
      'Event-driven backtesting engine with realistic fees, slippage, and latency',
      'Partial exit execution (TP1, TP2, TP3) and Trailing Stop / Breakeven modeling',
      'Comprehensive metrics suite (Sharpe, Sortino, Calmar, Max Drawdown, Expectancy, Win Rate)',
      'Walk-Forward 60/20/20 cross-validation optimizer',
      'Monte Carlo order shuffling engine (probability of ruin, drawdown distribution)'
    ],
    testRequirements: ['Zero-lookahead backtest verification test']
  },
  {
    phase: 6,
    title: 'Phase 6: Risk Management & Portfolio Guard',
    titleFa: 'فاز ۶: سیستم مدیریت ریسک، پوزیشن سایزینگ و کیل‌سوئیچ',
    status: 'pending',
    deliverables: [
      'Account balance & Stop-Loss distance position sizing algorithm (1% default risk)',
      'ATR-based, Swing-based, and Percentage-based Stop Loss engines',
      'Multi-tier Take Profit manager (1R, 2R, 3R) with Breakeven shift',
      'Anti-overtrading guards (daily loss limit, max open positions, cooldown throttle)',
      'Multi-pair correlation risk matrix (BTC/ETH/SOL covariance weighting)',
      'Autonomous Kill Switch circuit breaker'
    ],
    testRequirements: ['100% test coverage on position size formulas and drawdown veto triggers']
  },
  {
    phase: 7,
    title: 'Phase 7: Paper Trading Engine',
    titleFa: 'فاز ۷: موتور پیپر تریدینگ همگام با بازار زنده',
    status: 'pending',
    deliverables: [
      'Virtual balance and portfolio state engine identical to live trading pipeline',
      'Synthetic order matching engine with realistic slippage and exchange maker/taker fees',
      'Persistent SQLite tracking for paper positions, orders, and realized PnL',
      'Live paper trading session loop'
    ],
    testRequirements: ['Virtual order lifecycle audit and balance reconciliation tests']
  },
  {
    phase: 8,
    title: 'Phase 8: Machine Learning Signal Filter & Training Pipeline',
    titleFa: 'فاز ۸: فیلتر هوش مصنوعی، مهندسی ویژگی و پایپ‌لاین آموزش',
    status: 'pending',
    deliverables: [
      'Feature engineering matrix without look-ahead bias (RSI, MACD, ATR, distance, volume ratio)',
      'Time-series walk-forward dataset builder (no random splits)',
      'Classification models for Long / Short / Neutral probability estimation',
      'Composite signal scoring engine (0 to 100 with configurable thresholds)',
      'Strict AI governance guard (AI cannot override risk limits)'
    ],
    testRequirements: ['Data leakage prevention unit test and ROC-AUC / PR-AUC evaluation']
  },
  {
    phase: 9,
    title: 'Phase 9: Binance & Bybit Exchange Adapters',
    titleFa: 'فاز ۹: آداپتورهای اتصال واقعی به بایننس و بای‌بیت',
    status: 'pending',
    deliverables: [
      'Standardized ExchangeAdapter base class',
      'BinanceAdapter (Spot & USDT-M Futures via CCXT)',
      'BybitAdapter (Spot & Linear Futures via CCXT)',
      'Failsafe order confirmation query (prevents blind duplicate order retries)',
      'Strict credential isolation (no keys written to logs or sent to frontend)'
    ],
    testRequirements: ['Testnet order placement, query, and cancelation suite']
  },
  {
    phase: 10,
    title: 'Phase 10: FastAPI High-Performance Backend',
    titleFa: 'فاز ۱۰: وب‌سرویس بک‌اند با فست‌ای‌پی‌آی',
    status: 'completed',
    deliverables: [
      'REST endpoints: /status, /balance, /positions, /orders, /trades, /signals, /performance, /risk',
      'Bot management controls: /bot/start, /bot/stop, /bot/pause, /bot/resume, /bot/kill-switch',
      'WebSocket live feed for order book, ticker, and active trade telemetry',
      'API key and Bearer token security middleware'
    ],
    testRequirements: ['FastAPI TestClient integration tests across all endpoints']
  },
  {
    phase: 11,
    title: 'Phase 11: Real-Time Responsive Web Dashboard',
    titleFa: 'فاز ۱۱: داشبورد تحت وب واکنشی و مانیتورینگ زنده',
    status: 'completed',
    deliverables: [
      'Portfolio Overview (Balance, Equity, Daily PnL, Monthly PnL, Drawdown, Win Rate)',
      'Active Positions table with live PnL and real-time SL/TP markers',
      'Signal Dashboard showing timeframe, score, AI confidence, and market regime',
      'Performance charts (Equity curve, drawdown, strategy breakdown)',
      'Emergency Bot Control panel (Start/Stop, Pause, Paper/Live switch, Kill Switch)'
    ],
    testRequirements: ['Responsive mobile and desktop UI tests, WebSocket reconnection test']
  },
  {
    phase: 12,
    title: 'Phase 12: Telegram Alert & Command Bot',
    titleFa: 'فاز ۱۲: بات تلگرام جهت ارسال هشدارهای فوری و دریافت دستورات',
    status: 'completed',
    deliverables: [
      'Instant notification dispatcher (Signals, Fills, TP1/2/3 hits, SL hits, Circuit Breaker alerts, Daily PnL summary)',
      'Interactive commands (/status, /positions, /balance, /pnl, /regime, /pause, /resume, /kill, /help)',
      'Admin whitelist security gate and IP/User sliding-window rate limiting (20 req/min)',
      'Two-Factor Authentication (2FA) single-use tokens for dangerous commands (/kill, /resume)',
      'Interactive Inline Keyboard buttons for instant mobile execution'
    ],
    testRequirements: ['Telegram message format and command parser unit tests, 2FA token lifecycle and rate limiter tests']
  },
  {
    phase: 13,
    title: 'Phase 13: Android / Termux Deployment & PWA',
    titleFa: 'فاز ۱۳: استقرار روی اندروید، ترموکس و ساخت PWA',
    status: 'completed',
    deliverables: [
      'Termux one-command installer script (termux_install.sh)',
      'Background daemon setup using nohup/PID controller (termux_daemon.sh)',
      'PWA manifest and service worker for mobile home-screen install',
      'Termux CPU/battery optimization profile and aggressive Gen0 GC tuning'
    ],
    testRequirements: ['Clean installation test in an isolated Termux/Linux rootfs and battery-adaptive polling unit tests']
  },
  {
    phase: 14,
    title: 'Phase 14: Production Hardening, Cloud Migration & Disaster Recovery',
    titleFa: 'فاز ۱۴: امن‌سازی نهایی برای پروداکشن، انتقال به کلود و بکاپ',
    status: 'completed',
    deliverables: [
      'Automated database backup routine with sensitive API secrets sanitization',
      'System health monitor and watchdog (CPU, RAM, DB size, WS latency, bot uptime)',
      'Docker and Docker Compose config for migration from Termux to VPS/Cloud',
      'PostgreSQL migration utility and disaster recovery integrity drill'
    ],
    testRequirements: ['End-to-end disaster recovery simulation, secret redaction, and database restore tests']
  }
];

export const PYTHON_DEPENDENCIES = {
  core: [
    { name: 'python', version: '>=3.11.0', desc: 'Modern async Python runtime' },
    { name: 'pandas', version: '>=2.2.0', desc: 'Time series manipulation and candle dataframes' },
    { name: 'numpy', version: '>=1.26.0', desc: 'Vectorized mathematical and matrix operations' },
    { name: 'scipy', version: '>=1.12.0', desc: 'Statistical distributions and Monte Carlo simulations' },
    { name: 'pydantic', version: '>=2.6.0', desc: 'Type validation and immutable schema definitions' },
    { name: 'pydantic-settings', version: '>=2.2.0', desc: 'Environment variable and .env parsing' }
  ],
  market_and_crypto: [
    { name: 'ccxt', version: '>=4.2.0', desc: 'Unified API client for Binance, Bybit, OKX' },
    { name: 'websockets', version: '>=12.0', desc: 'Async real-time order book and candle streams' },
    { name: 'requests', version: '>=2.31.0', desc: 'Synchronous fallback HTTP requests' },
    { name: 'aiohttp', version: '>=3.9.0', desc: 'Async HTTP client for non-blocking I/O' }
  ],
  technical_analysis: [
    { name: 'ta', version: '>=0.11.0', desc: 'Technical indicators library (EMA, RSI, MACD, etc.)' },
    { name: 'numba', version: '>=0.59.0 (optional)', desc: 'JIT compilation for ultra-fast indicator loops on VPS' }
  ],
  ai_and_ml: [
    { name: 'scikit-learn', version: '>=1.4.0', desc: 'ML models, standard scalers, metrics, and calibration' },
    { name: 'lightgbm', version: '>=4.3.0', desc: 'Ultra-fast gradient boosting for regime and signal scoring' },
    { name: 'joblib', version: '>=1.3.0', desc: 'Model serialization and parallel feature computation' }
  ],
  database_and_backend: [
    { name: 'SQLAlchemy', version: '>=2.0.28', desc: 'ORM supporting both SQLite (Termux) and PostgreSQL (VPS)' },
    { name: 'alembic', version: '>=1.13.0', desc: 'Database schema migration manager' },
    { name: 'fastapi', version: '>=0.110.0', desc: 'High performance async REST & WebSocket server' },
    { name: 'uvicorn[standard]', version: '>=0.28.0', desc: 'Lightning-fast ASGI server' },
    { name: 'APScheduler', version: '>=3.10.4', desc: 'Async cron and interval scheduler for bots' }
  ],
  notifications_and_dev: [
    { name: 'python-telegram-bot', version: '>=20.8', desc: 'Telegram alerts and command bot' },
    { name: 'pytest', version: '>=8.0.0', desc: 'Unit and integration test runner' },
    { name: 'pytest-asyncio', version: '>=0.23.0', desc: 'Async test support for FastAPI & CCXT' },
    { name: 'rich', version: '>=13.7.0', desc: 'High-contrast terminal dashboards for Termux' }
  ]
};

export const TERMUX_COMMANDS = [
  { step: '1. Update Termux Packages', cmd: 'pkg update -y && pkg upgrade -y' },
  { step: '2. Install System Build Tools & Python', cmd: 'pkg install -y python git clang cmake make libffi openssl' },
  { step: '3. Clone / Create Workspace', cmd: 'mkdir -p ~/crypto_ai_trader && cd ~/crypto_ai_trader' },
  { step: '4. Create Isolated Python Virtualenv', cmd: 'python -m venv venv && source venv/bin/activate' },
  { step: '5. Upgrade Pip & Install Wheels', cmd: 'pip install --upgrade pip setuptools wheel' },
  { step: '6. Install Dependencies', cmd: 'pip install -r requirements.txt' },
  { step: '7. Initialize Environment File', cmd: 'cp .env.example .env && chmod 600 .env' },
  { step: '8. Run Unit Tests', cmd: 'pytest tests/ -v' },
  { step: '9. Launch Bot in Paper Mode', cmd: 'python main.py --mode=PAPER' },
  { step: '10. Launch Background Daemon (Optional)', cmd: 'nohup python main.py --mode=PAPER > bot.log 2>&1 &' }
];
