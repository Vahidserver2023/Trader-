import React from 'react';
import { Network, ShieldCheck, LayoutDashboard, Smartphone, Terminal, Lock, RefreshCw, Layers } from 'lucide-react';

export const ExchangeDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
            <Network className="w-4 h-4" />
            <span>Exchange, Dashboard & Mobile Architecture</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Pluggable Exchange Adapters & Isolated Client Interfaces
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
            معماری چندصرافی با کلاس تجریدی ExchangeAdapter، استعلام قطعی وضعیت اوردر پیش از هرگونه تلاش مجدد، و ساختار داشبورد با ایزولاسیون کامل کلاینت اندروید از کلیدهای API.
          </p>
        </div>
      </div>

      {/* Part 1: Exchange Adapter Architecture */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">
              ExchangeAdapter Abstraction (اتصال یکنواخت به صرافی‌ها)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">app/execution/base_exchange.py</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-emerald-400 block font-mono">
              Abstract Base Adapter Contract:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
              <li>• <span className="text-blue-400">connect()</span> → احراز هویت اولیه و تست پینگ</li>
              <li>• <span className="text-blue-400">fetch_balance()</span> → استعلام موجودی نقد و آزاد</li>
              <li>• <span className="text-blue-400">create_order(symbol, side, type, qty, price)</span> → ثبت امن</li>
              <li>• <span className="text-blue-400">cancel_order(order_id, symbol)</span> → ابطال اوردر باز</li>
              <li>• <span className="text-blue-400">fetch_order_status(order_id)</span> → راستی‌آزمایی وضعیت قبل از Retry</li>
              <li>• <span className="text-blue-400">listen_order_updates()</span> → وب‌سوکت فیل‌های لحظه‌ای</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400 block font-mono">
              Failsafe Protocol & Security Rules:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">1.</span>
                <span>اگر پاسخی از صرافی دریافت نشد، ربات هرگز دوباره کورکورانه سفارش ارسال نمی‌کند؛ ابتدا از مسیر <code className="text-emerald-300 font-mono">fetch_order_status</code> وضعیت استعلام می‌شود.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <span>کلیدهای API فقط دسترسی Trade دارند و دسترسی برداشت وجه (Withdrawal) اکیداً غیرفعال است.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <span>آداپتورهای بایننس و بای‌بیت آماده هستند و آداپتورهای OKX، Coinbase و Kraken با همین الگوی استاندارد در آینده اضافه خواهند شد.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Part 2: Dashboard UI Spec */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Dashboard Architecture (معماری داشبورد کنترل و مانیتورینگ)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">FastAPI + React Dashboard</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-emerald-400 block mb-1">Portfolio Overview</span>
            <p className="text-[11px] text-slate-400">نمایش بالانس، ارزش کل سهام (Equity)، سود روزانه/ماهانه، دراوداون جاری، وین‌ریت و استیت ربات</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-blue-400 block mb-1">Active Positions Live</span>
            <p className="text-[11px] text-slate-400">جدول پوزیشن‌های باز، نقطه ورود، قیمت لحظه‌ای، حد ضرر، تارگت‌های TP1/2/3، سود لحظه‌ای و ضریب اطمینان AI</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-violet-400 block mb-1">Signals Radar</span>
            <p className="text-[11px] text-slate-400">رادار سیگنال‌های تولید شده با تایم‌فریم، امتیاز ۰-۱۰۰، رژیم حاکم بازار، حد سود و ضرر پیشنهادی و وضعیت تاییدیه مدیر ریسک</p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-rose-400 block mb-1">Emergency Bot Controls</span>
            <p className="text-[11px] text-slate-400">کلیدهای کنترل فوری: START، STOP، PAUSE، سوییچ PAPER/LIVE و مدار شکن اضطراری KILL SWITCH</p>
          </div>
        </div>
      </div>

      {/* Part 3: Android Architecture */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold border-b border-slate-800 pb-2">
          <Smartphone className="w-4 h-4" />
          <span>Android Mobile Architecture & Zero-Secret Model</span>
        </div>
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-center text-slate-300">
          Android App (PWA / APK) ──► Secure HTTPS / Bearer Token ──► Trading Server (FastAPI) ──► Exchange Adapter ──► Binance / Bybit
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          اپلیکیشن کلاینت روی اندروید (PWA یا نسخه APK در آینده) به هیچ عنوان کلید API بایننس یا بای‌بیت را داخل گوشی نگهداری نمی‌کند. ارتباط صرفاً از طریق توکن‌های موقت Bearer با سرور تریدینگ (روی ترموکس یا VPS) انجام شده و تمام تعاملات با صرافی‌ها در محیط سرور محافظت‌شده باقی می‌ماند.
        </p>
      </div>
    </div>
  );
};
