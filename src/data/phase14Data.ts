export interface HealthMetric {
  id: string;
  name: string;
  nameFa: string;
  value: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  description: string;
  descriptionFa: string;
}

export const SYSTEM_HEALTH_METRICS: HealthMetric[] = [
  {
    id: 'cpu',
    name: 'CPU Load (Quad-Core ARM/x86)',
    nameFa: 'میزان بار پردازنده',
    value: '2.4%',
    status: 'OPTIMAL',
    description: 'Nominal CPU load across async event loops and indicator math.',
    descriptionFa: 'میزان مصرف منابع پردازشی در حد ایده‌آل و بهینه.'
  },
  {
    id: 'ram',
    name: 'Virtual Memory (RSS)',
    nameFa: 'حافظه رم اشغال‌شده',
    value: '84.8 MB',
    status: 'OPTIMAL',
    description: 'Aggressive Gen0 GC prevents heap spikes.',
    descriptionFa: 'مدیریت سخت‌گیرانه زباله‌روب و جلوگیری از اشغال بی‌مورد رم.'
  },
  {
    id: 'db_size',
    name: 'SQLite Database Footprint',
    nameFa: 'حجم فایل دیتابیس لوکال',
    value: '14.2 MB',
    status: 'OPTIMAL',
    description: 'WAL mode active, automated hourly checkpoints enabled.',
    descriptionFa: 'فعال بودن مد WAL با سرعت ثبت بالا و بکاپ‌های ساعتی.'
  },
  {
    id: 'ws_latency',
    name: 'WebSocket Ping-Pong Latency',
    nameFa: 'پینگ شبکه و لتنسی صرافی',
    value: '38 ms',
    status: 'OPTIMAL',
    description: 'Direct fiber connection to Binance/Bybit streaming endpoints.',
    descriptionFa: 'پینگ پایین اتصال به سرورهای استریم بلادرنگ صرافی.'
  },
  {
    id: 'uptime',
    name: 'Continuous Service Uptime',
    nameFa: 'زمان کارکرد مستمر سیستم',
    value: '99.99% (18d 04h)',
    status: 'OPTIMAL',
    description: 'Zero crashes, automated watchdog heartbeats intact.',
    descriptionFa: 'کارکرد مداوم بدون توقف یا خطای مسدودکننده.'
  }
];

export const MIGRATION_CHECKLIST = [
  {
    id: 'step_1',
    title: 'Backup & Sanitize Secrets',
    titleFa: 'تهیه نسخه پشتیبان امن و حذف کلیدهای API از دامپ',
    desc: 'DatabaseBackupManager produces a cryptographically sound snapshot with REDACTED API keys.'
  },
  {
    id: 'step_2',
    title: 'Docker Multi-Stage Build',
    titleFa: 'بیلد کانتینر ایزوله داکر با امنیت غیر ریشه (Non-Root User)',
    desc: 'Runs lean python:3.11-slim image with internal healthchecks.'
  },
  {
    id: 'step_3',
    title: 'PostgreSQL Schema Migration',
    titleFa: 'مهاجرت اسکیمای داده به پایگاه داده توزیع‌شده PostgreSQL',
    desc: 'Alembic migration scripts automatically adapt SQLite types to Postgres types.'
  },
  {
    id: 'step_4',
    title: 'High Availability Redis Cache',
    titleFa: 'افزودن کش سریع Redis برای صف پیام‌ها و رویدادها',
    desc: 'Decouples high-frequency market tick bursts from disk storage.'
  }
];
