import React, { useState, useMemo } from 'react';
import { Claim, HybridRiskAssessment, ReviewDecisionType, getPriorityMeta } from './types/claim';
import { SAMPLE_CLAIMS } from './data/sampleClaims';
import {
  ScoringConfig,
  loadScoringConfig,
  saveScoringConfig,
  resetScoringConfig,
} from './config/scoringConfig';
import { harmonizeClaimBatch } from './services/harmonizationService';
import { generateCandidatePairs } from './services/candidateService';
import { assessAllCandidatePairs } from './services/hybridRiskService';
import { getAuditLogs, saveAuditLog } from './services/auditService';
import { saveOCRProvenance, clearOCRProvenances } from './services/ocrService';

import {
  getHistoricalBackendClaims,
  loadHistoricalBackendClaims,
} from './services/historicalBackendService';

// Riwayat sumber berkas selalu mulai dari 0 setiap aplikasi dibuka
clearOCRProvenances();

import { NavTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { ConfigModal } from './components/ConfigModal';
import { WelcomeView } from './components/WelcomeView';
import { DashboardView } from './components/DashboardView';
import { DataInputView } from './components/DataInputView';
import { ReviewQueueView } from './components/ReviewQueueView';
import { CaseInvestigationView } from './components/CaseInvestigationView';
import { AuditLogView } from './components/AuditLogView';
import { PanelLeftClose, PanelLeftOpen, Sliders } from 'lucide-react';

export function App() {
  // Navigation State
  const [showLanding, setShowLanding] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedCase, setSelectedCase] = useState<HybridRiskAssessment | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [verifierName, setVerifierName] = useState<string>(
    () => localStorage.getItem('vireon_verifier_name') || 'dr. Hendra P.'
  );
  const [isEditingName, setIsEditingName] = useState(false);

  const saveVerifierName = (value: string) => {
    const name = value.trim() || 'dr. Hendra P.';
    setVerifierName(name);
    localStorage.setItem('vireon_verifier_name', name);
    setIsEditingName(false);
  };
  const verifierInitials = verifierName
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'V';

  // Core Data State: Pre-loaded with 300 Enriched Historical JKN Claims in Backend!
  const [claims, setClaims] = useState<Claim[]>(() => getHistoricalBackendClaims());
  const [config, setConfig] = useState<ScoringConfig>(loadScoringConfig());
  const [auditLogs, setAuditLogs] = useState(getAuditLogs());

  // Count incoming claims that were submitted for review during this session
  const incomingClaimsCount = useMemo(() => {
    return claims.filter((c) => c.is_incoming || c.record_role === 'incoming_draft' || c.claim_id.startsWith('IN-')).length;
  }, [claims]);

  // Pipeline Step 1: Harmonization & Preprocessing
  const harmonizedRecords = useMemo(() => {
    return harmonizeClaimBatch(claims, 'active_repository', 'synthetic');
  }, [claims]);

  // Pipeline Step 2: Candidate Generation (with Candidate Match Score)
  const candidatePairs = useMemo(() => {
    return generateCandidatePairs(claims, config);
  }, [claims, config]);

  // Pipeline Step 3 & 4: Specialist Detectors & Hybrid Risk Engine
  const assessments = useMemo(() => {
    return assessAllCandidatePairs(candidatePairs, config);
  }, [candidatePairs, config]);

  // Handlers
  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    setSelectedCase(null);
  };

  const handleSelectCase = (assessment: HybridRiskAssessment) => {
    setSelectedCase(assessment);
  };

  const handleBackToQueue = () => {
    setSelectedCase(null);
  };

  const handleSubmitReview = (data: {
    decision: ReviewDecisionType;
    reviewer_name: string;
    reviewer_note: string;
  }) => {
    if (!selectedCase) return;

    const saved = saveAuditLog({
      pair_id: selectedCase.pair_id,
      claim_a_id: selectedCase.candidate_pair.claimA.claim_id,
      claim_b_id: selectedCase.candidate_pair.claimB.claim_id,
      detection_route: selectedCase.detection_route,
      candidate_score: selectedCase.candidate_score,
      cloning_score: selectedCase.cloning_score,
      repeat_billing_score: selectedCase.repeat_billing_score,
      final_risk_score: selectedCase.final_fraud_risk_score,
      risk_category: selectedCase.risk_category,
      decision: data.decision,
      reviewer_name: data.reviewer_name,
      reviewer_note: data.reviewer_note,
      action_summary: `Verifikator mencatat keputusan: ${data.decision}`,
    });

    setAuditLogs([saved, ...auditLogs]);
  };

  const handleSaveConfig = (newConfig: ScoringConfig) => {
    saveScoringConfig(newConfig);
    setConfig(newConfig);
  };

  const handleResetConfig = () => {
    const def = resetScoringConfig();
    setConfig(def);
  };

  const handleResetData = () => {
    if (window.confirm('Bersihkan seluruh berkas klaim masuk dan pulihkan ke 300 data riwayat backend awal?')) {
      const baseline = getHistoricalBackendClaims();
      setClaims(baseline);
      clearOCRProvenances();
      setSelectedCase(null);
    }
  };

  const handleLoad300Dataset = async () => {
    try {
      const newClaims = await loadHistoricalBackendClaims();
      setClaims(newClaims);
      setSelectedCase(null);

      saveOCRProvenance({
        document_id: 'DOC-BATCH-JKN-300',
        claim_id: '300 Klaim Riwayat Backend (HIST-001 s.d. HIST-300)',
        document_type: 'Database Riwayat JKN FKRTL Enriched',
        source_format: 'application/jsonl',
        ocr_text: 'Dataset riwayat 300 klaim JKN FKRTL aktif di backend (jkn_historical_300_enriched.jsonl). Siap dikomparasikan terhadap klaim masuk.',
        ocr_confidence: 100,
        data_source: 'jkn_historical_backend',
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      alert(`Gagal memuat dataset: ${err.message}`);
    }
  };

  const handleAddClaims = (newClaims: Claim[]) => {
    let currentClaims = [...claims];
    const existingIds = new Set(currentClaims.map((c) => c.claim_id));

    const processedNew: Claim[] = [];
    for (const c of newClaims) {
      if (existingIds.has(c.claim_id)) {
        // If exact claim_id already exists in system, register as repeat billing re-submission!
        const repeatId = `${c.claim_id}-R`;

        // Mark the prior existing claim as 'paid' so it models an already-disbursed claim
        currentClaims = currentClaims.map((ec) =>
          ec.claim_id === c.claim_id
            ? {
                ...ec,
                claim_status: 'paid' as const,
                paid_date: ec.paid_date || ec.service_date || '2024-06-27',
              }
            : ec
        );

        processedNew.push({
          ...c,
          claim_id: repeatId,
          claim_status: 'draft' as const,
          claim_date: c.claim_date || new Date().toISOString().slice(0, 10),
          is_incoming: true,
          record_role: 'incoming_draft' as const,
        });
      } else {
        processedNew.push({
          ...c,
          is_incoming: true,
          record_role: (c.record_role || 'incoming_draft') as 'incoming_draft',
        });
      }
    }

    setClaims([...processedNew, ...currentClaims]);
  };

  const reviewedPairIds = useMemo(() => new Set(auditLogs.map((l) => l.pair_id)), [auditLogs]);
  const pendingReviewCount = useMemo(() => {
    return assessments.filter((a) => {
      if (reviewedPairIds.has(a.pair_id)) return false;
      const meta = getPriorityMeta(a.risk_category);
      return meta.label === 'Tinggi' || meta.label === 'Sedang';
    }).length;
  }, [assessments, reviewedPairIds]);

  // Standalone landing page (outside the sidebar/app shell)
  if (showLanding) {
    return (
      <WelcomeView
        onEnterApp={(tab) => {
          setSelectedCase(null);
          setCurrentTab(tab && tab !== 'welcome' ? tab : 'dashboard');
          setShowLanding(false);
        }}
        claimCount={claims.length}
        pairCount={assessments.length}
        pendingReviewCount={pendingReviewCount}
        onLoad300Dataset={handleLoad300Dataset}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fbfcfd] text-[#101731] font-sans selection:bg-[#297fbd]/20 selection:text-[#297fbd] relative overflow-x-hidden">
      {/* Apple Environmental Ambient Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#297fbd]/8 rounded-full blur-[140px] opacity-75" />
        <div className="absolute top-1/4 -right-32 w-[550px] h-[550px] bg-[#52b754]/8 rounded-full blur-[130px] opacity-70" />
        <div className="absolute -bottom-48 left-1/3 w-[650px] h-[650px] bg-[#d6df41]/10 rounded-full blur-[160px] opacity-65" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(41,127,189,0.04),transparent_70%)]" />
      </div>

      {/* Left Tablet-Style Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onResetData={handleResetData}
        pendingReviewCount={pendingReviewCount}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onExitToLanding={() => { setSelectedCase(null); setShowLanding(true); }}
        verifierName={verifierName}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto relative z-10">
        {/* Apple VisionOS Frosted Glass Header */}
        <header className="sticky top-0 z-20 h-14 apple-glass-header px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="apple-glass-pill inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#212b50] hover:text-[#101731] hover:border-[#297fbd]/40 cursor-pointer shadow-xs"
              title={isSidebarOpen ? "Sembunyikan Panel Samping" : "Buka Panel Samping"}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-4 h-4 text-[#297fbd]" />
                  <span className="hidden sm:inline">Tutup Panel</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-[#297fbd]" />
                  <span>Buka Menu</span>
                </>
              )}
            </button>

            {/* Brand Logo when sidebar is closed */}
            {!isSidebarOpen && (
              <div
                onClick={() => { setSelectedCase(null); setShowLanding(true); }}
                className="flex items-center gap-2 mr-1 cursor-pointer group"
                title="Kembali ke Beranda VIREON"
              >
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 group-hover:border-[#297fbd] p-1 flex items-center justify-center shrink-0 shadow-xs transition">
                  <img
                    src="/vireon-logo.png"
                    alt="Vireon"
                    className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition"
                  />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-[#101731] group-hover:text-[#297fbd] hidden xs:inline transition">VIREON</span>
              </div>
            )}

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Breadcrumb Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span
                onClick={() => { setSelectedCase(null); setShowLanding(true); }}
                className="font-bold text-[#101731] hover:text-[#297fbd] cursor-pointer transition"
                title="Buka Beranda"
              >
                VIREON
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-[#297fbd] font-semibold">
                {selectedCase ? 'Investigasi Kasus' : (
                  currentTab === 'welcome' ? 'Beranda' :
                  currentTab === 'dashboard' ? 'Dashboard' :
                  currentTab === 'data-input' ? 'Input Data' :
                  currentTab === 'review-queue' ? 'Antrean Verifikasi' : 'Log Audit'
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="apple-glass-pill text-[11px] text-[#212b50] hidden md:flex items-center gap-2 px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-[#52b754] animate-pulse" />
              <span>Klaim: <strong className="text-[#101731] font-bold">{claims.length}</strong></span>
            </div>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="apple-glass-pill p-1.5 text-[#212b50] hover:text-[#297fbd] hover:border-[#297fbd]/40 cursor-pointer"
              title="Parameter Penilaian"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#297fbd] to-[#52b754] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                {verifierInitials}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                {isEditingName ? (
                  <input
                    autoFocus
                    defaultValue={verifierName}
                    maxLength={40}
                    onBlur={(e) => saveVerifierName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveVerifierName((e.target as HTMLInputElement).value);
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    className="w-36 text-xs font-semibold text-[#101731] bg-white border border-[#297fbd] rounded-md px-1.5 py-0.5 focus:outline-hidden"
                  />
                ) : (
                  <p
                    onClick={() => setIsEditingName(true)}
                    title="Klik untuk ganti nama"
                    className="text-xs font-semibold text-[#101731] leading-tight cursor-pointer hover:text-[#297fbd] truncate max-w-[10rem]"
                  >
                    {verifierName}
                  </p>
                )}
                <p className="text-[10px] text-[#297fbd] font-medium">Verifikator Medis</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {selectedCase ? (
            <CaseInvestigationView
              assessment={selectedCase}
              verifierName={verifierName}
              onBack={handleBackToQueue}
              onSubmitReview={handleSubmitReview}
              onGoToAudit={() => {
                setSelectedCase(null);
                setCurrentTab('audit-log');
              }}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  harmonizedClaims={harmonizedRecords}
                  assessments={assessments}
                  auditLogs={auditLogs}
                  onSelectCase={handleSelectCase}
                  onNavigateTab={handleTabChange}
                  onLoad300Dataset={handleLoad300Dataset}
                  onResetData={handleResetData}
                />
              )}

              {currentTab === 'data-input' && (
                <DataInputView
                  harmonizedClaims={harmonizedRecords}
                  onAddClaims={handleAddClaims}
                  onRefreshData={() => setClaims([...claims])}
                  onNavigateTab={handleTabChange}
                />
              )}

              {currentTab === 'review-queue' && (
                <ReviewQueueView
                  assessments={assessments}
                  auditLogs={auditLogs}
                  onSelectCase={handleSelectCase}
                  onNavigateTab={handleTabChange}
                />
              )}

              {currentTab === 'audit-log' && (
                <AuditLogView
                  logs={auditLogs}
                  onRefreshLogs={() => setAuditLogs(getAuditLogs())}
                />
              )}
            </>
          )}
        </main>

        {/* Apple VisionOS Frosted Glass Footer */}
        <footer className="apple-glass-header border-t border-b-0 py-4 px-6 text-[#90a29f] text-xs mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                onClick={() => { setSelectedCase(null); setShowLanding(true); }}
                className="font-bold text-[#101731] hover:text-[#297fbd] cursor-pointer transition font-mono"
              >
                VIREON 2026
              </span>
            </div>
            <div className="text-[11px] text-slate-500 text-center sm:text-right">
              Anti-Cloning &amp; Anti-Repeat Billing
            </div>
          </div>
        </footer>
      </div>

      {/* Scoring Configuration Modal */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
      />
    </div>
  );
}

export default App;
