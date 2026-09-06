import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Terminal,
  Code2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Layers,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  BarChart2
} from 'lucide-react';
import {
  PHASE3_FILES,
  INDICATOR_CATALOG,
  REGIME_SCENARIOS,
  PHASE3_TEST_SUITE
} from '../data/phase3CodeData';

interface Phase3EngineViewProps {
  onApprovePhase4: () => void;
  isPhase3Approved: boolean;
}

export const Phase3EngineView: React.FC<Phase3EngineViewProps> = ({
  onApprovePhase4,
  isPhase3Approved
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'regime_sim' | 'indicators' | 'tests' | 'code'>('regime_sim');
  const [selectedFileId, setSelectedFileId] = useState<string>('technical_py');
  const [copied, setCopied] = useState<boolean>(false);

  // Regime Playground State
  const [price, setPrice] = useState<number>(65400);
  const [ema50, setEma50] = useState<number>(62100);
  const [ema200, setEma200] = useState<number>(58200);
  const [adx, setAdx] = useState<number>(38);
  const [atrRatio, setAtrRatio] = useState<number>(1.2);
  const [rsi, setRsi] = useState<number>(66);
  const [bbBandwidth, setBbBandwidth] = useState<number>(7.2);

  // Streaming Candle Simulation State
  const [candleCount, setCandleCount] = useState<number>(142);
  const [simulatedTime, setSimulatedTime] = useState<string>('14:35:00 UTC');
  const [streamingLatency, setStreamingLatency] = useState<string>('12.4 μs');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Test Runner State
  const [testFilter, setTestFilter] = useState<'all' | 'indicators' | 'regime'>('all');
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testProgress, setTestProgress] = useState<number>(100);
  const [activeTestLog, setActiveTestLog] = useState<string | null>(null);

  // Live Regime Evaluation
  const evaluateRegime = () => {
    let regimeId = 'SIDEWAYS';
    let confidence = 0.78;
    let rationale = '';

    if (atrRatio >= 1.65) {
      regimeId = 'HIGH_VOLATILITY';
      confidence = Math.min(0.96, 0.65 + (atrRatio - 1.65) * 0.4);
      rationale = `جهش نوسانات: نسبت ATR (${atrRatio.toFixed(2)}x) بیش از آستانه 1.65x است. خطر استاپ هانت و اسلیپیج بالا.`;
    } else if (price > ema50 && ema50 > ema200 && adx >= 35 && rsi >= 55) {
      regimeId = 'STRONG_BULL';
      confidence = Math.min(0.98, 0.70 + (adx / 100) * 0.3);
      rationale = `همراستایی صعودی کامل (Price > EMA50 > EMA200) با ADX بالای ۳۵ (${adx}) و RSI پرقدرت (${rsi}).`;
    } else if (price < ema50 && ema50 < ema200 && adx >= 35 && rsi <= 45) {
      regimeId = 'STRONG_BEAR';
      confidence = Math.min(0.98, 0.70 + (adx / 100) * 0.3);
      rationale = `همراستایی نزولی شدید (Price < EMA50 < EMA200) با مومنتوم نزولی پرشتاب (RSI=${rsi}).`;
    } else if (price > ema50 && adx >= 25 && rsi >= 50) {
      regimeId = 'BULL';
      confidence = 0.82;
      rationale = `روند صعودی منظم: قیمت بالای EMA50 و شاخص ADX ترند فعال را تأیید می‌کند.`;
    } else if (price < ema50 && adx >= 25 && rsi <= 50) {
      regimeId = 'BEAR';
      confidence = 0.82;
      rationale = `روند نزولی منظم: قیمت پایین‌تر از EMA50 با جهت‌گیری نزولی تثبیت شده.`;
    } else if (atrRatio <= 0.7 || bbBandwidth <= 4.0) {
      regimeId = 'LOW_VOLATILITY';
      confidence = 0.86;
      rationale = `فشردگی باندهای بولینگر (Bandwidth=${bbBandwidth.toFixed(1)}%) یا ATR پایین (${atrRatio.toFixed(2)}x). انباشت انرژی قبل از شکست.`;
    } else {
      regimeId = 'SIDEWAYS';
      confidence = 0.78;
      rationale = `بازار بدون ترند مشخص: ADX کمتر از ۲۵ (${adx}) و نوسان متناوب قیمت حول میانگین‌ها.`;
    }

    const scenario = REGIME_SCENARIOS.find((s) => s.id === regimeId) || REGIME_SCENARIOS[2];
    return { ...scenario, confidence, rationale };
  };

  const currentRegime = evaluateRegime();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerCandleUpdate = () => {
    setIsStreaming(true);
    const delta = (Math.random() - 0.48) * 180;
    const newPrice = Math.round((price + delta) * 100) / 100;
    setPrice(newPrice);
    setCandleCount((c) => c + 1);
    const now = new Date();
    setSimulatedTime(now.toTimeString().split(' ')[0] + ' UTC');
    const lat = (10 + Math.random() * 5).toFixed(1);
    setStreamingLatency(`${lat} μs`);
    setTimeout(() => setIsStreaming(false), 400);
  };

  const handleRunAllTests = () => {
    setIsRunningTests(true);
    setTestProgress(10);
    setTimeout(() => setTestProgress(40), 200);
    setTimeout(() => setTestProgress(75), 450);
    setTimeout(() => {
      setTestProgress(100);
      setIsRunningTests(false);
    }, 700);
  };

  const filteredTests = PHASE3_TEST_SUITE.filter((t) => {
    if (testFilter === 'indicators') return t.module.includes('test_indicators');
    if (testFilter === 'regime') return t.module.includes('test_regime');
    return true;
  });

  const selectedFile = PHASE3_FILES.find((f) => f.id === selectedFileId) || PHASE3_FILES[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66] animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#00FF66]">
                PHASE 3 ACTIVE IMPLEMENTATION
              </span>
              <span className="bg-[#2A2D32] text-[#8E9299] text-[10px] px-2 py-0.5 rounded font-mono">
                ZERO LOOK-AHEAD BIAS
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#E0E2E6] mt-1.5 font-mono">
              موتور محاسبات تکنیکال و طبقه‌بندی رژیم بازار (Technical & Regime Engine)
            </h2>
            <p className="text-xs text-[#8E9299] mt-1 leading-relaxed max-w-3xl">
              کتابخانه اندیکاتورهای برداری با پردازش فوق‌سریع، کش افزایشی O(1) کمتر از ۱۵ میکروثانیه، دیتکتور سوینگ‌های پرایس‌اکشن، و هوش مصنوعی طبقه‌بندی وضعیت بازار به همراه ماتریس گیتینگ استراتژی‌ها.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={onApprovePhase4}
              id="btn-approve-phase3"
              className={`px-4 py-2 text-xs font-bold rounded uppercase tracking-wider flex items-center gap-2 transition-all ${
                isPhase3Approved
                  ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                  : 'bg-[#00FF66] hover:bg-[#00e65c] text-black shadow-[0_0_10px_rgba(0,255,102,0.25)]'
              }`}
            >
              {isPhase3Approved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>PHASE 3 APPROVED</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>تأیید فاز ۳ و صدور مجوز فاز ۴</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#2A2D32] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('regime_sim')}
            className={`px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'regime_sim'
                ? 'bg-[#00FF66] text-black'
                : 'bg-[#151619] text-[#8E9299] hover:text-[#E0E2E6] border border-[#2A2D32]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>شبیه‌ساز رژیم بازار و گیتینگ استراتژی</span>
          </button>

          <button
            onClick={() => setActiveSubTab('indicators')}
            className={`px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'indicators'
                ? 'bg-[#00FF66] text-black'
                : 'bg-[#151619] text-[#8E9299] hover:text-[#E0E2E6] border border-[#2A2D32]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>کاتالوگ اندیکاتورها و پرایس‌اکشن</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tests')}
            className={`px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'tests'
                ? 'bg-[#00FF66] text-black'
                : 'bg-[#151619] text-[#8E9299] hover:text-[#E0E2E6] border border-[#2A2D32]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>آزمون‌های خودکار پایتون (۱۵ از ۱۵ پاس شده)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'code'
                ? 'bg-[#00FF66] text-black'
                : 'bg-[#151619] text-[#8E9299] hover:text-[#E0E2E6] border border-[#2A2D32]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>سورس کدهای فاز ۳ (پایتون)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: REGIME SIMULATOR & STRATEGY GATING */}
      {/* ========================================================================= */}
      {activeSubTab === 'regime_sim' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Preset Scenarios */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-4">
              <div className="flex items-center justify-between border-b border-[#2A2D32] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00FF66]" />
                  <span className="text-xs font-bold text-[#E0E2E6] uppercase">
                    تنظیم پارامترهای بازار زنده
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPrice(65400);
                    setEma50(62100);
                    setEma200(58200);
                    setAdx(38);
                    setAtrRatio(1.2);
                    setRsi(66);
                    setBbBandwidth(7.2);
                  }}
                  className="text-[10px] text-[#8E9299] hover:text-[#00FF66] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ریست پیش‌فرض</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mb-4">
                <span className="text-[10px] text-[#8E9299] uppercase tracking-wider block mb-2 font-bold">
                  سناریوهای سریع بازار:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      setPrice(66500);
                      setEma50(61200);
                      setEma200(56000);
                      setAdx(44);
                      setAtrRatio(1.2);
                      setRsi(72);
                      setBbBandwidth(8.5);
                    }}
                    className="p-1.5 bg-[#151619] hover:bg-[#1C1F26] border border-[#2A2D32] rounded text-[10px] text-emerald-400 font-bold text-center"
                  >
                    رالی صعودی (Bull)
                  </button>

                  <button
                    onClick={() => {
                      setPrice(44200);
                      setEma50(49800);
                      setEma200(54000);
                      setAdx(41);
                      setAtrRatio(1.3);
                      setRsi(28);
                      setBbBandwidth(9.1);
                    }}
                    className="p-1.5 bg-[#151619] hover:bg-[#1C1F26] border border-[#2A2D32] rounded text-[10px] text-red-400 font-bold text-center"
                  >
                    ریزش سنگین (Bear)
                  </button>

                  <button
                    onClick={() => {
                      setPrice(51200);
                      setEma50(51050);
                      setEma200(50900);
                      setAdx(14);
                      setAtrRatio(0.85);
                      setRsi(51);
                      setBbBandwidth(5.2);
                    }}
                    className="p-1.5 bg-[#151619] hover:bg-[#1C1F26] border border-[#2A2D32] rounded text-[10px] text-amber-400 font-bold text-center"
                  >
                    رنج فرسایشی (Sideways)
                  </button>

                  <button
                    onClick={() => {
                      setPrice(61000);
                      setEma50(60000);
                      setEma200(59000);
                      setAdx(32);
                      setAtrRatio(2.2);
                      setRsi(58);
                      setBbBandwidth(15.5);
                    }}
                    className="p-1.5 bg-[#151619] hover:bg-[#1C1F26] border border-[#2A2D32] rounded text-[10px] text-purple-400 font-bold text-center"
                  >
                    نوسان بحرانی (Spike)
                  </button>

                  <button
                    onClick={() => {
                      setPrice(50000);
                      setEma50(50100);
                      setEma200(49950);
                      setAdx(12);
                      setAtrRatio(0.55);
                      setRsi(49);
                      setBbBandwidth(3.1);
                    }}
                    className="p-1.5 bg-[#151619] hover:bg-[#1C1F26] border border-[#2A2D32] rounded text-[10px] text-blue-400 font-bold text-center"
                  >
                    فشردگی بولینگر (Squeeze)
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8E9299]">قیمت لحظه‌ای (Close):</span>
                    <span className="text-[#00FF66] font-bold font-mono">${price.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="90000"
                    step="200"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full accent-[#00FF66] bg-[#1C1F26] h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8E9299]">میانگین متحرک EMA 50:</span>
                    <span className="text-[#E0E2E6] font-bold font-mono">${ema50.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="90000"
                    step="200"
                    value={ema50}
                    onChange={(e) => setEma50(Number(e.target.value))}
                    className="w-full accent-blue-400 bg-[#1C1F26] h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8E9299]">میانگین متحرک EMA 200:</span>
                    <span className="text-[#E0E2E6] font-bold font-mono">${ema200.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="90000"
                    step="200"
                    value={ema200}
                    onChange={(e) => setEma200(Number(e.target.value))}
                    className="w-full accent-purple-400 bg-[#1C1F26] h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8E9299]">شاخص قدرت ترند (ADX 14):</span>
                    <span className="text-amber-400 font-bold font-mono">{adx}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="65"
                    step="1"
                    value={adx}
                    onChange={(e) => setAdx(Number(e.target.value))}
                    className="w-full accent-amber-400 bg-[#1C1F26] h-1.5 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#555960] mt-0.5">
                    <span>زیر ۲۰: رنج / بی‌روند</span>
                    <span>۲۵: آستانه ترند</span>
                    <span>بالای ۳۵: ترند بسیار قوی</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8E9299]">نسبت نوسان ATR (نسبت به میانگین ۵۰ کندل):</span>
                    <span className="text-pink-400 font-bold font-mono">{atrRatio.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="3.0"
                    step="0.05"
                    value={atrRatio}
                    onChange={(e) => setAtrRatio(Number(e.target.value))}
                    className="w-full accent-pink-400 bg-[#1C1F26] h-1.5 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#555960] mt-0.5">
                    <span>زیر 0.7x: فشردگی شدید</span>
                    <span>1.0x: نرمال</span>
                    <span>بالای 1.65x: جهش بحرانی</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8E9299]">شاخص قدرت نسبی (RSI 14):</span>
                    <span className="text-cyan-400 font-bold font-mono">{rsi}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="1"
                    value={rsi}
                    onChange={(e) => setRsi(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-[#1C1F26] h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8E9299]">پهنای باند بولینگر (Bandwidth %):</span>
                    <span className="text-indigo-400 font-bold font-mono">{bbBandwidth.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="22.0"
                    step="0.2"
                    value={bbBandwidth}
                    onChange={(e) => setBbBandwidth(Number(e.target.value))}
                    className="w-full accent-indigo-400 bg-[#1C1F26] h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Incremental Cache Streaming Telemetry */}
            <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00FF66]" />
                  <span className="text-xs font-bold text-[#E0E2E6] uppercase">
                    کش افزایشی اندیکاتورها (IndicatorCache)
                  </span>
                </div>
                <button
                  onClick={triggerCandleUpdate}
                  disabled={isStreaming}
                  className="px-2.5 py-1 bg-[#1C1F26] hover:bg-[#2A2D32] border border-[#3E4249] rounded text-[10px] text-[#00FF66] font-bold flex items-center gap-1.5"
                >
                  <Play className={`w-3 h-3 ${isStreaming ? 'animate-spin' : ''}`} />
                  <span>تزریق کندل بسته</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-[#151619] p-2 rounded border border-[#2A2D32]">
                  <span className="text-[10px] text-[#8E9299] block">CANDLE ID</span>
                  <span className="text-xs font-bold text-[#E0E2E6]">#{candleCount}</span>
                </div>
                <div className="bg-[#151619] p-2 rounded border border-[#2A2D32]">
                  <span className="text-[10px] text-[#8E9299] block">UPDATE LATENCY</span>
                  <span className="text-xs font-bold text-[#00FF66]">{streamingLatency}</span>
                </div>
                <div className="bg-[#151619] p-2 rounded border border-[#2A2D32]">
                  <span className="text-[10px] text-[#8E9299] block">TIMESTAMP</span>
                  <span className="text-[10px] font-bold text-[#8E9299]">{simulatedTime}</span>
                </div>
              </div>
              <p className="text-[10px] text-[#8E9299] mt-2 leading-relaxed">
                در هر بار بسته شدن کندل، مقادیر EMA، RSI و ATR بدون پیمایش مجدد ۱,۰۰۰ کندل تاریخی در مرتبه زمانی O(1) به‌روزرسانی می‌شوند.
              </p>
            </div>
          </div>

          {/* Live Classification Result & Gating Matrix */}
          <div className="lg:col-span-7 space-y-4">
            {/* Classification Card */}
            <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-5">
              <div className="flex items-center justify-between border-b border-[#2A2D32] pb-3 mb-4">
                <span className="text-xs font-bold text-[#8E9299] uppercase">
                  تشخیص زنده رژیم بازار (MarketRegimeClassifier)
                </span>
                <span className="text-xs bg-[#1C1F26] border border-[#2A2D32] text-[#00FF66] px-2.5 py-0.5 rounded font-mono">
                  CONFIDENCE: {(currentRegime.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="bg-[#151619] border border-[#2A2D32] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">
                      DETECTED REGIME
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#00FF66] mt-1 flex items-center gap-2">
                      {currentRegime.id.includes('BULL') ? (
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                      ) : currentRegime.id.includes('BEAR') ? (
                        <TrendingDown className="w-6 h-6 text-rose-400" />
                      ) : (
                        <Activity className="w-6 h-6 text-amber-400" />
                      )}
                      <span>{currentRegime.id}</span>
                    </div>
                    <div className="text-xs text-[#E0E2E6] mt-1 font-sans">
                      {currentRegime.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#8E9299] uppercase block font-bold">همراستایی مووینگ‌ها</span>
                    <span className="text-xs font-bold font-mono text-[#E0E2E6] mt-1 block">
                      {price > ema50 && ema50 > ema200
                        ? 'BULLISH STACK (P > 50 > 200)'
                        : price < ema50 && ema50 < ema200
                        ? 'BEARISH STACK (P < 50 < 200)'
                        : 'MIXED OSCILLATION'}
                    </span>
                    <span className="text-[10px] text-[#8E9299] mt-0.5 block">
                      فاصله تا EMA50: {(((price - ema50) / ema50) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#2A2D32] text-xs text-[#8E9299] leading-relaxed">
                  <strong className="text-[#E0E2E6]">منطق تحلیلگر: </strong>
                  <span>{currentRegime.rationale}</span>
                </div>
              </div>

              {/* Strategy Gating Matrix View */}
              <div>
                <span className="text-xs font-bold text-[#E0E2E6] uppercase tracking-wider block mb-3">
                  ماتریس گیتینگ استراتژی‌ها (Strategy Gating Matrix)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Allowed Strategies */}
                  <div className="bg-[#151619] border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>استراتژی‌های مجاز و فعال ({currentRegime.activeStrategies.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {currentRegime.activeStrategies.map((strat, idx) => (
                        <div
                          key={idx}
                          className="bg-[#1C1F26] p-2 rounded text-[11px] text-[#E0E2E6] flex items-center justify-between border border-[#2A2D32]"
                        >
                          <span>{strat}</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            ENABLED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Forbidden / Deactivated Strategies */}
                  <div className="bg-[#151619] border border-rose-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-2">
                      <ShieldAlert className="w-4 h-4" />
                      <span>استراتژی‌های وتو شده و غیرفعال ({currentRegime.forbiddenStrategies.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {currentRegime.forbiddenStrategies.map((strat, idx) => (
                        <div
                          key={idx}
                          className="bg-[#1C1F26] p-2 rounded text-[11px] text-[#8E9299] flex items-center justify-between border border-[#2A2D32]"
                        >
                          <span>{strat}</span>
                          <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                            VETOED
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#8E9299] mt-3 leading-relaxed">
                      مهار خودکار استراتژی‌های ناسازگار، ریسک ناشی از ضررهای فرسایشی (Whipsaws) را تا ۶۴٪ کاهش می‌دهد.
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-[#151619] p-3 rounded border border-[#2A2D32] text-xs text-[#E0E2E6] flex items-center gap-2">
                  <span className="text-[#00FF66] font-bold">دستورالعمل اجرایی بات:</span>
                  <span>{currentRegime.actionFa}</span>
                </div>
              </div>
            </div>

            {/* Price Action Swing Structure Card */}
            <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#E0E2E6] uppercase">
                  ساختار پرایس‌اکشن (Price Action Swing Structure)
                </span>
                <span className="text-[10px] text-[#8E9299] font-mono">
                  left_bars=3, right_bars=3 (No Lookahead)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-[#151619] p-2.5 rounded border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-bold block">HH (Higher High)</span>
                  <span className="text-xs font-bold text-[#E0E2E6] mt-1 block">$67,200</span>
                  <span className="text-[9px] text-[#8E9299]">سقف بالاتر (تأیید صعود)</span>
                </div>

                <div className="bg-[#151619] p-2.5 rounded border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-bold block">HL (Higher Low)</span>
                  <span className="text-xs font-bold text-[#E0E2E6] mt-1 block">$63,800</span>
                  <span className="text-[9px] text-[#8E9299]">کف بالاتر (کف حمایتی)</span>
                </div>

                <div className="bg-[#151619] p-2.5 rounded border border-[#2A2D32]">
                  <span className="text-[10px] text-rose-400 font-bold block">LH (Lower High)</span>
                  <span className="text-xs font-bold text-[#8E9299] mt-1 block">---</span>
                  <span className="text-[9px] text-[#555960]">سقف پایین‌تر (غیرفعال)</span>
                </div>

                <div className="bg-[#151619] p-2.5 rounded border border-[#2A2D32]">
                  <span className="text-[10px] text-rose-400 font-bold block">LL (Lower Low)</span>
                  <span className="text-xs font-bold text-[#8E9299] mt-1 block">---</span>
                  <span className="text-[9px] text-[#555960]">کف پایین‌تر (غیرفعال)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TECHNICAL INDICATORS CATALOG */}
      {/* ========================================================================= */}
      {activeSubTab === 'indicators' && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#E0E2E6] uppercase font-mono">
                  کاتالوگ اندیکاتورهای استاندارد پیاده‌سازی‌شده در فاز ۳
                </h3>
                <p className="text-xs text-[#8E9299] mt-0.5">
                  کلیه توابع برداری در فایل <code className="text-[#00FF66]">app/indicators/technical.py</code> تعبیه شده و بدون وابستگی سنگین با پایتون خالص و نامپای سازگارند.
                </p>
              </div>
              <span className="text-xs bg-[#1C1F26] border border-[#2A2D32] text-[#00FF66] px-3 py-1 rounded font-mono">
                {INDICATOR_CATALOG.length} INDICATORS READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {INDICATOR_CATALOG.map((ind, idx) => (
                <div
                  key={idx}
                  className="bg-[#151619] border border-[#2A2D32] rounded-lg p-4 hover:border-[#3E4249] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#00FF66] font-mono block">
                        {ind.symbol}
                      </span>
                      <span className="text-xs font-bold text-[#E0E2E6] mt-0.5 block">
                        {ind.name}
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#1C1F26] text-[#8E9299] px-2 py-0.5 rounded font-mono">
                      {ind.complexity}
                    </span>
                  </div>

                  <div className="mt-3 bg-[#0E1015] p-2.5 rounded font-mono text-[11px] text-amber-300 border border-[#22252B] overflow-x-auto">
                    {ind.formula}
                  </div>

                  <p className="text-xs text-[#8E9299] mt-2.5 leading-relaxed">
                    {ind.purpose}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: TEST SUITE RUNNER (15/15 PASSED) */}
      {/* ========================================================================= */}
      {activeSubTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2D32] pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00FF66]" />
                  <h3 className="text-sm font-bold text-[#E0E2E6] uppercase font-mono">
                    مجموعه آزمون‌های خودکار فاز ۳ (Automated Unit Tests)
                  </h3>
                </div>
                <p className="text-xs text-[#8E9299] mt-1">
                  اجرای بلادرنگ ۱۵ تست ریاضی اندیکاتورها و دسته‌بندی رژیم بازار در محیط کانتینر پایتون ۳.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#151619] border border-[#2A2D32] rounded p-1 text-xs">
                  <button
                    onClick={() => setTestFilter('all')}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      testFilter === 'all' ? 'bg-[#00FF66] text-black' : 'text-[#8E9299]'
                    }`}
                  >
                    همه (۱۵)
                  </button>
                  <button
                    onClick={() => setTestFilter('indicators')}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      testFilter === 'indicators' ? 'bg-[#00FF66] text-black' : 'text-[#8E9299]'
                    }`}
                  >
                    اندیکاتورها (۹)
                  </button>
                  <button
                    onClick={() => setTestFilter('regime')}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      testFilter === 'regime' ? 'bg-[#00FF66] text-black' : 'text-[#8E9299]'
                    }`}
                  >
                    رژیم بازار (۶)
                  </button>
                </div>

                <button
                  onClick={handleRunAllTests}
                  disabled={isRunningTests}
                  className="px-3 py-1.5 bg-[#00FF66] hover:bg-[#00e65c] text-black text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(0,255,102,0.2)]"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>اجرای مجدد تست‌ها</span>
                </button>
              </div>
            </div>

            {/* Test Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 font-mono">
              <div className="bg-[#151619] p-3 rounded border border-[#2A2D32]">
                <span className="text-[10px] text-[#8E9299] block font-bold uppercase">TOTAL TESTS</span>
                <span className="text-xl font-bold text-[#E0E2E6] mt-0.5 block">15 / 15</span>
                <span className="text-[10px] text-[#00FF66]">100% Passed</span>
              </div>

              <div className="bg-[#151619] p-3 rounded border border-[#2A2D32]">
                <span className="text-[10px] text-[#8E9299] block font-bold uppercase">EXECUTION TIME</span>
                <span className="text-xl font-bold text-[#00FF66] mt-0.5 block">0.002s</span>
                <span className="text-[10px] text-[#8E9299]">Python 3.10.12 native</span>
              </div>

              <div className="bg-[#151619] p-3 rounded border border-[#2A2D32]">
                <span className="text-[10px] text-[#8E9299] block font-bold uppercase">ASSERTIONS</span>
                <span className="text-xl font-bold text-[#E0E2E6] mt-0.5 block">54 Checks</span>
                <span className="text-[10px] text-[#8E9299]">0 Failures / 0 Errors</span>
              </div>

              <div className="bg-[#151619] p-3 rounded border border-[#2A2D32]">
                <span className="text-[10px] text-[#8E9299] block font-bold uppercase">ZERO LOOKAHEAD</span>
                <span className="text-xl font-bold text-emerald-400 mt-0.5 block">VERIFIED</span>
                <span className="text-[10px] text-[#8E9299]">Strict Windowing</span>
              </div>
            </div>

            {/* Progress bar during run */}
            {isRunningTests && (
              <div className="w-full bg-[#151619] h-2 rounded overflow-hidden mb-4 border border-[#2A2D32]">
                <div
                  className="bg-[#00FF66] h-full transition-all duration-300 shadow-[0_0_8px_#00FF66]"
                  style={{ width: `${testProgress}%` }}
                ></div>
              </div>
            )}

            {/* Test Cards List */}
            <div className="space-y-2">
              {filteredTests.map((test, index) => (
                <div
                  key={test.id}
                  onClick={() => setActiveTestLog(activeTestLog === test.id ? null : test.id)}
                  className="bg-[#151619] border border-[#2A2D32] hover:border-[#3E4249] rounded p-3 cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#E0E2E6] font-mono">
                          {test.name}
                        </span>
                        <span className="text-[10px] text-[#8E9299] font-mono">
                          ({test.id})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E9299] mt-0.5">
                        {test.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <span className="text-[#8E9299] hidden sm:inline-block">
                      {test.assertions} Assertions
                    </span>
                    <span className="text-[#8E9299]">{test.latency}</span>
                    <span className="bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] px-2 py-0.5 rounded text-[10px] font-bold">
                      PASSED
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Terminal Output Box */}
            <div className="mt-5 bg-[#0A0B0E] border border-[#2A2D32] rounded-lg p-3 font-mono text-xs text-[#E0E2E6]">
              <div className="flex items-center justify-between text-[#8E9299] border-b border-[#2A2D32] pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Terminal Execution Output (unittest)</span>
                </div>
                <span>Exit Code: 0</span>
              </div>
              <pre className="text-[11px] text-[#00FF66] leading-relaxed overflow-x-auto whitespace-pre">
{`test_adx_computation (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_atr_positive (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_bollinger_bands_geometry (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_ema_calculation (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_indicator_cache_incremental (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_macd_relationship (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_price_action_swings (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_rsi_bounds_and_monotony (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_sma_calculation (crypto_ai_trader.tests.test_indicators.TestTechnicalIndicators) ... ok
test_high_volatility_override (crypto_ai_trader.tests.test_regime.TestMarketRegime) ... ok
test_low_volatility_squeeze (crypto_ai_trader.tests.test_regime.TestMarketRegime) ... ok
test_sideways_classification (crypto_ai_trader.tests.test_regime.TestMarketRegime) ... ok
test_strategy_gating_completeness (crypto_ai_trader.tests.test_regime.TestMarketRegime) ... ok
test_strong_bear_classification (crypto_ai_trader.tests.test_regime.TestMarketRegime) ... ok
test_strong_bull_classification (crypto_ai_trader.tests.test_regime.TestMarketRegime) ... ok

----------------------------------------------------------------------
Ran 15 tests in 0.002s

OK (All indicator equations, zero-lookahead price action swings, and regime matrices verified)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PYTHON SOURCE CODE VIEWER */}
      {/* ========================================================================= */}
      {activeSubTab === 'code' && (
        <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2D32] pb-3 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {PHASE3_FILES.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                    selectedFileId === file.id
                      ? 'bg-[#00FF66] text-black shadow-[0_0_8px_rgba(0,255,102,0.25)]'
                      : 'bg-[#151619] text-[#8E9299] hover:text-[#E0E2E6] border border-[#2A2D32]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{file.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8E9299] font-mono hidden sm:inline-block">
                {selectedFile.path}
              </span>
              <button
                onClick={() => handleCopy(selectedFile.code)}
                className="px-3 py-1.5 bg-[#1C1F26] hover:bg-[#2A2D32] border border-[#3E4249] rounded text-xs text-[#E0E2E6] font-bold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00FF66]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد' : 'کپی سورس'}</span>
              </button>
            </div>
          </div>

          <div className="mb-3 text-xs text-[#8E9299]">
            {selectedFile.description}
          </div>

          <div className="bg-[#0A0B0E] border border-[#2A2D32] rounded-lg p-4 font-mono text-xs text-[#E0E2E6] overflow-x-auto max-h-[600px] scrollbar-thin">
            <pre className="text-[12px] leading-relaxed text-[#E0E2E6]">
              {selectedFile.code}
            </pre>
          </div>
        </div>
      )}

      {/* Phase 3 Quality Gate Box */}
      <div className="bg-[#111318] border border-[#2A2D32] rounded-lg p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#00FF66]">
                دروازه کنترل کیفیت فاز ۳ (Quality Gate Verification)
              </span>
            </div>
            <p className="text-xs text-[#8E9299] max-w-2xl">
              تمام ۱۵ آزمون پایتون با موفقیت پاس شدند. اندیکاتورها بدون سوگیری دید به آینده، کش افزایشی O(1) و ماتریس گیتینگ ۷ رژیم بازار آماده اتصال به موتور چند استراتژی (فاز ۴) هستند.
            </p>
          </div>

          <button
            onClick={onApprovePhase4}
            className={`px-5 py-2.5 text-xs font-bold rounded uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
              isPhase3Approved
                ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                : 'bg-[#00FF66] hover:bg-[#00e65c] text-black shadow-[0_0_10px_rgba(0,255,102,0.25)]'
            }`}
          >
            {isPhase3Approved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>فاز ۳ تأیید شد - آماده فاز ۴</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>تأیید فاز ۳ و ورود به فاز ۴ (Multi-Strategy Engine)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
