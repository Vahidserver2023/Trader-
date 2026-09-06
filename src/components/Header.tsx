import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onApprovePhase1: () => void;
  isApproved: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onApprovePhase1,
  isApproved
}) => {
  const tabs: { id: TabType; label: string; labelFa: string; badge?: string }[] = [
    { id: 'phase14_production', label: 'PHASE 14: PRODUCTION & CLOUD', labelFa: 'امن‌سازی نهایی و کلود', badge: 'READY' },
    { id: 'phase13_termux', label: 'PHASE 13: TERMUX & PWA', labelFa: 'استقرار ترموکس و PWA', badge: 'VERIFIED' },
    { id: 'phase12_telegram', label: 'PHASE 12: TELEGRAM BOT', labelFa: 'بات تلگرام و هشدارهای زنده', badge: 'VERIFIED' },
    { id: 'phase11_dashboard', label: 'PHASE 11: LIVE DASHBOARD', labelFa: 'داشبورد زنده و مانیتورینگ', badge: 'VERIFIED' },
    { id: 'phase5_risk', label: 'PHASE 5: RISK ENGINE', labelFa: 'مدیریت ریسک و پوزیشن', badge: 'VERIFIED' },
    { id: 'phase4_strategies', label: 'PHASE 4: STRATEGIES', labelFa: 'موتور چنداستراتژی', badge: 'VERIFIED' },
    { id: 'phase3_engine', label: 'PHASE 3: TA & REGIME', labelFa: 'اندیکاتورها و رژیم بازار', badge: 'VERIFIED' },
    { id: 'phase2_data', label: 'PHASE 2: DATA ENGINE', labelFa: 'کلاینت و پایپ‌لاین دیتا', badge: 'VERIFIED' },
    { id: 'phase1_core', label: 'PHASE 1: CORE ENGINE', labelFa: 'اسکلت و تنظیمات', badge: 'VERIFIED' },
    { id: 'architecture', label: 'ARCHITECTURE', labelFa: 'معماری کل' },
    { id: 'dataflow', label: 'DATA FLOW', labelFa: 'جریان داده' },
    { id: 'folders', label: 'FOLDER TREE', labelFa: 'ساختار پوشه‌ها' },
    { id: 'database', label: 'DB SCHEMA', labelFa: 'طرح دیتابیس' },
    { id: 'strategy_risk', label: 'STRATEGY & RISK', labelFa: 'استراتژی و ریسک' },
    { id: 'ai_engine', label: 'AI & REGIME', labelFa: 'هوش مصنوعی و رژیم' },
    { id: 'termux_android', label: 'TERMUX / ANDROID', labelFa: 'ترموکس و وابستگی‌ها' },
    { id: 'roadmap', label: '14-PHASE PLAN', labelFa: 'نقشه راه ۱۴ فاز' }
  ];

  return (
    <header className="border-b border-[#2A2D32] bg-[#111318] text-[#E0E2E6] font-mono sticky top-0 z-50">
      {/* Top Telemetry Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#00FF66] rounded-full shadow-[0_0_8px_#00FF66] animate-pulse"></div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tighter uppercase">
              AI.TRADER <span className="text-[#00FF66] font-normal">v1.0.0-BETA</span>
            </h1>
            <div className="h-4 w-[1px] bg-[#2A2D32] mx-1"></div>
            <span className="text-[11px] text-[#00FF66] uppercase tracking-wider hidden sm:inline-block">
              Phase 3: Technical Indicators & Market Regime Engine Active
            </span>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-4 text-right">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8E9299] uppercase leading-none">Uptime</span>
              <span className="text-xs leading-none mt-1 font-bold text-[#E0E2E6]">142:24:12</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#8E9299] uppercase leading-none">Server Load</span>
              <span className="text-xs leading-none mt-1 font-bold text-[#00FF66]">12.4%</span>
            </div>
          </div>

          <div className="bg-[#2A2D32] px-2.5 py-1 rounded text-[11px] font-bold border border-[#3E4249] uppercase tracking-wider text-[#E0E2E6]">
            PAPER MODE
          </div>

          <button
            id="btn-approve-phase0"
            onClick={onApprovePhase1}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-all uppercase tracking-wider ${
              isApproved 
                ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.3)]' 
                : 'bg-[#00FF66] hover:bg-[#00e65c] text-black shadow-[0_0_10px_rgba(0,255,102,0.25)]'
            }`}
          >
            {isApproved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                <span>PHASE 0 APPROVED</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>تأیید و صدور مجوز PHASE 1</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Data Grid Sub-bar */}
      <div className="border-t border-[#2A2D32] bg-[#0E1015]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1 py-1.5 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-nav-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-[#1C1E23] text-[#00FF66] border-[#00FF66]/40 shadow-[0_0_8px_rgba(0,255,102,0.1)]'
                      : 'text-[#8E9299] border-transparent hover:text-white hover:bg-[#151619] hover:border-[#2A2D32]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00FF66] text-black font-extrabold animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                  <span className="text-[10px] opacity-60 font-sans">({tab.labelFa})</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
