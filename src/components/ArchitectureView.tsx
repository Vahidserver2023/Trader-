import React from 'react';
import { Layers, Smartphone, Shield, Lock } from 'lucide-react';
import { SYSTEM_MODULES } from '../data/phase0Data';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6 font-mono">
      {/* Intro Hero Box */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs tracking-widest uppercase">
              <Layers className="w-4 h-4" />
              <span>Full System Architecture (معماری ۵ لایه چندتخصصی)</span>
            </div>
            <h2 className="text-lg font-bold text-[#E0E2E6] mt-1 tracking-tight">
              DECOUPLED, MODULAR & ASYNCHRONOUS TRADING CORE
            </h2>
            <p className="text-xs text-[#8E9299] mt-1.5 leading-relaxed max-w-4xl font-sans">
              طراحی شده بر پایه الگوی ۵ لایه ایزوله: کلاینت (اندروید/ترموکس/داشبورد وب)، درگاه ارتباطی (FastAPI/Scheduler)، موتور محاسبات و پوزیشن‌ها، لایه فیلتر هوش مصنوعی و رژیم بازار، و لایه نهایی کنترل ریسک و آداپتورهای معاملاتی.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-[#0A0B0E] px-3 py-2 rounded border border-[#2A2D32] text-[#8E9299] shrink-0">
            <Lock className="w-3.5 h-3.5 text-[#00FF66]" />
            <span className="text-[#E0E2E6] font-bold">ZERO SECRET INVERSION</span>
          </div>
        </div>
      </div>

      {/* Layer Stack Diagram */}
      <div className="space-y-4">
        {SYSTEM_MODULES.map((layer, index) => {
          const layerAccents: Record<string, { badge: string; border: string; glow: string }> = {
            emerald: { badge: 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30', border: 'border-[#2A2D32] hover:border-[#00FF66]/40', glow: 'text-[#00FF66]' },
            blue: { badge: 'bg-[#3E4249] text-[#E0E2E6] border-[#2A2D32]', border: 'border-[#2A2D32] hover:border-[#3E4249]', glow: 'text-[#E0E2E6]' },
            violet: { badge: 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30', border: 'border-[#2A2D32] hover:border-[#00FF66]/40', glow: 'text-[#00FF66]' },
            amber: { badge: 'bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/30', border: 'border-[#2A2D32] hover:border-[#F27D26]/40', glow: 'text-[#F27D26]' },
            rose: { badge: 'bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/30', border: 'border-[#2A2D32] hover:border-[#FF4444]/40', glow: 'text-[#FF4444]' }
          };
          const style = layerAccents[layer.color] || layerAccents.blue;

          return (
            <div
              key={layer.id}
              className={`p-4 rounded-lg border ${style.border} bg-[#151619] transition-all`}
            >
              <div className="flex items-center justify-between border-b border-[#2A2D32] pb-2.5 mb-3 bg-[#111318] -mx-4 -mt-4 p-3 rounded-t-lg">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style.badge} uppercase tracking-wider`}>
                    LAYER {index + 1}
                  </span>
                  <h3 className="text-xs font-bold text-[#E0E2E6] uppercase tracking-wider">
                    {layer.name}
                  </h3>
                  <span className="text-[11px] text-[#8E9299] font-sans">
                    ({layer.nameFa})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {layer.components.map((comp, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-3 rounded bg-[#0A0B0E] border border-[#2A2D32] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-[#E0E2E6]">{comp.name}</span>
                      </div>
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#00FF66] bg-[#111318] rounded border border-[#2A2D32] mb-1.5">
                        {comp.tech}
                      </span>
                      <p className="text-[11px] text-[#8E9299] leading-relaxed font-sans">
                        {comp.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Cutting Architectural Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-lg bg-[#151619] border border-[#2A2D32]">
          <div className="flex items-center gap-2 text-[#00FF66] mb-2">
            <Smartphone className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Termux to Cloud Portability</h4>
          </div>
          <p className="text-xs text-[#8E9299] leading-relaxed font-sans">
            کدها به شکلی ماژولار نوشته می‌شوند که در محیط کم‌مصرف اندروید (Termux) با دیتابیس محلی SQLite اجرا گردند و با تعویض یک متغیر در <code className="text-[#00FF66] font-mono">.env</code> به دیتابیس PostgreSQL روی سرور ابری بدون تغییر منطق معاملات مهاجرت کنند.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#151619] border border-[#2A2D32]">
          <div className="flex items-center gap-2 text-[#F27D26] mb-2">
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">AI Governance & Hard Veto</h4>
          </div>
          <p className="text-xs text-[#8E9299] leading-relaxed font-sans">
            هوش مصنوعی به هیچ عنوان حق ارسال مستقیم سفارش یا تغییر حد ضرر و سقف ریسک را ندارد. نقش AI منحصراً تخمین احتمالات، امتیازدهی آماری و فیلتر کردن سیگنال‌های ضعیف قبل از بررسی توسط مدیر ریسک است.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#151619] border border-[#2A2D32]">
          <div className="flex items-center gap-2 text-[#FF4444] mb-2">
            <Lock className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Zero-Leak Security Paradigm</h4>
          </div>
          <p className="text-xs text-[#8E9299] leading-relaxed font-sans">
            کلیدهای API فقط در <code className="text-[#00FF66] font-mono">.env</code> محلی ذخیره می‌شوند. سیستم لاگر به‌صورت خودکار هرگونه کلید، سکرت یا توکن را ماسک می‌کند تا هرگز در دیتابیس، خطاها، خروجی کنسول یا داشبورد وب منعکس نشوند.
          </p>
        </div>
      </div>
    </div>
  );
};
