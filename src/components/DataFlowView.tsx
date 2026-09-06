import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { DATA_FLOW_STEPS } from '../data/phase0Data';

export const DataFlowView: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<number>(1);

  const stepDetails: Record<number, { logic: string; inputs: string[]; outputs: string[]; failsafe: string }> = {
    1: {
      logic: 'اتصال مداوم به وب‌سوکت بایننس و بای‌بیت جهت دریافت کندل‌های تیک، اوردربوک و داده‌های OHLCV در تایم‌فریم‌های ۱ دقیقه تا روزانه.',
      inputs: ['WebSocket feeds (wss://stream.binance.com)', 'REST fallback (CCXT fetch_ohlcv)'],
      outputs: ['Raw Candle Dict {timestamp, open, high, low, close, volume}', 'Orderbook {bids, asks, spread}'],
      failsafe: 'تلاش مجدد با Exponential Backoff پس از قطعی؛ لغو سفارشات جدید تا زمان برقراری ارتباط پایدار.'
    },
    2: {
      logic: 'بررسی سلامت سری زمانی: کشف کندل‌های مفقود (Missing)، مهرهای زمانی تکراری، انحراف غیرعادی قیمت و اسپرد نامتعارف.',
      inputs: ['Raw Candle Buffer', 'Last 100 historical candles'],
      outputs: ['Sanitized Candle Sequence', 'Integrity Status: VALID / CORRUPT'],
      failsafe: 'در صورت تشخیص گپ یا داده مشکوک، وضعیت NO_TRADE اعلام شده و موتور موقتاً مسدود می‌شود.'
    },
    3: {
      logic: 'محاسبه تدریجی (Incremental Caching) بدون محاسبه مجدد تمام تاریخچه: EMA (9, 21, 50, 200), RSI, MACD, ATR, ADX, BB, StochRSI, VWAP.',
      inputs: ['Validated OHLCV DataFrame (minimum 250 bars)'],
      outputs: ['Technical Matrix', 'Price Action Structure (HH, HL, LH, LL)'],
      failsafe: 'کش کردن مقادیر قبلی جهت کاهش چشمگیر مصرف CPU روی ترموکس گوشی.'
    },
    4: {
      logic: 'تطبیق اندیکاتورهای ترند و نوسان جهت دسته‌بندی وضعیت به: STRONG_BULL, BULL, SIDEWAYS, BEAR, STRONG_BEAR, HIGH_VOLATILITY.',
      inputs: ['ADX (trend strength)', 'ATR Ratio (volatility)', 'EMA 50 vs 200 (macro trend)', 'Volume SMA'],
      outputs: ['Market Regime Enum', 'Permitted Strategies Filter List'],
      failsafe: 'استراتژی‌های خلاف جهت ترند یا نامتناسب با رژیم جاری غیرفعال (Deactivated) می‌گردند.'
    },
    5: {
      logic: 'اجرای استراتژی‌های فعال (ترند فالویینگ، EMA+RSI، بریک‌اوت، مومنتوم، بازگشت به میانگین، نوسان) برای تولید کاندیدهای سیگنال.',
      inputs: ['Active Strategy Registry', 'Indicators Matrix', 'Market Regime'],
      outputs: ['Candidate Signal {symbol, action: BUY/SELL, suggested_entry, sl, tp1, tp2, tp3}'],
      failsafe: 'اگر هیچ شرطی محقق نشود یا ریسک به ریوارد کمتر از ۲ باشد، سیگنالی منتشر نمی‌شود.'
    },
    6: {
      logic: 'استخراج فیچرهای بدون Look-Ahead Bias و عبور از مدل ML جهت محاسبه احتمال سناریو (Long Win / Short Win). امتیازدهی ۰ تا ۱۰۰.',
      inputs: ['11+ ML Features', 'Pre-trained Walk-Forward Classifier'],
      outputs: ['AI Confidence % (0.00-1.00)', 'Signal Score (0-100)', 'AI Approval Flag'],
      failsafe: 'اگر Confidence < 0.65 یا Score < 70 باشد، معامله به عنوان فاقد مزیت آماری لغو می‌گردد.'
    },
    7: {
      logic: 'مهم‌ترین سد دفاعی سیستم: محاسبه حجم پوزیشن بر اساس سقف ریسک ۱٪، بررسی همبستگی با ارزهای دیگر، سقف ضرر روزانه و مهار Overtrading.',
      inputs: ['Account Balance', 'Stop Loss Distance', 'Open Positions Correlation', 'Daily Cumulative PnL'],
      outputs: ['Exact Position Size (Qty)', 'Risk Verdict: APPROVED or VETOED'],
      failsafe: 'وتوی قطعی معامله در صورت رسیدن به سقف ۳٪ ضرر روزانه یا تخطی از مارجین مجاز.'
    },
    8: {
      logic: 'ارسال امن سفارش توسط OrderManager به ExchangeAdapter (در حالت PAPER یا LIVE)، ثبت اوردر در دیتابیس، شیفت حد ضرر به Breakeven بعد از TP1.',
      inputs: ['Approved Order Spec', 'Execution Mode (PAPER / LIVE)'],
      outputs: ['Executed Order ID', 'Database Records in positions & orders', 'Telegram Notification'],
      failsafe: 'استعلام قطعی وضعیت اوردر از صرافی پیش از هرگونه تلاش مجدد برای جلوگیری از ارسال سفارش تکراری.'
    }
  };

  const currentDetail = stepDetails[selectedStep];

  return (
    <div className="space-y-6 font-mono">
      {/* Header card */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32]">
        <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs tracking-widest uppercase">
          <Activity className="w-4 h-4" />
          <span>Pipeline & Execution Flowchart (جریان داده گام‌به‌گام)</span>
        </div>
        <h2 className="text-lg font-bold text-[#E0E2E6] mt-1 tracking-tight">
          ZERO-LEAKAGE 8-STAGE SIGNAL & EXECUTION LIFECYCLE
        </h2>
        <p className="text-xs text-[#8E9299] mt-1.5 leading-relaxed font-sans">
          جریان کامل داده از وب‌سوکت صرافی تا بررسی سلامت داده، تولید سیگنال، فیلتر هوش مصنوعی، محاسبه ریسک و در نهایت ثبت در Paper Trading یا صرافی زنده.
        </p>
      </div>

      {/* Interactive Horizontal Pipeline Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {DATA_FLOW_STEPS.map((s) => {
          const isActive = selectedStep === s.step;
          return (
            <button
              key={s.step}
              onClick={() => setSelectedStep(s.step)}
              className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[#1C1E23] border-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'bg-[#151619] border-[#2A2D32] hover:border-[#3E4249]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                  isActive ? 'bg-[#00FF66] text-black' : 'bg-[#2A2D32] text-[#8E9299]'
                }`}>
                  STEP {s.step}
                </span>
              </div>
              <p className={`text-[11px] font-bold mt-2 uppercase tracking-tight line-clamp-2 ${isActive ? 'text-[#00FF66]' : 'text-[#E0E2E6]'}`}>
                {s.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Step Deep Dive */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center font-bold text-sm border border-[#00FF66]/30 shadow-[0_0_8px_rgba(0,255,102,0.15)]">
              {selectedStep}
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#E0E2E6] uppercase tracking-wider">
                {DATA_FLOW_STEPS[selectedStep - 1].title}
              </h3>
              <p className="text-xs text-[#8E9299] font-sans">
                {DATA_FLOW_STEPS[selectedStep - 1].titleFa}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono rounded bg-[#2A2D32] text-[#00FF66] border border-[#3E4249] font-bold">
            STAGE {selectedStep} OF 8
          </span>
        </div>

        <div className="p-3.5 rounded bg-[#0A0B0E] border border-[#2A2D32] text-xs text-[#E0E2E6] leading-relaxed font-sans">
          <strong className="text-[#00FF66] font-mono block mb-1 uppercase tracking-wider">منطق اجرایی این مرحله:</strong>
          {currentDetail.logic}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32]">
            <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2 font-mono">
              ورودی‌ها (Inputs)
            </span>
            <ul className="space-y-1.5">
              {currentDetail.inputs.map((inp, idx) => (
                <li key={idx} className="text-xs text-[#E0E2E6] flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]"></span>
                  <span className="truncate">{inp}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32]">
            <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-widest block mb-2 font-mono">
              خروجی‌ها (Outputs)
            </span>
            <ul className="space-y-1.5">
              {currentDetail.outputs.map((out, idx) => (
                <li key={idx} className="text-xs text-[#E0E2E6] flex items-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26]"></span>
                  <span className="truncate">{out}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded bg-[#0A0B0E] border border-[#FF4444]/30">
            <span className="text-[10px] font-bold text-[#FF4444] uppercase tracking-widest block mb-1.5 font-mono">
              مکانیسم محافظتی (Failsafe)
            </span>
            <p className="text-xs text-[#8E9299] leading-relaxed font-sans">
              {currentDetail.failsafe}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
