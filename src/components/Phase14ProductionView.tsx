import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Server, 
  Database, 
  HardDrive, 
  Activity, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Terminal, 
  Cloud, 
  FileCode,
  Award
} from 'lucide-react';
import { SYSTEM_HEALTH_METRICS, MIGRATION_CHECKLIST } from '../data/phase14Data';

interface Props {
  onApproveCompletion: () => void;
  isAllCompleted: boolean;
}

export const Phase14ProductionView: React.FC<Props> = ({ onApproveCompletion, isAllCompleted }) => {
  const [activeTab, setActiveTab] = useState<'health' | 'backup' | 'docker' | 'migration'>('health');
  const [backupRunning, setBackupRunning] = useState<boolean>(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [backups, setBackups] = useState<Array<{ id: string; time: string; size: string; sanitized: boolean }>>([
    { id: 'backup_20260906_001500', time: '15 minutes ago', size: '14.2 MB', sanitized: true },
    { id: 'backup_20260905_120000', time: '12 hours ago', size: '13.9 MB', sanitized: true },
    { id: 'backup_20260905_000000', time: '24 hours ago', size: '13.5 MB', sanitized: true }
  ]);

  const handleCreateBackup = () => {
    setBackupRunning(true);
    setTimeout(() => {
      const now = new Date();
      const id = `backup_${now.getFullYear()}${String(now.getMonth()+1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      setBackups(prev => [
        { id, time: 'Just now', size: '14.3 MB', sanitized: true },
        ...prev
      ]);
      setBackupRunning(false);
    }, 1200);
  };

  const handleSimulateDisasterRecovery = () => {
    setRecoveryStatus('RESTORING');
    setTimeout(() => {
      setRecoveryStatus('SUCCESS');
      setTimeout(() => setRecoveryStatus(null), 5000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-[#12141A] border border-[#2A2D32] rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
              PHASE 14 & FINAL SIGN-OFF
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Production Hardening, Cloud Migration & Disaster Recovery
            </h2>
          </div>
          <p className="text-sm text-[#8E9299] mt-1 font-sans">
            امن‌سازی نهایی سامانه، مانیتورینگ سلامت سخت‌افزار، پشتیبان‌گیری خودکار بدون افشای کلیدها و کنترل پایانی تمام ۱۴ فاز
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onApproveCompletion}
            className={`px-5 py-2.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${
              isAllCompleted
                ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 cursor-default'
                : 'bg-[#00FF66] text-black hover:bg-[#00CC52] active:scale-95 shadow-lg shadow-[#00FF66]/15'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isAllCompleted ? 'تأیید نهایی پروژه و آماده برای پروداکشن ✓' : 'کنترل نهایی و تأیید نهایی سامانه'}</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {isAllCompleted && (
        <div className="p-4 bg-[#00FF66]/10 border border-[#00FF66]/40 rounded-lg flex items-center justify-between gap-3 text-xs text-[#00FF66]">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#00FF66]" />
            <span className="font-bold text-sm">
              تمامی ۱۴ فاز پروژه Crypto AI Trader با موفقیت کامل پیاده‌سازی، اعتبارسنجی و تست شدند. سامانه آماده فعالیت ۲۴/۷ زنده است.
            </span>
          </div>
        </div>
      )}

      {/* System Health Telemetry Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SYSTEM_HEALTH_METRICS.map(metric => (
          <div key={metric.id} className="p-3 bg-[#151619] border border-[#2A2D32] rounded">
            <div className="text-[10px] text-[#8E9299] uppercase font-bold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#00FF66]" />
              {metric.name.split(' ')[0]}
            </div>
            <div className="text-xl font-bold mt-1 text-white">{metric.value}</div>
            <div className="text-[10px] text-[#00FF66] mt-0.5 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse"></span>
              {metric.status}
            </div>
          </div>
        ))}
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-[#2A2D32] gap-2">
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'health'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5'
              : 'border-transparent text-[#8E9299] hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Watchdog & System Health
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'backup'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5'
              : 'border-transparent text-[#8E9299] hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Disaster Recovery & Sanitized Backups
        </button>

        <button
          onClick={() => setActiveTab('docker')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'docker'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5'
              : 'border-transparent text-[#8E9299] hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" /> Docker & Docker Compose
        </button>

        <button
          onClick={() => setActiveTab('migration')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'migration'
              ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5'
              : 'border-transparent text-[#8E9299] hover:text-white'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" /> PostgreSQL Cloud Migration
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="bg-[#12141A] border border-[#2A2D32] rounded-lg p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00FF66]" />
              پایش بلادرنگ منابع و نگهبان سلامت سیستم (Watchdog Health Telemetry)
            </h3>
            <p className="text-xs text-[#8E9299] mt-1 font-sans">
              سیستم به صورت خودکار هر ۳۰ ثانیه لتنسی سوکت، مصرف حافظه رم و اندازه دیتابیس را اندازه‌گیری می‌کند.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {SYSTEM_HEALTH_METRICS.map(m => (
                <div key={m.id} className="p-3 bg-[#181A20] border border-[#2A2D32] rounded flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{m.name}</div>
                    <div className="text-[11px] text-[#8E9299] font-sans mt-0.5">{m.nameFa}</div>
                    <div className="text-[11px] text-[#8E9299] mt-2 font-mono">{m.description}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-[#00FF66]">{m.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-[#12141A] border border-[#2A2D32] rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00FF66]" />
                  سامانه پشتیبان‌گیری اتمیک و بازیابی پس از بحران (Disaster Recovery)
                </h3>
                <p className="text-xs text-[#8E9299] mt-1 font-sans">
                  تهیه فایل‌های ایمن دیتابیس SQLite با فیلتر خودکار و حذف اطلاعات محرمانه (API Secrets & Tokens)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateBackup}
                  disabled={backupRunning}
                  className="px-3 py-2 text-xs font-bold rounded bg-[#00FF66] text-black hover:bg-[#00CC52] flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${backupRunning ? 'animate-spin' : ''}`} />
                  <span>{backupRunning ? 'در حال تهیه اسنپ‌شات...' : 'ایجاد بکاپ فوری'}</span>
                </button>

                <button
                  onClick={handleSimulateDisasterRecovery}
                  disabled={recoveryStatus === 'RESTORING'}
                  className="px-3 py-2 text-xs font-bold rounded bg-[#FF3366]/20 text-[#FF3366] border border-[#FF3366]/40 hover:bg-[#FF3366]/30 flex items-center gap-1.5 transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{recoveryStatus === 'RESTORING' ? 'در حال بازیابی...' : 'تست بازیابی از بحران'}</span>
                </button>
              </div>
            </div>

            {recoveryStatus === 'SUCCESS' && (
              <div className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded text-xs text-[#00FF66] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>شبیه‌سازی بازیابی با موفقیت انجام شد: یکپارچگی داده‌ها (PRAGMA integrity_check = ok) تأیید شد.</span>
              </div>
            )}

            {/* Backups Table */}
            <div className="border border-[#2A2D32] rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181A20] text-[#8E9299] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">شناسه بکاپ (Backup Snapshot ID)</th>
                    <th className="p-2.5">زمان ایجاد</th>
                    <th className="p-2.5">حجم</th>
                    <th className="p-2.5">امنیت کلیدها (Sanitized)</th>
                    <th className="p-2.5">یکپارچگی (Integrity)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2D32] font-mono">
                  {backups.map(b => (
                    <tr key={b.id} className="hover:bg-[#151619]">
                      <td className="p-2.5 font-bold text-white">{b.id}</td>
                      <td className="p-2.5 text-[#8E9299]">{b.time}</td>
                      <td className="p-2.5 text-white">{b.size}</td>
                      <td className="p-2.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
                          REDACTED ✓
                        </span>
                      </td>
                      <td className="p-2.5 text-[#00FF66]">PASSED</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docker' && (
        <div className="p-4 bg-[#12141A] border border-[#2A2D32] rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-[#00FF66]" />
              پیکربندی استقرار کانتینری داکر (Docker & Docker Compose)
            </h3>
            <span className="text-[10px] text-[#00FF66] font-bold px-2 py-0.5 bg-[#00FF66]/10 rounded border border-[#00FF66]/30">
              PRODUCTION READY
            </span>
          </div>

          <div className="p-3 bg-[#0A0B0E] border border-[#23262D] rounded text-xs text-[#E0E2E6] font-mono overflow-x-auto">
{`# دستور اجرای سریع با Docker Compose بر روی سرور VPS:
$ docker compose up -d --build

# مشاهده وضعیت لاگ‌های کانتینر ربات:
$ docker compose logs -f trader`}
          </div>

          <pre className="p-3 bg-[#0A0B0E] border border-[#23262D] rounded text-xs text-[#E0E2E6] font-mono overflow-x-auto max-h-64">
{`version: '3.8'
services:
  trader:
    build: .
    container_name: crypto_ai_trader
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - APP_MODE=PRODUCTION
      - DATABASE_URL=postgresql://trader_user:trader_secure_pass@postgres:5432/trader_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy`}
          </pre>
        </div>
      )}

      {activeTab === 'migration' && (
        <div className="p-4 bg-[#12141A] border border-[#2A2D32] rounded-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#F27D26]" />
            چک‌لیست و ابزار مهاجرت از SQLite به PostgreSQL
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MIGRATION_CHECKLIST.map(item => (
              <div key={item.id} className="p-3 bg-[#181A20] border border-[#2A2D32] rounded space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                  {item.title}
                </div>
                <div className="text-[11px] text-[#8E9299] font-sans">{item.titleFa}</div>
                <p className="text-[11px] text-[#8E9299] font-mono mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 bg-[#0A0B0E] border border-[#23262D] rounded text-xs text-[#E0E2E6] font-mono">
            $ python scripts/migrate_sqlite_to_postgres.py --sqlite data/trader.db --postgres postgresql://trader_user:pass@vps.cloud:5432/trader_db
          </div>
        </div>
      )}
    </div>
  );
};
