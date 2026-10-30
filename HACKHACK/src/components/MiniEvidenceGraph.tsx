import React from 'react';
import { Claim } from '../types/claim';

interface MiniEvidenceGraphProps {
  claimA: Claim;
  claimB: Claim;
  route: 'cloning' | 'repeat_billing' | 'dual' | 'normal';
}

export const MiniEvidenceGraph: React.FC<MiniEvidenceGraphProps> = ({ claimA, claimB, route }) => {
  const samePatient =
    claimA.patient_id === claimB.patient_id ||
    (Boolean(claimA.no_rm) && Boolean(claimB.no_rm) && claimA.no_rm === claimB.no_rm);
  const sameEpisode = claimA.episode_id === claimB.episode_id;
  const sameProvider = claimA.provider_id === claimB.provider_id;
  const sameDoctor = claimA.practitioner_id === claimB.practitioner_id;

  const anomalyLabel =
    route === 'cloning'
      ? 'Duplikasi Teks / Lab'
      : route === 'repeat_billing'
      ? 'Penagihan Berulang'
      : route === 'dual'
      ? 'Kloning & Berulang'
      : 'Kandidat Pasangan';

  return (
    <div className="apple-glass-card border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
      <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#101731]">
          Relasi Entitas
        </span>
        <span className="text-[11px] text-[#297fbd] font-mono bg-[#297fbd]/10 border border-[#297fbd]/20 px-2.5 py-0.5 rounded-full">
          Topologi
        </span>
      </div>

      <div className="p-6 bg-transparent overflow-x-auto">
        <div className="min-w-[760px] flex flex-col items-center">
          <svg viewBox="0 0 840 270" className="w-full max-w-4xl h-auto select-none overflow-visible">
            <defs>
              <marker
                id="arrow-blue"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#297fbd" />
              </marker>
              <marker
                id="arrow-green"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#13712c" />
              </marker>
            </defs>

            {/* Column Header Titles */}
            <text x="92.5" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" letterSpacing="1">
              ENTITAS PASIEN
            </text>
            <text x="302.5" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" letterSpacing="1">
              EPISODE PERAWATAN
            </text>
            <text x="517.5" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" letterSpacing="1">
              PENGAJUAN KLAIM
            </text>
            <text x="737.5" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" letterSpacing="1">
              FASKES &amp; DPJP
            </text>

            {/* Segment 1: Pasien to Episode Connectors */}
            {samePatient && sameEpisode ? (
              <path d="M 165 145 L 230 145" stroke="#297fbd" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" />
            ) : samePatient && !sameEpisode ? (
              <>
                <path d="M 165 145 C 197 145, 198 84, 230 84" stroke="#297fbd" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" />
                <path d="M 165 145 C 197 145, 198 206, 230 206" stroke="#13712c" strokeWidth="2" fill="none" markerEnd="url(#arrow-green)" />
              </>
            ) : !samePatient && sameEpisode ? (
              <>
                <path d="M 165 84 C 197 84, 198 145, 230 145" stroke="#297fbd" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" />
                <path d="M 165 206 C 197 206, 198 145, 230 145" stroke="#13712c" strokeWidth="2" fill="none" markerEnd="url(#arrow-green)" />
              </>
            ) : (
              <>
                <path d="M 165 84 L 230 84" stroke="#297fbd" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" />
                <path d="M 165 206 L 230 206" stroke="#13712c" strokeWidth="2" fill="none" markerEnd="url(#arrow-green)" />
              </>
            )}

            {/* Segment 2: Episode to Klaim Connectors */}
            {sameEpisode ? (
              <>
                <path d="M 375 145 C 407 145, 408 84, 440 84" stroke="#297fbd" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" />
                <path d="M 375 145 C 407 145, 408 206, 440 206" stroke="#13712c" strokeWidth="2" fill="none" markerEnd="url(#arrow-green)" />
              </>
            ) : (
              <>
                <path d="M 375 84 L 440 84" stroke="#297fbd" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" />
                <path d="M 375 206 L 440 206" stroke="#13712c" strokeWidth="2" fill="none" markerEnd="url(#arrow-green)" />
              </>
            )}

            {/* Vertical Anomaly Connector between Klaim A and Klaim B */}
            <line x1="517.5" y1="118" x2="517.5" y2="172" stroke="#e11d48" strokeWidth="2" strokeDasharray="4 3" />
            <rect x="437.5" y="133" width="160" height="24" rx="12" fill="#fff1f2" stroke="#fecdd3" strokeWidth="1" />
            <text x="517.5" y="149" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#be123c">
              {anomalyLabel}
            </text>

            {/* Segment 3: Klaim to Faskes Connectors */}
            {sameProvider ? (
              <>
                <path d="M 595 84 C 627 84, 628 145, 660 145" stroke="#297fbd" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" />
                <path d="M 595 206 C 627 206, 628 145, 660 145" stroke="#13712c" strokeWidth="2" fill="none" markerEnd="url(#arrow-green)" />
              </>
            ) : (
              <>
                <path d="M 595 84 L 660 84" stroke="#297fbd" strokeWidth="2" fill="none" markerEnd="url(#arrow-blue)" />
                <path d="M 595 206 L 660 206" stroke="#13712c" strokeWidth="2" fill="none" markerEnd="url(#arrow-green)" />
              </>
            )}

            {/* Column 1: Patient Nodes */}
            {samePatient ? (
              <g>
                <rect x="20" y="108" width="145" height="74" rx="14" fill="#fef3c7" stroke="#fde68a" strokeWidth="1.5" />
                <text x="92.5" y="136" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#78350f">
                  {claimA.patient_id}
                </text>
                <rect x="44.5" y="148" width="96" height="18" rx="9" fill="#fde68a" />
                <text x="92.5" y="161" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#92400e">
                  Pasien Sama
                </text>
              </g>
            ) : (
              <>
                <g>
                  <rect x="20" y="50" width="145" height="68" rx="14" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
                  <text x="92.5" y="78" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#1e3a8a">
                    {claimA.patient_id}
                  </text>
                  <text x="92.5" y="98" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#297fbd">
                    Pasien A
                  </text>
                </g>
                <g>
                  <rect x="20" y="172" width="145" height="68" rx="14" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
                  <text x="92.5" y="200" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#064e3b">
                    {claimB.patient_id}
                  </text>
                  <text x="92.5" y="220" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#13712c">
                    Pasien B (Berbeda)
                  </text>
                </g>
              </>
            )}

            {/* Column 2: Episode Nodes */}
            {sameEpisode ? (
              <g>
                <rect x="230" y="108" width="145" height="74" rx="14" fill="#fff1f2" stroke="#fecdd3" strokeWidth="1.5" />
                <text x="302.5" y="136" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#9f1239">
                  {claimA.episode_id}
                </text>
                <rect x="249.5" y="148" width="106" height="18" rx="9" fill="#fecdd3" />
                <text x="302.5" y="161" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#be123c">
                  ID Episode Sama
                </text>
              </g>
            ) : (
              <>
                <g>
                  <rect x="230" y="50" width="145" height="68" rx="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="302.5" y="78" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#1e293b">
                    {claimA.episode_id}
                  </text>
                  <text x="302.5" y="98" textAnchor="middle" fontSize="10" fill="#64748b">
                    Episode A
                  </text>
                </g>
                <g>
                  <rect x="230" y="172" width="145" height="68" rx="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="302.5" y="200" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" fill="#1e293b">
                    {claimB.episode_id}
                  </text>
                  <text x="302.5" y="220" textAnchor="middle" fontSize="10" fill="#64748b">
                    Episode B (Terpisah)
                  </text>
                </g>
              </>
            )}

            {/* Column 3: Klaim Nodes */}
            <g>
              <rect x="440" y="50" width="155" height="68" rx="14" fill="#ffffff" stroke="#297fbd" strokeWidth="1.5" />
              <text x="452" y="73" fontSize="11.5" fontWeight="bold" fontFamily="monospace" fill="#297fbd">
                {claimA.claim_id}
              </text>
              <rect x="540" y="60" width="46" height="16" rx="8" fill="#ecfdf5" stroke="#a7f3d0" />
              <text x="563" y="72" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#047857">
                {claimA.claim_status.toUpperCase()}
              </text>
              <text x="452" y="92" fontSize="10" fontFamily="monospace" fill="#475569">
                Rp {claimA.billed_amount.toLocaleString('id-ID')}
              </text>
              <text x="452" y="106" fontSize="9" fill="#94a3b8">
                {claimA.service_date}
              </text>
            </g>

            <g>
              <rect x="440" y="172" width="155" height="68" rx="14" fill="#ffffff" stroke="#13712c" strokeWidth="1.5" />
              <text x="452" y="195" fontSize="11.5" fontWeight="bold" fontFamily="monospace" fill="#13712c">
                {claimB.claim_id}
              </text>
              <rect x="540" y="182" width="46" height="16" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
              <text x="563" y="194" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1d4ed8">
                {claimB.claim_status.toUpperCase()}
              </text>
              <text x="452" y="214" fontSize="10" fontFamily="monospace" fill="#475569">
                Rp {claimB.billed_amount.toLocaleString('id-ID')}
              </text>
              <text x="452" y="228" fontSize="9" fill="#94a3b8">
                {claimB.service_date}
              </text>
            </g>

            {/* Column 4: Faskes & DPJP Nodes */}
            {sameProvider ? (
              <g>
                <rect x="660" y="104" width="155" height="82" rx="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="737.5" y="126" textAnchor="middle" fontSize="10.5" fontWeight="bold" fontFamily="monospace" fill="#1e293b">
                  {claimA.provider_id}
                </text>
                {sameDoctor ? (
                  <>
                    <text x="737.5" y="145" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#297fbd">
                      DPJP: {claimA.practitioner_id}
                    </text>
                    <rect x="687.5" y="156" width="100" height="18" rx="9" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="737.5" y="169" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#297fbd">
                      DPJP Sama
                    </text>
                  </>
                ) : (
                  <>
                    <text x="737.5" y="144" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#475569">
                      {claimA.practitioner_id} vs {claimB.practitioner_id}
                    </text>
                    <rect x="687.5" y="156" width="100" height="18" rx="9" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
                    <text x="737.5" y="169" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
                      DPJP Berbeda
                    </text>
                  </>
                )}
              </g>
            ) : (
              <>
                <g>
                  <rect x="660" y="50" width="155" height="68" rx="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="737.5" y="78" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#1e293b">
                    {claimA.provider_id}
                  </text>
                  <text x="737.5" y="98" textAnchor="middle" fontSize="9.5" fill="#64748b">
                    DPJP: {claimA.practitioner_id}
                  </text>
                </g>
                <g>
                  <rect x="660" y="172" width="155" height="68" rx="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="737.5" y="200" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#1e293b">
                    {claimB.provider_id}
                  </text>
                  <text x="737.5" y="220" textAnchor="middle" fontSize="9.5" fill="#64748b">
                    DPJP: {claimB.practitioner_id}
                  </text>
                </g>
              </>
            )}
          </svg>

          {/* Topology Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-600 border-t border-slate-100 pt-3.5 w-full">
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[#297fbd] inline-block rounded-full"></span>
              <span>Alur Klaim A ({claimA.claim_id})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[#13712c] inline-block rounded-full"></span>
              <span>Alur Klaim B ({claimB.claim_id})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-rose-500 inline-block"></span>
              <span>Korelasi Anomali Antar-Klaim</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
