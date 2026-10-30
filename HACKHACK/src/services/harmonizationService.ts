import { Claim, HarmonizedClaimRecord } from '../types/claim';

/**
 * Normalizes date string into YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

/**
 * Harmonizes and calculates data quality for an individual claim
 */
export function harmonizeClaim(
  rawClaim: any,
  source: string = 'synthetic',
  format: 'json' | 'jsonl' | 'ocr' | 'synthetic' = 'json'
): HarmonizedClaimRecord {
  const issues: string[] = [];
  let qualityScore = 100;

  if (!rawClaim || typeof rawClaim !== 'object') {
    throw new Error('Objek klaim tidak valid.');
  }

  // Record role & demo metadata
  const record_role: 'historical_reference' | 'incoming_draft' | undefined =
    rawClaim.record_role ||
    (rawClaim.historical_record_id ? 'historical_reference' : undefined) ||
    (rawClaim.incoming_id ? 'incoming_draft' : undefined);
  const comparison_target = rawClaim.comparison_target ? String(rawClaim.comparison_target).trim() : undefined;
  const scenario = rawClaim.scenario ? String(rawClaim.scenario).trim() : undefined;
  const is_incoming = record_role === 'incoming_draft' || Boolean(rawClaim.incoming_id) || rawClaim.claim_status === 'draft';
  const patient_display_name = rawClaim.patient_display_name ? String(rawClaim.patient_display_name).trim() : undefined;

  // --- 1. Identifier Extraction ---
  const claim_id = String(
    rawClaim.claim_id ||
    rawClaim.incoming_id ||
    rawClaim.historical_record_id ||
    rawClaim.synthetic_enrichment?.claim_record_id ||
    rawClaim.id ||
    rawClaim.nomor_klaim ||
    rawClaim.no_klaim ||
    rawClaim.claimId ||
    `CLM-${Date.now().toString().slice(-8)}`
  ).trim();

  // No. Rekam Medis (No. RM)
  let no_rm = '';
  if (typeof rawClaim.no_rm === 'string' && rawClaim.no_rm.trim()) {
    no_rm = rawClaim.no_rm.trim();
  } else if (rawClaim.jkn_source?.visit_id_fkl02) {
    no_rm = String(rawClaim.jkn_source.visit_id_fkl02).trim();
  } else if (rawClaim.visit_id_fkl02) {
    no_rm = String(rawClaim.visit_id_fkl02).trim();
  } else if (typeof rawClaim.nomor_rm === 'string' && rawClaim.nomor_rm.trim()) {
    no_rm = rawClaim.nomor_rm.trim();
  } else if (typeof rawClaim.medical_record_number === 'string' && rawClaim.medical_record_number.trim()) {
    no_rm = rawClaim.medical_record_number.trim();
  } else if (rawClaim.patient && typeof rawClaim.patient === 'object') {
    no_rm = String(
      rawClaim.patient.medical_record_number ||
      rawClaim.patient.no_rm ||
      rawClaim.patient.nomor_rm ||
      ''
    ).trim();
  }

  // No. SEP
  let sep_number = '';
  if (typeof rawClaim.sep_number === 'string' && rawClaim.sep_number.trim()) {
    sep_number = rawClaim.sep_number.trim();
  } else if (rawClaim.synthetic_enrichment?.sep_number) {
    sep_number = String(rawClaim.synthetic_enrichment.sep_number).trim();
  } else if (typeof rawClaim.no_sep === 'string' && rawClaim.no_sep.trim()) {
    sep_number = rawClaim.no_sep.trim();
  } else if (typeof rawClaim.nomor_sep === 'string' && rawClaim.nomor_sep.trim()) {
    sep_number = rawClaim.nomor_sep.trim();
  } else if (rawClaim.sep && typeof rawClaim.sep === 'object') {
    sep_number = String(rawClaim.sep.sep_number || rawClaim.sep.no_sep || '').trim();
  }

  // Patient
  let patient_id = '';
  if (typeof rawClaim.patient_id === 'string' && rawClaim.patient_id.trim()) {
    patient_id = rawClaim.patient_id.trim();
  } else if (rawClaim.patient_reference) {
    patient_id = String(rawClaim.patient_reference).trim();
  } else if (rawClaim.participant_reference) {
    patient_id = String(rawClaim.participant_reference).trim();
  } else if (rawClaim.jkn_source?.participant_reference) {
    patient_id = String(rawClaim.jkn_source.participant_reference).trim();
  } else if (rawClaim.patient && typeof rawClaim.patient === 'object') {
    patient_id = String(
      rawClaim.patient.patient_id ||
      rawClaim.patient.ihs_patient_id ||
      rawClaim.patient.participant_id ||
      rawClaim.patient.medical_record_number ||
      ''
    ).trim();
  }
  if (!patient_id) {
    patient_id = 'PAT-UNKNOWN';
    issues.push('Missing patient identification');
    qualityScore -= 15;
  }

  // Provider / Faskes
  let provider_id = '';
  if (typeof rawClaim.provider_id === 'string' && rawClaim.provider_id.trim()) {
    provider_id = rawClaim.provider_id.trim();
  } else if (rawClaim.synthetic_enrichment?.provider_display_name) {
    provider_id = String(rawClaim.synthetic_enrichment.provider_display_name).trim();
  } else if (rawClaim.provider_display_name) {
    provider_id = String(rawClaim.provider_display_name).trim();
  } else if (rawClaim.provider && typeof rawClaim.provider === 'object') {
    provider_id = String(
      rawClaim.provider.provider_name ||
      rawClaim.provider.provider_id ||
      rawClaim.provider.satusehat_organization_id ||
      ''
    ).trim();
  } else if (record_role === 'incoming_draft' || record_role === 'historical_reference') {
    // Default shared demo hospital for reference comparison
    provider_id = 'RS Demo Sehat';
  }
  if (!provider_id) {
    provider_id = 'RSUD SEHAT SENTOSA';
  }

  // Practitioner / Dokter
  let practitioner_id = '';
  if (typeof rawClaim.practitioner_id === 'string' && rawClaim.practitioner_id.trim()) {
    practitioner_id = rawClaim.practitioner_id.trim();
  } else if (rawClaim.synthetic_enrichment?.practitioner_display_name) {
    practitioner_id = String(rawClaim.synthetic_enrichment.practitioner_display_name).trim();
  } else if (rawClaim.practitioner_display_name) {
    practitioner_id = String(rawClaim.practitioner_display_name).trim();
  } else if (rawClaim.practitioner && typeof rawClaim.practitioner === 'object') {
    practitioner_id = String(
      rawClaim.practitioner.name ||
      rawClaim.practitioner.practitioner_id ||
      rawClaim.practitioner.ihs_practitioner_id ||
      ''
    ).trim();
  } else if (scenario === 'cloning_positive' || claim_id === 'IN-CL-001') {
    practitioner_id = 'dr. Raka Pratama';
  } else if (scenario === 'repeat_billing_positive' || claim_id === 'IN-RB-001') {
    practitioner_id = 'dr. Nadia Rahma';
  }
  if (!practitioner_id) {
    practitioner_id = 'DR-DPJP-01';
  }

  // Encounter & Episode
  let encounter_id = '';
  if (typeof rawClaim.encounter_id === 'string' && rawClaim.encounter_id.trim()) {
    encounter_id = rawClaim.encounter_id.trim();
  } else if (rawClaim.encounter && typeof rawClaim.encounter === 'object') {
    encounter_id = String(rawClaim.encounter.encounter_id || '').trim();
  }
  if (!encounter_id) {
    encounter_id = `ENC-${claim_id}`;
  }

  let episode_id = '';
  if (typeof rawClaim.episode_id === 'string' && rawClaim.episode_id.trim()) {
    episode_id = rawClaim.episode_id.trim();
  } else if (rawClaim.synthetic_enrichment?.episode_id) {
    episode_id = String(rawClaim.synthetic_enrichment.episode_id).trim();
  } else if (rawClaim.encounter && typeof rawClaim.encounter === 'object') {
    episode_id = String(rawClaim.encounter.episode_id || '').trim();
  }
  if (!episode_id) {
    episode_id = `EP-${encounter_id}`;
  }

  // Dates
  let rawServiceDate =
    rawClaim.service_date ||
    rawClaim.jkn_source?.service_start_date ||
    (rawClaim.encounter && typeof rawClaim.encounter === 'object' ? rawClaim.encounter.service_date : null) ||
    (rawClaim.sep && typeof rawClaim.sep === 'object' ? rawClaim.sep.sep_date : null) ||
    '';
  const service_date = normalizeDate(rawServiceDate);
  if (!service_date) {
    issues.push('Missing service date');
    qualityScore -= 15;
  }

  let rawClaimDate =
    rawClaim.claim_date ||
    rawClaim.jkn_source?.service_end_date ||
    (rawClaim.claim_status && typeof rawClaim.claim_status === 'object' ? rawClaim.claim_status.submission_date : null) ||
    rawClaim.submission_date ||
    service_date ||
    '';
  const claim_date = normalizeDate(rawClaimDate);
  if (!claim_date) {
    issues.push('Missing claim submission date');
    qualityScore -= 10;
  }

  let rawPaidDate =
    rawClaim.paid_date ||
    rawClaim.synthetic_enrichment?.paid_date ||
    (rawClaim.claim_status && typeof rawClaim.claim_status === 'object' ? rawClaim.claim_status.paid_date : null) ||
    undefined;
  const paid_date = rawPaidDate ? normalizeDate(rawPaidDate) : undefined;

  // Billed Amount
  let billed_amount = 0;
  if (typeof rawClaim.billed_amount === 'number') {
    billed_amount = rawClaim.billed_amount;
  } else if (rawClaim.jkn_source?.provider_billed_cost !== undefined) {
    billed_amount = Number(rawClaim.jkn_source.provider_billed_cost);
  } else if (rawClaim.jkn_source?.inacbg_group_tariff !== undefined) {
    billed_amount = Number(rawClaim.jkn_source.inacbg_group_tariff);
  } else if (rawClaim.billing && typeof rawClaim.billing === 'object' && rawClaim.billing.billed_amount !== undefined) {
    billed_amount = Number(rawClaim.billing.billed_amount);
  } else if (rawClaim.billed_amount) {
    billed_amount = Number(rawClaim.billed_amount);
  }
  if (isNaN(billed_amount) || billed_amount < 0) {
    issues.push('Invalid billed amount value');
    qualityScore -= 15;
    billed_amount = 0;
  }

  // Clinical Text
  let clinical_text = '';
  if (typeof rawClaim.clinical_text === 'string' && rawClaim.clinical_text.trim()) {
    clinical_text = rawClaim.clinical_text.trim();
  } else if (rawClaim.synthetic_enrichment?.clinical_text) {
    clinical_text = String(rawClaim.synthetic_enrichment.clinical_text).trim();
  } else if (rawClaim.clinical && typeof rawClaim.clinical === 'object') {
    clinical_text = String(
      rawClaim.clinical.clinical_text ||
      rawClaim.clinical.chief_complaint ||
      rawClaim.clinical.therapy_text ||
      ''
    ).trim();
  }

  // Rare Fields
  let rare_fields: Record<string, string | number> = {};
  if (rawClaim.rare_fields && typeof rawClaim.rare_fields === 'object') {
    rare_fields = rawClaim.rare_fields;
  } else if (rawClaim.synthetic_enrichment?.rare_fields && typeof rawClaim.synthetic_enrichment.rare_fields === 'object') {
    rare_fields = rawClaim.synthetic_enrichment.rare_fields;
  } else if (rawClaim.clinical && typeof rawClaim.clinical.rare_fields === 'object') {
    rare_fields = rawClaim.clinical.rare_fields;
  }

  // Diagnosis (ICD-10)
  let rawDiags: string[] = [];
  if (Array.isArray(rawClaim.diagnosis)) {
    rawDiags = rawClaim.diagnosis.map((d: any) => String(d).trim().toUpperCase()).filter(Boolean);
  } else if (typeof rawClaim.diagnosis === 'string' && rawClaim.diagnosis.trim()) {
    rawDiags.push(rawClaim.diagnosis.trim().toUpperCase());
  }
  if (rawClaim.diagnosis_primary) {
    if (typeof rawClaim.diagnosis_primary === 'string') {
      rawDiags.push(rawClaim.diagnosis_primary.trim().toUpperCase());
    } else if (rawClaim.diagnosis_primary.code) {
      rawDiags.push(String(rawClaim.diagnosis_primary.code).trim().toUpperCase());
    }
  }
  if (rawClaim.diagnosis_secondary) {
    if (typeof rawClaim.diagnosis_secondary === 'string') {
      rawDiags.push(rawClaim.diagnosis_secondary.trim().toUpperCase());
    } else if (Array.isArray(rawClaim.diagnosis_secondary)) {
      rawClaim.diagnosis_secondary.forEach((d: any) => rawDiags.push(String(d?.code || d).trim().toUpperCase()));
    }
  }
  if (rawClaim.jkn_source) {
    if (rawClaim.jkn_source.diagnosis_primary_code) {
      rawDiags.push(String(rawClaim.jkn_source.diagnosis_primary_code).trim().toUpperCase());
    }
    if (rawClaim.jkn_source.diagnosis_admission_code) {
      rawDiags.push(String(rawClaim.jkn_source.diagnosis_admission_code).trim().toUpperCase());
    }
    if (rawClaim.jkn_source.diagnosis_secondary_codes) {
      const secStr = String(rawClaim.jkn_source.diagnosis_secondary_codes);
      secStr.split('|').forEach((s) => rawDiags.push(s.trim().toUpperCase()));
    }
  }
  if (rawClaim.clinical && typeof rawClaim.clinical === 'object') {
    if (rawClaim.clinical.primary_diagnosis) {
      const pDiag = rawClaim.clinical.primary_diagnosis;
      if (typeof pDiag === 'string') rawDiags.push(pDiag.trim().toUpperCase());
      else if (pDiag?.code) rawDiags.push(String(pDiag.code).trim().toUpperCase());
    }
    if (Array.isArray(rawClaim.clinical.secondary_diagnoses)) {
      rawClaim.clinical.secondary_diagnoses.forEach((d: any) => {
        if (typeof d === 'string') rawDiags.push(d.trim().toUpperCase());
        else if (d?.code) rawDiags.push(String(d.code).trim().toUpperCase());
      });
    }
  }
  // Normalize ICD codes (e.g. Z09.8 and Z098)
  const normDiagSet = new Set<string>();
  for (const d of rawDiags) {
    if (!d) continue;
    normDiagSet.add(d);
    normDiagSet.add(d.replace(/\./g, ''));
  }
  const diagnosis = Array.from(normDiagSet);

  // Procedures
  let rawProcs: string[] = [];
  if (Array.isArray(rawClaim.procedure)) {
    rawProcs = rawClaim.procedure.map((p: any) => String(p).trim().toUpperCase()).filter(Boolean);
  } else if (typeof rawClaim.procedure === 'string' && rawClaim.procedure.trim()) {
    rawProcs.push(rawClaim.procedure.trim().toUpperCase());
  }
  if (rawClaim.jkn_source?.procedure) {
    const pStr = String(rawClaim.jkn_source.procedure).trim().toUpperCase();
    rawProcs.push(pStr);
    const m = pStr.match(/^([0-9A-Z.]+)/);
    if (m) rawProcs.push(m[1]);
  }
  if (rawClaim.inacbg?.code) {
    rawProcs.push(String(rawClaim.inacbg.code).trim().toUpperCase());
  }
  if (rawClaim.jkn_source?.inacbg_code) {
    rawProcs.push(String(rawClaim.jkn_source.inacbg_code).trim().toUpperCase());
  }
  if (rawClaim.billing?.inacbg_code) {
    rawProcs.push(String(rawClaim.billing.inacbg_code).trim().toUpperCase());
  }
  if (rawClaim.clinical && Array.isArray(rawClaim.clinical.procedures)) {
    rawClaim.clinical.procedures.forEach((p: any) => {
      if (typeof p === 'string') rawProcs.push(p.trim().toUpperCase());
      else if (p?.code) rawProcs.push(String(p.code).trim().toUpperCase());
    });
  }
  const procedure = Array.from(new Set(rawProcs.filter(Boolean)));

  // Chronology check
  if (service_date && claim_date && service_date > claim_date) {
    issues.push('Service date cannot be later than claim submission date');
    qualityScore -= 15;
  }

  // Claim Status normalization
  let rawStatusStr = 'submitted';
  if (rawClaim.synthetic_enrichment?.payment_status) {
    rawStatusStr = rawClaim.synthetic_enrichment.payment_status;
  } else if (typeof rawClaim.claim_status === 'string') {
    rawStatusStr = rawClaim.claim_status;
  } else if (rawClaim.claim_status && typeof rawClaim.claim_status === 'object') {
    rawStatusStr = String(
      rawClaim.claim_status.claim_status ||
      rawClaim.claim_status.payment_status ||
      rawClaim.claim_status.verification_status ||
      'submitted'
    );
  }
  const cleanStatus = rawStatusStr.toLowerCase().trim();
  let normalizedStatus: Claim['claim_status'] = 'submitted';
  if (cleanStatus === 'paid' || cleanStatus === 'layak') {
    normalizedStatus = 'paid';
  } else if (cleanStatus === 'rejected' || cleanStatus === 'tidak_layak') {
    normalizedStatus = 'rejected';
  } else if (cleanStatus === 'under_review' || cleanStatus === 'pending') {
    normalizedStatus = 'under_review';
  } else if (cleanStatus === 'draft') {
    normalizedStatus = 'draft';
  }

  // Data source & provenance
  let data_source = String(rawClaim.data_source || '').trim();
  if (!data_source) {
    if (record_role === 'historical_reference') {
      data_source = 'jkn_historical_backend';
    } else if (record_role === 'incoming_draft') {
      data_source = 'incoming_draft';
    } else if (rawClaim.provenance && typeof rawClaim.provenance === 'object') {
      data_source = 'satusehat_sandbox';
    } else {
      data_source = source;
    }
  }

  const normalizedClaim: Claim = {
    claim_id,
    no_rm: no_rm || undefined,
    sep_number: sep_number || undefined,
    patient_id,
    practitioner_id,
    provider_id,
    encounter_id,
    episode_id,
    service_date,
    claim_date,
    diagnosis,
    procedure,
    clinical_text,
    rare_fields,
    billed_amount,
    claim_status: normalizedStatus,
    paid_date,
    data_source,
    record_role,
    comparison_target,
    scenario,
    is_incoming,
    patient_display_name,
  };

  return {
    claim: normalizedClaim,
    data_quality_score: Math.max(0, Math.min(100, qualityScore)),
    quality_issues: issues,
    normalized: true,
    provenance: {
      source,
      ingested_at: new Date().toISOString(),
      format,
    },
  };
}

export function harmonizeClaimBatch(
  claims: Partial<Claim>[],
  source: string = 'batch_upload',
  format: 'json' | 'jsonl' | 'ocr' | 'synthetic' = 'json'
): HarmonizedClaimRecord[] {
  return claims.map((c) => harmonizeClaim(c, source, format));
}
