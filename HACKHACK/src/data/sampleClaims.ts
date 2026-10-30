import { Claim } from '../types/claim';

export const SAMPLE_CLAIMS: Claim[] = [
  // --- PAIR 1: HIGH RISK CLONING CASE (Diff Patient, Same Provider, Duplicate Text & Exact Rare Fields) ---
  {
    claim_id: 'CLM-001',
    no_rm: 'RM-881201',
    sep_number: '0192R0010926V000001',
    patient_id: 'PAT-8812-AHMAD',
    practitioner_id: 'DR-HEN-04',
    provider_id: 'FASKES-RSUD-01',
    encounter_id: 'ENC-2026-1011',
    episode_id: 'EP-2026-1011',
    service_date: '2026-09-01',
    claim_date: '2026-09-03',
    diagnosis: ['J18.9', 'R50.9'],
    procedure: ['PROC-CXR', 'PROC-LAB-FULL'],
    clinical_text:
      'Pasien datang rujukan dengan demam akut 39.2C sejak 3 hari disertai sesak napas berat dan batuk berdahak purulen kecoklatan. Auskultasi thoraks: vesikuler menurun pada hemithoraks dekstra bawah dengan ronki basah kasar difus. Diberikan oksigenasi nasal kanul 4 lpm dan antibiotik empirik lini kedua ceftriaxone iv. Foto rontgen thoraks menunjukkan infiltrat peribronkial segmental lobus inferior dekstra.',
    rare_fields: {
      crp_mg_l: '48.4',
      spo2_pct: '91',
      d_dimer_ng_ml: '820',
      procalcitonin: '2.14',
    },
    billed_amount: 3450000,
    claim_status: 'paid',
    paid_date: '2026-09-10',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-002',
    no_rm: 'RM-994302',
    sep_number: '0192R0010926V000002',
    patient_id: 'PAT-9943-BUDIMAN', // DIFFERENT PATIENT
    practitioner_id: 'DR-HEN-04', // SAME DOCTOR
    provider_id: 'FASKES-RSUD-01', // SAME PROVIDER
    encounter_id: 'ENC-2026-1049',
    episode_id: 'EP-2026-1049',
    service_date: '2026-09-04',
    claim_date: '2026-09-06',
    diagnosis: ['J18.9', 'R50.9'],
    procedure: ['PROC-CXR', 'PROC-LAB-FULL'],
    clinical_text:
      'Pasien datang rujukan dengan demam akut 39.2C sejak 3 hari disertai sesak napas berat dan batuk berdahak purulen kecoklatan. Auskultasi thoraks: vesikuler menurun pada hemithoraks dekstra bawah dengan ronki basah kasar difus. Diberikan oksigenasi nasal kanul 4 lpm dan antibiotik empirik lini kedua ceftriaxone iv. Foto rontgen thoraks menunjukkan infiltrat peribronkial segmental lobus inferior dekstra.',
    rare_fields: {
      crp_mg_l: '48.4', // EXACT COPY OF RARE VALUES
      spo2_pct: '91',
      d_dimer_ng_ml: '820',
      procalcitonin: '2.14',
    },
    billed_amount: 3450000,
    claim_status: 'submitted',
    data_source: 'synthetic',
  },

  // --- PAIR 2: HIGH RISK REPEAT BILLING CASE (Same Patient, Same Episode, Prior Claim Paid, Resubmitted) ---
  {
    claim_id: 'CLM-003',
    no_rm: 'RM-440203',
    sep_number: '0192R0010826V000003',
    patient_id: 'PAT-4402-CITRA',
    practitioner_id: 'DR-SIT-09',
    provider_id: 'FASKES-RS-HERMINA',
    encounter_id: 'ENC-2026-2101',
    episode_id: 'EP-2026-CITRA-APP',
    service_date: '2026-08-15',
    claim_date: '2026-08-17',
    diagnosis: ['K35.8'],
    procedure: ['PROC-APP-OPEN', 'PROC-ANESTH-GEN'],
    clinical_text:
      'Pasien wanita 28 tahun masuk IGD dengan nyeri akut perut kanan bawah McBurney sign positif sejak 12 jam. USG abdomen mengkonfirmasi apendisitis akut non-perforasi. Dilakukan laparotomi apendektomi emergensi dengan anestesi umum tanpa komplikasi.',
    rare_fields: {
      leukocyte_count: '16800',
      alvarado_score: '8',
    },
    billed_amount: 8750000,
    claim_status: 'paid',
    paid_date: '2026-08-25',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-004',
    no_rm: 'RM-440203', // SAME PATIENT & RM
    sep_number: '0192R0010926V000004',
    patient_id: 'PAT-4402-CITRA', // SAME PATIENT
    practitioner_id: 'DR-SIT-09',
    provider_id: 'FASKES-RS-HERMINA',
    encounter_id: 'ENC-2026-2101', // SAME ENCOUNTER
    episode_id: 'EP-2026-CITRA-APP', // SAME EPISODE!
    service_date: '2026-08-15', // SAME SERVICE DATE!
    claim_date: '2026-09-02', // Resubmitted AFTER paid date (08-25)
    diagnosis: ['K35.8'],
    procedure: ['PROC-APP-OPEN', 'PROC-ANESTH-GEN'], // Identical procedure
    clinical_text:
      'Laporan tindakan pembedahan apendektomi terbuka pada kasus apendisitis akut. Insisi gridiron pada titik McBurney, eksisi apendiks gangrenosa, hemostasis terkontrol baik.',
    rare_fields: {
      leukocyte_count: '16800',
    },
    billed_amount: 8750000,
    claim_status: 'submitted',
    data_source: 'synthetic',
  },

  // --- PAIR 3: LEGITIMATE SIMILAR CLINICAL NOTES (Template Coincidence, Diff Patient, Unique Findings) ---
  {
    claim_id: 'CLM-005',
    no_rm: 'RM-312905',
    sep_number: '0192R0010826V000005',
    patient_id: 'PAT-3129-DEWI',
    practitioner_id: 'DR-MAY-12',
    provider_id: 'FASKES-PUSK-03',
    encounter_id: 'ENC-2026-3001',
    episode_id: 'EP-2026-3001',
    service_date: '2026-08-20',
    claim_date: '2026-08-21',
    diagnosis: ['J06.9'],
    procedure: ['PROC-RAWAT-JALAN'],
    clinical_text:
      'Pasien datang ke poli dengan keluhan batuk pilek dan demam sejak 2 hari. Keadaan umum: sakit sedang, compos mentis. Tanda vital: TD 110/70, Nadi 84x/m, Suhu 38.1C. Pemeriksaan faring hiperemis, tonsil T1/T1 tenang. Terapi simptomatik paracetamol dan vitamin C diberikan. Kontrol bila keluhan berlanjut.',
    rare_fields: {
      suhu_aksila: '38.1',
      berat_badan_kg: '15',
    },
    billed_amount: 150000,
    claim_status: 'paid',
    paid_date: '2026-08-28',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-006',
    no_rm: 'RM-551906',
    sep_number: '0192R0010826V000006',
    patient_id: 'PAT-5519-EKO',
    practitioner_id: 'DR-MAY-12',
    provider_id: 'FASKES-PUSK-03',
    encounter_id: 'ENC-2026-3044',
    episode_id: 'EP-2026-3044',
    service_date: '2026-08-22',
    claim_date: '2026-08-23',
    diagnosis: ['J06.9'],
    procedure: ['PROC-RAWAT-JALAN'],
    clinical_text:
      'Pasien datang ke poli dengan keluhan batuk berdahak dan hidung tersumbat sejak 4 hari disertai nyeri tenggorokan dan mual. Keadaan umum: sakit ringan, compos mentis. Tanda vital: TD 125/80, Nadi 78x/m, Suhu 37.4C. Faring edema ringan dengan eksudat minimal. Terapi ambroxol syr, cetirizine, dan hidrasi adekuat.',
    rare_fields: {
      suhu_aksila: '37.4',
      berat_badan_kg: '68',
    },
    billed_amount: 150000,
    claim_status: 'paid',
    paid_date: '2026-08-30',
    data_source: 'synthetic',
  },

  // --- PAIR 4: LEGITIMATE REPEATED SERVICE ON DIFFERENT EPISODES (e.g. Hemodialysis Routine) ---
  {
    claim_id: 'CLM-007',
    no_rm: 'RM-771107',
    sep_number: '0192R0010826V000007',
    patient_id: 'PAT-7711-FARHAN',
    practitioner_id: 'DR-RUD-05',
    provider_id: 'FASKES-RS-SILOAM',
    encounter_id: 'ENC-2026-HD-08',
    episode_id: 'EP-2026-HD-AUG-CYCLE', // Episode Agustus
    service_date: '2026-08-08',
    claim_date: '2026-08-09',
    diagnosis: ['N18.5', 'I10'],
    procedure: ['PROC-HEMODIALYSIS', 'PROC-LAB-UREUM'],
    clinical_text:
      'Pasien rutin penyakit ginjal kronik stadium 5 menjalani hemodialisis reguler siklus ke-1 Agustus. Akses vaskular AV shunt kiri paten bising terdengar. Durasi HD 4.5 jam, Qb 200 ml/m, UF goal 2200 ml. Post HD keluhan pusing disangkal.',
    rare_fields: {
      ureum_pre_hd: '142',
      creatinine_pre_hd: '9.4',
      kt_v: '1.45',
    },
    billed_amount: 1100000,
    claim_status: 'paid',
    paid_date: '2026-08-16',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-008',
    no_rm: 'RM-771107', // SAME PATIENT & RM
    sep_number: '0192R0010926V000008',
    patient_id: 'PAT-7711-FARHAN', // SAME PATIENT
    practitioner_id: 'DR-RUD-05',
    provider_id: 'FASKES-RS-SILOAM',
    encounter_id: 'ENC-2026-HD-09',
    episode_id: 'EP-2026-HD-SEP-CYCLE', // DIFFERENT EPISODE (September Cycle)!
    service_date: '2026-09-08',
    claim_date: '2026-09-09',
    diagnosis: ['N18.5', 'I10'],
    procedure: ['PROC-HEMODIALYSIS', 'PROC-LAB-UREUM'],
    clinical_text:
      'Pasien rutin penyakit ginjal kronik stadium 5 menjalani hemodialisis reguler siklus ke-1 September. Akses vaskular AV shunt kiri lancar tidak ada hematom. Durasi HD 4.5 jam, Qb 210 ml/m, UF goal 2400 ml. Sesi dialisis berlangsung stabil.',
    rare_fields: {
      ureum_pre_hd: '138',
      creatinine_pre_hd: '9.1',
      kt_v: '1.42',
    },
    billed_amount: 1100000,
    claim_status: 'submitted',
    data_source: 'synthetic',
  },

  // --- DIVERSE NORMAL CASES (Clean, Diverse Specializations) ---
  {
    claim_id: 'CLM-009',
    no_rm: 'RM-108809',
    sep_number: '0192R0010826V000009',
    patient_id: 'PAT-1088-GANI',
    practitioner_id: 'DR-ANI-02',
    provider_id: 'FASKES-RS-MATA-JKT',
    encounter_id: 'ENC-2026-4100',
    episode_id: 'EP-2026-CATARACT-OD',
    service_date: '2026-08-18',
    claim_date: '2026-08-19',
    diagnosis: ['H25.9'],
    procedure: ['PROC-PHACO-IOL'],
    clinical_text:
      'Operasi fakoemulsifikasi dengan implantasi lensa intraokular (IOL) pada mata kanan atas indikasi katarak senilis matur. Prosedur lancar tanpa ruptur kapsul posterior. TIO post op 14 mmHg.',
    rare_fields: {
      biometry_axial_length: '23.45',
      iol_power: '+21.5',
    },
    billed_amount: 5800000,
    claim_status: 'paid',
    paid_date: '2026-08-26',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-010',
    no_rm: 'RM-209110',
    sep_number: '0192R0010826V000010',
    patient_id: 'PAT-2091-HANIFAH',
    practitioner_id: 'DR-YUS-07',
    provider_id: 'FASKES-RSUD-02',
    encounter_id: 'ENC-2026-5201',
    episode_id: 'EP-2026-SEPSIS-ICU',
    service_date: '2026-08-25',
    claim_date: '2026-08-28',
    diagnosis: ['A41.9', 'N39.0'],
    procedure: ['PROC-ICU-DAY', 'PROC-CVC-INSERT'],
    clinical_text:
      'Perawatan intensif ICU hari ke-3 pasien sepsis berat sekunder urosepsis. Terpasang central venous catheter vena jugularis interna dekstra. Titrasi noradrenalin untuk mempertahankan MAP diatas 65 mmHg.',
    rare_fields: {
      lactate_serum: '4.2',
      sofa_score: '9',
    },
    billed_amount: 14200000,
    claim_status: 'paid',
    paid_date: '2026-09-05',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-011',
    no_rm: 'RM-661211',
    sep_number: '0192R0010926V000011',
    patient_id: 'PAT-6612-IRFAN',
    practitioner_id: 'DR-WID-11',
    provider_id: 'FASKES-RS-ORTHO-SOLO',
    encounter_id: 'ENC-2026-6110',
    episode_id: 'EP-2026-ORIF-FEMUR',
    service_date: '2026-09-02',
    claim_date: '2026-09-05',
    diagnosis: ['S72.301A'],
    procedure: ['PROC-ORIF-IM-NAIL'],
    clinical_text:
      'Tindakan reduksi terbuka dan fiksasi internal (ORIF) menggunakan intramedullary nail pada fraktur diafisis femur dekstra tertutup pasca KLL. Evaluasi c-arm intraoperatif menunjukkan aligment anatomis baik.',
    rare_fields: {
      blood_loss_ml: '350',
      im_nail_size: '10x380mm',
    },
    billed_amount: 19500000,
    claim_status: 'submitted',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-012',
    no_rm: 'RM-773412',
    sep_number: '0192R0010926V000012',
    patient_id: 'PAT-7734-JOKO',
    practitioner_id: 'DR-KUS-08',
    provider_id: 'FASKES-KLINIK-UTAMA',
    encounter_id: 'ENC-2026-7019',
    episode_id: 'EP-2026-DM-CONTROL',
    service_date: '2026-09-07',
    claim_date: '2026-09-08',
    diagnosis: ['E11.9', 'I10'],
    procedure: ['PROC-POLI-KRONIS', 'PROC-LAB-HBA1C'],
    clinical_text:
      'Kunjungan rutin program pengelolaan penyakit kronis (Prolanis) diabetes melitus tipe 2 dan hipertensi derajat 1. Keluhan polidipsi berkurang, neuropati perifer minimal. Terapi metformin 500mg 2x1 dan amlodipin 5mg 1x1 dilanjutkan.',
    rare_fields: {
      hba1c_pct: '7.8',
      gds_mg_dl: '154',
    },
    billed_amount: 320000,
    claim_status: 'submitted',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-013',
    no_rm: 'RM-881913',
    sep_number: '0192R0010926V000013',
    patient_id: 'PAT-8819-KARTIKA',
    practitioner_id: 'DR-HEN-04',
    provider_id: 'FASKES-RSUD-01',
    encounter_id: 'ENC-2026-8090',
    episode_id: 'EP-2026-STROKE-INF',
    service_date: '2026-09-09',
    claim_date: '2026-09-11',
    diagnosis: ['I63.9', 'I10'],
    procedure: ['PROC-CT-BRAIN', 'PROC-RAWAT-INAP'],
    clinical_text:
      'Pasien perempuan 56 tahun masuk dengan kelemahan anggota gerak sisi kiri mendadak saat bangun tidur. GCS E4V5M6, parese N. VII dan XII dextra sentral, motorik ekstremitas sinistra 3/5. CT scan kepala non kontras menunjukkan infark subakut di kapsula interna dekstra.',
    rare_fields: {
      nihss_score: '7',
      map_mmhg: '112',
    },
    billed_amount: 6200000,
    claim_status: 'submitted',
    data_source: 'synthetic',
  },
  {
    claim_id: 'CLM-014',
    no_rm: 'RM-901114',
    sep_number: '0192R0010926V000014',
    patient_id: 'PAT-9011-LUKMAN',
    practitioner_id: 'DR-SUR-01',
    provider_id: 'FASKES-RS-JANTUNG',
    encounter_id: 'ENC-2026-9022',
    episode_id: 'EP-2026-CAG-CORONARY',
    service_date: '2026-09-12',
    claim_date: '2026-09-14',
    diagnosis: ['I25.1'],
    procedure: ['PROC-CORONARY-ANGIO', 'PROC-PCI-STENT'],
    clinical_text:
      'Angiografi koroner diagnostik dilanjutkan perkutan transluminal angioplasti (PCI) dengan 1 DES (Drug-Eluting Stent) pada mid-LAD stenosis 85%. Hasil TIMI flow 3 tanpa diseksi atau no-reflow.',
    rare_fields: {
      troponin_i: '0.04',
      stent_dimension: '3.0x24mm',
    },
    billed_amount: 32000000,
    claim_status: 'submitted',
    data_source: 'synthetic',
  },
];
