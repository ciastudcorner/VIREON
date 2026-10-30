import React from 'react';
import { Claim, CloningEvidence } from '../types/claim';
import { CheckCircle2, Stethoscope, Building2 } from 'lucide-react';

interface VisualExplainabilityCloningProps {
  claimA: Claim;
  claimB: Claim;
  evidence: CloningEvidence;
}

/**
 * Highlights matching clauses and phrases within clinical text smoothly on dark background
 */
function renderSmoothDiff(text: string, otherText: string) {
  if (!text) return null;
  if (!otherText) return <span className="text-[#212b50]">{text}</span>;

  const trimmedText = text.trim();
  const normOther = otherText.toLowerCase().trim();

  // If the entire text block is identical or contained in the other claim
  if (normOther.includes(trimmedText.toLowerCase())) {
    return (
      <mark
        className="bg-amber-100 text-amber-900 font-medium px-1.5 py-0.5 rounded border border-amber-300 leading-relaxed block"
        title="Narasi klinis identik dengan klaim pembanding"
      >
        {text}
      </mark>
    );
  }

  // Tokenize by word boundaries including numbers, decimals, and alphanumeric
  const tokens = text.match(/[\w.-]+|[^\w.-]+/g) || [text];
  const isMatchFlags: boolean[] = new Array(tokens.length).fill(false);

  for (let i = 0; i < tokens.length; i++) {
    const rawToken = tokens[i].trim();
    if (!rawToken) continue;
    const token = rawToken.toLowerCase();

    // Check 3-word window
    if (i + 4 <= tokens.length) {
      const phrase3 = (tokens[i] + tokens[i + 1] + tokens[i + 2] + tokens[i + 3] + tokens[i + 4])
        .toLowerCase()
        .trim();
      if (phrase3.length > 7 && normOther.includes(phrase3)) {
        isMatchFlags[i] = true;
        isMatchFlags[i + 1] = true;
        isMatchFlags[i + 2] = true;
        isMatchFlags[i + 3] = true;
        isMatchFlags[i + 4] = true;
      }
    }

    // Check 2-word window
    if (i + 2 <= tokens.length) {
      const phrase2 = (tokens[i] + tokens[i + 1] + tokens[i + 2]).toLowerCase().trim();
      if (phrase2.length > 4 && normOther.includes(phrase2)) {
        isMatchFlags[i] = true;
        isMatchFlags[i + 1] = true;
        isMatchFlags[i + 2] = true;
      }
    }

    // Check individual token
    if (token.length >= 1 && normOther.includes(token)) {
      isMatchFlags[i] = true;
    }
  }

  // Bridge short whitespace, delimiters, and short connective tokens between matches
  for (let i = 1; i < tokens.length - 1; i++) {
    if (!isMatchFlags[i] && isMatchFlags[i - 1] && isMatchFlags[i + 1]) {
      if (/^[\s,.:;()/-]+$/.test(tokens[i]) || /^\d+$/.test(tokens[i]) || tokens[i].trim().length <= 3) {
        isMatchFlags[i] = true;
      }
    }
  }

  // Group contiguous tokens into smooth spans
  const spans: { text: string; isMatch: boolean }[] = [];
  let currentText = '';
  let currentMatch = isMatchFlags[0] || false;

  for (let i = 0; i < tokens.length; i++) {
    const match = isMatchFlags[i];
    if (match === currentMatch) {
      currentText += tokens[i];
    } else {
      if (currentText) {
        spans.push({ text: currentText, isMatch: currentMatch });
      }
      currentText = tokens[i];
      currentMatch = match;
    }
  }
  if (currentText) {
    spans.push({ text: currentText, isMatch: currentMatch });
  }

  return (
    <span className="leading-relaxed">
      {spans.map((span, idx) => {
        if (span.isMatch && span.text.trim().length > 0) {
          return (
            <mark
              key={idx}
              className="bg-amber-100 text-amber-900 font-medium px-1 py-0.5 rounded border border-amber-300"
              title="Teks/Frasa yang cocok dengan klaim pembanding"
            >
              {span.text}
            </mark>
          );
        }
        return <span key={idx} className="text-[#212b50]">{span.text}</span>;
      })}
    </span>
  );
}

export const VisualExplainabilityCloning: React.FC<VisualExplainabilityCloningProps> = ({
  claimA,
  claimB,
  evidence,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Evidence Badges & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="apple-glass-card border border-slate-200/80 rounded-3xl p-4.5 flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Kemiripan Teks Klinis</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span
              className={`text-2xl font-black ${
                evidence.text_similarity > 0.7
                  ? 'text-rose-600'
                  : evidence.text_similarity > 0.4
                  ? 'text-amber-600'
                  : 'text-[#13712c]'
              }`}
            >
              {Math.round(evidence.text_similarity * 100)}%
            </span>
            <span className="text-[11px] text-slate-500">Jaccard token</span>
          </div>
        </div>

        <div className="apple-glass-card border border-slate-200/80 rounded-3xl p-4.5 flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Irisan Lab &amp; Nilai Langka</span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span
              className={`text-2xl font-black ${
                evidence.rare_field_overlap_ratio > 0.5
                  ? 'text-rose-600'
                  : evidence.rare_field_overlap_ratio > 0
                  ? 'text-amber-600'
                  : 'text-[#13712c]'
              }`}
            >
              {Math.round(evidence.rare_field_overlap_ratio * 100)}%
            </span>
            <span className="text-[11px] text-slate-500">
              ({evidence.rare_field_matches.filter((m) => m.match).length}/
              {evidence.rare_field_matches.length})
            </span>
          </div>
        </div>

        <div className="apple-glass-card border border-slate-200/80 rounded-3xl p-4.5 flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Fasilitas Kesehatan</span>
          <div className="flex items-center gap-1.5 mt-2">
            {evidence.same_provider ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Building2 className="w-3.5 h-3.5" /> Faskes Sama
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                Faskes Berbeda
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            {claimA.provider_id}
          </span>
        </div>

        <div className="apple-glass-card border border-slate-200/80 rounded-3xl p-4.5 flex flex-col justify-between shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Dokter DPJP</span>
          <div className="flex items-center gap-1.5 mt-2">
            {evidence.same_practitioner ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Stethoscope className="w-3.5 h-3.5" /> DPJP Sama
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                DPJP Berbeda
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            {claimA.practitioner_id}
          </span>
        </div>
      </div>

      {/* Patient Entity Check Warning */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-3.5 text-xs flex items-center justify-between text-[#13712c]">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#52b754] shrink-0" />
          <span>
            <strong className="text-[#13712c]">Validasi Pasien:</strong> Pasien berbeda terverifikasi ({claimA.patient_id} vs {claimB.patient_id}).
          </span>
        </div>
      </div>

      {/* Side-by-Side Clinical Text Diff Highlight */}
      <div className="apple-glass-card border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#101731]">
            Perbandingan Narasi Klinis
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-400 inline-block"></span>
              Bagian Teks Serupa
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
          {/* Claim A */}
          <div className="p-5 bg-transparent">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#297fbd] bg-[#297fbd]/10 border border-[#297fbd]/25 px-2.5 py-1 rounded-full font-mono">
                ID Klaim: {claimA.claim_id}
              </span>
              <span className="text-[11px] text-slate-500">
                Pasien: <strong className="text-[#101731]">{claimA.patient_id}</strong>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2.5">
              <span className="font-mono text-[#297fbd]">{claimA.no_rm ? `No. RM: ${claimA.no_rm}` : ''} {claimA.sep_number ? `| SEP: ${claimA.sep_number}` : ''}</span>
              <span>Layanan: {claimA.service_date}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs min-h-[140px] max-h-[240px] overflow-y-auto font-sans leading-relaxed text-[#212b50] shadow-sm">
              {renderSmoothDiff(claimA.clinical_text, claimB.clinical_text)}
            </div>
          </div>

          {/* Claim B */}
          <div className="p-5 bg-transparent">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#13712c] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-mono">
                ID Klaim: {claimB.claim_id}
              </span>
              <span className="text-[11px] text-slate-500">
                Pasien: <strong className="text-[#101731]">{claimB.patient_id}</strong>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2.5">
              <span className="font-mono text-[#13712c]">{claimB.no_rm ? `No. RM: ${claimB.no_rm}` : ''} {claimB.sep_number ? `| SEP: ${claimB.sep_number}` : ''}</span>
              <span>Layanan: {claimB.service_date}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs min-h-[140px] max-h-[240px] overflow-y-auto font-sans leading-relaxed text-[#212b50] shadow-sm">
              {renderSmoothDiff(claimB.clinical_text, claimA.clinical_text)}
            </div>
          </div>
        </div>
      </div>

      {/* Rare Fields Overlap Table */}
      {evidence.rare_field_matches.length > 0 && (
        <div className="apple-glass-card border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#101731]">
              Biomarker &amp; Nilai Lab
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-600 border-b border-slate-200/80 font-semibold">
                <tr>
                  <th className="py-3 px-5">Biomarker / Nilai Lab</th>
                  <th className="py-3 px-5">Nilai di {claimA.claim_id}</th>
                  <th className="py-3 px-5">Nilai di {claimB.claim_id}</th>
                  <th className="py-3 px-5 text-center">Status Kesamaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidence.rare_field_matches.map((item, i) => (
                  <tr key={i} className={item.match ? 'bg-rose-50/70' : 'hover:bg-slate-50/50'}>
                    <td className="py-3 px-5 font-mono font-medium text-[#101731]">{item.key}</td>
                    <td className="py-3 px-5 font-mono text-slate-700">{item.valueA}</td>
                    <td className="py-3 px-5 font-mono text-slate-700">{item.valueB}</td>
                    <td className="py-3 px-5 text-center">
                      {item.match ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          Identik (100%)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          Berbeda
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
