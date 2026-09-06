import React, { useState } from 'react';
import { Database, Code } from 'lucide-react';
import { DATABASE_TABLES } from '../data/phase0Data';

export const SchemaView: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('signals');
  const [viewSql, setViewSql] = useState<boolean>(false);

  const activeTableData = DATABASE_TABLES.find(t => t.name === selectedTable) || DATABASE_TABLES[0];

  return (
    <div className="space-y-6 font-mono">
      {/* Header card */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs tracking-widest uppercase">
            <Database className="w-4 h-4" />
            <span>Database Architecture & Schema (طرح دیتابیس ۱۴ جدول)</span>
          </div>
          <h2 className="text-lg font-bold text-[#E0E2E6] mt-1 tracking-tight">
            SQLITE (TERMUX) ↔ POSTGRESQL (CLOUD) DUAL-TARGET ORM
          </h2>
          <p className="text-xs text-[#8E9299] mt-1 font-sans">
            طراحی شده با SQLAlchemy 2.0 ORM؛ کاملاً یکسان برای SQLite در گوشی و PostgreSQL روی سرور با حفظ روابط کلید خارجی و ایندکس‌های زمانی.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-sql-mode"
            onClick={() => setViewSql(!viewSql)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border uppercase tracking-wider transition-all ${
              viewSql
                ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                : 'bg-[#1C1E23] text-[#E0E2E6] border-[#2A2D32] hover:border-[#3E4249]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{viewSql ? 'SHOW DATA GRID' : 'SHOW SQL DDL'}</span>
          </button>
        </div>
      </div>

      {/* Tables Quick Selector Tabs */}
      <div className="p-3 rounded-lg bg-[#111318] border border-[#2A2D32] flex flex-wrap gap-1.5">
        {DATABASE_TABLES.map((tbl) => {
          const isSelected = tbl.name === selectedTable;
          return (
            <button
              key={tbl.name}
              id={`btn-table-${tbl.name}`}
              onClick={() => setSelectedTable(tbl.name)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all border ${
                isSelected
                  ? 'bg-[#1C1E23] text-[#00FF66] border-[#00FF66]/50 shadow-[0_0_8px_rgba(0,255,102,0.15)]'
                  : 'bg-[#151619] text-[#8E9299] border-[#2A2D32] hover:text-[#E0E2E6] hover:border-[#3E4249]'
              }`}
            >
              <span>{tbl.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Table Grid / Schema Details */}
      <div className="p-5 rounded-lg bg-[#151619] border border-[#2A2D32] space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2D32] pb-3 bg-[#111318] -mx-5 -mt-5 p-4 rounded-t-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF66] font-bold uppercase">TABLE:</span>
              <h3 className="text-sm font-bold text-[#E0E2E6] font-mono">
                {activeTableData.name}
              </h3>
            </div>
            <p className="text-xs text-[#8E9299] mt-0.5 font-sans">
              {activeTableData.description}
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono rounded bg-[#2A2D32] text-[#E0E2E6] border border-[#3E4249]">
            {activeTableData.columns.length} COLUMNS
          </span>
        </div>

        {viewSql ? (
          <div className="bg-[#0A0B0E] p-4 rounded border border-[#2A2D32] overflow-x-auto text-xs font-mono text-[#00FF66]">
            <pre className="leading-relaxed">
{`-- SQLAlchemy Model Definition for ${activeTableData.name}
CREATE TABLE IF NOT EXISTS ${activeTableData.name} (
${activeTableData.columns.map(c => `    ${c.name.padEnd(20)} ${c.type.padEnd(14)} ${c.constraints || ''}`).join(',\n')}
);
${activeTableData.indexes.map(idx => `CREATE INDEX IF NOT EXISTS ${idx} ON ${activeTableData.name}(...);`).join('\n')}`}
            </pre>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[#2A2D32]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2A2D32] bg-[#111318] text-[#8E9299] uppercase text-[10px] tracking-wider">
                  <th className="p-3 font-normal">Column Name</th>
                  <th className="p-3 font-normal">Data Type</th>
                  <th className="p-3 font-normal text-center">Constraints</th>
                  <th className="p-3 font-normal">Description / Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D32] bg-[#0A0B0E]">
                {activeTableData.columns.map((col, idx) => (
                  <tr key={idx} className="hover:bg-[#151619] transition-colors">
                    <td className="p-3 font-bold text-[#E0E2E6] font-mono">
                      {col.name}
                    </td>
                    <td className="p-3 font-mono text-[#8E9299]">
                      {col.type}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1C1E23] text-[#00FF66] border border-[#2A2D32]">
                        {col.constraints || 'NONE'}
                      </span>
                    </td>
                    <td className="p-3 text-[#8E9299] font-sans text-xs">
                      {col.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
