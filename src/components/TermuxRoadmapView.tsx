import React, { useState } from 'react';
import { Terminal, Check, Copy, CheckCircle2, Sparkles, Smartphone, Box } from 'lucide-react';
import { TERMUX_COMMANDS, PYTHON_DEPENDENCIES, ROADMAP_PHASES } from '../data/phase0Data';

interface TermuxRoadmapViewProps {
  onApprovePhase1: () => void;
  isApproved: boolean;
}

export const TermuxRoadmapView: React.FC<TermuxRoadmapViewProps> = ({
  onApprovePhase1,
  isApproved
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const allTermuxScript = TERMUX_COMMANDS.map(c => c.cmd).join('\n');

  return (
    <div className="space-y-6 font-mono">
      {/* Header card */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs tracking-widest uppercase">
            <Smartphone className="w-4 h-4" />
            <span>Android + Termux Environment & Production Roadmap</span>
          </div>
          <h2 className="text-lg font-bold text-[#E0E2E6] mt-1 tracking-tight">
            TERMUX RUN COMMANDS & 14-PHASE PROGRESSION PLAN
          </h2>
          <p className="text-xs text-[#8E9299] mt-1 font-sans">
            دستورات دقیق راه‌اندازی و بیلد محیط محلی اندروید با ترموکس، ماتریس پکیج‌های پایتون سازگار با معماری ARM64 و نقشه راه مرحله‌به‌مرحله با شرط تأیید پیش از ورود به فاز بعدی.
          </p>
        </div>

        <button
          id="btn-copy-all-termux"
          onClick={() => copyToClipboard(allTermuxScript, 'all')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded bg-[#1C1E23] hover:bg-[#2A2D32] text-[#00FF66] border border-[#2A2D32] uppercase tracking-wider shrink-0 transition-all"
        >
          {copiedCmd === 'all' ? <Check className="w-3.5 h-3.5 text-[#00FF66]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCmd === 'all' ? 'SCRIPT COPIED' : 'COPY ALL TERMUX SCRIPT'}</span>
        </button>
      </div>

      {/* Termux Commands Step by Step */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00FF66]" />
            <h3 className="text-sm font-bold text-[#E0E2E6] uppercase tracking-wider">
              Termux Installation & Run Guide (دستورات گام‌به‌گام ترموکس)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#00FF66]">Android 11+ / aarch64</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TERMUX_COMMANDS.map((item, idx) => (
            <div key={idx} className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#E0E2E6] block mb-1 font-sans">
                  {item.step}
                </span>
                <div className="font-mono text-xs text-[#00FF66] bg-[#111318] p-2 rounded border border-[#2A2D32] break-all select-all">
                  {item.cmd}
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => copyToClipboard(item.cmd, `step-${idx}`)}
                  className="flex items-center gap-1 text-[11px] text-[#8E9299] hover:text-[#00FF66] transition-colors"
                >
                  {copiedCmd === `step-${idx}` ? <Check className="w-3 h-3 text-[#00FF66]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === `step-${idx}` ? 'COPIED' : 'COPY COMMAND'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Python Dependencies Matrix */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <Box className="w-4 h-4 text-[#00FF66]" />
          <h3 className="text-sm font-bold text-[#E0E2E6] uppercase tracking-wider">
            Python 3.11+ Dependencies Matrix (کتابخانه‌های پایتون سازگار با ترموکس)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(PYTHON_DEPENDENCIES).map(([category, pkgs]) => (
            <div key={category} className="p-3.5 rounded bg-[#0A0B0E] border border-[#2A2D32]">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#8E9299] block mb-2 border-b border-[#2A2D32] pb-1">
                {category.replace('_', ' ')}
              </span>
              <ul className="space-y-2">
                {pkgs.map((pkg, pIdx) => (
                  <li key={pIdx} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#00FF66]">{pkg.name}</span>
                      <span className="font-mono text-[10px] text-[#8E9299]">{pkg.version}</span>
                    </div>
                    <span className="text-[11px] text-[#8E9299] block mt-0.5 font-sans">{pkg.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 14-Phase Implementation Roadmap */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <div>
            <h3 className="text-sm font-bold text-[#E0E2E6] uppercase tracking-wider">
              Strict 14-Phase Development Lifecycle (نقشه راه مرحله‌به‌مرحله)
            </h3>
            <p className="text-xs text-[#8E9299] mt-0.5 font-sans">
              قانون بخش ۵۴ پرامپت: تا زمانی که فاز فعلی تست و تایید نشده باشد، کدنویسی فاز بعدی آغاز نخواهد شد.
            </p>
          </div>

          <button
            id="btn-approve-phase1-bottom"
            onClick={onApprovePhase1}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded transition-all uppercase tracking-wider ${
              isApproved
                ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                : 'bg-[#00FF66] hover:bg-[#00e65c] text-black shadow-[0_0_10px_rgba(0,255,102,0.25)]'
            }`}
          >
            {isApproved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>PHASE 0 APPROVED • READY FOR PHASE 1</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>تأیید فاز ۰ و صدور دستور ساخت PHASE 1</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {ROADMAP_PHASES.map((p) => {
            const isPhase0 = p.phase === 0;
            return (
              <div
                key={p.phase}
                className={`p-4 rounded border transition-all ${
                  isPhase0
                    ? 'bg-[#00FF66]/5 border-[#00FF66]/40 shadow-[0_0_12px_rgba(0,255,102,0.05)]'
                    : 'bg-[#0A0B0E] border-[#2A2D32]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
                      isPhase0
                        ? isApproved ? 'bg-[#00FF66] text-black' : 'bg-[#F27D26] text-black animate-pulse'
                        : 'bg-[#2A2D32] text-[#8E9299]'
                    }`}>
                      {p.phase}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#E0E2E6] uppercase tracking-wider">{p.title}</h4>
                      <p className="text-xs text-[#8E9299] font-sans">{p.titleFa}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider w-fit ${
                    isPhase0
                      ? isApproved 
                        ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30' 
                        : 'bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30'
                      : 'bg-[#2A2D32] text-[#555960]'
                  }`}>
                    {isPhase0 
                      ? isApproved ? 'APPROVED & READY' : 'AWAITING USER CONFIRMATION'
                      : 'LOCKED (PENDING PHASE ' + (p.phase - 1) + ')'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[#2A2D32] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                      تحویل دادنی‌ها (Deliverables):
                    </span>
                    <ul className="space-y-1 text-[#E0E2E6] font-sans">
                      {p.deliverables.map((del, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-1.5">
                          <span className="text-[#00FF66] font-bold font-mono">•</span>
                          <span>{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                      الزامات تست و راستی‌آزمایی (Test Requirements):
                    </span>
                    <ul className="space-y-1 text-[#8E9299] font-sans">
                      {p.testRequirements.map((req, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1.5">
                          <span className="text-[#E0E2E6] font-bold font-mono">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
