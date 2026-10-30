import { CandidatePair, HybridRiskAssessment, RiskCategory, RiskBreakdownItem } from '../types/claim';
import { ScoringConfig } from '../config/scoringConfig';
import { evaluateCloning } from './cloningService';
import { evaluateRepeatBilling } from './repeatBillingService';

/**
 * Computes Hybrid Fraud Risk Assessment combining candidate factors and specialist engines
 */
export function assessHybridRisk(
  candidatePair: CandidatePair,
  config: ScoringConfig
): HybridRiskAssessment {
  const { claimA, claimB, candidate_match_score } = candidatePair;

  // Run specialist detectors
  const cloningEvidence = evaluateCloning(claimA, claimB, config);
  const repeatBillingEvidence = evaluateRepeatBilling(claimA, claimB, config);

  const cloningScore = cloningEvidence.cloning_score;
  const repeatBillingScore = repeatBillingEvidence.repeat_billing_score;

  // Route identification
  let detection_route: HybridRiskAssessment['detection_route'] = 'normal';
  let primarySpecialistScore = 0;

  if (repeatBillingScore > 0.35 && repeatBillingScore >= cloningScore) {
    detection_route = 'repeat_billing';
    primarySpecialistScore = repeatBillingScore;
  } else if (cloningScore > 0.35 && cloningScore > repeatBillingScore) {
    detection_route = 'cloning';
    primarySpecialistScore = cloningScore;
  } else if (cloningScore > 0.35 && repeatBillingScore > 0.35) {
    detection_route = 'dual';
    primarySpecialistScore = Math.max(cloningScore, repeatBillingScore);
  } else {
    // Normal / low specialist signals
    detection_route = candidatePair.suggested_route === 'repeat_billing' ? 'repeat_billing' : 'cloning';
    primarySpecialistScore = Math.max(cloningScore, repeatBillingScore);
  }

  // If repeat billing was explicitly cleared as legitimate different episode
  if (repeatBillingEvidence.is_legitimate_different_episode) {
    primarySpecialistScore = 0.05;
  }

  // Hybrid Combination Formula:
  // Final Score = candidate_weight * candidate_match_score + specialist_weight * primary_specialist_score
  const candWeight = config.hybridWeights.candidate_weight;
  const specWeight = config.hybridWeights.specialist_weight;

  const candidateContribution = candidate_match_score * candWeight;
  const specialistContribution = primarySpecialistScore * specWeight;

  const rawFinalScore = candidateContribution + specialistContribution;
  const final_fraud_risk_score = Number(Math.max(0, Math.min(1, rawFinalScore)).toFixed(3));

  // Determine Risk Category
  let risk_category: RiskCategory = 'Rendah';
  if (final_fraud_risk_score >= config.thresholds.highRisk) {
    risk_category = 'Tinggi';
  } else if (final_fraud_risk_score >= config.thresholds.suspicious) {
    risk_category = 'Sedang';
  }

  // Construct detailed breakdown for explainability
  const breakdown: RiskBreakdownItem[] = [
    {
      label: 'Relevansi Candidate Match (Pra-Filter)',
      value: candidate_match_score,
      weight: candWeight,
      contribution: Number(candidateContribution.toFixed(3)),
      detail: 'Skor relevansi awal pra-filter pasangan klaim',
    },
  ];

  if (detection_route === 'cloning' || detection_route === 'dual') {
    breakdown.push({
      label: 'Sinyal Spesialis Anti-Cloning',
      value: cloningScore,
      weight: specWeight,
      contribution: Number((cloningScore * specWeight).toFixed(3)),
      detail: `Kemiripan teks (${Math.round(cloningEvidence.text_similarity * 100)}%) & irisan biomarker langka (${Math.round(cloningEvidence.rare_field_overlap_ratio * 100)}%)`,
    });
  }

  if (detection_route === 'repeat_billing' || detection_route === 'dual') {
    breakdown.push({
      label: 'Sinyal Spesialis Anti-Repeat Billing',
      value: repeatBillingScore,
      weight: specWeight,
      contribution: Number((repeatBillingScore * specWeight).toFixed(3)),
      detail: `Keterikatan episode (${repeatBillingEvidence.same_episode ? 'Sama' : 'Terpisah'}), irisan prosedur (${Math.round(repeatBillingEvidence.procedure_overlap_ratio * 100)}%), status pembayaran sebelumnya (${repeatBillingEvidence.previous_claim_paid ? 'PAID' : 'Belum Bayar'})`,
    });
  }

  // Primary flags
  const primary_flags: string[] = [];
  if (cloningScore >= 0.6) {
    primary_flags.push('Indikasi Kuat Cloning Rekam Medis (Pasien Berbeda)');
  }
  if (repeatBillingScore >= 0.6) {
    primary_flags.push('Indikasi Kuat Repeat Billing (Klaim Sebelumnya Telah Berstatus PAID)');
  }
  if (repeatBillingEvidence.is_legitimate_different_episode) {
    primary_flags.push('Pelayanan Sah Episode Terpisah (Bukan Repeat Billing)');
  }

  return {
    pair_id: candidatePair.pair_id,
    candidate_pair: candidatePair,
    detection_route,
    candidate_score: candidate_match_score,
    cloning_score: cloningScore,
    repeat_billing_score: repeatBillingScore,
    final_fraud_risk_score,
    risk_category,
    cloning_evidence: cloningEvidence,
    repeat_billing_evidence: repeatBillingEvidence,
    breakdown,
    primary_flags,
  };
}

/**
 * Assesses an entire list of candidate pairs and sorts by priority (final risk descending)
 */
export function assessAllCandidatePairs(
  pairs: CandidatePair[],
  config: ScoringConfig
): HybridRiskAssessment[] {
  // Only evaluate pairs that pass candidate generation threshold
  const qualifying = pairs.filter((p) => p.passes_threshold);
  const assessments = qualifying.map((p) => assessHybridRisk(p, config));

  return assessments.sort((a, b) => b.final_fraud_risk_score - a.final_fraud_risk_score);
}
