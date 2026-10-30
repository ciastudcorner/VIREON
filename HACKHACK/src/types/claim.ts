export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'paid' | 'rejected';

export interface RareFields {
  [key: string]: string | number;
}

export interface Claim {
  claim_id: string; // Identitas unik data klaim yang masuk ke sistem perantara RS - BPJS (contoh: CLM-001 dst)
  no_rm?: string; // Nomor Rekam Medis pasien yang diambil dari data yang masuk
  sep_number?: string; // Nomor SEP yang diambil dari data yang masuk
  patient_id: string;
  practitioner_id: string;
  provider_id: string;
  encounter_id: string;
  episode_id: string;
  service_date: string;
  claim_date: string;
  diagnosis: string[];
  procedure: string[];
  clinical_text: string;
  rare_fields?: RareFields;
  billed_amount: number;
  claim_status: ClaimStatus;
  paid_date?: string;
  data_source: string;
  record_role?: 'historical_reference' | 'incoming_draft';
  comparison_target?: string;
  scenario?: string;
  is_incoming?: boolean;
  patient_display_name?: string;
}

export interface HarmonizedClaimRecord {
  claim: Claim;
  data_quality_score: number; // 0 - 100
  quality_issues: string[];
  normalized: boolean;
  provenance: {
    source: string;
    ingested_at: string;
    format: 'json' | 'jsonl' | 'ocr' | 'synthetic';
  };
}

export interface OCRProvenance {
  document_id: string;
  claim_id: string;
  document_type: string;
  source_format: string;
  ocr_text: string;
  ocr_confidence: number;
  data_source: string;
  created_at: string;
  image_preview?: string;
}

export interface MatchFactor {
  factor: string;
  weight: number;
  score: number;
  description: string;
}

export interface CandidatePair {
  pair_id: string;
  claimA: Claim;
  claimB: Claim;
  candidate_match_score: number; // 0 - 1 (NOT fraud probability)
  match_factors: MatchFactor[];
  passes_threshold: boolean;
  suggested_route: 'cloning' | 'repeat_billing' | 'dual' | 'unassigned';
}

export interface RareFieldMatch {
  key: string;
  valueA: string | number;
  valueB: string | number;
  match: boolean;
}

export interface CloningEvidence {
  cloning_score: number; // 0 - 1
  text_similarity: number; // 0 - 1
  template_suppressed_text_A: string;
  template_suppressed_text_B: string;
  overlapping_tokens: string[];
  overlapping_phrases: string[];
  rare_field_overlap_ratio: number;
  rare_field_matches: RareFieldMatch[];
  same_provider: boolean;
  same_practitioner: boolean;
  different_patient: boolean;
  risk_reason: string;
}

export interface RepeatBillingEvidence {
  repeat_billing_score: number; // 0 - 1
  same_patient: boolean;
  same_episode: boolean;
  same_encounter: boolean;
  procedure_overlap_ratio: number;
  matching_procedures: string[];
  previous_claim_paid: boolean;
  paid_claim_id?: string;
  paid_date?: string;
  new_claim_date?: string;
  service_date_gap_days: number;
  amount_similarity: number;
  reason_codes: { code: string; label: string; severity: 'high' | 'medium' | 'info' }[];
  is_legitimate_different_episode: boolean;
  risk_reason: string;
}

export type RiskCategory =
  | 'Tinggi'
  | 'Sedang'
  | 'Rendah'
  | 'Normal / Prioritas Rendah'
  | 'Mencurigakan / Perlu Verifikasi'
  | 'Risiko Tinggi / Prioritas Investigasi';

export interface PriorityMeta {
  label: 'Tinggi' | 'Sedang' | 'Rendah';
  badgeClass: string;
  textClass: string;
  bgPillClass: string;
}

export function getPriorityMeta(category: string): PriorityMeta {
  if (category === 'Tinggi' || category.includes('Tinggi')) {
    return {
      label: 'Tinggi',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      textClass: 'text-rose-600',
      bgPillClass: 'bg-rose-600 text-white',
    };
  }
  if (category === 'Sedang' || category.includes('Sedang') || category.includes('Mencurigakan')) {
    return {
      label: 'Sedang',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      textClass: 'text-amber-600',
      bgPillClass: 'bg-amber-500 text-white',
    };
  }
  return {
    label: 'Rendah',
    badgeClass: 'bg-emerald-50 text-[#13712c] border-emerald-200',
    textClass: 'text-[#13712c]',
    bgPillClass: 'bg-[#13712c] text-white',
  };
}

export interface RiskBreakdownItem {
  label: string;
  value: number;
  weight: number;
  contribution: number;
  detail: string;
}

export interface HybridRiskAssessment {
  pair_id: string;
  candidate_pair: CandidatePair;
  detection_route: 'cloning' | 'repeat_billing' | 'dual' | 'normal';
  candidate_score: number;
  cloning_score: number;
  repeat_billing_score: number;
  final_fraud_risk_score: number; // 0 - 1
  risk_category: RiskCategory;
  cloning_evidence?: CloningEvidence;
  repeat_billing_evidence?: RepeatBillingEvidence;
  breakdown: RiskBreakdownItem[];
  primary_flags: string[];
}

export type ReviewDecisionType =
  | 'Bersih / Tanpa Anomali'
  | 'Perlu Verifikasi Lanjutan'
  | 'Eskalasi Investigasi';

export interface ReviewQueueFilter {
  riskCategory: 'Semua' | 'Tinggi' | 'Sedang' | 'Rendah' | 'Risiko Tinggi' | 'Mencurigakan' | 'Normal';
  route: 'all' | 'cloning' | 'repeat_billing';
  searchQuery: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  pair_id: string;
  claim_a_id: string;
  claim_b_id: string;
  detection_route: string;
  candidate_score: number;
  cloning_score: number;
  repeat_billing_score: number;
  final_risk_score: number;
  risk_category: RiskCategory;
  decision: ReviewDecisionType;
  reviewer_name: string;
  reviewer_note: string;
  action_summary: string;
}
