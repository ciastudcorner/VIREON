import { Claim, CandidatePair, MatchFactor } from '../types/claim';
import { ScoringConfig } from '../config/scoringConfig';

/**
 * Calculates Jaccard similarity between two arrays of strings
 */
function setJaccard(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of set1) {
    if (set2.has(item)) intersectionSize++;
  }
  const unionSize = set1.size + set2.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function fastTemporalScore(t1: number, t2: number): { score: number; days: number } {
  if (isNaN(t1) || isNaN(t2) || t1 === 0 || t2 === 0) return { score: 0, days: 999 };
  const diffDays = Math.round(Math.abs(t1 - t2) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return { score: 1.0, days: diffDays };
  if (diffDays <= 7) return { score: 0.9, days: diffDays };
  if (diffDays <= 14) return { score: 0.75, days: diffDays };
  if (diffDays <= 30) return { score: 0.5, days: diffDays };
  if (diffDays <= 60) return { score: 0.3, days: diffDays };
  return { score: 0.1, days: diffDays };
}

/**
/**
 * Determines whether a claim is an incoming claim submitted for verification
 */
export function isIncomingClaim(c: Claim): boolean {
  if (c.is_incoming) return true;
  if (c.record_role === 'incoming_draft') return true;
  if (c.claim_id.startsWith('IN-')) return true;
  if (c.claim_status === 'draft') return true;
  if (c.data_source === 'incoming_draft' || c.data_source === 'synthetic_incoming_draft') return true;
  if (c.data_source === 'pdf_claim_document' || c.data_source === 'scanned_image_ocr') return true;
  return false;
}

/**
 * Generates Candidate Pairs from a list of claims and scores their pairwise relevance.
 * When incoming claims are present, prioritizes comparing incoming claims against
 * the historical backend claims database.
 */
export function generateCandidatePairs(
  claims: Claim[],
  config: ScoringConfig,
  options?: { allowHistoricalSelfAudit?: boolean }
): CandidatePair[] {
  const pairs: CandidatePair[] = [];
  const n = claims.length;
  if (n < 2) return [];

  // Determine if there are incoming claims needing verification
  const hasIncoming = claims.some(isIncomingClaim);

  // Core Principle:
  // The system acts as an incoming claim verifier against the historical reference database.
  // If no incoming claims are present (only historical reference claims exist),
  // there are no claims awaiting verification yet.
  if (!hasIncoming && !options?.allowHistoricalSelfAudit) {
    return [];
  }

  // Pre-process and index claims once upfront (O(N)) to eliminate redundant processing inside loops
  const tokenSets = claims.map((c) => {
    const words = (c.clinical_text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    return new Set(words);
  });

  const diagnosisSets = claims.map((c) => new Set((c.diagnosis || []).map((d) => d.toUpperCase())));
  const procedureSets = claims.map((c) => new Set((c.procedure || []).map((p) => p.toUpperCase())));
  const serviceTimestamps = claims.map((c) => (c.service_date ? new Date(c.service_date).getTime() : 0));

  const weights = config.candidateWeights;
  const isLargeBatch = n > 50;

  for (let i = 0; i < n; i++) {
    const rawClaimA = claims[i];
    const aIsIncoming = isIncomingClaim(rawClaimA);
    const setDiagA = diagnosisSets[i];
    const setProcA = procedureSets[i];
    const setTokA = tokenSets[i];
    const timeA = serviceTimestamps[i];

    for (let j = i + 1; j < n; j++) {
      const rawClaimB = claims[j];
      const bIsIncoming = isIncomingClaim(rawClaimB);

      // Rule: When incoming claims exist, only evaluate candidate pairs involving at least one incoming claim
      if (hasIncoming && !aIsIncoming && !bIsIncoming) {
        continue;
      }

      // Standardize ordering: claimA = Historical Reference (Baseline in Backend), claimB = Incoming Draft
      let claimA = rawClaimA;
      let claimB = rawClaimB;
      let idxA = i;
      let idxB = j;

      if (aIsIncoming && !bIsIncoming) {
        claimA = rawClaimB;
        claimB = rawClaimA;
        idxA = j;
        idxB = i;
      }

      // Check explicit demo target linkage
      const isExplicitTarget =
        (claimB.comparison_target && (claimB.comparison_target === claimA.claim_id || claimA.claim_id.includes(claimB.comparison_target))) ||
        (claimA.comparison_target && (claimA.comparison_target === claimB.claim_id || claimB.claim_id.includes(claimA.comparison_target)));

      const curSetDiagA = diagnosisSets[idxA];
      const curSetProcA = procedureSets[idxA];
      const curSetTokA = tokenSets[idxA];
      const curTimeA = serviceTimestamps[idxA];

      const curSetDiagB = diagnosisSets[idxB];
      const curSetProcB = procedureSets[idxB];
      const curSetTokB = tokenSets[idxB];
      const curTimeB = serviceTimestamps[idxB];

      const textSim = setJaccard(curSetTokA, curSetTokB);

      // Smart Blocking / Early Exit Check:
      const samePatient =
        claimA.patient_id === claimB.patient_id ||
        (Boolean(claimA.no_rm) && Boolean(claimB.no_rm) && claimA.no_rm === claimB.no_rm);
      const sameProvider = claimA.provider_id === claimB.provider_id;
      const samePractitioner =
        Boolean(claimA.practitioner_id) &&
        Boolean(claimB.practitioner_id) &&
        claimA.practitioner_id === claimB.practitioner_id;

      let hasSharedDiag = false;
      for (const d of curSetDiagA) {
        if (curSetDiagB.has(d)) {
          hasSharedDiag = true;
          break;
        }
      }

      if (
        isLargeBatch &&
        !isExplicitTarget &&
        !samePatient &&
        !sameProvider &&
        !samePractitioner &&
        !hasSharedDiag &&
        textSim < 0.25
      ) {
        continue;
      }

      // Fast set-based comparisons
      const diagSim = setJaccard(curSetDiagA, curSetDiagB);
      const procSim = setJaccard(curSetProcA, curSetProcB);
      const { score: tempScore, days: tempDays } = fastTemporalScore(curTimeA, curTimeB);

      const matchFactors: MatchFactor[] = [
        {
          factor: 'Same Patient Entity',
          weight: weights.same_patient,
          score: samePatient ? 1 : 0,
          description: samePatient
            ? `Identical Patient (${claimA.no_rm ? `No. RM: ${claimA.no_rm}` : claimA.patient_id})`
            : `Different Patients (${claimA.no_rm || claimA.patient_id} vs ${claimB.no_rm || claimB.patient_id})`,
        },
        {
          factor: 'Same Healthcare Provider',
          weight: weights.same_provider,
          score: sameProvider ? 1 : 0,
          description: sameProvider
            ? `Identical Faskes (${claimA.provider_id})`
            : `Distinct Providers (${claimA.provider_id} vs ${claimB.provider_id})`,
        },
        {
          factor: 'Same Practitioner (Dokter)',
          weight: weights.same_practitioner,
          score: samePractitioner ? 1 : 0,
          description: samePractitioner
            ? `Attending Doctor: ${claimA.practitioner_id}`
            : 'Distinct or unspecified doctors',
        },
        {
          factor: 'Diagnosis Code Overlap',
          weight: weights.diagnosis_overlap,
          score: diagSim,
          description: `ICD overlap ratio: ${Math.round(diagSim * 100)}%`,
        },
        {
          factor: 'Procedure Code Overlap',
          weight: weights.procedure_overlap,
          score: procSim,
          description: `Procedure overlap ratio: ${Math.round(procSim * 100)}%`,
        },
        {
          factor: 'Temporal Proximity',
          weight: weights.temporal_proximity,
          score: tempScore,
          description: `Service date gap: ${tempDays} days (Score: ${Math.round(tempScore * 100)}%)`,
        },
        {
          factor: 'Clinical Text Keyword Overlap',
          weight: weights.text_similarity,
          score: textSim,
          description: `Lexical overlap index: ${Math.round(textSim * 100)}%`,
        },
      ];

      // Candidate Match Score calculation
      const totalWeight = matchFactors.reduce((acc, f) => acc + f.weight, 0);
      const weightedSum = matchFactors.reduce((acc, f) => acc + f.score * f.weight, 0);
      let candidate_match_score = totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(3)) : 0;

      // Ensure explicit target cases meet the candidate threshold
      if (isExplicitTarget && candidate_match_score < config.candidateThreshold) {
        candidate_match_score = Math.max(candidate_match_score, 0.65);
      }

      // Filter: Only retain candidates passing pre-filter threshold
      if (candidate_match_score < config.candidateThreshold && !isExplicitTarget) {
        continue;
      }

      // Determine suggested route
      let suggested_route: CandidatePair['suggested_route'] = 'unassigned';
      if (samePatient) {
        suggested_route = 'repeat_billing';
      } else if (sameProvider || samePractitioner || textSim > 0.35 || diagSim > 0.5) {
        suggested_route = 'cloning';
      }

      pairs.push({
        pair_id: `PAIR-${claimA.claim_id}-${claimB.claim_id}`,
        claimA,
        claimB,
        candidate_match_score,
        match_factors: matchFactors,
        passes_threshold: true,
        suggested_route,
      });
    }
  }

  // Sort descending by candidate_match_score, cap to top 500 relevant pairs
  return pairs
    .sort((a, b) => b.candidate_match_score - a.candidate_match_score)
    .slice(0, 500);
}
