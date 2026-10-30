import { Claim } from '../types/claim';
import { harmonizeClaim } from './harmonizationService';
import rawHistoricalData from '../data/historicalClaimsData.json';

// In-memory cached harmonized historical repository (300 JKN FKRTL records)
let cachedHistoricalClaims: Claim[] | null = null;

/**
 * Harmonizes and returns the 300 historical claims from the backend repository.
 * Cached in memory so it is only parsed once.
 */
export function getHistoricalBackendClaims(): Claim[] {
  if (cachedHistoricalClaims) {
    return cachedHistoricalClaims;
  }

  try {
    const rawList = Array.isArray(rawHistoricalData) ? rawHistoricalData : [];
    const harmonized = rawList.map((item: any) => {
      const h = harmonizeClaim(item, 'jkn_historical_300_enriched.jsonl', 'jsonl');
      return {
        ...h.claim,
        record_role: 'historical_reference' as const,
        data_source: 'jkn_historical_backend',
        is_incoming: false,
      };
    });

    cachedHistoricalClaims = harmonized;
    return cachedHistoricalClaims;
  } catch (err) {
    console.error('Gagal memuat dataset riwayat klaim backend:', err);
    return [];
  }
}

/**
 * Asynchronously reload the 300 historical claims from public JSONL if preferred
 */
export async function loadHistoricalBackendClaims(): Promise<Claim[]> {
  try {
    const res = await fetch('/jkn_historical_300_enriched.jsonl');
    if (!res.ok) {
      // Fallback to in-memory JSON bundle
      return getHistoricalBackendClaims();
    }
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed = lines.map((l) => JSON.parse(l));

    const harmonized = parsed.map((item: any) => {
      const h = harmonizeClaim(item, 'jkn_historical_300_enriched.jsonl', 'jsonl');
      return {
        ...h.claim,
        record_role: 'historical_reference' as const,
        data_source: 'jkn_historical_backend',
        is_incoming: false,
      };
    });

    cachedHistoricalClaims = harmonized;
    return harmonized;
  } catch (e) {
    console.warn('Fallback ke bundel backend internal:', e);
    return getHistoricalBackendClaims();
  }
}

/**
 * Look up a historical record by ID (e.g. "HIST-008", "HIST-011")
 */
export function getHistoricalClaimById(claimId: string): Claim | undefined {
  const list = getHistoricalBackendClaims();
  return list.find((c) => c.claim_id === claimId);
}

export const HISTORICAL_CLAIMS_COUNT = 300;
