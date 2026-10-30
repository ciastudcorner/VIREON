import React, { useState } from 'react';
import {
  HybridRiskAssessment,
  ReviewDecisionType,
  getPriorityMeta,
} from '../types/claim';
import {
  ArrowLeft,
  CheckCircle,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { VisualExplainabilityCloning } from './VisualExplainabilityCloning';
import { VisualExplainabilityRepeatBilling } from './VisualExplainabilityRepeatBilling';
import { MiniEvidenceGraph } from './MiniEvidenceGraph';
import { SpiderwebRadarChart } from './SpiderwebRadarChart';

interface CaseInvestigationViewProps {
  assessment: HybridRiskAssessment;
  verifierName?: string;
  onBack: () => void;
  onSubmitReview: (decision: {
    decision: ReviewDecisionType;
    reviewer_name: string;
    reviewer_note: string;
  }) => void;
  onGoToAudit: () => void;
}

export const CaseInvestigationView: React.FC<CaseInvestigationViewProps> = ({
  assessment,
  verifierName,
  onBack,
  onSubmitReview,
  onGoToAudit,
}) => {
  const { candidate_pair, detection_route, final_fraud_risk_score, risk_category } = assessment;
  const { claimA, claimB, candidate_match_score } = candidate_pair;

  const [decision, setDecision] = useState<ReviewDecisionType>('Perlu Verifikasi Lanjutan');
  const [reviewerName, setReviewerName] = useState(`${verifierName || 'dr. Hendra P.'} (Verifikator Medis)`);
  const [reviewerNote, setReviewerNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerNote.trim()) {
      alert('Mohon cantumkan catatan verifikasi sebelum menyimpan keputusan.');
      return;
    }

    onSubmitReview({
      decision,
      reviewer_name: reviewerName,
      reviewer_note: reviewerNote,
    });
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 pb-12 text-[#101731]">
      {/* Top Navigation & Ref */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="apple-glass-pill inline-flex items-center gap-2 text-xs font-semibold text-[#212b50] hover:text-[#101731] px-4 py-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#297fbd]" />
          <span>Kembali ke Antrean</span>
        </button>

        <div className="text-xs text-slate-500 font-mono">
          ID Kasus: <strong className="text-[#297fbd]">{assessment.pair_id}</strong>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="apple-glass-card rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`apple-glass-pill text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 font-mono ${
                detection_route === 'cloning'
                  ? 'text-[#297fbd] border-[#297fbd]/30'
                  : detection_route === 'repeat_billing'
                  ? 'text-[#13712c] border-[#52b754]/30'
                  : 'text-amber-700 border-amber-300'
              }`}>
                {detection_route === 'cloning' ? 'CLONING' : detection_route === 'repeat_billing' ? 'REPEAT BILLING' : detection_route.toUpperCase()}
              </span>
              <span
                className={`apple-glass-pill text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 border ${getPriorityMeta(risk_category).badgeClass}`}
              >
                Prioritas {getPriorityMeta(risk_category).label}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#101731] tracking-tight flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-800 font-mono">{claimA.claim_id}</span>
                {claimA.record_role === 'historical_reference' && (
                  <span className="apple-glass-pill text-[10px] font-sans font-bold text-slate-600 bg-slate-100 px-2 py-0.5">
                    Riwayat Backend
                  </span>
                )}
              </span>
              <span className="text-[#297fbd] font-normal">&harr;</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#297fbd] font-mono">{claimB.claim_id}</span>
                {(claimB.is_incoming || claimB.record_role === 'incoming_draft') && (
                  <span className="apple-glass-pill text-[10px] font-sans font-bold text-[#297fbd] bg-blue-50 border border-[#297fbd]/30 px-2 py-0.5">
                    Berkas Masuk
                  </span>
                )}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              {(claimA.no_rm || claimB.no_rm) && (
                <span className="apple-glass-pill px-2.5 py-0.5 text-[#297fbd] border-[#297fbd]/25 font-mono text-[11px]">
                  No. RM: {claimA.no_rm === claimB.no_rm ? claimA.no_rm : `${claimA.no_rm || '-'} / ${claimB.no_rm || '-'}`}
                </span>
              )}
              {(claimA.sep_number || claimB.sep_number) && (
                <span className="apple-glass-pill px-2.5 py-0.5 text-[#13712c] border-[#52b754]/25 font-mono text-[11px]">
                  No. SEP: {claimA.sep_number === claimB.sep_number ? claimA.sep_number : `${claimA.sep_number || '-'} / ${claimB.sep_number || '-'}`}
                </span>
              )}
              <span className="text-slate-500 text-[11px]">
                Pasien: <strong className="text-[#101731]">{claimA.patient_id === claimB.patient_id ? `${claimA.patient_id} (Sama)` : `${claimA.patient_id} vs ${claimB.patient_id}`}</strong>
              </span>
            </div>
          </div>

          {/* 3 Scoring Levels Visual Display */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center min-w-[110px] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                1. Pra-Filter
              </span>
              <span className="text-2xl font-black text-[#101731] font-mono">
                {candidate_match_score.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Kesesuaian Awal</span>
            </div>

            <div className={`p-3.5 bg-slate-50 border rounded-2xl text-center min-w-[110px] shadow-xs ${
              detection_route === 'cloning'
                ? 'border-[#297fbd]/30'
                : detection_route === 'repeat_billing'
                ? 'border-emerald-200'
                : 'border-slate-200'
            }`}>
              <span className={`text-[10px] uppercase font-bold block tracking-wider ${
                detection_route === 'cloning'
                  ? 'text-[#297fbd]'
                  : detection_route === 'repeat_billing'
                  ? 'text-[#13712c]'
                  : 'text-slate-500'
              }`}>
                2. Spesialis
              </span>
              <span className={`text-2xl font-black font-mono ${
                detection_route === 'cloning'
                  ? 'text-[#297fbd]'
                  : detection_route === 'repeat_billing'
                  ? 'text-[#13712c]'
                  : 'text-slate-800'
              }`}>
                {detection_route === 'cloning'
                  ? assessment.cloning_score.toFixed(2)
                  : assessment.repeat_billing_score.toFixed(2)}
              </span>
              <span className={`text-[9px] font-medium block mt-0.5 ${
                detection_route === 'cloning'
                  ? 'text-[#297fbd]'
                  : detection_route === 'repeat_billing'
                  ? 'text-[#13712c]'
                  : 'text-slate-400'
              }`}>
                {detection_route === 'cloning' ? 'Cloning' : detection_route === 'repeat_billing' ? 'Repeat Billing' : 'Dual'}
              </span>
            </div>

            <div className={`rounded-2xl p-3.5 text-center min-w-[125px] border shadow-xs ${getPriorityMeta(risk_category).badgeClass}`}>
              <span className="text-[10px] uppercase font-bold block opacity-90 tracking-wider">
                3. Risiko Akhir
              </span>
              <span className="text-3xl font-black font-mono">
                {final_fraud_risk_score.toFixed(2)}
              </span>
              <span className="text-[9px] font-medium block mt-0.5 opacity-90">Prioritas {getPriorityMeta(risk_category).label}</span>
            </div>
          </div>
        </div>

        {/* Primary Flags */}
        {assessment.primary_flags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {assessment.primary_flags.map((flag, idx) => (
              <span
                key={idx}
                className="apple-glass-pill inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-rose-50 text-rose-700 border-rose-200"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Section 1: Visual Explainability Modules */}
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#101731] tracking-tight">
            Analisis
          </h3>
        </div>

        {/* Anti-Cloning Explainability */}
        {(detection_route === 'cloning' || detection_route === 'dual') && assessment.cloning_evidence && (
          <VisualExplainabilityCloning
            claimA={claimA}
            claimB={claimB}
            evidence={assessment.cloning_evidence}
          />
        )}

        {/* Anti-Repeat Billing Explainability */}
        {(detection_route === 'repeat_billing' || detection_route === 'dual' || detection_route === 'normal') &&
          assessment.repeat_billing_evidence && (
            <VisualExplainabilityRepeatBilling
              claimA={claimA}
              claimB={claimB}
              evidence={assessment.repeat_billing_evidence}
            />
          )}

        {/* Spiderweb Risk Radar Chart */}
        <SpiderwebRadarChart assessment={assessment} />

        {/* Mini Relationship Graph */}
        <MiniEvidenceGraph claimA={claimA} claimB={claimB} route={detection_route} />
      </div>

      {/* Section 2: Hybrid Scoring Breakdown */}
      <div className="apple-glass-card rounded-3xl overflow-hidden shadow-sm border-slate-200">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#101731]">
            Pembobotan Skor
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Final: {final_fraud_risk_score.toFixed(3)}
          </span>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/60 text-[#212b50] border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Komponen Evidence</th>
                <th className="py-3 px-4">Detail Pengamatan</th>
                <th className="py-3 px-4 text-center">Nilai Mentah</th>
                <th className="py-3 px-4 text-center">Bobot</th>
                <th className="py-3 px-4 text-right">Kontribusi Skor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#101731]">
              {assessment.breakdown.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-[#101731]">{item.label}</td>
                  <td className="py-3.5 px-4 text-slate-500">{item.detail}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#212b50]">
                    {item.value.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                    {(item.weight * 100).toFixed(0)}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#297fbd]">
                    +{item.contribution.toFixed(3)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                <td colSpan={4} className="py-3.5 px-4 text-right text-[#212b50]">
                  Total Skor Risiko Akhir:
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base text-[#297fbd]">
                  {final_fraud_risk_score.toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Human-in-the-Loop Review Box */}
      <div className="apple-glass-card rounded-3xl overflow-hidden border-slate-200 shadow-sm">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#101731]">
            Keputusan Verifikator Medis
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">

        {submitted ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[#13712c] mt-5 space-y-3 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#52b754]" />
              <span className="font-bold text-sm text-[#13712c]">
                Keputusan Berhasil Disimpan
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Keputusan <strong className="text-[#13712c]">{decision}</strong> oleh <strong className="text-[#101731]">{reviewerName}</strong> telah dicatat ke log audit.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onGoToAudit}
                className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-[#297fbd] to-[#52b754] text-white rounded-full shadow-md shadow-[#297fbd]/20 hover:opacity-95 transition cursor-pointer"
              >
                Buka Log Audit
              </button>
              <button
                onClick={onBack}
                className="apple-glass-pill px-4 py-2.5 text-xs font-semibold text-[#212b50] hover:text-[#101731] transition cursor-pointer"
              >
                Kembali ke Antrean
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Options */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#90a29f] mb-2.5">
                Keputusan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`border rounded-2xl p-4 cursor-pointer flex flex-col justify-between transition backdrop-blur-xs ${
                    decision === 'Bersih / Tanpa Anomali'
                      ? 'border-[#52b754] bg-[#52b754]/10 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#13712c]">
                      Bersih / Tanpa Anomali
                    </span>
                    <input
                      type="radio"
                      name="decision"
                      value="Bersih / Tanpa Anomali"
                      checked={decision === 'Bersih / Tanpa Anomali'}
                      onChange={() => setDecision('Bersih / Tanpa Anomali')}
                      className="accent-[#52b754]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Klaim wajar dan sesuai regulasi.
                  </p>
                </label>

                <label
                  className={`border rounded-2xl p-4 cursor-pointer flex flex-col justify-between transition backdrop-blur-xs ${
                    decision === 'Perlu Verifikasi Lanjutan'
                      ? 'border-amber-400 bg-amber-50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-800">
                      Perlu Verifikasi Lanjutan
                    </span>
                    <input
                      type="radio"
                      name="decision"
                      value="Perlu Verifikasi Lanjutan"
                      checked={decision === 'Perlu Verifikasi Lanjutan'}
                      onChange={() => setDecision('Perlu Verifikasi Lanjutan')}
                      className="accent-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Perlu konfirmasi berkas fisik atau klarifikasi DPJP.
                  </p>
                </label>

                <label
                  className={`border rounded-2xl p-4 cursor-pointer flex flex-col justify-between transition backdrop-blur-xs ${
                    decision === 'Eskalasi Investigasi'
                      ? 'border-rose-400 bg-rose-50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-rose-700">
                      Eskalasi Investigasi
                    </span>
                    <input
                      type="radio"
                      name="decision"
                      value="Eskalasi Investigasi"
                      checked={decision === 'Eskalasi Investigasi'}
                      onChange={() => setDecision('Eskalasi Investigasi')}
                      className="accent-rose-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Indikasi kuat duplikasi; teruskan ke tim investigasi.
                  </p>
                </label>
              </div>
            </div>

            {/* Reviewer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-[#212b50] mb-1.5">
                  Verifikator
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-2xl text-[#101731] focus:border-[#297fbd] focus:outline-hidden transition"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#212b50] mb-1.5">
                  Catatan Verifikasi
                </label>
                <textarea
                  rows={3}
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="Catatan pertimbangan verifikator..."
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-2xl text-[#101731] focus:border-[#297fbd] focus:outline-hidden leading-relaxed placeholder:text-slate-400 transition"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onBack}
                className="apple-glass-pill px-4 py-2.5 text-xs font-medium text-[#212b50] hover:text-[#101731] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#297fbd] to-[#52b754] hover:opacity-95 rounded-full shadow-md shadow-[#297fbd]/20 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Simpan Keputusan</span>
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
