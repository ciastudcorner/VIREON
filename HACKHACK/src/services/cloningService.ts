import { Claim, CloningEvidence, RareFieldMatch } from '../types/claim';
import { ScoringConfig } from '../config/scoringConfig';

// Standard Indonesian clinical templates/boilerplates to suppress
const COMMON_TEMPLATES = [
  'pasien datang ke poli dengan keluhan',
  'pasien datang dengan keluhan',
  'pasien datang rujukan dengan',
  'keadaan umum: sakit sedang, compos mentis',
  'keadaan umum: sakit ringan, compos mentis',
  'keadaan umum sakit sedang compos mentis',
  'keadaan umum sakit ringan compos mentis',
  'pemeriksaan fisik dalam batas normal',
  'terapi dilanjutkan sesuai instruksi',
  'kontrol bila keluhan berlanjut',
  'tanda vital dalam batas normal',
  'tanda vital:',
  'tidak ada riwayat alergi obat',
  'pasien mengeluh',
];

/**
 * Suppresses common boilerplate templates from clinical narratives
 */
export function suppressTemplates(text: string): string {
  let cleaned = text.toLowerCase();
  for (const tpl of COMMON_TEMPLATES) {
    cleaned = cleaned.replaceAll(tpl, ' ');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Tokenizes text into normalized words (length >= 3)
 */
function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

/**
 * Finds exact 3-word or larger overlapping phrases between two texts
 */
export function findOverlappingPhrases(text1: string, text2: string): string[] {
  if (!text1 || !text2) return [];

  const t1 = text1.toLowerCase();
  const t2 = text2.toLowerCase();

  const words = t1.split(/\s+/).filter((w) => w.length > 2);
  if (words.length < 3) return [];
  const matchedPhrases = new Set<string>();

  // Look for 4-word and 3-word windows, cap at max 5 distinct phrases
  for (let windowSize = 4; windowSize >= 3 && matchedPhrases.size < 5; windowSize--) {
    for (let i = 0; i <= words.length - windowSize && matchedPhrases.size < 5; i++) {
      const phrase = words.slice(i, i + windowSize).join(' ');
      if (phrase.length > 15 && t2.includes(phrase)) {
        matchedPhrases.add(phrase);
      }
    }
  }

  return Array.from(matchedPhrases);
}

/**
 * Anti-Cloning Engine: Computes Cloning Score and extracts visual evidence
 */
export function evaluateCloning(claimA: Claim, claimB: Claim, config: ScoringConfig): CloningEvidence {
  const isSamePatient =
    claimA.patient_id === claimB.patient_id ||
    (Boolean(claimA.no_rm) && Boolean(claimB.no_rm) && claimA.no_rm === claimB.no_rm);
  const differentPatient = !isSamePatient;

  // If same patient, cloning does not apply (that falls under repeat billing or clinical follow-up)
  if (!differentPatient) {
    return {
      cloning_score: 0,
      text_similarity: 0,
      template_suppressed_text_A: claimA.clinical_text,
      template_suppressed_text_B: claimB.clinical_text,
      overlapping_tokens: [],
      overlapping_phrases: [],
      rare_field_overlap_ratio: 0,
      rare_field_matches: [],
      same_provider: claimA.provider_id === claimB.provider_id,
      same_practitioner: claimA.practitioner_id === claimB.practitioner_id,
      different_patient: false,
      risk_reason: 'Same patient entity; evaluated under Anti-Repeat Billing route instead.',
    };
  }

  // 1. Text Similarity after Template Suppression
  const cleanedA = suppressTemplates(claimA.clinical_text || '');
  const cleanedB = suppressTemplates(claimB.clinical_text || '');

  const tokensA = tokenizeWords(cleanedA);
  const tokensB = tokenizeWords(cleanedB);

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const sharedTokens = tokensA.filter((t) => setB.has(t));
  const uniqueSharedTokens = Array.from(new Set(sharedTokens));

  const unionTokens = new Set([...tokensA, ...tokensB]);
  const textSimilarity = unionTokens.size > 0 ? uniqueSharedTokens.length / unionTokens.size : 0;

  const overlappingPhrases = findOverlappingPhrases(claimA.clinical_text, claimB.clinical_text);

  // 2. Rare Fields Evaluation (Biomarkers, lab values, measurements)
  const rareA = claimA.rare_fields || {};
  const rareB = claimB.rare_fields || {};

  const keysA = Object.keys(rareA);
  const keysB = Object.keys(rareB);
  const allKeys = Array.from(new Set([...keysA, ...keysB]));

  const rareMatches: RareFieldMatch[] = [];
  let exactMatchCount = 0;

  for (const key of allKeys) {
    const valA = rareA[key] !== undefined ? String(rareA[key]).trim() : '';
    const valB = rareB[key] !== undefined ? String(rareB[key]).trim() : '';
    const match = valA !== '' && valB !== '' && valA.toLowerCase() === valB.toLowerCase();

    if (valA !== '' || valB !== '') {
      rareMatches.push({
        key,
        valueA: valA || '-',
        valueB: valB || '-',
        match,
      });
      if (match) exactMatchCount++;
    }
  }

  const rareFieldRatio = rareMatches.length > 0 ? exactMatchCount / rareMatches.length : 0;

  // 3. Provider & Practitioner context
  const sameProvider = claimA.provider_id === claimB.provider_id;
  const samePractitioner =
    Boolean(claimA.practitioner_id) &&
    Boolean(claimB.practitioner_id) &&
    claimA.practitioner_id === claimB.practitioner_id;

  // 4. Weighted Cloning Score
  const weights = config.cloningWeights;

  let rawScore =
    textSimilarity * weights.text_similarity +
    rareFieldRatio * weights.rare_field_overlap +
    (sameProvider ? 1 : 0) * weights.same_provider +
    (samePractitioner ? 1 : 0) * weights.same_practitioner;

  // If text is extremely similar (> 85%) and rare fields match identically, boost risk signal
  if (textSimilarity > 0.8 && rareFieldRatio > 0.6) {
    rawScore = Math.min(1.0, rawScore * 1.15);
  }

  // If text similarity is very low (< 0.25), scale down cloning score
  if (textSimilarity < 0.25) {
    rawScore = rawScore * 0.4;
  }

  const cloning_score = Number(Math.max(0, Math.min(1, rawScore)).toFixed(3));

  let risk_reason = 'Similarity within standard clinical documentation variations.';
  if (cloning_score >= 0.7) {
    risk_reason = `High text overlap (${Math.round(textSimilarity * 100)}%) with identical rare fields (${Math.round(rareFieldRatio * 100)}%) across distinct patients at ${claimA.provider_id}.`;
  } else if (cloning_score >= 0.4) {
    risk_reason = `Moderate narrative overlap (${Math.round(textSimilarity * 100)}%) detected; requires human review for standard clinical templates vs unoriginal text.`;
  }

  return {
    cloning_score,
    text_similarity: Number(textSimilarity.toFixed(3)),
    template_suppressed_text_A: cleanedA,
    template_suppressed_text_B: cleanedB,
    overlapping_tokens: uniqueSharedTokens,
    overlapping_phrases: overlappingPhrases,
    rare_field_overlap_ratio: Number(rareFieldRatio.toFixed(3)),
    rare_field_matches: rareMatches,
    same_provider: sameProvider,
    same_practitioner: samePractitioner,
    different_patient: differentPatient,
    risk_reason,
  };
}
