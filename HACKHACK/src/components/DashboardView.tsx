import React, { useState } from 'react';
import {
  HybridRiskAssessment,
  HarmonizedClaimRecord,
  getPriorityMeta,
} from '../types/claim';
import {
  FileSpreadsheet,
  Layers,
  AlertTriangle,
  Camera,
  ArrowRight,
  Search,
  FileCheck2,
  UploadCloud,
  RotateCcw,
  Plus,
  Sparkles,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { getOCRProvenances } from '../services/ocrService';

interface DashboardViewProps {
  harmonizedClaims: HarmonizedClaimRecord[];
  assessments: HybridRiskAssessment[];
  onSelectCase: (assessment: HybridRiskAssessment) => void;
  onNavigateTab: (tab: 'data-input' | 'review-queue' | 'audit-log') => void;
  onLoad300Dataset?: () => void;
  onResetData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  harmonizedClaims,
  assessments,
  onSelectCase,
  onNavigateTab,
  onLoad300Dataset,
  onResetData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const ocrDocuments = getOCRProvenances();

  const incomingCount = harmonizedClaims.filter(
    (h) => h.claim.is_incoming || h.claim.record_role === 'incoming_draft' || h.claim.claim_id.startsWith('IN-')
  ).length;

  const highRiskCases = assessments.filter((a) => getPriorityMeta(a.risk_category).label === 'Tinggi');
  const suspiciousCases = assessments.filter((a) => getPriorityMeta(a.risk_category).label === 'Sedang');
  const normalCases = assessments.filter((a) => getPriorityMeta(a.risk_category).label === 'Rendah');

  const cloningCount = assessments.filter(
    (a) => a.detection_route === 'cloning' || a.detection_route === 'dual'
  ).length;
  const repeatCount = assessments.filter(
    (a) => a.detection_route === 'repeat_billing' || a.detection_route === 'dual'
  ).length;
  const splittingCount = assessments.filter((a) =>
    a.repeat_billing_evidence?.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE')
  ).length;

  const topRiskCases = [...assessments]
    .sort((a, b) => b.final_fraud_risk_score - a.final_fraud_risk_score)
    .slice(0, 5);

  const avgRiskScore =
    assessments.length > 0
      ? (
          assessments.reduce((sum, a) => sum + a.final_fraud_risk_score, 0) / assessments.length
        ).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-6 text-[#101731]">
      {/* Top Header: Greeting & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#101731]">
            Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Anti-Cloning &amp; Anti-Repeat Billing
          </p>
        </div>

        {/* Search Bar Pill */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#297fbd] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID klaim atau faskes..."
              className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/90 hover:border-[#297fbd]/40 focus:border-[#297fbd] rounded-full pl-9 pr-4 py-2 text-xs text-[#101731] placeholder-slate-400 focus:outline-hidden transition shadow-xs"
            />
          </div>

          <button
            onClick={() => onNavigateTab('review-queue')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#297fbd] to-[#52b754] hover:opacity-95 text-white font-bold rounded-full text-xs shadow-md shadow-[#297fbd]/20 transition cursor-pointer shrink-0"
          >
            <span>Antrean ({highRiskCases.length + suspiciousCases.length})</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Empty State / Launchpad when 0 Claims */}
      {harmonizedClaims.length === 0 ? (
        <div className="apple-glass-card rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-white border border-slate-200 rounded-3xl flex items-center justify-center p-2.5 shadow-sm">
            <img
              src="/vireon-logo.png"
              alt="Vireon"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="apple-glass-pill inline-flex items-center gap-2 px-3.5 py-1 text-xs font-semibold text-[#297fbd] border-[#297fbd]/30">
              <span className="w-2 h-2 rounded-full bg-[#52b754] animate-pulse"></span>
              Sistem Siap Menerima Data Klaim
            </div>
            <h3 className="text-2xl font-black text-[#101731] tracking-tight">
              Belum Ada Berkas Klaim Aktif
            </h3>
          </div>

          <div className="max-w-md mx-auto text-left pt-2">
            {/* Action: Go to Data Input Hub */}
            <div
              onClick={() => onNavigateTab('data-input')}
              className="group p-5 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-[#297fbd]/50 rounded-3xl transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 bg-gradient-to-br from-[#297fbd] to-[#52b754] text-white rounded-2xl shadow-sm">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#297fbd] bg-[#297fbd]/10 border border-[#297fbd]/25 px-2.5 py-0.5 rounded-full">
                  Input Data
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#101731] group-hover:text-[#297fbd] transition">
                Buka Hub Input Data
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Unggah berkas PDF, JSON, JSONL, atau hasil scan dokumen rekam medis.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Active Data Toolbar */}
          <div className="apple-glass-card rounded-3xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52b754] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#52b754]"></span>
              </span>
              <span className="text-xs text-slate-600">
                Backend: <strong className="text-[#101731] font-semibold">300 Riwayat Klaim JKN</strong>
                {incomingCount > 0 ? (
                  <> &bull; Berkas Masuk Diuji: <strong className="text-[#297fbd] font-bold">{incomingCount} klaim</strong> ({assessments.length} anomali terdeteksi)</>
                ) : (
                  <> &bull; <span className="text-[#13712c] font-medium">Siap menguji berkas klaim masuk</span></>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('data-input')}
                className="apple-glass-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#297fbd] hover:text-[#101731] hover:border-[#297fbd]/50 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#297fbd]" />
                <span>Tambah Berkas</span>
              </button>
              {onResetData && (
                <button
                  onClick={onResetData}
                  className="apple-glass-pill inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 cursor-pointer"
                  title="Bersihkan workspace untuk mengulang demo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Core Stat Cards (Apple VisionOS Glass Style) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Card 1: Total Claims / Historical Baseline */}
            <div
              onClick={() => onNavigateTab('data-input')}
              className="apple-glass-card rounded-3xl p-5 shadow-sm cursor-pointer group hover:border-[#297fbd]/50 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {incomingCount > 0 ? 'Total Klaim' : 'Basis Data Riwayat'}
                </span>
                <div className="p-2.5 bg-[#297fbd]/10 text-[#297fbd] rounded-2xl border border-[#297fbd]/25 group-hover:scale-105 transition shadow-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#101731] font-mono tracking-tight">
                  {harmonizedClaims.length}
                </span>
                <span className="text-xs text-slate-500">berkas</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-[#297fbd] font-medium">
                  {incomingCount > 0 ? `${incomingCount} berkas baru diuji` : '300 klaim acuan'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#297fbd]/10 text-[#297fbd] border border-[#297fbd]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#297fbd]"></span>
                  Aktif
                </span>
              </div>
            </div>

            {/* Card 2: Analyzed Pairs / Incoming Claims */}
            <div
              onClick={() => onNavigateTab(incomingCount > 0 ? 'review-queue' : 'data-input')}
              className="apple-glass-card rounded-3xl p-5 shadow-sm cursor-pointer group hover:border-[#52b754]/50 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {incomingCount > 0 ? 'Pasangan Terkait' : 'Berkas Masuk Diuji'}
                </span>
                <div className="p-2.5 bg-[#52b754]/10 text-[#52b754] rounded-2xl border border-[#52b754]/25 group-hover:scale-105 transition shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#101731] font-mono tracking-tight">
                  {incomingCount > 0 ? assessments.length : incomingCount}
                </span>
                <span className="text-xs text-slate-500">
                  {incomingCount > 0 ? 'pasangan' : 'klaim baru'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-[#13712c] font-medium">
                  {incomingCount > 0 ? 'Pra-filter lolos' : 'Menunggu berkas'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                  incomingCount > 0 ? 'bg-[#52b754]/10 text-[#13712c] border border-[#52b754]/20' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${incomingCount > 0 ? 'bg-[#52b754]' : 'bg-slate-400'}`}></span>
                  {incomingCount > 0 ? 'Sinkron' : 'Standby'}
                </span>
              </div>
            </div>

            {/* Card 3: Needs Review */}
            <div
              onClick={() => onNavigateTab('review-queue')}
              className="apple-glass-card rounded-3xl p-5 shadow-sm cursor-pointer group hover:border-amber-400 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Perlu Verifikasi</span>
                <div className={`p-2.5 rounded-2xl border group-hover:scale-105 transition shadow-xs ${
                  highRiskCases.length + suspiciousCases.length > 0
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono tracking-tight ${
                  highRiskCases.length + suspiciousCases.length > 0 ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  {highRiskCases.length + suspiciousCases.length}
                </span>
                <span className="text-xs text-slate-500">anomali</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">
                  {highRiskCases.length + suspiciousCases.length > 0 ? 'Prioritas verifikasi' : 'Antrean bersih'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                  highRiskCases.length + suspiciousCases.length > 0
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-[#13712c] border border-emerald-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    highRiskCases.length + suspiciousCases.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-[#52b754]'
                  }`}></span>
                  {highRiskCases.length + suspiciousCases.length > 0 ? 'Tindakan' : 'Aman'}
                </span>
              </div>
            </div>

            {/* Card 4: Normal / Cleared */}
            <div
              onClick={() => onNavigateTab('review-queue')}
              className="apple-glass-card rounded-3xl p-5 shadow-sm cursor-pointer group hover:border-[#13712c]/40 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {incomingCount > 0 ? 'Sesuai Ketentuan' : 'Status Deteksi'}
                </span>
                <div className="p-2.5 bg-[#13712c]/10 text-[#13712c] rounded-2xl border border-[#13712c]/20 group-hover:scale-105 transition shadow-xs">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#13712c] font-mono tracking-tight">
                  {incomingCount > 0 ? normalCases.length : 'SIAP'}
                </span>
                <span className="text-xs text-slate-500">
                  {incomingCount > 0 ? 'wajar' : 'standby'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-[#13712c] font-medium">
                  {incomingCount > 0 ? 'Klaim wajar & sah' : 'Algoritma aktif'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#52b754]/10 text-[#13712c] border border-[#52b754]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52b754]"></span>
                  Normal
                </span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols Wide): Trend Chart & Priority Table */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Risk Distribution Wave Curve */}
              <div className="apple-glass-card rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Profil Risiko Anomali</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-extrabold text-[#101731] font-mono">{avgRiskScore}</span>
                      <span className="text-xs text-[#297fbd] font-medium">skor rata-rata batch</span>
                    </div>
                  </div>
                  <span className="apple-glass-pill text-xs font-semibold px-3 py-1 text-[#297fbd] border-[#297fbd]/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#297fbd] animate-pulse"></span>
                    Kondisi Terpantau
                  </span>
                </div>

                {/* Smooth Glowing Wave Curve SVG Chart */}
                <div className="relative pt-2">
                  <svg className="w-full h-32 overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#297fbd" stopOpacity="0.2" />
                        <stop offset="60%" stopColor="#52b754" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#297fbd" />
                        <stop offset="50%" stopColor="#52b754" />
                        <stop offset="100%" stopColor="#9fcc4d" />
                      </linearGradient>
                    </defs>

                    {/* Background Grid Lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(16,23,49,0.06)" strokeDasharray="3 3" />
                    <line x1="0" y1="65" x2="500" y2="65" stroke="rgba(16,23,49,0.06)" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(16,23,49,0.06)" strokeDasharray="3 3" />

                    {/* Smooth Area Wave Fill */}
                    <path
                      d="M 0 100 Q 60 40 120 70 T 240 30 T 360 80 T 500 45 L 500 120 L 0 120 Z"
                      fill="url(#waveGradient)"
                    />

                    {/* Glowing Stroke Wave Line */}
                    <path
                      d="M 0 100 Q 60 40 120 70 T 240 30 T 360 80 T 500 45"
                      fill="none"
                      stroke="url(#strokeGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Highlight Pulsing Peak Points */}
                    <circle cx="240" cy="30" r="5" fill="#297fbd" className="animate-ping opacity-60" />
                    <circle cx="240" cy="30" r="4" fill="#ffffff" stroke="#297fbd" strokeWidth="2" />
                    <circle cx="500" cy="45" r="3.5" fill="#52b754" />
                  </svg>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2">
                    <span>0.00 (Wajar)</span>
                    <span>0.25 (Rendah)</span>
                    <span>0.50 (Sedang)</span>
                    <span>0.75 (Tinggi)</span>
                    <span>1.00 (Kritis)</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Priority Review Cases Table */}
              <div className="apple-glass-card rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#101731]">Prioritas Verifikasi</h3>
                  </div>
                  <button
                    onClick={() => onNavigateTab('review-queue')}
                    className="apple-glass-pill px-3 py-1 text-xs text-[#297fbd] hover:text-[#101731] font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Semua Antrean</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-[#212b50] text-[11px] font-semibold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">ID Klaim Pasangan</th>
                        <th className="py-3.5 px-3">Jalur Deteksi</th>
                        <th className="py-3.5 px-3 text-center">Skor Risiko</th>
                        <th className="py-3.5 px-3">Prioritas</th>
                        <th className="py-3.5 px-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[#101731]">
                      {topRiskCases.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Belum ada pasangan anomali terdeteksi dalam batch data saat ini.
                          </td>
                        </tr>
                      ) : (
                        topRiskCases.map((item) => {
                          const meta = getPriorityMeta(item.risk_category);

                          return (
                            <tr
                              key={item.pair_id}
                              className="hover:bg-slate-50/80 transition cursor-pointer"
                              onClick={() => onSelectCase(item)}
                            >
                              <td className="py-3.5 px-5">
                                <div className="font-mono font-bold text-[#101731] text-xs">
                                  {item.candidate_pair.claimA.claim_id}
                                  <span className="text-[#297fbd] mx-1.5">↔</span>
                                  {item.candidate_pair.claimB.claim_id}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  {item.candidate_pair.claimA.no_rm && (
                                    <span className="text-[#297fbd] font-mono">
                                      RM: {item.candidate_pair.claimA.no_rm} •
                                    </span>
                                  )}
                                  <span>Pasien: {item.candidate_pair.claimA.patient_id}</span>
                                </div>
                              </td>
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
                              <td className="py-3.5 px-3 text-center font-mono font-bold text-sm">
                                <span className={meta.textClass}>
                                  {item.final_fraud_risk_score.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeClass}`}
                                >
                                  {meta.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectCase(item);
                                  }}
                                  className="apple-glass-pill px-3 py-1 text-xs font-semibold text-[#297fbd] hover:text-[#101731] hover:border-[#297fbd] transition cursor-pointer shadow-xs"
                                >
                                  Verifikasi
                                </button>
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

            {/* Right Column (1 Col Wide): Anomaly Summary & Recent Documents */}
            <div className="space-y-6">
              {/* Card 1: Kategori Temuan Anomali */}
              <div className="apple-glass-card rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#90a29f]">
                    Kategori Temuan
                  </span>
                  <span className="apple-glass-pill text-[10px] text-[#297fbd] px-2 py-0.5">Batch Aktif</span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {/* Item 1: Cloning */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#212b50] font-medium">Cloning</span>
                      <span className="font-mono font-bold text-[#297fbd]">{cloningCount} kasus</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#297fbd] to-[#52b754] rounded-full transition-all duration-500"
                        style={{
                          width: `${assessments.length > 0 ? (cloningCount / assessments.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Item 2: Repeat Billing */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#212b50] font-medium">Repeat Billing</span>
                      <span className="font-mono font-bold text-[#13712c]">{repeatCount} kasus</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#52b754] to-[#9fcc4d] rounded-full transition-all duration-500"
                        style={{
                          width: `${assessments.length > 0 ? (repeatCount / assessments.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Item 3: Episode Splitting */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#212b50] font-medium">Indikasi Pemecahan Episode</span>
                      <span className="font-mono font-bold text-amber-600">{splittingCount} kasus</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#d6df41] to-amber-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${assessments.length > 0 ? (splittingCount / assessments.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Recent OCR Ingestion Documents */}
              <div className="apple-glass-card rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#297fbd]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#90a29f]">
                      Dokumen OCR Terkini
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('data-input')}
                    className="apple-glass-pill text-[11px] text-[#297fbd] hover:text-[#101731] px-2.5 py-0.5 transition cursor-pointer"
                  >
                    Unggah
                  </button>
                </div>

                <div className="space-y-3">
                  {ocrDocuments.slice(0, 3).map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white/90 border border-slate-200/80 rounded-2xl space-y-1.5 hover:border-[#297fbd]/40 transition shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#101731]">{doc.document_id}</span>
                        <span className="text-[10px] font-bold text-[#13712c] bg-[#52b754]/10 border border-[#52b754]/30 px-2 py-0.5 rounded-full font-mono">
                          OCR {doc.ocr_confidence}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="truncate">{doc.document_type}</span>
                        <span>•</span>
                        <span className="font-mono text-[#297fbd]">{doc.claim_id}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic line-clamp-1">
                        "{doc.ocr_text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
