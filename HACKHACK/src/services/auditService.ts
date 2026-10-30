import { AuditRecord, ReviewDecisionType, RiskCategory } from '../types/claim';

const AUDIT_STORAGE_KEY = 'vireon_audit_logs';

export function getAuditLogs(): AuditRecord[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to retrieve audit logs', e);
  }
  // Initial seed audit log for realistic demonstration
  return [
    {
      id: 'AUD-2026-001',
      timestamp: '2026-09-15T09:40:00Z',
      pair_id: 'PAIR-CLM-SYN-2026-0007-CLM-SYN-2026-0008',
      claim_a_id: 'CLM-SYN-2026-0007',
      claim_b_id: 'CLM-SYN-2026-0008',
      detection_route: 'repeat_billing',
      candidate_score: 0.62,
      cloning_score: 0,
      repeat_billing_score: 0.05,
      final_risk_score: 0.13,
      risk_category: 'Rendah',
      decision: 'Bersih / Tanpa Anomali',
      reviewer_name: 'Verifikator Medis 01',
      reviewer_note:
        'Klaim rutin hemodialisis pada pasien ginjal kronis terbukti terpisah siklus episode (Agustus vs September). Prosedur sesuai standar INA-CBG.',
      action_summary: 'Diverifikasi sebagai pengulangan hemodialisis sah pada episode siklus terpisah.',
    },
  ];
}

export function saveAuditLog(record: Omit<AuditRecord, 'id' | 'timestamp'>): AuditRecord {
  const fullRecord: AuditRecord = {
    ...record,
    id: `AUD-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = getAuditLogs();
    const updated = [fullRecord, ...current];
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save audit log', e);
  }

  return fullRecord;
}

export function exportAuditLogsJSON(): void {
  const logs = getAuditLogs();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `VIREON_Audit_Logs_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function clearAuditLogs(): void {
  localStorage.removeItem(AUDIT_STORAGE_KEY);
}
