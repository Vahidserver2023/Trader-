import React, { useState } from 'react';
import { FolderTree, Copy, Check, FileCode, Folder } from 'lucide-react';
import { PROJECT_TREE } from '../data/phase0Data';

export const FolderStructureView: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyTree = () => {
    const textTree = `crypto_ai_trader/
├── app/
│   ├── core/ (config.py, logger.py, exceptions.py)
│   ├── data/ (market_data.py, websocket.py, data_validator.py)
│   ├── indicators/ (technical.py)
│   ├── strategies/ (base.py, trend.py, breakout.py, momentum.py, mean_reversion.py)
│   ├── ai/ (features.py, regime.py, model.py, trainer.py, predictor.py)
│   ├── risk/ (risk_manager.py, position_sizing.py, portfolio_risk.py)
│   ├── execution/ (base_exchange.py, binance.py, bybit.py, order_manager.py)
│   ├── portfolio/ (manager.py)
│   ├── backtest/ (engine.py, metrics.py, walk_forward.py, monte_carlo.py)
│   ├── paper/ (engine.py)
│   ├── database/ (models.py, repository.py)
│   ├── notifications/ (telegram.py)
│   └── api/ (main.py, routes.py)
├── tests/ (test_risk_manager.py, test_strategies.py, test_backtest.py, test_data_validator.py)
├── scripts/ (install_termux.sh, backup.py)
├── main.py
├── requirements.txt
├── .env.example
└── README.md`;
    navigator.clipboard.writeText(textTree);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header card */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs tracking-widest uppercase">
            <FolderTree className="w-4 h-4" />
            <span>Complete Modular Folder Structure (ساختار پوشه‌ها و ماژول‌ها)</span>
          </div>
          <h2 className="text-lg font-bold text-[#E0E2E6] mt-1 tracking-tight">
            DECOUPLED PYTHON CODEBASE TREE
          </h2>
          <p className="text-xs text-[#8E9299] mt-1 font-sans">
            تفکیک کامل مسئولیت‌ها در لایه‌های مجزا، ماژول‌های سبک سازگار با Termux و قابلیت تست مستقل تک‌تک بخش‌ها.
          </p>
        </div>

        <button
          id="btn-copy-tree"
          onClick={copyTree}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded bg-[#1C1E23] hover:bg-[#2A2D32] text-[#00FF66] border border-[#2A2D32] uppercase tracking-wider shrink-0 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#00FF66]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'TREE COPIED' : 'COPY TREE'}</span>
        </button>
      </div>

      {/* Code Tree Container */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32]">
        <div className="flex items-center justify-between border-b border-[#2A2D32] pb-3 mb-4 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <div className="flex items-center gap-2 text-xs text-[#8E9299]">
            <Folder className="w-4 h-4 text-[#00FF66]" />
            <span className="font-bold text-[#E0E2E6]">crypto_ai_trader/</span>
          </div>
          <span className="text-[10px] text-[#8E9299] uppercase tracking-wider font-mono">
            Python 3.11+ • Clean Architecture
          </span>
        </div>

        <div className="bg-[#0A0B0E] p-4 rounded border border-[#2A2D32] overflow-x-auto">
          <div className="space-y-4 text-xs font-mono">
            {PROJECT_TREE.map((node, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-[#00FF66] font-bold">
                  <Folder className="w-4 h-4 text-[#00FF66]" />
                  <span>{node.path}</span>
                  <span className="text-[11px] text-[#8E9299] font-normal font-sans">
                    — {node.purpose}
                  </span>
                </div>

                <div className="mr-6 pr-4 space-y-1 border-r border-[#2A2D32] ml-2 pl-3">
                  {node.files.map((file, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center justify-between text-[#8E9299] hover:text-[#E0E2E6] hover:bg-[#151619] px-2 py-0.5 rounded transition-colors text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-[#8E9299]" />
                        <span className="font-mono text-[#E0E2E6]">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-[#8E9299] font-sans">
                        {file.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
