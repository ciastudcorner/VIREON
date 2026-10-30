import React, { useState, useMemo } from 'react';
import {
  HybridRiskAssessment,
  ReviewQueueFilter,
  AuditRecord,
  getPriorityMeta,
} from '../types/claim';
import {
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  FileText,
  Info,
  Radar,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';
import { SpiderwebRadarChart } from './SpiderwebRadarChart';

type SortField = 'none' | 'claim_pair' | 'priority';
type SortOrder = 'asc' | 'desc';

interface ReviewQueueViewProps {
  assessments: HybridRiskAssessment[];
  auditLogs?: AuditRecord[];
  onSelectCase: (assessment: HybridRiskAssessment) => void;
  onNavigateTab?: (tab: 'data-input' | 'dashboard' | 'audit-log') => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  assessments,
  auditLogs = [],
  onSelectCase,
  onNavigateTab,
}) => {
  // Set of pair_ids yang sudah diverifikasi — item ini disembunyikan dari antrean
  const reviewedPairIds = useMemo(
    () => new Set(auditLogs.map((l) => l.pair_id)),
    [auditLogs]
  );

  // Assessments yang belum diverifikasi
  const pendingAssessments = useMemo(
    () => assessments.filter((a) => !reviewedPairIds.has(a.pair_id)),
    [assessments, reviewedPairIds]
  );
  const [riskFilter, setRiskFilter] = useState<'Semua' | 'Tinggi' | 'Sedang' | 'Rendah'>('Semua');
  const [routeFilter, setRouteFilter] = useState<'all' | 'cloning' | 'repeat_billing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Radar chart preview modal state
  const [radarPreviewCase, setRadarPreviewCase] = useState<HybridRiskAssessment | null>(null);

  // Filter pipeline (gunakan pendingAssessments agar yg sudah diverifikasi tidak muncul)
  const filtered = useMemo(() => {
    return pendingAssessments.filter((a) => {
      // Risk category filter
      if (riskFilter !== 'Semua') {
        const meta = getPriorityMeta(a.risk_category);
        if (riskFilter === 'Tinggi' && meta.label !== 'Tinggi') return false;
        if (riskFilter === 'Sedang' && meta.label !== 'Sedang') return false;
        if (riskFilter === 'Rendah' && meta.label !== 'Rendah') return false;
      }

      // Detection route filter
      if (routeFilter !== 'all') {
        if (routeFilter === 'cloning' && a.detection_route !== 'cloning' && a.detection_route !== 'dual') {
          return false;
        }
        if (routeFilter === 'repeat_billing' && a.detection_route !== 'repeat_billing' && a.detection_route !== 'dual') {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const { claimA, claimB } = a.candidate_pair;
        const match =
          claimA.claim_id.toLowerCase().includes(q) ||
          claimB.claim_id.toLowerCase().includes(q) ||
          (claimA.no_rm && claimA.no_rm.toLowerCase().includes(q)) ||
          (claimB.no_rm && claimB.no_rm.toLowerCase().includes(q)) ||
          (claimA.sep_number && claimA.sep_number.toLowerCase().includes(q)) ||
          (claimB.sep_number && claimB.sep_number.toLowerCase().includes(q)) ||
          claimA.patient_id.toLowerCase().includes(q) ||
          claimB.patient_id.toLowerCase().includes(q) ||
          claimA.provider_id.toLowerCase().includes(q) ||
          claimB.provider_id.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [pendingAssessments, riskFilter, routeFilter, searchQuery]);

  // Sorting pipeline
  const sortedAndFiltered = useMemo(() => {
    if (sortField === 'none') return filtered;

    const list = [...filtered];

    if (sortField === 'claim_pair') {
      list.sort((a, b) => {
        const idA1 = a.candidate_pair.claimA.claim_id;
        const idB1 = b.candidate_pair.claimA.claim_id;
        const cmp1 = idA1.localeCompare(idB1, undefined, { numeric: true, sensitivity: 'base' });
        if (cmp1 !== 0) {
          return sortOrder === 'asc' ? cmp1 : -cmp1;
        }
        const idA2 = a.candidate_pair.claimB.claim_id;
        const idB2 = b.candidate_pair.claimB.claim_id;
        const cmp2 = idA2.localeCompare(idB2, undefined, { numeric: true, sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp2 : -cmp2;
      });
    } else if (sortField === 'priority') {
      const getPriorityRank = (item: HybridRiskAssessment) => {
        const label = getPriorityMeta(item.risk_category).label;
        if (label === 'Tinggi') return 3;
        if (label === 'Sedang') return 2;
        return 1;
      };

      list.sort((a, b) => {
        const rankA = getPriorityRank(a);
        const rankB = getPriorityRank(b);
        if (rankA !== rankB) {
          return sortOrder === 'asc' ? rankA - rankB : rankB - rankA;
        }
        // Tie-breaker dengan skor risiko akhir
        return sortOrder === 'asc'
          ? a.final_fraud_risk_score - b.final_fraud_risk_score
          : b.final_fraud_risk_score - a.final_fraud_risk_score;
      });
    }

    return list;
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedAndFiltered.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAndFiltered.slice(start, start + pageSize);
  }, [sortedAndFiltered, currentPage, pageSize]);

  // Handler toggle sorting pada header kolom
  const handleToggleSort = (field: 'claim_pair' | 'priority') => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortField('none');
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const counts = useMemo(() => {
    return {
      all: pendingAssessments.length,
      high: pendingAssessments.filter((a) => getPriorityMeta(a.risk_category).label === 'Tinggi').length,
      suspicious: pendingAssessments.filter((a) => getPriorityMeta(a.risk_category).label === 'Sedang').length,
      normal: pendingAssessments.filter((a) => getPriorityMeta(a.risk_category).label === 'Rendah').length,
    };
  }, [pendingAssessments]);

  return (
    <div className="space-y-6 text-[#101731]">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-xl font-bold text-[#101731] whitespace-nowrap">Antrean Verifikasi</h2>
          <span className="apple-glass-pill text-xs text-[#297fbd] border-[#297fbd]/30 px-3 py-0.5 font-bold font-mono whitespace-nowrap">
            {filtered.length} Pasangan
          </span>
        </div>

        {/* Risk Filter: 4 equal segments */}
        <div className="apple-glass-pill p-1 grid grid-cols-4 gap-1 shadow-xs w-full lg:w-auto lg:min-w-[440px]">
          {([
            { key: 'Semua', label: 'Semua', count: counts.all, active: 'bg-gradient-to-r from-[#297fbd] to-[#52b754] shadow-[#297fbd]/20', hover: 'hover:text-[#101731]' },
            { key: 'Tinggi', label: 'Tinggi', count: counts.high, active: 'bg-rose-600 shadow-rose-600/20', hover: 'hover:text-rose-600' },
            { key: 'Sedang', label: 'Sedang', count: counts.suspicious, active: 'bg-amber-500 shadow-amber-500/20', hover: 'hover:text-amber-600' },
            { key: 'Rendah', label: 'Rendah', count: counts.normal, active: 'bg-[#13712c] shadow-[#13712c]/20', hover: 'hover:text-[#13712c]' },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setRiskFilter(opt.key);
                setCurrentPage(1);
              }}
              className={`flex flex-col items-center justify-center leading-tight px-2 py-1.5 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
                riskFilter === opt.key
                  ? `${opt.active} text-white font-bold shadow-md`
                  : `text-[#212b50] font-semibold ${opt.hover}`
              }`}
            >
              <span>{opt.label}</span>
              <span className="font-mono text-[11px] opacity-90">{opt.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="apple-glass-card rounded-3xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_260px] gap-4 shadow-sm border-slate-200">
        <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-1.5 min-w-0">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Search className="w-3.5 h-3.5 text-[#297fbd]" />
            Cari
          </span>
          <input
            type="text"
            placeholder="ID klaim, ID pasien, atau faskes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-4 text-xs bg-white border border-slate-200 rounded-full text-[#101731] placeholder-slate-400 focus:outline-hidden focus:border-[#297fbd] transition"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Filter className="w-3.5 h-3.5 text-[#297fbd]" />
            Jalur Deteksi
          </span>
          <select
            value={routeFilter}
            onChange={(e) => {
              setRouteFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full h-10 px-4 text-xs text-[#212b50] bg-white border border-slate-200 rounded-full focus:outline-hidden focus:border-[#297fbd] cursor-pointer"
          >
            <option value="all" className="bg-white text-[#101731]">Semua Jalur</option>
            <option value="cloning" className="bg-white text-[#101731]">Cloning</option>
            <option value="repeat_billing" className="bg-white text-[#101731]">Repeat Billing</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#297fbd]" />
            Urutkan
          </span>
          <select
            value={
              sortField === 'claim_pair'
                ? sortOrder === 'asc'
                  ? 'pair_asc'
                  : 'pair_desc'
                : sortField === 'priority'
                ? sortOrder === 'asc'
                  ? 'priority_asc'
                  : 'priority_desc'
                : 'default'
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'pair_asc') {
                setSortField('claim_pair');
                setSortOrder('asc');
              } else if (val === 'pair_desc') {
                setSortField('claim_pair');
                setSortOrder('desc');
              } else if (val === 'priority_asc') {
                setSortField('priority');
                setSortOrder('asc');
              } else if (val === 'priority_desc') {
                setSortField('priority');
                setSortOrder('desc');
              } else {
                setSortField('none');
                setSortOrder('asc');
              }
              setCurrentPage(1);
            }}
            className="w-full h-10 px-4 text-xs text-[#212b50] bg-white border border-slate-200 rounded-full focus:outline-hidden focus:border-[#297fbd] cursor-pointer"
          >
            <option value="default" className="bg-white text-[#101731]">Urutan Default</option>
            <option value="pair_asc" className="bg-white text-[#101731]">Pasangan Klaim (A-Z)</option>
            <option value="pair_desc" className="bg-white text-[#101731]">Pasangan Klaim (Z-A)</option>
            <option value="priority_asc" className="bg-white text-[#101731]">Prioritas (Rendah ke Tinggi)</option>
            <option value="priority_desc" className="bg-white text-[#101731]">Prioritas (Tinggi ke Rendah)</option>
          </select>
        </div>
      </div>

      {/* Table of Review Queue */}
      <div className="apple-glass-card rounded-3xl overflow-hidden shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[#212b50] border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleToggleSort('claim_pair')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100/90 transition select-none group"
                  title="Klik untuk mengurutkan: A-Z / Z-A"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Pasangan Klaim</span>
                    {sortField === 'claim_pair' ? (
                      sortOrder === 'asc' ? (
                        <span className="inline-flex items-center gap-0.5 text-[#297fbd] bg-[#297fbd]/10 border border-[#297fbd]/30 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight">
                          <ArrowUp className="w-3 h-3 text-[#297fbd]" /> A-Z
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[#297fbd] bg-[#297fbd]/10 border border-[#297fbd]/30 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight">
                          <ArrowDown className="w-3 h-3 text-[#297fbd]" /> Z-A
                        </span>
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-3">Jalur Deteksi</th>
                <th className="py-3.5 px-3 text-center">Kandidat</th>
                <th className="py-3.5 px-3 text-center">Skor Deteksi</th>
                <th className="py-3.5 px-4 text-center">Skor Risiko Akhir</th>
                <th
                  onClick={() => handleToggleSort('priority')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100/90 transition select-none group"
                  title="Klik untuk mengurutkan: Rendah ke Tinggi / Tinggi ke Rendah"
                >
                  <div className="inline-flex items-center justify-center gap-1.5">
                    <span>Prioritas</span>
                    {sortField === 'priority' ? (
                      sortOrder === 'asc' ? (
                        <span className="inline-flex items-center gap-0.5 text-[#13712c] bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight">
                          <ArrowUp className="w-3 h-3 text-[#13712c]" /> Rendah ke Tinggi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 border border-rose-300 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight">
                          <ArrowDown className="w-3 h-3 text-rose-600" /> Tinggi ke Rendah
                        </span>
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#101731]">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-[#101731]">
                        {assessments.length === 0
                          ? 'Belum Ada Berkas Klaim Masuk untuk Diverifikasi'
                          : 'Tidak Ada Pasangan Klaim Sesuai Kriteria Filter'}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {assessments.length === 0
                          ? 'Saat ini seluruh 300 data di sistem merupakan basis data riwayat (historical baseline) yang sudah selesai diproses. Silakan unggah berkas klaim baru di menu Input Data untuk memulai komparasi deteksi anomali.'
                          : 'Coba ubah filter kategori risiko, jalur deteksi, atau kata kunci pencarian.'}
                      </p>
                      {assessments.length === 0 && onNavigateTab && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => onNavigateTab('data-input')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#297fbd] to-[#52b754] text-white text-xs font-bold rounded-full shadow-md shadow-[#297fbd]/20 hover:opacity-95 transition cursor-pointer"
                          >
                            <span>Ke Menu Input Data</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const { claimA, claimB, candidate_match_score } = item.candidate_pair;
                  const meta = getPriorityMeta(item.risk_category);

                  return (
                    <tr
                      key={item.pair_id}
                      className="hover:bg-slate-50/80 transition group cursor-pointer"
                      onClick={() => onSelectCase(item)}
                    >
                      {/* Claim Pair Details */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-[#101731] text-xs">
                          <span className="flex items-center gap-1">
                            <span>{claimA.claim_id}</span>
                            {claimA.record_role === 'historical_reference' && (
                              <span className="text-[9px] font-sans font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                Riwayat
                              </span>
                            )}
                          </span>
                          <span className="text-[#297fbd] font-sans font-normal">↔</span>
                          <span className="flex items-center gap-1">
                            <span className="text-[#297fbd]">{claimB.claim_id}</span>
                            {(claimB.is_incoming || claimB.record_role === 'incoming_draft') && (
                              <span className="text-[9px] font-sans font-semibold text-[#297fbd] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                Masuk
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          {(claimA.no_rm || claimB.no_rm) && (
                            <span className="text-[#297fbd] font-mono text-[10px] bg-[#297fbd]/10 border border-[#297fbd]/20 px-1.5 py-0.5 rounded-md">
                              RM: {claimA.no_rm === claimB.no_rm ? claimA.no_rm : `${claimA.no_rm || '-'} / ${claimB.no_rm || '-'}`}
                            </span>
                          )}
                          <span>
                            Pasien: <strong className="text-[#101731]">{claimA.patient_id === claimB.patient_id ? `${claimA.patient_id} (Sama)` : 'Berbeda'}</strong>
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[140px] text-slate-500">{claimA.provider_id}</span>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-3">
                        {item.detection_route === 'cloning' && (
                          <span className="apple-glass-pill inline-flex items-center gap-1 text-[10px] font-bold text-[#297fbd] border-[#297fbd]/25 px-2.5 py-0.5 uppercase font-mono">
                            <FileText className="w-3 h-3 text-[#297fbd]" /> Cloning
                          </span>
                        )}
                        {item.detection_route === 'repeat_billing' && (
                          <span className="apple-glass-pill inline-flex items-center gap-1 text-[10px] font-bold text-[#13712c] border-[#52b754]/25 px-2.5 py-0.5 uppercase font-mono">
                            <Layers className="w-3 h-3 text-[#52b754]" /> Repeat Billing
                          </span>
                        )}
                        {item.detection_route === 'dual' && (
                          <span className="apple-glass-pill inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 border-amber-300 px-2.5 py-0.5 uppercase font-mono">
                            Dual
                          </span>
                        )}
                        {item.detection_route === 'normal' && (
                          <span className="apple-glass-pill inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 px-2.5 py-0.5">
                            Standar
                          </span>
                        )}
                      </td>

                      {/* Candidate Score */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-[#212b50] text-xs">
                          {candidate_match_score.toFixed(2)}
                        </span>
                      </td>

                      {/* Unified Skor Deteksi (Cloning = Biru, Repeat Billing = Hijau) */}
                      <td className="py-3.5 px-3 text-center">
                        {item.detection_route === 'cloning' ? (
                          <span className="font-mono text-xs font-bold text-[#297fbd] bg-[#297fbd]/10 border border-[#297fbd]/25 px-2.5 py-0.5 rounded-full inline-block">
                            {item.cloning_score > 0 ? item.cloning_score.toFixed(2) : '-'}
                          </span>
                        ) : item.detection_route === 'repeat_billing' ? (
                          <span className="font-mono text-xs font-bold text-[#13712c] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                            {item.repeat_billing_score > 0 ? item.repeat_billing_score.toFixed(2) : '-'}
                          </span>
                        ) : item.detection_route === 'dual' ? (
                          <div className="inline-flex items-center gap-1 font-mono text-[11px]">
                            <span className="font-bold text-[#297fbd] bg-[#297fbd]/10 border border-[#297fbd]/20 px-1.5 py-0.5 rounded-md">
                              C {item.cloning_score.toFixed(2)}
                            </span>
                            <span className="font-bold text-[#13712c] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                              R {item.repeat_billing_score.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-slate-400">
                            {Math.max(item.cloning_score, item.repeat_billing_score) > 0
                              ? Math.max(item.cloning_score, item.repeat_billing_score).toFixed(2)
                              : '-'}
                          </span>
                        )}
                      </td>

                      {/* Final Risk Score Bar */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`font-mono font-extrabold text-sm ${meta.textClass}`}>
                            {item.final_fraud_risk_score.toFixed(2)}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                meta.label === 'Tinggi' ? 'bg-rose-500' : meta.label === 'Sedang' ? 'bg-amber-400' : 'bg-[#52b754]'
                              }`}
                              style={{ width: `${Math.round(item.final_fraud_risk_score * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="Pratinjau Diagram Risiko Multi-Dimensi"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRadarPreviewCase(item);
                            }}
                            className="apple-glass-pill inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#297fbd] hover:text-[#101731] hover:border-[#297fbd] cursor-pointer shadow-xs"
                          >
                            <Radar className="w-3.5 h-3.5 text-[#297fbd]" />
                            <span>Diagram</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCase(item);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#297fbd] to-[#52b754] hover:opacity-95 rounded-full transition cursor-pointer shadow-md shadow-[#297fbd]/20"
                          >
                            <span>Verifikasi</span>
                            <ExternalLink className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {sortedAndFiltered.length > pageSize && (
            <div className="bg-slate-50/60 px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Menampilkan <strong className="text-[#101731]">{(currentPage - 1) * pageSize + 1}</strong> -{' '}
                <strong className="text-[#101731]">
                  {Math.min(currentPage * pageSize, sortedAndFiltered.length)}
                </strong>{' '}
                dari <strong className="text-[#101731]">{sortedAndFiltered.length}</strong> pasangan klaim
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="apple-glass-pill flex items-center gap-1 px-3.5 py-1.5 text-[#212b50] hover:text-[#101731] disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <span className="px-3 py-1 font-semibold text-[#101731] font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="apple-glass-pill flex items-center gap-1 px-3.5 py-1.5 text-[#212b50] hover:text-[#101731] disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spiderweb Radar Chart Preview Modal */}
      {radarPreviewCase && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="apple-glass-card rounded-3xl border-slate-200 bg-white/95 max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#297fbd]/10 text-[#297fbd] border border-[#297fbd]/30 rounded-2xl">
                  <Radar className="w-5 h-5 text-[#297fbd]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#101731]">
                    Diagram Multi-Dimensi: {radarPreviewCase.candidate_pair.claimA.claim_id} ↔ {radarPreviewCase.candidate_pair.claimB.claim_id}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setRadarPreviewCase(null)}
                className="apple-glass-pill p-2 text-slate-400 hover:text-[#101731] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Radar Component */}
            <SpiderwebRadarChart assessment={radarPreviewCase} size={280} />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-mono">
                Skor Risiko Akhir: <strong className={`${getPriorityMeta(radarPreviewCase.risk_category).textClass} font-bold`}>{radarPreviewCase.final_fraud_risk_score.toFixed(2)}</strong> (Prioritas {getPriorityMeta(radarPreviewCase.risk_category).label})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRadarPreviewCase(null)}
                  className="apple-glass-pill px-4 py-2 text-xs font-medium text-[#212b50] hover:text-[#101731] cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const c = radarPreviewCase;
                    setRadarPreviewCase(null);
                    onSelectCase(c);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#297fbd] to-[#52b754] hover:opacity-95 rounded-full shadow-md shadow-[#297fbd]/20 transition cursor-pointer"
                >
                  <span>Buka Verifikasi</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
