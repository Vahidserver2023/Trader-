import React, { useState } from 'react';
import { TabType } from './types';
import { Header } from './components/Header';
import { Phase14ProductionView } from './components/Phase14ProductionView';
import { Phase13TermuxPWAView } from './components/Phase13TermuxPWAView';
import { Phase12TelegramView } from './components/Phase12TelegramView';
import { Phase11DashboardView } from './components/Phase11DashboardView';
import { Phase1CoreView } from './components/Phase1CoreView';
import { Phase2DataView } from './components/Phase2DataView';
import { Phase3EngineView } from './components/Phase3EngineView';
import { Phase4StrategiesView } from './components/Phase4StrategiesView';
import { Phase5RiskView } from './components/Phase5RiskView';
import { ArchitectureView } from './components/ArchitectureView';
import { DataFlowView } from './components/DataFlowView';
import { FolderStructureView } from './components/FolderStructureView';
import { SchemaView } from './components/SchemaView';
import { StrategyRiskView } from './components/StrategyRiskView';
import { AIEngineView } from './components/AIEngineView';
import { TermuxRoadmapView } from './components/TermuxRoadmapView';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('phase14_production');
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [isPhase1Approved, setIsPhase1Approved] = useState<boolean>(true);
  const [isPhase2Approved, setIsPhase2Approved] = useState<boolean>(true);
  const [isPhase3Approved, setIsPhase3Approved] = useState<boolean>(true);
  const [isPhase4Approved, setIsPhase4Approved] = useState<boolean>(true);
  const [isPhase5Approved, setIsPhase5Approved] = useState<boolean>(true);
  const [isPhase11Approved, setIsPhase11Approved] = useState<boolean>(true);
  const [isPhase12Approved, setIsPhase12Approved] = useState<boolean>(true);
  const [isPhase13Approved, setIsPhase13Approved] = useState<boolean>(true);
  const [isPhase14Approved, setIsPhase14Approved] = useState<boolean>(false);
  const [showApprovalNotice, setShowApprovalNotice] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string>('');

  const handleApprove = () => {
    setIsApproved(true);
    setNoticeMessage('فاز ۰ تأیید شد! فاز ۱ هم‌اکنون فعال و آماده بهره‌برداری است.');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 5000);
  };

  const handleApprovePhase2 = () => {
    setIsPhase1Approved(true);
    setActiveTab('phase2_data');
    setNoticeMessage('فاز ۱ تأیید شد! ورود به فاز ۲ (دریافت داده و وب‌سوکت).');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 5000);
  };

  const handleApprovePhase3 = () => {
    setIsPhase2Approved(true);
    setActiveTab('phase3_engine');
    setNoticeMessage('فاز ۲ با موفقیت تأیید شد! ورود به فاز ۳ (اندیکاتورها و رژیم بازار).');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 6000);
  };

  const handleApprovePhase4 = () => {
    setIsPhase3Approved(true);
    setActiveTab('phase4_strategies');
    setNoticeMessage('فاز ۳ تأیید شد! ورود به فاز ۴ (موتور چند استراتژی الگوریتمی).');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 6000);
  };

  const handleApprovePhase5 = () => {
    setIsPhase4Approved(true);
    setActiveTab('phase5_risk');
    setNoticeMessage('فاز ۴ تأیید شد! ورود به فاز ۵ (موتور مدیریت ریسک و پوزیشن).');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 6000);
  };

  const handleApprovePhase6 = () => {
    setIsPhase5Approved(true);
    setNoticeMessage('فاز ۵ با موفقیت کامل تأیید شد! تمامی ۱۴ تست ریسک پاس شدند. آماده برای فاز ۶: موتور اجرای سفارشات و اتصال صرافی (Order Execution & Exchange Layer).');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 7000);
  };

  const handleApprovePhase12 = () => {
    setIsPhase11Approved(true);
    setNoticeMessage('فاز ۱۱ با موفقیت کامل تأیید شد! داشبورد زنده وب، وب‌سوکت و کلید اضطراری راستی‌آزمایی شدند. آماده برای فاز ۱۲: بات تلگرام (Telegram Alert & Command Bot).');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 8000);
  };

  const handleApprovePhase13 = () => {
    setIsPhase12Approved(true);
    setActiveTab('phase13_termux');
    setNoticeMessage('فاز ۱۲ با موفقیت کامل تأیید شد! کنسول تلگرام، دستورات، احراز هویت ۲ مرحله‌ای (2FA) و هشدارهای آنی راستی‌آزمایی شدند. ورود به فاز ۱۳ (ترموکس و PWA).');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 8000);
  };

  const handleApprovePhase14 = () => {
    setIsPhase13Approved(true);
    setActiveTab('phase14_production');
    setNoticeMessage('فاز ۱۳ با موفقیت کامل تأیید شد! اسکریپت‌های نصب تک‌دستوری ترموکس، دیمن پس‌زمینه و بسته PWA راستی‌آزمایی شدند. ورود به فاز ۱۴ (امن‌سازی پروداکشن، کلود و بازیابی از بحران).');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 8000);
  };

  const handleApproveFinalCompletion = () => {
    setIsPhase14Approved(true);
    setNoticeMessage('🎉 تبریک! تمامی ۱۴ فاز سامانه Crypto AI Trader با موفقیت کامل پیاده‌سازی و کنترل نهایی شدند. سیستم برای فعالیت تجاری زنده و بدون وقفه آماده است.');
    setShowApprovalNotice(true);
    setTimeout(() => setShowApprovalNotice(false), 12000);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#E0E2E6] font-mono selection:bg-[#00FF66] selection:text-black flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onApprovePhase1={handleApprove}
        isApproved={isApproved}
      />

      {/* Live Technical Metrics Quick Grid */}
      <div className="border-b border-[#2A2D32] bg-[#0E1015]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#151619] p-3 border border-[#2A2D32] rounded">
              <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">TOTAL EQUITY (USDT)</div>
              <div className="text-xl font-bold mt-1 text-[#E0E2E6] font-mono">12,450.00</div>
              <div className="text-[10px] text-[#00FF66] mt-0.5">+4.2% Today (Virtual)</div>
            </div>

            <div className="bg-[#151619] p-3 border border-[#2A2D32] rounded">
              <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">WIN RATE</div>
              <div className="text-xl font-bold mt-1 text-[#E0E2E6] font-mono">68.4%</div>
              <div className="text-[10px] text-[#8E9299] mt-0.5">Last 50 Paper Trades</div>
            </div>

            <div className="bg-[#151619] p-3 border border-[#2A2D32] rounded">
              <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">ACTIVE POSITIONS</div>
              <div className="text-xl font-bold mt-1 text-[#00FF66] font-mono">03</div>
              <div className="text-[10px] text-[#8E9299] mt-0.5">2 Long / 1 Short</div>
            </div>

            <div className="bg-[#151619] p-3 border border-[#2A2D32] rounded">
              <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-bold">MARKET REGIME</div>
              <div className="text-xl font-bold mt-1 text-[#F27D26] font-mono">STRONG_BULL</div>
              <div className="text-[10px] text-[#8E9299] mt-0.5">AI Confidence: 89%</div>
            </div>
          </div>
        </div>
      </div>

      {showApprovalNotice && (
        <div className="bg-[#00FF66]/10 border-b border-[#00FF66]/30 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-[#00FF66] font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
              <span>{noticeMessage || 'عملیات با موفقیت تأیید شد.'}</span>
            </div>
            <button
              onClick={() => setShowApprovalNotice(false)}
              className="text-[#00FF66] hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === 'phase14_production' && (
          <Phase14ProductionView
            onApproveCompletion={handleApproveFinalCompletion}
            isAllCompleted={isPhase14Approved}
          />
        )}
        {activeTab === 'phase13_termux' && (
          <Phase13TermuxPWAView
            onApprovePhase14={handleApprovePhase14}
            isApproved={isPhase13Approved}
          />
        )}
        {activeTab === 'phase12_telegram' && (
          <Phase12TelegramView
            onApprovePhase13={handleApprovePhase13}
            isApproved={isPhase12Approved}
          />
        )}
        {activeTab === 'phase11_dashboard' && (
          <Phase11DashboardView
            onApprovePhase12={handleApprovePhase12}
            isApproved={isPhase11Approved}
          />
        )}
        {activeTab === 'phase5_risk' && (
          <Phase5RiskView
            onApprovePhase={handleApprovePhase6}
            isApproved={isPhase5Approved}
          />
        )}
        {activeTab === 'phase4_strategies' && (
          <Phase4StrategiesView
            onApprovePhase={handleApprovePhase5}
            isApproved={isPhase4Approved}
          />
        )}
        {activeTab === 'phase3_engine' && (
          <Phase3EngineView
            onApprovePhase4={handleApprovePhase4}
            isPhase3Approved={isPhase3Approved}
          />
        )}
        {activeTab === 'phase2_data' && (
          <Phase2DataView
            onApprovePhase3={handleApprovePhase3}
            isPhase2Approved={isPhase2Approved}
          />
        )}
        {activeTab === 'phase1_core' && (
          <Phase1CoreView
            onApprovePhase2={handleApprovePhase2}
            isPhase1Approved={isPhase1Approved}
          />
        )}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'dataflow' && <DataFlowView />}
        {activeTab === 'folders' && <FolderStructureView />}
        {activeTab === 'database' && <SchemaView />}
        {activeTab === 'strategy_risk' && <StrategyRiskView />}
        {activeTab === 'ai_engine' && <AIEngineView />}
        {activeTab === 'termux_android' && (
          <TermuxRoadmapView onApprovePhase1={handleApprove} isApproved={isApproved} />
        )}
        {activeTab === 'roadmap' && (
          <TermuxRoadmapView onApprovePhase1={handleApprove} isApproved={isApproved} />
        )}
      </main>

      {/* Terminal Telemetry Status Bar Footer */}
      <footer className="h-9 bg-[#111318] border-t border-[#2A2D32] px-4 sm:px-6 flex items-center justify-between text-[11px] text-[#8E9299] font-mono mt-auto">
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none py-1">
          <span className="text-[#555960]">ENV: <strong className="text-[#E0E2E6]">TERMUX v0.118</strong></span>
          <span className="text-[#555960]">PYTHON: <strong className="text-[#E0E2E6]">3.11.4</strong></span>
          <span className="text-[#555960]">CCXT: <strong className="text-[#E0E2E6]">4.2.0</strong></span>
          <span className="text-[#555960]">EXCHANGE: <strong className="text-[#00FF66]">BINANCE / BYBIT (READY)</strong></span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[#00FF66] flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]"></span>
            <span>WEBSOCKETS CONNECTED</span>
          </span>
          <span className="text-[#555960] hidden md:inline-block">DEFAULT: PAPER</span>
        </div>
      </footer>
    </div>
  );
}
