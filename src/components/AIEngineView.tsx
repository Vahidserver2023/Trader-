import React from 'react';
import { Brain, ShieldCheck, Lock, SlidersHorizontal, Compass } from 'lucide-react';

export const AIEngineView: React.FC = () => {
  const featureList = [
    { name: 'RSI (14 & 7)', desc: 'مومنتوم کوتاه‌مدت و شاخص قدرت نسبی' },
    { name: 'MACD Histogram & Signal', desc: 'شتاب همگرایی/واگرایی میانگین متحرک' },
    { name: 'EMA Distance (9, 21, 50, 200)', desc: 'فاصله درصدی قیمت فعلی از میانگین‌های کلیدی' },
    { name: 'ATR & Normalized ATR Ratio', desc: 'نوسان‌پذیری واقعی روزانه نسبت به میانگین تاریخی' },
    { name: 'ADX & Directional Indicators', desc: 'شدت و قدرت خالص جهت‌دار روند' },
    { name: 'Volume Ratio vs 20-period SMA', desc: 'حجم غیرعادی نسبت به میانگین حجم ۲۰ کندل قبل' },
    { name: 'Price Momentum & Velocity', desc: 'سرعت تغییر قیمت در ۳، ۶ و ۱۲ کندل گذشته' },
    { name: 'Bollinger BandWidth & %B', desc: 'فشردگی نوسان و موقعیت قیمتی در باندها' },
    { name: 'Candle Structure (Wicks / Body)', desc: 'نسبت طول بدنه به شدوها و کندل‌های پین‌بار' },
    { name: 'Institutional VWAP Deviation', desc: 'فاصله انحراف استاندارد از حجم وزنی نهادی' },
    { name: 'Market Regime Encoding', desc: 'کدگذاری One-Hot رژیم تشخیص داده شده توسط موتور' }
  ];

  const scoreBrackets = [
    { range: '0 — 39', label: 'NO TRADE', desc: 'بدون لبه آماری؛ ورود اکیداً ممنوع', color: 'text-[#FF4444] bg-[#FF4444]/10 border-[#FF4444]/30' },
    { range: '40 — 59', label: 'WEAK', desc: 'سیگنال ضعیف؛ عدم تایید هوش مصنوعی', color: 'text-[#F27D26] bg-[#F27D26]/10 border-[#F27D26]/30' },
    { range: '60 — 74', label: 'MODERATE', desc: 'متوسط؛ نیازمند تطابق با رژیم و حجم بالا', color: 'text-[#E0E2E6] bg-[#2A2D32] border-[#3E4249]' },
    { range: '75 — 89', label: 'STRONG', desc: 'سیگنال قوی؛ تایید مشترک استراتژی و AI', color: 'text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/30' },
    { range: '90 — 100', label: 'VERY STRONG', desc: 'بهترین کیفیت ریاضیاتی با احتمال بالا', color: 'text-[#00FF66] bg-[#00FF66]/20 border-[#00FF66]/60 shadow-[0_0_12px_rgba(0,255,102,0.15)]' }
  ];

  return (
    <div className="space-y-6 font-mono">
      {/* Header card */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32]">
        <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs tracking-widest uppercase">
          <Brain className="w-4 h-4" />
          <span>AI Signal Filter & Probability Engine (فیلتر هوش مصنوعی و برآورد احتمال)</span>
        </div>
        <h2 className="text-lg font-bold text-[#E0E2E6] mt-1 tracking-tight">
          ZERO-LOOKAHEAD TEMPORAL MODELING & AI GOVERNANCE
        </h2>
        <p className="text-xs text-[#8E9299] mt-1 font-sans">
          هوش مصنوعی به عنوان فیلتر کیفیت و برآوردگر احتمال عمل می‌کند، نه مجری سفارش! جلوگیری از خطای Look-Ahead Bias، اعتبارسنجی رو به جلو (Walk-Forward) و حکومت اکید بر رفتارهای مدل.
        </p>
      </div>

      {/* Zero Look-Ahead Bias Guarantee */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-3">
        <div className="flex items-center gap-2 text-[#00FF66] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>تضمین علیت زمانی و جلوگیری قطعی از Look-Ahead Bias و Data Leakage</span>
        </div>
        <p className="text-xs text-[#8E9299] leading-relaxed font-sans">
          تمام ویژگی‌ها (Features) منحصراً بر پایه کندل‌های بسته شده گذشته (Closed Bars at <code className="text-[#00FF66] font-mono">t-1</code>) محاسبه می‌شوند. هیچ داده‌ای از کندل باز فعلی یا قیمت‌های آینده در ساخت ماتریس ویژگی وارد نمی‌شود. همچنین در پایپ‌لاین آموزش، استفاده از Random K-Fold برای سری زمانی اکیداً ممنوع بوده و فقط از <strong className="text-[#00FF66] font-mono">Walk-Forward Split (۶۰٪ آموزش، ۲۰٪ اعتبارسنجی، ۲۰٪ تست برون‌نمونه)</strong> استفاده می‌گردد.
        </p>

        {/* Walk Forward Visual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32]">
            <span className="text-xs font-mono text-[#00FF66] font-bold block uppercase tracking-wider">1. Train Period (60%)</span>
            <p className="text-[11px] text-[#8E9299] mt-1 font-sans">آموزش وزن‌ها و یادگیری الگوهای تاریخی سری زمانی</p>
          </div>
          <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32]">
            <span className="text-xs font-mono text-[#F27D26] font-bold block uppercase tracking-wider">2. Validation Period (20%)</span>
            <p className="text-[11px] text-[#8E9299] mt-1 font-sans">تنظیم هایپرپارامترها و تعیین آستانه احتمال بهینه</p>
          </div>
          <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32]">
            <span className="text-xs font-mono text-[#00FF66] font-bold block uppercase tracking-wider">3. Out-of-Sample Test (20%)</span>
            <p className="text-[11px] text-[#8E9299] mt-1 font-sans">ارزیابی عملکرد روی داده‌های کاملاً جدید و دست‌نخورده</p>
          </div>
        </div>
      </div>

      {/* Feature Engineering Catalog */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-3">
        <div className="flex items-center justify-between border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#00FF66]" />
            <h3 className="text-sm font-bold text-[#E0E2E6] uppercase tracking-wider">
              11+ Core Engineered Features (ماتریس ویژگی‌های آماری)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#8E9299]">app/ai/features.py</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {featureList.map((feat, idx) => (
            <div key={idx} className="p-2.5 rounded bg-[#0A0B0E] border border-[#2A2D32]">
              <span className="text-xs font-mono font-bold text-[#00FF66] block">{feat.name}</span>
              <span className="text-[11px] text-[#8E9299] block mt-0.5 font-sans">{feat.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signal Scoring Matrix */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-3">
        <div className="flex items-center gap-2 border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <Compass className="w-4 h-4 text-[#00FF66]" />
          <h3 className="text-sm font-bold text-[#E0E2E6] uppercase tracking-wider">
            Composite Signal Scoring Matrix (ماتریس نمره‌دهی سیگنال ۰ تا ۱۰۰)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {scoreBrackets.map((sc, idx) => (
            <div key={idx} className={`p-3 rounded border flex flex-col justify-between ${sc.color}`}>
              <div>
                <span className="text-xs font-mono font-bold block">{sc.range}</span>
                <span className="text-sm font-bold block mt-1">{sc.label}</span>
              </div>
              <p className="text-[10px] opacity-80 mt-2 font-sans">{sc.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32] text-xs">
          <strong className="text-[#00FF66] block mb-1 uppercase tracking-wider">فرمول امتیاز نهایی (Final Composite Score):</strong>
          <code className="font-mono text-xs text-[#E0E2E6] block">
            Final Score = (Trend × 0.25) + (Momentum × 0.20) + (Volume × 0.15) + (Volatility × 0.15) + (PriceAction × 0.10) + (AI Confidence × 0.15)
          </code>
        </div>
      </div>

      {/* Strict AI Governance Rules */}
      <div className="p-4 rounded-lg bg-[#0A0B0E] border border-[#2A2D32]">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#F27D26] uppercase tracking-wider">
          <Lock className="w-4 h-4" />
          <span>AI Governance Rules (خطوط قرمز رفتار هوش مصنوعی)</span>
        </div>
        <ul className="space-y-1.5 text-xs text-[#8E9299] font-sans">
          <li className="flex items-start gap-2">
            <span className="text-[#FF4444] font-bold font-mono">✕</span>
            <span>هوش مصنوعی هرگز مجاز به ارسال مستقیم یا خودسر سفارش به صرافی نیست.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF4444] font-bold font-mono">✕</span>
            <span>هوش مصنوعی هرگز حق ندارد حد ضرر، حد سود یا حجم پوزیشن را از قوانین ریاضیاتی Risk Manager تغییر دهد.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF4444] font-bold font-mono">✕</span>
            <span>هوش مصنوعی هرگز حق دور زدن سقف ضرر روزانه، سقف دراوداون یا فیلتر نوسان غیرعادی را ندارد.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00FF66] font-bold font-mono">✓</span>
            <span>وظیفه انحصاری هوش مصنوعی: تحلیل الگوها، تخمین آماری احتمال پیروزی سناریو و فیلتر کردن سیگنال‌های فاقد ارزش.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
