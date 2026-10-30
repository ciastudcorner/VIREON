import { Claim, RepeatBillingEvidence } from '../types/claim';
import { ScoringConfig } from '../config/scoringConfig';

/**
 * Calculates procedure overlap ratio
 */
function calculateProcedureOverlap(procsA: string[], procsB: string[]): { ratio: number; matches: string[] } {
  if (!procsA.length || !procsB.length) return { ratio: 0, matches: [] };
  const setA = new Set(procsA.map((p) => p.toUpperCase().trim()));
  const setB = new Set(procsB.map((p) => p.toUpperCase().trim()));

  const matches: string[] = [];
  for (const pA of setA) {
    if (setB.has(pA)) {
      matches.push(pA);
    } else {
      // Substring/code match (e.g. "3995" in "3995 - HEMODIALYSIS")
      for (const pB of setB) {
        if (pA.includes(pB) || pB.includes(pA)) {
          matches.push(pA);
          break;
        }
      }
    }
  }

  const unionSize = Math.max(setA.size, setB.size);
  const ratio = unionSize > 0 ? Math.min(1.0, matches.length / Math.min(setA.size, setB.size)) : 0;

  return { ratio, matches: Array.from(new Set(matches)) };
}

/**
 * Calculates billed amount similarity (0 to 1)
 */
function calculateAmountSimilarity(amtA: number, amtB: number): number {
  if (amtA === 0 && amtB === 0) return 1;
  const max = Math.max(amtA, amtB);
  if (max === 0) return 0;
  const diff = Math.abs(amtA - amtB);
  return Math.max(0, 1 - diff / max);
}

/**
 * Calculates difference in calendar days
 */
function getDaysDifference(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 999;
  const d1 = new Date(dateStr1).getTime();
  const d2 = new Date(dateStr2).getTime();
  if (isNaN(d1) || isNaN(d2)) return 999;
  return Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
}

/**
 * Anti-Repeat Billing Engine: Detects duplicate claims for the same patient in the same episode
 */
export function evaluateRepeatBilling(
  claimA: Claim,
  claimB: Claim,
  config: ScoringConfig
): RepeatBillingEvidence {
  const samePatient =
    claimA.patient_id === claimB.patient_id ||
    (Boolean(claimA.no_rm) && Boolean(claimB.no_rm) && claimA.no_rm === claimB.no_rm);

  // If different patients, repeat billing cannot apply
  if (!samePatient) {
    return {
      repeat_billing_score: 0,
      same_patient: false,
      same_episode: false,
      same_encounter: false,
      procedure_overlap_ratio: 0,
      matching_procedures: [],
      previous_claim_paid: false,
      service_date_gap_days: 999,
      amount_similarity: 0,
      reason_codes: [],
      is_legitimate_different_episode: false,
      risk_reason: 'Different patient entities; not applicable for Repeat Billing evaluation.',
    };
  }

  const sameEpisode = Boolean(claimA.episode_id) && claimA.episode_id === claimB.episode_id;
  const sameEncounter = Boolean(claimA.encounter_id) && claimA.encounter_id === claimB.encounter_id;

  const { ratio: procOverlap, matches: matchingProcedures } = calculateProcedureOverlap(
    claimA.procedure,
    claimB.procedure
  );

  const serviceDateGap = getDaysDifference(claimA.service_date, claimB.service_date);
  const amountSimilarity = calculateAmountSimilarity(claimA.billed_amount, claimB.billed_amount);

  // Chronological determination of earlier claim vs newer claim
  // Give priority to whichever claim was already paid or is the historical baseline
  let earlierClaim = claimA;
  let laterClaim = claimB;

  if (claimA.claim_status === 'paid' && claimB.claim_status !== 'paid') {
    earlierClaim = claimA;
    laterClaim = claimB;
  } else if (claimB.claim_status === 'paid' && claimA.claim_status !== 'paid') {
    earlierClaim = claimB;
    laterClaim = claimA;
  } else if (claimA.record_role === 'historical_reference' && claimB.record_role === 'incoming_draft') {
    earlierClaim = claimA;
    laterClaim = claimB;
  } else if (claimB.record_role === 'historical_reference' && claimA.record_role === 'incoming_draft') {
    earlierClaim = claimB;
    laterClaim = claimA;
  } else {
    const isAFirst = new Date(claimA.claim_date).getTime() <= new Date(claimB.claim_date).getTime();
    earlierClaim = isAFirst ? claimA : claimB;
    laterClaim = isAFirst ? claimB : claimA;
  }

  const earlierIsPaid = earlierClaim.claim_status === 'paid' && Boolean(earlierClaim.paid_date);
  const paidDate = earlierClaim.paid_date;
  const newClaimDate = laterClaim.claim_date;

  const reason_codes: RepeatBillingEvidence['reason_codes'] = [];

  // CRITICAL REQUIREMENT & EPISODE SPLITTING DETECTION:
  // "Pelayanan yang sama pada episode berbeda jangan otomatis dianggap repeat billing,
  // KECUALI jika ada indikasi Episode Splitting (pemecahan episode: jeda waktu <= 3 hari dengan tindakan identik)"
  const isSuspiciousEpisodeSplitting =
    !sameEpisode &&
    serviceDateGap <= 3 &&
    (procOverlap >= 0.5 || (earlierIsPaid && serviceDateGap === 0) || amountSimilarity > 0.85);

  if (!sameEpisode && !isSuspiciousEpisodeSplitting) {
    reason_codes.push({
      code: 'LEGIT-EPISODE',
      label: 'Different Episode IDs (Separated Episode of Care - Legitimate Re-attendance)',
      severity: 'info',
    });

    return {
      repeat_billing_score: 0.05,
      same_patient: true,
      same_episode: false,
      same_encounter: sameEncounter,
      procedure_overlap_ratio: Number(procOverlap.toFixed(3)),
      matching_procedures: matchingProcedures,
      previous_claim_paid: earlierIsPaid,
      paid_claim_id: earlierClaim.claim_id,
      paid_date: paidDate,
      new_claim_date: newClaimDate,
      service_date_gap_days: serviceDateGap,
      amount_similarity: Number(amountSimilarity.toFixed(3)),
      reason_codes,
      is_legitimate_different_episode: true,
      risk_reason:
        'Services occur in distinct episode cycles with adequate temporal separation (e.g. routine hemodialysis or new outpatient encounter). Legitimate recurrence; cleared of repeat billing.',
    };
  }

  // Same episode case OR Suspicious Episode Splitting: Evaluate suspicious signals
  if (isSuspiciousEpisodeSplitting) {
    reason_codes.push({
      code: 'RB-SPLIT-EPISODE',
      label: `Indikasi Pemecahan Episode (Episode Splitting): Episode berbeda (${earlierClaim.episode_id} vs ${laterClaim.episode_id}) diajukan dalam jeda waktu sangat dekat (${serviceDateGap} hari) dengan prosedur serupa`,
      severity: 'high',
    });
  } else if (sameEpisode) {
    reason_codes.push({
      code: 'RB-01',
      label: `Identical Episode ID (${claimA.episode_id})`,
      severity: 'high',
    });
  }

  if (earlierIsPaid) {
    reason_codes.push({
      code: 'RB-02',
      label: `Prior Claim ${earlierClaim.claim_id} was already PAID on ${paidDate}`,
      severity: 'high',
    });
  }

  if (procOverlap > 0.6) {
    reason_codes.push({
      code: 'RB-03',
      label: `Substantial procedure code overlap (${matchingProcedures.join(', ')})`,
      severity: 'high',
    });
  }

  if (serviceDateGap === 0) {
    reason_codes.push({
      code: 'RB-04',
      label: 'Same exact service date (0 days gap)',
      severity: 'high',
    });
  } else if (serviceDateGap <= 3) {
    reason_codes.push({
      code: 'RB-05',
      label: `Close service date proximity (${serviceDateGap} days)`,
      severity: 'medium',
    });
  }

  if (amountSimilarity > 0.9) {
    reason_codes.push({
      code: 'RB-06',
      label: `Virtually identical billed amount (Similarity: ${Math.round(amountSimilarity * 100)}%)`,
      severity: 'medium',
    });
  }

  // Calculate weighted repeat billing score
  const weights = config.repeatBillingWeights;

  // Proximity score: 0 days = 1.0, 1-3 days = 0.8, 4-7 days = 0.5, >7 days = 0.2
  const dateProximityScore =
    serviceDateGap === 0 ? 1.0 : serviceDateGap <= 3 ? 0.8 : serviceDateGap <= 7 ? 0.5 : 0.2;

  let rawScore =
    (sameEpisode ? 1 : isSuspiciousEpisodeSplitting ? 0.75 : 0) * weights.same_episode +
    procOverlap * weights.procedure_overlap +
    (earlierIsPaid ? 1 : 0) * weights.previous_claim_paid +
    dateProximityScore * weights.date_proximity +
    amountSimilarity * weights.amount_similarity;

  // Amplify if all core repeat billing hallmarks are present
  if ((sameEpisode || isSuspiciousEpisodeSplitting) && earlierIsPaid && procOverlap >= 0.7 && serviceDateGap <= 3) {
    rawScore = Math.min(1.0, rawScore * 1.2);
  }

  const repeat_billing_score = Number(Math.max(0, Math.min(1, rawScore)).toFixed(3));

  let risk_reason = 'Low probability of repeat billing.';
  if (isSuspiciousEpisodeSplitting) {
    risk_reason = `Indikasi Pemecahan Episode (Episode Splitting): Episode berbeda (${earlierClaim.episode_id} vs ${laterClaim.episode_id}) diajukan dalam jeda waktu singkat (${serviceDateGap} hari) dengan prosedur identik/serupa.`;
  } else if (repeat_billing_score >= 0.7) {
    risk_reason = `Secondary claim submitted on episode ${claimA.episode_id} with matching procedures after prior claim ${earlierClaim.claim_id} was paid.`;
  } else if (repeat_billing_score >= 0.4) {
    risk_reason = `Moderate repeat billing indicators present (shared episode/procedures). Review recommended to verify unbundled vs duplicate submission.`;
  }

  return {
    repeat_billing_score,
    same_patient: true,
    same_episode: sameEpisode,
    same_encounter: sameEncounter,
    procedure_overlap_ratio: Number(procOverlap.toFixed(3)),
    matching_procedures: matchingProcedures,
    previous_claim_paid: earlierIsPaid,
    paid_claim_id: earlierClaim.claim_id,
    paid_date: paidDate,
    new_claim_date: newClaimDate,
    service_date_gap_days: serviceDateGap,
    amount_similarity: Number(amountSimilarity.toFixed(3)),
    reason_codes,
    is_legitimate_different_episode: false,
    risk_reason,
  };
}
