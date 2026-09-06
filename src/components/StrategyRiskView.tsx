import React, { useState } from 'react';
import { ShieldAlert, Code2, Sliders, AlertTriangle } from 'lucide-react';
import { STRATEGY_CATALOG } from '../data/phase0Data';

export const StrategyRiskView: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('strategy_a');

  const activeStrat = STRATEGY_CATALOG.find(s => s.id === selectedStrategy) || STRATEGY_CATALOG[0];

  return (
    <div className="space-y-6 font-mono">
      {/* Header card */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32]">
        <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs tracking-widest uppercase">
          <ShieldAlert className="w-4 h-4" />
          <span>Strategy Contracts & Mathematical Risk Guard (استراتژی‌ها و قوانین ریسک)</span>
        </div>
        <h2 className="text-lg font-bold text-[#E0E2E6] mt-1 tracking-tight">
          UNIFIED STRATEGY INTERFACE & HARD-CODED RISK LIMITS
        </h2>
        <p className="text-xs text-[#8E9299] mt-1 font-sans">
          تمام استراتژی‌ها از اینترفیس تجریدی BaseStrategy تبعیت می‌کنند. خروجی هر استراتژی تحت نظارت بی‌قیدوشرط مدیر ریسک (Risk Manager) با فرمول‌های ریاضی و بدون دخالت مستقیم هوش مصنوعی کنترل می‌شود.
        </p>
      </div>

      {/* Part 1: Strategy Contract & Catalog */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#00FF66]" />
            <h3 className="text-sm font-bold text-[#E0E2E6] uppercase tracking-wider">
              6 Built-in Quantitative Strategies (کاتالوگ ۶ استراتژی رسمی)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#00FF66]">
            Target: app/strategies/
          </span>
        </div>

        {/* Strategy Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {STRATEGY_CATALOG.map((st) => {
            const isSel = st.id === selectedStrategy;
            return (
              <button
                key={st.id}
                id={`btn-strat-${st.id}`}
                onClick={() => setSelectedStrategy(st.id)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
                  isSel
                    ? 'bg-[#1C1E23] text-[#00FF66] border-[#00FF66]/50 shadow-[0_0_8px_rgba(0,255,102,0.15)]'
                    : 'bg-[#0A0B0E] text-[#8E9299] border-[#2A2D32] hover:text-[#E0E2E6] hover:border-[#3E4249]'
                }`}
              >
                <span>{st.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Strategy Card */}
        <div className="p-4 rounded bg-[#0A0B0E] border border-[#2A2D32] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#E0E2E6]">
                  {activeStrat.name}
                </h4>
                <span className="px-2 py-0.5 rounded bg-[#1C1E23] text-[#00FF66] text-[10px] font-mono border border-[#2A2D32]">
                  {activeStrat.type}
                </span>
              </div>
              <p className="text-xs text-[#8E9299] mt-1 font-sans leading-relaxed">
                {activeStrat.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded bg-[#111318] border border-[#2A2D32]">
              <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-1">
                اندیکاتورهای مورد نیاز
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {activeStrat.indicatorsUsed.map((ind, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded bg-[#0A0B0E] text-[#00FF66] border border-[#2A2D32] font-mono text-[11px]">
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded bg-[#111318] border border-[#2A2D32]">
              <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-1">
                رژیم‌های بازار بهینه
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {activeStrat.bestRegimes.map((reg, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded bg-[#0A0B0E] text-[#F27D26] border border-[#2A2D32] font-mono text-[11px]">
                    {reg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-[#111318] border border-[#2A2D32]">
              <span className="text-[10px] font-bold text-[#00FF66] uppercase tracking-widest block mb-1 font-mono">
                شرط ورود (Entry Trigger)
              </span>
              <p className="text-xs text-[#E0E2E6] font-mono mt-1 leading-relaxed">
                {activeStrat.entryCondition}
              </p>
            </div>

            <div className="p-3 rounded bg-[#111318] border border-[#2A2D32]">
              <span className="text-[10px] font-bold text-[#FF4444] uppercase tracking-widest block mb-1 font-mono">
                شرط خروج و حد ضرر (Exit & SL)
              </span>
              <p className="text-xs text-[#E0E2E6] font-mono mt-1 leading-relaxed">
                {activeStrat.exitCondition}
              </p>
            </div>
          </div>
        </div>

        {/* Code Contract Preview */}
        <div className="bg-[#0A0B0E] p-4 rounded border border-[#2A2D32] overflow-x-auto text-xs font-mono text-[#00FF66]">
          <pre className="leading-relaxed">
{`# BaseStrategy Abstract Interface (app/strategies/base.py)
class BaseStrategy(ABC):
    @abstractmethod
    def generate_signal(self, df: pd.DataFrame, regime: MarketRegime) -> CandidateSignal: ...
    @abstractmethod
    def calculate_entry(self, df: pd.DataFrame) -> float: ...
    @abstractmethod
    def calculate_stop_loss(self, df: pd.DataFrame, entry: float, side: str, method: str) -> float: ...
    @abstractmethod
    def calculate_take_profit(self, entry: float, sl: float, side: str) -> Tuple[float, float, float]: ...
    @abstractmethod
    def calculate_position_size(self, balance: float, entry: float, sl: float, risk_pct: float) -> float: ...`}
          </pre>
        </div>
      </div>

      {/* Part 2: Institutional Risk Rules */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <Sliders className="w-4 h-4 text-[#FF4444]" />
          <h3 className="text-sm font-bold text-[#E0E2E6] uppercase tracking-wider">
            Active Risk Limits & Circuit Breakers (محدودیت‌های سخت ریسک)
          </h3>
        </div>

        {/* Real-time Risk Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0A0B0E] border border-[#2A2D32] p-4 rounded">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">Daily Loss Limit</span>
              <span className="text-[11px] font-bold text-[#FF4444] font-mono">$373.50 / $1000.00 (3.0% Max)</span>
            </div>
            <div className="h-2 w-full bg-[#1C1E23] rounded-full overflow-hidden">
              <div className="h-full bg-[#FF4444] w-[37.35%] shadow-[0_0_8px_#FF4444]"></div>
            </div>
            <span className="text-[10px] text-[#8E9299] mt-2 block font-sans">
              در صورت عبور از سقف ۳٪ ضرر روزانه، تمام سفارشات تا ۲۴ ساعت آینده فریز می‌شوند.
            </span>
          </div>

          <div className="bg-[#0A0B0E] border border-[#2A2D32] p-4 rounded">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">Portfolio Drawdown</span>
              <span className="text-[11px] font-bold text-[#00FF66] font-mono">2.1% / 10.0% Max</span>
            </div>
            <div className="h-2 w-full bg-[#1C1E23] rounded-full overflow-hidden">
              <div className="h-full bg-[#00FF66] w-[21%] shadow-[0_0_8px_#00FF66]"></div>
            </div>
            <span className="text-[10px] text-[#8E9299] mt-2 block font-sans">
              سقف مجاز افت حساب ۱۰٪؛ در صورت فعال‌سازی، حالت معامله خودکار خاموش می‌گردد.
            </span>
          </div>
        </div>

        {/* Sizing Formula Math */}
        <div className="p-4 rounded bg-[#0A0B0E] border border-[#2A2D32] text-xs">
          <div className="flex items-center gap-2 mb-2 text-[#00FF66] font-bold uppercase tracking-wider">
            <span>فرمول قطعی محاسبه حجم پوزیشن (Position Sizing Formula):</span>
          </div>
          <div className="bg-[#111318] p-3 rounded font-mono text-xs text-[#00FF66] border border-[#2A2D32]">
            Risk_Amount = Account_Balance × 0.01<br />
            Position_Size = Risk_Amount / abs(Entry_Price - Stop_Loss_Price)<br />
            Position_Size = min(Position_Size, MAX_POSITION_CAP)
          </div>
        </div>

        {/* Ladder Take-Profit Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32]">
            <span className="text-[10px] font-bold text-[#00FF66] uppercase tracking-wider block font-mono">1. TP1 (1.0R Target)</span>
            <p className="text-[11px] text-[#8E9299] mt-1 font-sans">
              بسته شدن ۵۰٪ از حجم معامله + <strong className="text-[#00FF66]">انتقال خودکار حد ضرر باقیمانده به نقطه ورود (Break-Even)</strong>.
            </p>
          </div>

          <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32]">
            <span className="text-[10px] font-bold text-[#00FF66] uppercase tracking-wider block font-mono">2. TP2 (2.0R Target)</span>
            <p className="text-[11px] text-[#8E9299] mt-1 font-sans">
              بسته شدن ۲۵٪ دیگر از حجم معامله + <strong className="text-[#00FF66]">فعال‌سازی حد ضرر متحرک (Trailing Stop با ۱.۵ برابر ATR)</strong>.
            </p>
          </div>

          <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32]">
            <span className="text-[10px] font-bold text-[#00FF66] uppercase tracking-wider block font-mono">3. TP3 (3.0R+ Runner)</span>
            <p className="text-[11px] text-[#8E9299] mt-1 font-sans">
              خروج ۲۵٪ باقیمانده حجم معامله در ادامه روند، با تریلینگ هوشمند برای بیشینه‌سازی سود در روندهای بزرگ.
            </p>
          </div>
        </div>

        {/* Emergency Kill Switch */}
        <button
          type="button"
          onClick={() => alert('EMERGENCY KILL SWITCH: Circuit breaker protocol armed. In production this immediately aborts all tasks, closes WebSocket connections, and cancels all pending broker orders.')}
          className="w-full py-3.5 bg-[#FF4444] hover:bg-[#CC0000] text-black font-black uppercase text-xs tracking-[0.2em] rounded shadow-[0_0_20px_rgba(255,68,68,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-black" />
          <span>EMERGENCY KILL SWITCH (مدار شکن اضطراری)</span>
        </button>
      </div>
    </div>
  );
};
