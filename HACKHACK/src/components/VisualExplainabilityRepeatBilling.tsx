import React from 'react';
import { Claim, RepeatBillingEvidence } from '../types/claim';
import {
  CreditCard,
  AlertOctagon,
  CheckCircle,
  Layers,
} from 'lucide-react';

interface VisualExplainabilityRepeatBillingProps {
  claimA: Claim;
  claimB: Claim;
  evidence: RepeatBillingEvidence;
}

export const VisualExplainabilityRepeatBilling: React.FC<VisualExplainabilityRepeatBillingProps> = ({
  claimA,
  claimB,
  evidence,
}) => {
  // Chronological sort
  const isAFirst = new Date(claimA.claim_date).getTime() <= new Date(claimB.claim_date).getTime();
  const firstClaim = isAFirst ? claimA : claimB;
  const secondClaim = isAFirst ? claimB : claimA;

  return (
    <div className="space-y-6">
      {/* Top Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="apple-glass-card border border-slate-200/80 rounded-3xl p-4.5 flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Keterikatan Episode</span>
          <div className="mt-2">
            {evidence.same_episode ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                <Layers className="w-3.5 h-3.5" /> Episode Sama ({firstClaim.episode_id})
              </span>
            ) : evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE') ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-600" /> Indikasi Pemecahan Episode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#13712c] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5 text-[#52b754]" /> Episode Terpisah (Wajar)
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-2">
            {evidence.same_episode
              ? 'Potensi klaim ganda'
              : evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE')
              ? 'Episode baru dalam tempo singkat'
              : 'Prosedur bertahap yang sah'}
          </span>
        </div>

        <div className="apple-glass-card border border-slate-200/80 rounded-3xl p-4.5 flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Irisan Prosedur / Tindakan</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span
              className={`text-2xl font-black ${
                evidence.procedure_overlap_ratio > 0.6
                  ? 'text-rose-600'
                  : 'text-[#13712c]'
              }`}
            >
              {Math.round(evidence.procedure_overlap_ratio * 100)}%
            </span>
            <span className="text-[11px] text-slate-500">tindakan sama</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            {evidence.matching_procedures.join(', ') || 'Tidak ada irisan prosedur'}
          </span>
        </div>

        <div className="apple-glass-card border border-slate-200/80 rounded-3xl p-4.5 flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Status Klaim Terdahulu</span>
          <div className="mt-2">
            {evidence.previous_claim_paid ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                <CreditCard className="w-3.5 h-3.5" /> PAID ({evidence.paid_date})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                Belum Dibayarkan / Dalam Proses
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">
            {evidence.paid_claim_id ? `ID: ${evidence.paid_claim_id}` : '-'}
          </span>
        </div>

        <div className="apple-glass-card border border-slate-200/80 rounded-3xl p-4.5 flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Kesesuaian Tarif Diajukan</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-[#297fbd]">
              {Math.round(evidence.amount_similarity * 100)}%
            </span>
            <span className="text-[11px] text-slate-500">kemiripan nominal</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">
            Rp {claimA.billed_amount.toLocaleString('id-ID')} vs Rp {claimB.billed_amount.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Special Notice if Cleared because of Legitimate Different Episodes */}
      {evidence.is_legitimate_different_episode && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs text-[#13712c] flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#52b754] shrink-0" />
          <span className="text-[11px] text-[#212b50]">
            <strong className="text-[#13712c]">Episode Berbeda:</strong> Pasien ({firstClaim.patient_id}) menerima tindakan pada episode pelayanan terpisah ({firstClaim.episode_id} vs {secondClaim.episode_id}).
          </span>
        </div>
      )}

      {/* Visual Interactive Chronological Timeline */}
      <div className="apple-glass-card border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#101731]">
            Kronologi Pengajuan Klaim
          </span>
        </div>

        <div className="p-6 bg-transparent">
          <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
            {/* Step 1: Medical Service Delivered */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#297fbd] to-[#52b754] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                1
              </div>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101731]">Pelayanan Medis Diberikan</span>
                  <span className="text-xs font-mono font-semibold text-[#297fbd] bg-[#297fbd]/10 border border-[#297fbd]/20 px-2 py-0.5 rounded-full">
                    {firstClaim.service_date}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Pasien {firstClaim.patient_id} {firstClaim.no_rm ? `(No. RM: ${firstClaim.no_rm})` : ''} menerima prosedur{' '}
                  <code className="font-mono font-bold text-[#101731] bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {firstClaim.procedure.join(', ')}
                  </code>{' '}
                  pada faskes {firstClaim.provider_id}.
                </p>
              </div>
            </div>

            {/* Step 2: First Claim Submitted */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#297fbd] to-[#52b754] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                2
              </div>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101731]">
                    Klaim Pertama Diajukan (ID: {firstClaim.claim_id}{firstClaim.sep_number ? ` | SEP: ${firstClaim.sep_number}` : ''})
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {firstClaim.claim_date}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-4">
                  <span>Episode: <strong className="text-[#101731] font-mono">{firstClaim.episode_id}</strong></span>
                  <span>Nominal: <strong className="text-[#13712c] font-mono">Rp {firstClaim.billed_amount.toLocaleString('id-ID')}</strong></span>
                </div>
              </div>
            </div>

            {/* Step 3: Prior Claim Paid */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full ${
                firstClaim.claim_status === 'paid' ? 'bg-[#52b754] text-white' : 'bg-slate-200 text-slate-600'
              } flex items-center justify-center text-xs font-bold shadow-sm`}>
                3
              </div>
              <div className={`rounded-2xl p-4 border ${
                firstClaim.claim_status === 'paid'
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-slate-50/70 border-slate-200/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#13712c] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#52b754]" />
                    Klaim Pertama Disetujui &amp; Dibayar (PAID)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#13712c] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {firstClaim.paid_date || 'Status Belum Dibayar'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  Klaim {firstClaim.claim_id} telah berstatus PAID sebesar Rp {firstClaim.billed_amount.toLocaleString('id-ID')}.
                </p>
              </div>
            </div>

            {/* Step 4: Resubmission or Second Claim */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full ${
                (evidence.same_episode || evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE')) && evidence.previous_claim_paid
                  ? 'bg-rose-500 text-white animate-pulse'
                  : evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE')
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#297fbd] text-white'
              } flex items-center justify-center text-xs font-bold shadow-sm`}>
                4
              </div>
              <div className={`rounded-2xl p-4 border ${
                (evidence.same_episode || evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE')) && evidence.previous_claim_paid
                  ? 'bg-rose-50 border-rose-200'
                  : evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE')
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50/70 border-slate-200/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${
                    (evidence.same_episode || evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE')) ? 'text-rose-800' : 'text-[#101731]'
                  }`}>
                    {(evidence.same_episode || evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE')) && (
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                    )}
                    Klaim Kedua Diajukan (ID: {secondClaim.claim_id}{secondClaim.sep_number ? ` | SEP: ${secondClaim.sep_number}` : ''})
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-700 bg-white px-2.5 py-0.5 rounded-full border border-rose-200">
                    {secondClaim.claim_date}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1.5">
                  {evidence.reason_codes.some((r) => r.code === 'RB-SPLIT-EPISODE') ? (
                    <strong className="text-amber-800">
                      Peringatan: Indikasi pemecahan episode ({secondClaim.episode_id}) dalam tempo {evidence.service_date_gap_days} hari dengan tindakan serupa.
                    </strong>
                  ) : evidence.same_episode && evidence.previous_claim_paid ? (
                    <strong className="text-rose-800">
                      Peringatan: Diajukan setelah klaim pertama berstatus PAID ({firstClaim.paid_date}), dengan ID episode ({firstClaim.episode_id}) dan prosedur serupa.
                    </strong>
                  ) : (
                    <span>Pengajuan klaim reguler untuk episode pelayanan terpisah.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Codes Table */}
      <div className="apple-glass-card border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#101731]">
            Kode Temuan Evidence
          </span>
        </div>
        <div className="p-5 space-y-2.5">
          {evidence.reason_codes.map((rc, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                rc.severity === 'high'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : rc.severity === 'medium'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-[#13712c]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] text-[#101731] shadow-xs">
                  {rc.code}
                </span>
                <span>{rc.label}</span>
              </div>
              <span className="font-semibold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-slate-200/60 shadow-xs">
                Tingkat: {rc.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
