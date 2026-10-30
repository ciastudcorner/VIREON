import React, { useState } from 'react';
import { AuditRecord } from '../types/claim';
import {
  Download,
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import { exportAuditLogsJSON, clearAuditLogs } from '../services/auditService';

interface AuditLogViewProps {
  logs: AuditRecord[];
  onRefreshLogs: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onRefreshLogs }) => {
  const [filterDecision, setFilterDecision] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterDecision !== 'All' && log.decision !== filterDecision) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        log.claim_a_id.toLowerCase().includes(q) ||
        log.claim_b_id.toLowerCase().includes(q) ||
        log.reviewer_name.toLowerCase().includes(q) ||
        log.reviewer_note.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleClear = () => {
    if (window.confirm('Yakin ingin mereset seluruh catatan Log Audit?')) {
      clearAuditLogs();
      onRefreshLogs();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[#101731] tracking-tight">Log Audit</h2>
            <span className="text-xs bg-[#297fbd]/10 text-[#297fbd] border border-[#297fbd]/25 px-3 py-1 rounded-full font-bold">
              {filteredLogs.length} Catatan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekam keputusan verifikasi klaim.
          </p>
        </div>

        {/* Export & Reset Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportAuditLogsJSON}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#297fbd] to-[#52b754] text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/20 hover:brightness-105 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>

          <button
            onClick={handleClear}
            className="apple-glass-pill flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 apple-glass-card p-4 rounded-3xl border border-slate-200/80 shadow-sm backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari ID Klaim, Verifikator, atau Catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-full text-[#101731] focus:border-[#297fbd] focus:outline-hidden placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-[#297fbd]" />
            <span>Filter Status:</span>
          </div>
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-full px-3.5 py-2 text-[#101731] focus:border-[#297fbd] focus:outline-hidden"
          >
            <option value="All">Semua Keputusan</option>
            <option value="Bersih / Tanpa Anomali">Bersih / Tanpa Anomali</option>
            <option value="Perlu Verifikasi Lanjutan">Perlu Verifikasi Lanjutan</option>
            <option value="Eskalasi Investigasi">Eskalasi Investigasi</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm apple-glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5">Waktu Audit</th>
                <th className="py-3.5 px-5">Pasangan Klaim</th>
                <th className="py-3.5 px-3">Jalur Deteksi</th>
                <th className="py-3.5 px-3 text-center">Skor Risiko</th>
                <th className="py-3.5 px-5">Keputusan Verifikator</th>
                <th className="py-3.5 px-5">Verifikator &amp; Catatan Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    Belum ada catatan log audit yang tersimpan. Lakukan verifikasi kasus pada antrean verifikasi untuk mencatat keputusan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isClear = log.decision === 'Bersih / Tanpa Anomali';
                  const isEscalate = log.decision === 'Eskalasi Investigasi';
                  const isReview = log.decision === 'Perlu Verifikasi Lanjutan';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      {/* Timestamp */}
                      <td className="py-4 px-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#297fbd]" />
                          <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                        </div>
                      </td>

                      {/* Claim Pair */}
                      <td className="py-4 px-5">
                        <div className="font-mono font-bold text-[#101731] text-xs">
                          <span className="text-[#297fbd]">{log.claim_a_id}</span>
                          <span className="text-slate-400 mx-1.5">&harr;</span>
                          <span className="text-[#13712c]">{log.claim_b_id}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {log.pair_id}
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-4 px-3">
                        {log.detection_route === 'cloning' ? (
                          <span className="font-semibold text-[#297fbd] uppercase font-mono text-[10px] bg-[#297fbd]/10 border border-[#297fbd]/25 px-2.5 py-0.5 rounded-full">
                            Cloning
                          </span>
                        ) : log.detection_route === 'repeat_billing' ? (
                          <span className="font-semibold text-[#13712c] uppercase font-mono text-[10px] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            Repeat Billing
                          </span>
                        ) : log.detection_route === 'dual' ? (
                          <span className="font-semibold text-amber-700 uppercase font-mono text-[10px] bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            Dual
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-600 uppercase font-mono text-[10px] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                            {log.detection_route}
                          </span>
                        )}
                      </td>

                      {/* Final Risk Score */}
                      <td className="py-4 px-3 text-center">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          {log.final_risk_score.toFixed(2)}
                        </span>
                      </td>

                      {/* Decision Badge */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            isClear
                              ? 'bg-emerald-50 text-[#13712c] border-emerald-200'
                              : isEscalate
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isClear && <CheckCircle className="w-3.5 h-3.5 text-[#52b754]" />}
                          {isEscalate && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
                          {isReview && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          <span>{log.decision}</span>
                        </span>
                      </td>

                      {/* Reviewer Note & Name */}
                      <td className="py-4 px-5 max-w-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-[#101731] mb-1">
                          <User className="w-3.5 h-3.5 text-[#297fbd]" />
                          <span>{log.reviewer_name}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed italic text-[11px]">
                          &ldquo;{log.reviewer_note}&rdquo;
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
