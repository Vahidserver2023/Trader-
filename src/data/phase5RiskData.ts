export interface RiskCodeFile {
  id: string;
  name: string;
  path: string;
  category: 'types' | 'sizing' | 'circuit_breaker' | 'portfolio' | 'trailing' | 'engine' | 'tests';
  titleFa: string;
  description: string;
  constraints: string;
  code: string;
}

export const PHASE5_RISK_FILES: RiskCodeFile[] = [
  {
    id: 'risk_types_py',
    name: 'types.py',
    path: 'app/risk/types.py',
    category: 'types',
    titleFa: 'مدل‌های داده‌ای ریسک، پوزیشن و سبد دارایی',
    description: 'تعریف وضعیت پوزیشن‌های معاملاتی، مدل حالت پورتفولیو، نتیجه اعتبارسنجی ریسک و اکشن‌های ترلینگ استاپ.',
    constraints: 'Typed Data Models, Enums',
    code: `@dataclass
class Position:
    position_id: str
    symbol: str
    side: PositionSide
    entry_price: float
    size: float
    current_stop_loss: float
    tp1: float
    tp2: Optional[float] = None
    highest_price: float = 0.0
    lowest_price: float = float("inf")
    breakeven_activated: bool = False
    risk_usd: float = 0.0`
  },
  {
    id: 'risk_sizing_py',
    name: 'sizing.py',
    path: 'app/risk/sizing.py',
    category: 'sizing',
    titleFa: 'موتور محاسباتی سایزبندی پوزیشن و کنترل اهرم',
    description: 'سایزبندی کسری ثابت (Fixed Fractional 1.5%)، تطبیق با نوسان ATR، معیار نیمه-کلی (Half-Kelly) و سقف سرمایه هر معامله (حداکثر ۲۰٪ کل اکوئیتی).',
    constraints: 'Risk: 0.5% - 2.5% | Max Cap: 20%',
    code: `class PositionSizer:
    # Target Risk USD = Equity * Risk Fraction
    # Volatility factor = max(0.4, 1.0 / (ATR_ratio ** 0.5))
    # Units = Adjusted_Risk / Stop_Distance
    # Max Cap = min(Raw_Notional, Equity * 0.20)`
  },
  {
    id: 'risk_circuit_breaker_py',
    name: 'circuit_breaker.py',
    path: 'app/risk/circuit_breaker.py',
    category: 'circuit_breaker',
    titleFa: 'فیوز قطع اضطراری معامله (Circuit Breaker)',
    description: 'توقف خودکار معاملات در صورت عبور زیان روزانه از ۳.۰٪ یا افت سرمایه از قله (Drawdown) بیش از ۶.۰٪، و نصف کردن حجم معاملات پس از ۳ زیان متوالی.',
    constraints: 'Daily Loss <= 3.0% | Max DD <= 6.0%',
    code: `class CircuitBreaker:
    # 1. Daily Loss >= 3.0% -> Halted (24h Cooldown)
    # 2. Max Drawdown >= 6.0% -> Emergency Halt
    # 3. Consecutive Losses >= 3 -> Cut Risk by 50%`
  },
  {
    id: 'risk_portfolio_py',
    name: 'portfolio.py',
    path: 'app/risk/portfolio.py',
    category: 'portfolio',
    titleFa: 'مدیریت تخصیص سرمایه و حرارت سبد دارایی (Portfolio Heat)',
    description: 'محدودیت حداکثر ۵ پوزیشن همزمان، حداکثر ریسک تجمعی ۶.۰٪ کل سرمایه، سقف تمرکز روی یک ارز (۳۰٪) و ممانعت از باز شدن معاملات هم‌جهت تکراری.',
    constraints: 'Max 5 Positions | Total Heat <= 6.0%',
    code: `class PortfolioRiskManager:
    # Max Concurrent Positions: 5
    # Max Aggregate Risk Heat: 6.0%
    # Max Single Asset Notional: 30.0%
    # Max Concurrent Correlated Alts: 3`
  },
  {
    id: 'risk_trailing_py',
    name: 'trailing.py',
    path: 'app/risk/trailing.py',
    category: 'trailing',
    titleFa: 'مدیریت پویای حد ضرر متحرک و خروج پله‌ای (Trailing & Scale-Out)',
    description: 'فعال‌سازی حد ضرر سر به سر (Breakeven) در سود ۱R، خروج ۵۰٪ حجم در TP1، تریلینگ دینامیک ۲ برابر ATR (لوستلیر/Chandelier) و خروج زمانی در رکود.',
    constraints: 'Breakeven at 1.0R | TP1 Scale-Out: 50%',
    code: `class TrailingStopManager:
    # Price reaches 1.0R -> Ratchet SL to Entry + Fees
    # High touches TP1 -> Scale out 50%, lock Breakeven
    # Ongoing trend -> Chandelier ATR Trailing (Highest - 2.0x ATR)`
  },
  {
    id: 'risk_manager_py',
    name: 'manager.py',
    path: 'app/risk/manager.py',
    category: 'engine',
    titleFa: 'دروازه یکپارچه مدیریت ریسک و ارزیابی ارزش در معرض ریسک (VaR)',
    description: 'هماهنگ‌کننده مرکزی میان سیگنال و موتور اردرگذاری، اعتبارسنجی ۶ لایه فیلتر ریسک و محاسبه پارامتریک ارزش در معرض ریسک (VaR 95% و CVaR).',
    constraints: 'Full 6-Layer Gateway | 95% Parametric VaR',
    code: `class UnifiedRiskManager:
    def evaluate_signal(self, signal, portfolio, market_context) -> RiskCheckResult: ...
    def process_portfolio_tick(self, portfolio, current_prices, atrs) -> List[TrailingAction]: ...
    def calculate_parametric_var(self, portfolio, confidence_level=0.95) -> Dict[str, float]: ...`
  },
  {
    id: 'test_risk_py',
    name: 'test_risk.py',
    path: 'tests/test_risk.py',
    category: 'tests',
    titleFa: 'مجموعه ۱۴ تست نهادی اعتبارسنجی ریاضیات ریسک',
    description: 'تست‌های محاسبات سایزبندی دقیق، فیوز زیان روزانه و دراودان، کاهش ریسک در زیان‌های متوالی، سقف حرارت پورتفولیو، ترلینگ سر به سر و VaR.',
    constraints: '14 Unit & Integration Tests (100% Pass)',
    code: `class TestRiskAndPositionManagement(unittest.TestCase):
    # 14 Institutional Tests Passed in 0.001s
    # Fixed fractional, ATR dampener, Kelly, Circuit Breakers, Trailing Stops`
  }
];

export interface MockPositionData {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  size: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  pnlUsd: number;
  pnlPct: number;
  breakevenActive: boolean;
  tp1Hit: boolean;
  riskUsd: number;
  strategy: string;
}

export const ACTIVE_MONITORED_POSITIONS: MockPositionData[] = [
  {
    id: 'pos_btc_01',
    symbol: 'BTC/USDT',
    side: 'LONG',
    entryPrice: 66200.0,
    currentPrice: 68450.0,
    size: 0.045,
    stopLoss: 66250.0, // Ratcheted to breakeven + fees!
    tp1: 68200.0,
    tp2: 70500.0,
    pnlUsd: 101.25,
    pnlPct: 3.40,
    breakevenActive: true,
    tp1Hit: true,
    riskUsd: 0.0, // Risk is now eliminated
    strategy: 'Trend Following Core'
  },
  {
    id: 'pos_sol_02',
    symbol: 'SOL/USDT',
    side: 'LONG',
    entryPrice: 168.50,
    currentPrice: 174.20,
    size: 8.5,
    stopLoss: 168.60, // Ratcheted to breakeven
    tp1: 173.00,
    tp2: 179.50,
    pnlUsd: 48.45,
    pnlPct: 3.38,
    breakevenActive: true,
    tp1Hit: true,
    riskUsd: 0.0,
    strategy: 'Multi-Timeframe Breakout'
  },
  {
    id: 'pos_eth_03',
    symbol: 'ETH/USDT',
    side: 'LONG',
    entryPrice: 2580.0,
    currentPrice: 2610.0,
    size: 0.65,
    stopLoss: 2520.0,
    tp1: 2670.0,
    tp2: 2750.0,
    pnlUsd: 19.50,
    pnlPct: 1.16,
    breakevenActive: false,
    tp1Hit: false,
    riskUsd: 39.0,
    strategy: 'Statistical Mean Reversion'
  }
];
