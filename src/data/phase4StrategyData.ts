export interface StrategyCodeFile {
  id: string;
  name: string;
  path: string;
  strategyId: string;
  category: 'interface' | 'strategy' | 'engine' | 'tests';
  titleFa: string;
  description: string;
  targetRegimes: string[];
  riskRewardRatio: string;
  code: string;
}

export const PHASE4_STRATEGY_FILES: StrategyCodeFile[] = [
  {
    id: 'base_strategy_py',
    name: 'base.py',
    path: 'app/strategies/base.py',
    strategyId: 'base',
    category: 'interface',
    titleFa: 'اینترفیس تجریدی استراتژی و قرارداد سیگنال',
    description: 'کلاس پایه BaseStrategy با اعتبارسنجی پارامترها، متد بررسی انطباق با رژیم و مدل داده TradeSignal با اعتبارسنجی نسبت سود به زیان (R/R >= 1.5).',
    targetRegimes: ['ALL_REGIMES'],
    riskRewardRatio: 'Min 1.5:1',
    code: `class BaseStrategy(abc.ABC):
    def generate_signal(self, candles, regime, context) -> TradeSignal: ...
    def should_exit(self, position, current_candle, context) -> Tuple[bool, str]: ...
    def validate_parameters(self, params: Dict[str, Any]) -> bool: ...
    def get_required_indicators(self) -> List[str]: ...
    def is_regime_compatible(self, regime: MarketRegime) -> bool: ...`
  },
  {
    id: 'trend_strategy_py',
    name: 'trend.py',
    path: 'app/strategies/trend.py',
    strategyId: 'strategy_a',
    category: 'strategy',
    titleFa: 'استراتژی A: تعقیب روند اصلی (Trend Following Core)',
    description: 'معاملات جهت‌دار بر مبنای جهت‌گیری EMA 50/200، فیلتر قدرت روند با ADX > 25، ورود در پولبک EMA 21 و تارگت‌های مرحله‌ای ۱.۵R و ۳R.',
    targetRegimes: ['STRONG_BULL', 'BULL', 'BEAR', 'STRONG_BEAR'],
    riskRewardRatio: '1.5R (TP1), 3.0R (TP2), 4.5R (TP3)',
    code: `class TrendFollowingStrategy(BaseStrategy):
    # Enforces EMA 50 > 200 alignment, ADX > 25, EMA21 pullback recovery
    # Trailing Stop = 2.0x ATR, Dynamic Exit on opposite EMA break`
  },
  {
    id: 'breakout_strategy_py',
    name: 'breakout.py',
    path: 'app/strategies/breakout.py',
    strategyId: 'strategy_c',
    category: 'strategy',
    titleFa: 'استراتژی C: شکست فشردگی باندهای بولینگر (Multi-Timeframe Breakout)',
    description: 'شناسایی دوره‌های فشردگی شدید نوسانات (Bandwidth < 6.5%) و ورود در خروج کندل پرقدرت خارج از باندها با تأیید حجم ۱.۴ برابر میانگین.',
    targetRegimes: ['SIDEWAYS', 'HIGH_VOLATILITY'],
    riskRewardRatio: '1.5R (TP1), 3.0R (TP2)',
    code: `class BreakoutStrategy(BaseStrategy):
    # Detects Bollinger Squeeze -> Expansion
    # Entry on breakout bar outside upper/lower band with volume surge > 1.4x SMA`
  },
  {
    id: 'momentum_rsi_strategy_py',
    name: 'momentum.py (Strategy B)',
    path: 'app/strategies/momentum.py',
    strategyId: 'strategy_b',
    category: 'strategy',
    titleFa: 'استراتژی B: تقاطع متحرک نمایی و مومنتوم RSI',
    description: 'تقاطع‌های سریع EMA 9/21 با فیلتر مومنتوم RSI در محدوده ۴۵ تا ۷۰ و تأیید حجم معاملات، جلوگیری از ورود در شرایط اشباع خرید شدید.',
    targetRegimes: ['BULL', 'BEAR', 'HIGH_VOLATILITY'],
    riskRewardRatio: '1.5R (TP1), 3.0R (TP2)',
    code: `class EMAMomentumRSIStrategy(BaseStrategy):
    # EMA 9 crosses EMA 21 + RSI in sweet spot [45, 70] + Volume confirmation`
  },
  {
    id: 'momentum_pulse_strategy_py',
    name: 'momentum.py (Strategy D)',
    path: 'app/strategies/momentum.py',
    strategyId: 'strategy_d',
    category: 'strategy',
    titleFa: 'استراتژی D: پالس مومنتوم تطبیقی (Adaptive Momentum Pulse)',
    description: 'بهره‌برداری از شتاب هیستوگرام MACD همگام با تقاطع صعودی/نزولی استوکاستیک RSI (%K > %D) در رژیم‌های روند دار قوی.',
    targetRegimes: ['STRONG_BULL', 'STRONG_BEAR'],
    riskRewardRatio: '1.5R (TP1), 3.0R (TP2)',
    code: `class AdaptiveMomentumPulseStrategy(BaseStrategy):
    # MACD Histogram acceleration + StochRSI cross below 80`
  },
  {
    id: 'mean_reversion_strategy_py',
    name: 'mean_reversion.py (Strategy E)',
    path: 'app/strategies/mean_reversion.py',
    strategyId: 'strategy_e',
    category: 'strategy',
    titleFa: 'استراتژی E: بازگشت آماری به میانگین (Statistical Mean Reversion)',
    description: 'مخصوص رژیم‌های رنج و سایدوی (SIDEWAYS/LOW_VOLATILITY). ورود در انحراف شدید ۲.۵ انحراف معیار بولینگر و RSI اشباع با هدف بازگشت به میانگین SMA20.',
    targetRegimes: ['SIDEWAYS', 'LOW_VOLATILITY'],
    riskRewardRatio: '1.5R to Middle Band',
    code: `class StatisticalMeanReversionStrategy(BaseStrategy):
    # Price touches 2.5 SD Outer Band + RSI < 30 / > 70
    # Strictly GATED OUT in STRONG_BULL and STRONG_BEAR to prevent liquidation`
  },
  {
    id: 'volatility_impulse_strategy_py',
    name: 'mean_reversion.py (Strategy F)',
    path: 'app/strategies/mean_reversion.py',
    strategyId: 'strategy_f',
    category: 'strategy',
    titleFa: 'استراتژی F: شکست و جهش نوسان (Volatility Breakout ATR Impulse)',
    description: 'شناسایی و تصاحب روندهای انفجاری با دامنه کندل بیش از ۱.۸ برابر ATR بیس‌لاین ۵۰ دوره‌ای با حد ضرر تریلینگ ۱.۸ برابر ATR.',
    targetRegimes: ['HIGH_VOLATILITY', 'STRONG_BULL', 'STRONG_BEAR'],
    riskRewardRatio: '1.5R (TP1), 2.8R (TP2)',
    code: `class VolatilityBreakoutStrategy(BaseStrategy):
    # Single candle range >= 1.8x Baseline ATR50 + solid directional body`
  },
  {
    id: 'engine_orchestrator_py',
    name: 'engine.py',
    path: 'app/strategies/engine.py',
    strategyId: 'orchestrator',
    category: 'engine',
    titleFa: 'موتور هماهنگ‌کننده چند استراتژی و رفع تضاد (Arbitrage)',
    description: 'اجرای همزمان و مستقل استراتژی‌ها، تطبیق با StrategyGatingMatrix، و سیستم داوری وزن‌دار برای حل تضاد سیگنال‌های متناقض خرید و فروش.',
    targetRegimes: ['ALL_REGIMES'],
    riskRewardRatio: 'Dynamic Filter',
    code: `class MultiStrategyEngine:
    def evaluate_all(self, candles, regime, context) -> List[TradeSignal]: ...
    def arbitrate_signals(self, signals: List[TradeSignal]) -> Optional[TradeSignal]: ...`
  },
  {
    id: 'test_strategies_py',
    name: 'test_strategies.py',
    path: 'tests/test_strategies.py',
    strategyId: 'tests',
    category: 'tests',
    titleFa: 'مجموعه ۹ تست اعتبارسنجی واحد و گیتینگ استراتژی‌ها',
    description: 'تست‌های جامع بررسی ریاضیات R/R، مسدودسازی هوشمند استراتژی‌های ناسازگار با رژیم، دقت تولید سیگنال و مکانیزم داوری بدون سوگیری دید به آینده.',
    targetRegimes: ['ALL_REGIMES'],
    riskRewardRatio: 'Automated 100% Pass',
    code: `class TestPhase4Strategies(unittest.TestCase):
    # 9 Institutional Unit & Integration Tests (100% Green)`
  }
];

export interface SimulatedSignalOutput {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'NO_TRADE';
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  riskReward: number;
  confidence: number;
  technicalScore: number;
  regime: string;
  reasons: string[];
}

export const MOCK_STRATEGY_SIGNALS: SimulatedSignalOutput[] = [
  {
    id: 'sig_001_trend',
    strategyId: 'strategy_a',
    strategyName: 'Trend Following Core',
    symbol: 'BTC/USDT',
    timeframe: '1h',
    action: 'BUY',
    entryPrice: 68450.0,
    stopLoss: 67120.0,
    tp1: 70445.0,
    tp2: 72440.0,
    riskReward: 1.5,
    confidence: 0.88,
    technicalScore: 92.5,
    regime: 'STRONG_BULL',
    reasons: [
      'EMA 50 ($66,800) > EMA 200 ($62,100) Bullish Alignment',
      'ADX (32.4) exceeds trending threshold (25.0)',
      'Price pulled back to EMA 21 ($67,900) and reclaimed with strong green body'
    ]
  },
  {
    id: 'sig_002_breakout',
    strategyId: 'strategy_c',
    strategyName: 'Multi-Timeframe Breakout',
    symbol: 'SOL/USDT',
    timeframe: '15m',
    action: 'BUY',
    entryPrice: 174.20,
    stopLoss: 168.50,
    tp1: 182.75,
    tp2: 191.30,
    riskReward: 1.5,
    confidence: 0.84,
    technicalScore: 88.0,
    regime: 'HIGH_VOLATILITY',
    reasons: [
      'Bollinger Bandwidth expanded from 4.2% squeeze to 11.8%',
      'Candle closed above Upper Band ($173.80)',
      'Volume is 2.3x higher than 20-period Volume SMA'
    ]
  },
  {
    id: 'sig_003_meanrev',
    strategyId: 'strategy_e',
    strategyName: 'Statistical Mean Reversion',
    symbol: 'ETH/USDT',
    timeframe: '1h',
    action: 'BUY',
    entryPrice: 2610.0,
    stopLoss: 2540.0,
    tp1: 2715.0,
    tp2: 2785.0,
    riskReward: 1.5,
    confidence: 0.81,
    technicalScore: 85.0,
    regime: 'SIDEWAYS',
    reasons: [
      'Low pierced 2.5σ Lower Bollinger Band ($2,605)',
      'RSI (24.5) indicates oversold condition',
      'Targeting institutionally calculated 20-period SMA middle band ($2,715)'
    ]
  }
];
