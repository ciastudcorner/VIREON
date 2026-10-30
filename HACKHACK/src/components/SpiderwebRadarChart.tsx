import React, { useState } from 'react';
import { HybridRiskAssessment, getPriorityMeta } from '../types/claim';
import { Info } from 'lucide-react';

interface SpiderwebRadarChartProps {
  assessment: HybridRiskAssessment;
  size?: number;
}

interface DimensionPoint {
  label: string;
  shortLabel: string;
  value: number; // 0 - 1
  category: 'candidate' | 'cloning' | 'repeat' | 'provider';
  description: string;
}

export const SpiderwebRadarChart: React.FC<SpiderwebRadarChartProps> = ({
  assessment,
  size = 320,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<DimensionPoint | null>(null);

  const { candidate_score, cloning_evidence, repeat_billing_evidence, risk_category } = assessment;

  // Extract normalized 0 - 1 dimensions for the radar
  const textSim = cloning_evidence ? cloning_evidence.text_similarity : 0;
  const rareSim = cloning_evidence ? cloning_evidence.rare_field_overlap_ratio : 0;
  
  const sameProv = cloning_evidence?.same_provider || false;
  const sameDoc = cloning_evidence?.same_practitioner || false;
  const providerDoctorVal = (sameProv ? 0.5 : 0) + (sameDoc ? 0.5 : 0);

  const sameEp = repeat_billing_evidence?.same_episode || false;
  const procSim = repeat_billing_evidence ? repeat_billing_evidence.procedure_overlap_ratio : 0;
  const episodeProcVal = (sameEp ? 0.5 : 0) + (procSim * 0.5);

  const priorPaid = repeat_billing_evidence?.previous_claim_paid || false;
  const gapDays = repeat_billing_evidence ? repeat_billing_evidence.service_date_gap_days : 999;
  let paidConflictVal = 0;
  if (priorPaid) {
    paidConflictVal = gapDays === 0 ? 1.0 : gapDays <= 7 ? 0.85 : gapDays <= 30 ? 0.6 : 0.4;
  }

  const dimensions: DimensionPoint[] = [
    {
      label: 'Kesesuaian Awal Kandidat',
      shortLabel: 'Kandidat',
      value: candidate_score,
      category: 'candidate',
      description: `Relevansi pra-filter pasangan klaim (${Math.round(candidate_score * 100)}%)`,
    },
    {
      label: 'Kemiripan Narasi Medis',
      shortLabel: 'Teks Klinis',
      value: textSim,
      category: 'cloning',
      description: `Kemiripan narasi medis setelah pembersihan template (${Math.round(textSim * 100)}%)`,
    },
    {
      label: 'Irisan Nilai Lab Langka',
      shortLabel: 'Lab Langka',
      value: rareSim,
      category: 'cloning',
      description: `Kesamaan identik nilai lab biomarker: ${Math.round(rareSim * 100)}%`,
    },
    {
      label: 'Keterikatan Faskes & DPJP',
      shortLabel: 'Faskes & DPJP',
      value: providerDoctorVal,
      category: 'provider',
      description: `Relasi faskes (${sameProv ? 'Sama' : 'Berbeda'}) & dokter DPJP (${sameDoc ? 'Sama' : 'Berbeda'})`,
    },
    {
      label: 'Irisan Episode & Tindakan',
      shortLabel: 'Episode & Tindakan',
      value: episodeProcVal,
      category: 'repeat',
      description: `Kesamaan episode perawatan & irisan kode tindakan (${Math.round(episodeProcVal * 100)}%)`,
    },
    {
      label: 'Konflik Kronologi Pembayaran',
      shortLabel: 'Status Bayar',
      value: paidConflictVal,
      category: 'repeat',
      description: priorPaid
        ? `Klaim sebelumnya sudah berstatus PAID (${Math.round(paidConflictVal * 100)}%)`
        : 'Tidak ada konflik pembayaran klaim sebelumnya (0%)',
    },
  ];

  // SVG Geometry calculations
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const totalAxes = dimensions.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Grid level rings: 20%, 40%, 60%, 80%, 100%
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = cx + radius * value * Math.cos(angle);
    const y = cy + radius * value * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = dimensions
    .map((dim, i) => {
      const { x, y } = getCoordinates(dim.value, i);
      return `${x},${y}`;
    })
    .join(' ');

  const priorityMeta = getPriorityMeta(risk_category);
  const isHigh = priorityMeta.label === 'Tinggi';
  const isSuspicious = priorityMeta.label === 'Sedang';

  const strokeColor = isHigh ? '#e11d48' : isSuspicious ? '#d97706' : '#13712c';
  const fillColor = isHigh
    ? 'rgba(225, 29, 72, 0.22)'
    : isSuspicious
    ? 'rgba(217, 119, 6, 0.22)'
    : 'rgba(19, 113, 44, 0.22)';

  return (
    <div className="apple-glass-card border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Left / Chart Section */}
      <div className="relative flex flex-col items-center">
        <svg width={size} height={size} className="overflow-visible select-none">
          {/* Background Concentric Grid Rings */}
          {levels.map((lvl, lIdx) => {
            const ringPoints = Array.from({ length: totalAxes })
              .map((_, i) => {
                const { x, y } = getCoordinates(lvl, i);
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <g key={lIdx}>
                <polygon
                  points={ringPoints}
                  fill={lIdx % 2 === 0 ? 'rgba(241, 245, 249, 0.7)' : 'rgba(255, 255, 255, 0.8)'}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={cx + 3}
                  y={cy - radius * lvl + 9}
                  fontSize="8"
                  fill="#64748b"
                  className="font-mono"
                >
                  {Math.round(lvl * 100)}%
                </text>
              </g>
            );
          })}

          {/* Radial Axis Spokes */}
          {dimensions.map((dim, i) => {
            const { x, y } = getCoordinates(1.0, i);
            const labelCoord = getCoordinates(1.24, i);

            return (
              <g key={i}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={labelCoord.x}
                  y={labelCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9.5"
                  className="font-semibold fill-[#212b50] cursor-pointer hover:fill-[#297fbd] transition"
                  onClick={() => setActiveTooltip(dim)}
                >
                  {dim.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Shaded Risk Polygon Area */}
          <polygon
            points={polygonPoints}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Data Point Dots on Vertices */}
          {dimensions.map((dim, i) => {
            const { x, y } = getCoordinates(dim.value, i);
            return (
              <g key={i} className="cursor-pointer" onClick={() => setActiveTooltip(dim)}>
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill="#ffffff"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                />
                <circle cx={x} cy={y} r="2" fill={strokeColor} />
              </g>
            );
          })}
        </svg>

        <span className="text-[10px] text-slate-500 mt-2 font-mono">
          Diagram 6 Dimensi (0% - 100%)
        </span>
      </div>

      {/* Right / Information & Dimension Decomposition */}
      <div className="flex-1 space-y-3.5 w-full">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#101731]">
            Diagram Dimensi Risiko
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${priorityMeta.badgeClass}`}
          >
            Prioritas {priorityMeta.label}
          </span>
        </div>

        {/* Dimension Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {dimensions.map((dim, idx) => {
            const pct = Math.round(dim.value * 100);
            const isDominant = dim.value >= 0.7;

            return (
              <div
                key={idx}
                onClick={() => setActiveTooltip(dim)}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  activeTooltip?.shortLabel === dim.shortLabel
                    ? 'border-[#297fbd] bg-[#297fbd]/10 shadow-sm'
                    : isDominant
                    ? 'border-rose-200 bg-rose-50/70 hover:border-rose-300'
                    : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 truncate font-medium">{dim.shortLabel}</span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isDominant
                        ? 'text-rose-600'
                        : pct > 40
                        ? 'text-amber-600'
                        : 'text-[#13712c]'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isDominant
                        ? 'bg-rose-500'
                        : pct > 40
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-[#297fbd] to-[#52b754]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Tooltip Context Box */}
        {activeTooltip ? (
          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-[#212b50] flex items-start gap-2 shadow-xs">
            <Info className="w-4 h-4 text-[#297fbd] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#101731] block">{activeTooltip.label}:</span>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {activeTooltip.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Klik salah satu sumbu diagram atau kotak metrik untuk melihat rincian klinis dimensi terkait.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
