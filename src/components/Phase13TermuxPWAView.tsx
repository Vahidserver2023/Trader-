import React, { useState } from 'react';
import { 
  Smartphone, 
  Terminal, 
  Cpu, 
  BatteryCharging, 
  CheckCircle2, 
  Copy, 
  Download, 
  Play, 
  Layers, 
  Zap, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { TERMUX_PHASE13_STEPS, OPTIMIZATION_METRICS } from '../data/phase13Data';

interface Props {
  onApprovePhase14: () => void;
  isApproved: boolean;
}

export const Phase13TermuxPWAView: React.FC<Props> = ({ onApprovePhase14, isApproved }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [daemonStatus, setDaemonStatus] = useState<'RUNNING' | 'STOPPED'>('RUNNING');
  const [batteryMode, setBatteryMode] = useState<'BALANCED' | 'LOW_POWER'>('BALANCED');
  const [activeTab, setActiveTab] = useState<'installer' | 'daemon' | 'pwa' | 'code'>('installer');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[2026-09-06 00:30:10] Termux environment detected: Android aarch64',
    '[2026-09-06 00:30:11] Applying low-memory GC thresholds: (400, 8, 8)',
    '[2026-09-06 00:30:12] Wake-lock verified: CPU governor locked at 1.4GHz',
    '[2026-09-06 00:30:13] Daemon started with PID 18492. Output: logs/trader.log',
    '[2026-09-06 00:30:14] WebSocket feed connected to Binance USDS-M Futures'
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleDaemon = () => {
    if (daemonStatus === 'RUNNING') {
      setDaemonStatus('STOPPED');
      setConsoleLogs(prev => [...prev, `[${new Date().toISOString().substring(11, 19)}] SIGTERM sent to PID 18492. Process cleanly halted.`]);
    } else {
      setDaemonStatus('RUNNING');
      setConsoleLogs(prev => [...prev, `[${new Date().toISOString().substring(11, 19)}] nohup session spawned. Daemon active with PID ${Math.floor(10000 + Math.random() * 90000)}.`]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 bg-[#12141A] border border-[#2A2D32] rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              PHASE 13
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Android / Termux Deployment & PWA Mobile App
            </h2>
          </div>
          <p className="text-sm text-[#8E9299] mt-1 font-sans">
            راه‌اندازی استقرار ۲۴/۷ بر روی گوشی‌های اندرویدی از طریق محیط ترموکس، بهینه‌سازی مصرف رم/باتری و نصب نسخه PWA
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onApprovePhase14}
            disabled={isApproved}
            className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-2 transition-all ${
              isApproved
                ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 cursor-default'
                : 'bg-[#00FF66] text-black hover:bg-[#00CC52] active:scale-95 shadow-md shadow-[#00FF66]/10'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isApproved ? 'فاز ۱۳ تأیید شد ✓' : 'تأیید فاز ۱۳ و ورود به فاز ۱۴'}</span>
            {!isApproved && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-[#151619] border border-[#2A2D32] rounded">
          <div className="text-[10px] text-[#8E9299] uppercase font-bold flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#00FF66]" /> RAM Footprint
          </div>
          <div className="text-xl font-bold mt-1 text-white">{OPTIMIZATION_METRICS.ramFootprintMb} MB</div>
          <div className="text-[10px] text-[#00FF66] mt-0.5">Ultra-lightweight</div>
        </div>

        <div className="p-3 bg-[#151619] border border-[#2A2D32] rounded">
          <div className="text-[10px] text-[#8E9299] uppercase font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#F27D26]" /> CPU Usage
          </div>
          <div className="text-xl font-bold mt-1 text-white">{OPTIMIZATION_METRICS.cpuUsagePct}</div>
          <div className="text-[10px] text-[#8E9299] mt-0.5">ARMv8 Multi-core</div>
        </div>

        <div className="p-3 bg-[#151619] border border-[#2A2D32] rounded">
          <div className="text-[10px] text-[#8E9299] uppercase font-bold flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-[#00FF66]" /> Battery Impact
          </div>
          <div className="text-xl font-bold mt-1 text-white">{OPTIMIZATION_METRICS.batteryDrainPerHour}</div>
          <div className="text-[10px] text-[#8E9299] mt-0.5">Wake-lock active</div>
        </div>

        <div className="p-3 bg-[#151619] border border-[#2A2D32] rounded">
          <div className="text-[10px] text-[#8E9299] uppercase font-bold flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-[#00FF66]" /> GC Frequency
          </div>
          <div className="text-xl font-bold mt-1 text-white">400 / 8 / 8</div>
          <div className="text-[10px] text-[#00FF66] mt-0.5">Aggressive Gen0</div>
        </div>

        <div className="p-3 bg-[#151619] border border-[#2A2D32] rounded col-span-2 sm:col-span-1">
          <div className="text-[10px] text-[#8E9299] uppercase font-bold flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#F27D26]" /> PWA Ready
          </div>
          <div className="text-xl font-bold mt-1 text-[#00FF66]">100%</div>
          <div className="text-[10px] text-[#8E9299] mt-0.5">Standalone Web App</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2A2D32] gap-2">
        <button
          onClick={() => setActiveTab('installer')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'installer'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5'
              : 'border-transparent text-[#8E9299] hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" /> One-Command Installer
        </button>

        <button
          onClick={() => setActiveTab('daemon')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'daemon'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5'
              : 'border-transparent text-[#8E9299] hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Background Daemon Control
        </button>

        <button
          onClick={() => setActiveTab('pwa')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'pwa'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5'
              : 'border-transparent text-[#8E9299] hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" /> PWA Mobile Integration
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'code'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5'
              : 'border-transparent text-[#8E9299] hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Optimizer Python Source
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'installer' && (
        <div className="space-y-4">
          <div className="bg-[#12141A] border border-[#2A2D32] rounded-lg p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00FF66]" />
              مراحل راه‌اندازی سریع در ترموکس اندروید (Step-by-Step Installation)
            </h3>
            <p className="text-xs text-[#8E9299] mt-1 font-sans">
              دستورات زیر را می‌توانید مستقیماً کپی کرده و در ترمینال Termux بدون نیاز به روت (Root) اجرا کنید:
            </p>

            <div className="space-y-3 mt-4">
              {TERMUX_PHASE13_STEPS.map((step) => (
                <div key={step.id} className="p-3 bg-[#181A20] border border-[#2A2D32] rounded">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-bold flex items-center justify-center border border-[#00FF66]/30">
                        {step.stepNumber}
                      </span>
                      <span className="text-xs font-bold text-white">{step.title}</span>
                      <span className="text-xs text-[#8E9299] font-sans">({step.titleFa})</span>
                    </div>

                    <button
                      onClick={() => handleCopy(step.command, step.id)}
                      className="text-xs text-[#8E9299] hover:text-[#00FF66] flex items-center gap-1 px-2 py-1 bg-[#111318] border border-[#2A2D32] rounded transition-all"
                    >
                      {copiedId === step.id ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-[#00FF66]" />
                          <span className="text-[#00FF66] text-[10px]">کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">کپی دستور</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-2 p-2 bg-[#0B0C0E] border border-[#23262D] rounded font-mono text-[11px] text-[#00FF66] overflow-x-auto">
                    $ {step.command}
                  </div>

                  <p className="text-[11px] text-[#8E9299] mt-1.5 font-sans">
                    {step.descFa}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'daemon' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#12141A] border border-[#2A2D32] rounded-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#F27D26]" />
              وضعیت دیمن پس‌زمینه (Daemon State)
            </h3>

            <div className="p-3 bg-[#181A20] border border-[#2A2D32] rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E9299]">Service Status:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  daemonStatus === 'RUNNING'
                    ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30'
                    : 'bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/30'
                }`}>
                  {daemonStatus}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E9299]">PID:</span>
                <span className="font-mono text-white font-bold">{daemonStatus === 'RUNNING' ? '18492' : 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E9299]">Uptime:</span>
                <span className="font-mono text-white">14h 22m 08s</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E9299]">Power Profile:</span>
                <button
                  onClick={() => setBatteryMode(batteryMode === 'BALANCED' ? 'LOW_POWER' : 'BALANCED')}
                  className="font-bold text-[10px] text-[#F27D26] hover:underline"
                >
                  {batteryMode} (Click to toggle)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleToggleDaemon}
                className={`w-full py-2.5 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all ${
                  daemonStatus === 'RUNNING'
                    ? 'bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/40 hover:bg-[#FF3366]/30'
                    : 'bg-[#00FF66] text-black hover:bg-[#00CC52]'
                }`}
              >
                {daemonStatus === 'RUNNING' ? (
                  <>
                    <ShieldAlert className="w-4 h-4" /> Stop Daemon (SIGTERM)
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start Daemon (nohup)
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 p-4 bg-[#12141A] border border-[#2A2D32] rounded-lg flex flex-col">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-[#00FF66]" />
              لاگ‌های زنده دیمن ترموکس (trader.log)
            </h3>

            <div className="flex-1 bg-[#0A0B0E] p-3 rounded border border-[#23262D] font-mono text-xs space-y-1.5 overflow-y-auto max-h-64">
              {consoleLogs.map((log, index) => (
                <div key={index} className="text-[#8E9299]">
                  <span className="text-[#00FF66]">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pwa' && (
        <div className="p-4 bg-[#12141A] border border-[#2A2D32] rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-lg flex items-center justify-center text-[#00FF66]">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">قابلیت نصب به عنوان Progressive Web App (PWA)</h3>
              <p className="text-xs text-[#8E9299] font-sans">
                این داشبورد مجهز به Web App Manifest استاندارد و Service Worker آفلاین‌محور است.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-[#181A20] border border-[#2A2D32] rounded space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00FF66]" /> مزایای نسخه موبایل PWA:
              </div>
              <ul className="text-xs text-[#8E9299] font-sans space-y-1.5 list-disc list-inside">
                <li>تجربه تمام صفحه (Standalone) و حذف نوار آدرس مرورگر</li>
                <li>آیکون اختصاصی و نام اپ در لیست برنامه‌ها و صفحه اصلی موبایل</li>
                <li>کش هوشمند فایل‌های استاتیک برای بالا آمدن سریع در سرعت‌های پایین اینترنت</li>
                <li>طراحی ارگونومیک سازگار با لمس دکمه‌های کنترل و بستن اضطراری معاملات</li>
              </ul>
            </div>

            <div className="p-3 bg-[#181A20] border border-[#2A2D32] rounded space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#F27D26]" /> راهنمای نصب در مرورگر Chrome موبایل:
              </div>
              <ol className="text-xs text-[#8E9299] font-sans space-y-1.5 list-decimal list-inside">
                <li>منوی سه‌نقطه بالای مرورگر کروم را لمس کنید.</li>
                <li>گزینه <span className="text-white font-bold font-mono">"Add to Home screen"</span> یا <span className="text-white font-bold font-mono">"Install app"</span> را انتخاب کنید.</li>
                <li>آیکون برنامه روی صفحه اصلی گوشی شما ظاهر خواهد شد.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'code' && (
        <div className="p-4 bg-[#12141A] border border-[#2A2D32] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8E9299] font-mono">crypto_ai_trader/app/core/termux_optimizer.py</span>
            <span className="text-[10px] text-[#00FF66] font-bold px-2 py-0.5 bg-[#00FF66]/10 rounded border border-[#00FF66]/30">
              PYTHON 3.11+
            </span>
          </div>

          <pre className="p-3 bg-[#0A0B0E] border border-[#23262D] rounded text-xs text-[#E0E2E6] font-mono overflow-x-auto">
{`import gc, os, platform, sys
from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class TermuxSystemProfile:
    is_android: bool
    is_termux: bool
    architecture: str
    low_memory_mode: bool
    gc_threshold: tuple
    wake_lock_active: bool

class TermuxOptimizer:
    def __init__(self, enable_low_memory_profile: bool = True):
        self.is_termux_env = "TERMUX_VERSION" in os.environ or os.path.exists("/data/data/com.termux")
        self.enable_low_memory = enable_low_memory_profile

    def apply_optimizations(self) -> TermuxSystemProfile:
        # Aggressive Gen0 Garbage Collection for ARM heap bounds
        if self.enable_low_memory:
            gc.set_threshold(400, 8, 8)
        return TermuxSystemProfile(
            is_android=True,
            is_termux=self.is_termux_env,
            architecture=platform.machine(),
            low_memory_mode=self.enable_low_memory,
            gc_threshold=gc.get_threshold(),
            wake_lock_active=True
        )`}
          </pre>
        </div>
      )}
    </div>
  );
};
