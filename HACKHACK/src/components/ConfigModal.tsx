import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Check, Info } from 'lucide-react';
import { ScoringConfig, DEFAULT_SCORING_CONFIG } from '../config/scoringConfig';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScoringConfig;
  onSave: (newConfig: ScoringConfig) => void;
  onReset: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
}) => {
  const [localConfig, setLocalConfig] = useState<ScoringConfig>(config);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_SCORING_CONFIG);
    onReset();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="apple-glass-card rounded-3xl shadow-2xl border border-slate-200/90 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 bg-white/95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#297fbd]/10 text-[#297fbd] border border-[#297fbd]/20 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#101731] tracking-tight">Konfigurasi Parameter Scoring</h2>
              <p className="text-xs text-slate-500">
                Pengaturan bobot analitik &amp; ambang batas deteksi Anti-Cloning dan Anti-Repeat Billing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-[#101731] hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content with tabs/sections */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* Info pill */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-[#212b50] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#297fbd] shrink-0 mt-0.5" />
            <span>
              Parameter di bawah ini adalah simulasi konfigurasi verifikator untuk menguji sensitivitas deteksi. Nilai ini tidak menggantikan regulasi atau tarif resmi BPJS Kesehatan.
            </span>
          </div>

          {/* Section 1: Candidate Generation Threshold */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-[#101731] text-xs sm:text-sm">Threshold Pra-Filter Kandidat (Candidate Match)</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pasangan klaim dengan skor di bawah nilai ini tidak diproses oleh modul detektor lanjutan.
                </p>
              </div>
              <span className="text-sm font-bold font-mono px-2.5 py-0.5 bg-[#297fbd]/10 text-[#297fbd] border border-[#297fbd]/30 rounded-lg">
                {localConfig.candidateThreshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={localConfig.candidateThreshold}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  candidateThreshold: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#297fbd] cursor-pointer"
            />
          </div>

          {/* Section 2: Anti-Cloning Weights */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
            <h3 className="font-semibold text-[#101731] flex items-center justify-between text-xs sm:text-sm">
              <span>Bobot Komponen Anti-Cloning</span>
              <span className="text-[11px] font-mono text-[#297fbd] bg-[#297fbd]/10 border border-[#297fbd]/20 px-2.5 py-0.5 rounded-full">
                Modul 1
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">
                  Kemiripan Teks: <strong className="text-[#297fbd] font-mono">{localConfig.cloningWeights.text_similarity}</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={localConfig.cloningWeights.text_similarity}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      cloningWeights: {
                        ...localConfig.cloningWeights,
                        text_similarity: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#297fbd]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Irisan Nilai Lab Langka: <strong className="text-[#297fbd] font-mono">{localConfig.cloningWeights.rare_field_overlap}</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={localConfig.cloningWeights.rare_field_overlap}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      cloningWeights: {
                        ...localConfig.cloningWeights,
                        rare_field_overlap: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#297fbd]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Faskes Sama: <strong className="text-[#297fbd] font-mono">{localConfig.cloningWeights.same_provider}</strong>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="0.4"
                  step="0.05"
                  value={localConfig.cloningWeights.same_provider}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      cloningWeights: {
                        ...localConfig.cloningWeights,
                        same_provider: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#297fbd]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  DPJP Sama: <strong className="text-[#297fbd] font-mono">{localConfig.cloningWeights.same_practitioner}</strong>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="0.3"
                  step="0.05"
                  value={localConfig.cloningWeights.same_practitioner}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      cloningWeights: {
                        ...localConfig.cloningWeights,
                        same_practitioner: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#297fbd]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Anti-Repeat Billing Weights */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
            <h3 className="font-semibold text-[#101731] flex items-center justify-between text-xs sm:text-sm">
              <span>Bobot Komponen Anti-Repeat Billing</span>
              <span className="text-[11px] font-mono text-[#13712c] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Modul 2
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">
                  Keterikatan Episode Sama: <strong className="text-[#13712c] font-mono">{localConfig.repeatBillingWeights.same_episode}</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={localConfig.repeatBillingWeights.same_episode}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      repeatBillingWeights: {
                        ...localConfig.repeatBillingWeights,
                        same_episode: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#52b754]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Irisan Tindakan / Prosedur: <strong className="text-[#13712c] font-mono">{localConfig.repeatBillingWeights.procedure_overlap}</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={localConfig.repeatBillingWeights.procedure_overlap}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      repeatBillingWeights: {
                        ...localConfig.repeatBillingWeights,
                        procedure_overlap: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#52b754]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Klaim Terdahulu Telah PAID: <strong className="text-[#13712c] font-mono">{localConfig.repeatBillingWeights.previous_claim_paid}</strong>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.05"
                  value={localConfig.repeatBillingWeights.previous_claim_paid}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      repeatBillingWeights: {
                        ...localConfig.repeatBillingWeights,
                        previous_claim_paid: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#52b754]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Kedekatan Tanggal Pelayanan: <strong className="text-[#13712c] font-mono">{localConfig.repeatBillingWeights.date_proximity}</strong>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="0.3"
                  step="0.05"
                  value={localConfig.repeatBillingWeights.date_proximity}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      repeatBillingWeights: {
                        ...localConfig.repeatBillingWeights,
                        date_proximity: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-[#52b754]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Hybrid Risk & Thresholds */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
            <h3 className="font-semibold text-[#101731] text-xs sm:text-sm">
              Rasio Hybrid &amp; Ambang Batas Risiko Tinggi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">
                  Rasio Spesialis vs Pra-Filter: <strong className="text-[#297fbd] font-mono">{Math.round(localConfig.hybridWeights.specialist_weight * 100)}% / {Math.round(localConfig.hybridWeights.candidate_weight * 100)}%</strong>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={localConfig.hybridWeights.specialist_weight}
                  onChange={(e) => {
                    const spec = parseFloat(e.target.value);
                    setLocalConfig({
                      ...localConfig,
                      hybridWeights: {
                        specialist_weight: spec,
                        candidate_weight: Number((1 - spec).toFixed(2)),
                      },
                    });
                  }}
                  className="w-full accent-[#297fbd]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  Batas Ambang Risiko Tinggi: <strong className="text-rose-600 font-mono">{localConfig.thresholds.highRisk.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min="0.50"
                  max="0.90"
                  step="0.05"
                  value={localConfig.thresholds.highRisk}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      thresholds: {
                        ...localConfig.thresholds,
                        highRisk: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="apple-glass-pill flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-[#101731] hover:border-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Nilai Default</span>
          </button>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-[#101731] hover:bg-slate-100 rounded-full transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#297fbd] to-[#52b754] hover:brightness-105 rounded-full shadow-md shadow-blue-500/20 transition"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Konfigurasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
