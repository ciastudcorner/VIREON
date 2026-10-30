export interface ScoringConfig {
  candidateThreshold: number; // Candidate pairs must score >= this to be analyzed by detectors
  candidateWeights: {
    same_patient: number;
    same_provider: number;
    same_practitioner: number;
    diagnosis_overlap: number;
    procedure_overlap: number;
    temporal_proximity: number;
    text_similarity: number;
  };
  cloningWeights: {
    text_similarity: number;
    rare_field_overlap: number;
    same_provider: number;
    same_practitioner: number;
  };
  repeatBillingWeights: {
    same_episode: number;
    procedure_overlap: number;
    previous_claim_paid: number;
    date_proximity: number;
    amount_similarity: number;
  };
  hybridWeights: {
    candidate_weight: number;
    specialist_weight: number;
  };
  thresholds: {
    highRisk: number;
    suspicious: number;
  };
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  candidateThreshold: 0.35,
  candidateWeights: {
    same_patient: 0.25,
    same_provider: 0.15,
    same_practitioner: 0.15,
    diagnosis_overlap: 0.15,
    procedure_overlap: 0.15,
    temporal_proximity: 0.05,
    text_similarity: 0.10,
  },
  cloningWeights: {
    text_similarity: 0.45,
    rare_field_overlap: 0.30,
    same_provider: 0.15,
    same_practitioner: 0.10,
  },
  repeatBillingWeights: {
    same_episode: 0.35,
    procedure_overlap: 0.25,
    previous_claim_paid: 0.20,
    date_proximity: 0.10,
    amount_similarity: 0.10,
  },
  hybridWeights: {
    candidate_weight: 0.15,
    specialist_weight: 0.85,
  },
  thresholds: {
    highRisk: 0.70,
    suspicious: 0.40,
  },
};

const STORAGE_KEY = 'vireon_scoring_config';

export function loadScoringConfig(): ScoringConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SCORING_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse scoring config from localStorage, using defaults', e);
  }
  return DEFAULT_SCORING_CONFIG;
}

export function saveScoringConfig(config: ScoringConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save scoring config to localStorage', e);
  }
}

export function resetScoringConfig(): ScoringConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove scoring config from localStorage', e);
  }
  return DEFAULT_SCORING_CONFIG;
}
