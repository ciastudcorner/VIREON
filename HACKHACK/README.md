# VIREON - Healthcare Claim Anti-Cloning & Anti-Repeat Billing System
### Web Prototype

> **Disclaimer Resmi:**  
> *“Prototype scores are generated from synthetic/demo data and have not been validated on real BPJS Kesehatan claims. Results are intended to support human review, not determine fraud automatically.”*

---

## 1. Konsep & Arsitektur Sistem

VIREON dirancang khusus untuk membantu verifikator klaim BPJS Kesehatan mendeteksi indikasi **Cloning Rekam Medis** dan **Repeat Billing**, bukan untuk memutuskan fraud secara otomatis tanpa telaah manusia (*Human-in-the-Loop*).

Sistem mengikuti alur arsitektur 8 tahap:
```
[Data Input (JSON/JSONL/OCR)] 
            ↓
[Claim Intelligence & Harmonization]
            ↓
[Candidate Generation (Candidate Match Score)]
            ↓
[Anti-Cloning & Anti-Repeat Billing Engines (Specialist Scores)]
            ↓
[Hybrid Fraud Risk Scoring (Final Fraud Risk Score)]
            ↓
[Visual Explainability (Side-by-Side Diff, Chronology Timeline, Entity Graph, Radar Multi-Dimensi)]
            ↓
[Human-in-the-Loop Review (Verifikator Decision & Clinical Notes)]
            ↓
[Audit Log & Integration Export]
```

### 3 Level Scoring yang Berbeda
1. **Candidate Match Score (Level 1 - Pra-Filter Relevansi):**
   - Dihitung saat *Candidate Generation* untuk menyaring pasangan klaim sebelum masuk ke detector utama.
   - Menggabungkan kesamaan entitas pasien/provider/dokter, overlap diagnosis/prosedur, kedekatan temporal, dan kesamaan teks dasar.
   - **BUKAN probabilitas fraud**, melainkan indikator kelayakan komparasi.
2. **Specialist Detection Score (Level 2 - Analisis Spesialis):**
   - **Cloning Score:** Mendeteksi duplikasi narasi klinis & kesamaan biomarker langka (*rare-fields*) antar pasien yang berbeda di faskes/dokter yang sama dengan template suppression.
   - **Repeat Billing Score:** Mendeteksi klaim berulang pada pasien yang sama, episode yang sama, prosedur identik, di mana klaim sebelumnya telah berstatus **PAID**. Pelayanan sah pada episode berbeda (misal siklus rutin hemodialisis) otomatis dinormalkan.
3. **Final Fraud Risk Score (Level 3 - Prioritas Review Manusia):**
   - Menggabungkan *Candidate Match Score* dan *Specialist Score* menggunakan konfigurasi bobot transparan (*weighted formula*).
   - Digunakan untuk mengurutkan prioritas antrean kerja verifikator (High Risk / Suspicious / Normal), bukan vonis final.

---

## 2. Struktur Proyek

```
d:/HACKHACK/
├── sample_data/                        # Sample dataset berkas klaim & master
│   ├── claims_300_fkrtl.jsonl          # Dataset 300 klaim FKRTL format SATUSEHAT FHIR
│   ├── claims_300_indonesia.jsonl      # Dataset 300 klaim JSONL
│   ├── sample_claims.json              # Contoh klaim format JSON
│   ├── sample_claims.jsonl             # Contoh klaim format JSONL
│   └── Contoh Dummy RS Haji.pdf        # Dokumen fisik klaim contoh format PDF
├── src/
│   ├── config/
│   │   └── scoringConfig.ts            # Konfigurasi bobot matematis & threshold dinamis
│   ├── data/
│   │   └── sampleClaims.ts             # Synthetic claims kasus nyata (cloning, repeat, kontrol)
│   ├── types/
│   │   └── claim.ts                    # TypeScript interface (Claim, Evidence, Audit, Provenance)
│   ├── services/
│   │   ├── harmonizationService.ts     # Validasi format, normalisasi ISO-8601, data quality score
│   │   ├── candidateService.ts         # Candidate Generation & Candidate Match Score
│   │   ├── cloningService.ts           # Anti-Cloning Engine (Template suppression, rare fields)
│   │   ├── repeatBillingService.ts     # Anti-Repeat Billing Engine (Episode linkage, paid check)
│   │   ├── hybridRiskService.ts        # Hybrid Risk Engine & Category Classification
│   │   ├── ocrService.ts               # OCR Engine (Tesseract.js) & Provenance Tracking
│   │   └── auditService.ts             # Human-in-the-Loop decision storage (localStorage & export)
│   ├── components/
│   │   ├── WelcomeView.tsx             # Halaman pembuka mandiri Platform Deteksi Anomali Klaim
│   │   ├── Sidebar.tsx                 # Navigasi bilah samping interaktif & profil verifikator dinamis
│   │   ├── Navbar.tsx                  # Navigasi atas & reset demo / konfigurasi
│   │   ├── DisclaimerBanner.tsx        # Banner peringatan prototype resmi
│   │   ├── ConfigModal.tsx             # Modal tuning bobot & threshold real-time
│   │   ├── DashboardView.tsx           # Dashboard verifikator (metrik inti, top cases, OCR)
│   │   ├── DataInputView.tsx           # Input terstruktur (JSONL FHIR, PDF) & Scanned OCR Dokumen
│   │   ├── ReviewQueueView.tsx         # Antrean verifikasi klaim dengan filter risiko & sorting A-Z
│   │   ├── CaseInvestigationView.tsx   # Investigasi detail kasus & form telaah manusia
│   │   ├── SpiderwebRadarChart.tsx     # Visualisasi diagram laba-laba risiko anomali 5 dimensi
│   │   ├── VisualExplainabilityCloning.tsx        # Side-by-side diff teks & tabel biomarker
│   │   ├── VisualExplainabilityRepeatBilling.tsx  # Timeline kronologis pengajuan & reason codes
│   │   ├── MiniEvidenceGraph.tsx       # Graf visual entitas (Patient -> Episode -> Claim -> Faskes)
│   │   └── AuditLogView.tsx            # Rekam jejak audit keputusan verifikator & export JSON
│   ├── App.tsx                         # State pipeline utama aplikasi
│   ├── main.tsx                        # Entry point aplikasi
│   └── index.css                       # Styling Tailwind CSS & highlight diff
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Cara Menjalankan

### Prasyarat
- Node.js (versi 18+)
- npm (versi 9+)

### Langkah Instalasi & Menjalankan Dev Server
```bash
# 1. Masuk ke direktori proyek
cd d:/HACKHACK

# 2. Install dependencies (jika belum)
npm install

# 3. Jalankan server pengembangan Vite
npm run dev
```

Buka URL lokal yang muncul di terminal (biasanya `http://localhost:5173`) di browser Anda.

### Menjalankan Build Produksi
```bash
npm run build
npm run preview
```

---

## 4. Lokasi Scoring Logic

Semua logika penilaian dipisahkan secara modular agar transparan dan mudah diintegrasikan dengan backend API nyata:

1. **Candidate Match Scoring:**
   - Berada di: [`src/services/candidateService.ts`](file:///d:/HACKHACK/src/services/candidateService.ts)
   - Fungsi utama: `generateCandidatePairs(claims, config)`
2. **Anti-Cloning Scoring:**
   - Berada di: [`src/services/cloningService.ts`](file:///d:/HACKHACK/src/services/cloningService.ts)
   - Fungsi utama: `evaluateCloning(claimA, claimB, config)`
   - Mencakup algoritma: `suppressTemplates()`, `findOverlappingPhrases()`, dan komparasi biomarker langka `rare_fields`.
3. **Anti-Repeat Billing Scoring:**
   - Berada di: [`src/services/repeatBillingService.ts`](file:///d:/HACKHACK/src/services/repeatBillingService.ts)
   - Fungsi utama: `evaluateRepeatBilling(claimA, claimB, config)`
   - Memeriksa ketat batasan episode: Jika episode berbeda (misal `EP-HD-AUG` vs `EP-HD-SEP`), klaim dinyatakan sah (*legitimate separate episode*).
4. **Hybrid Risk Engine & Thresholds:**
   - Berada di: [`src/services/hybridRiskService.ts`](file:///d:/HACKHACK/src/services/hybridRiskService.ts)
   - Konfigurasi bobot dapat disesuaikan di: [`src/config/scoringConfig.ts`](file:///d:/HACKHACK/src/config/scoringConfig.ts) atau langsung melalui tombol **"Config Engine"** di navigasi web.

---

## 5. Lokasi Sample Dataset

Dataset bawaan berada di:
- Kode Sumber: [`src/data/sampleClaims.ts`](file:///d:/HACKHACK/src/data/sampleClaims.ts)
- File JSON: [`sample_data/sample_claims.json`](file:///d:/HACKHACK/sample_data/sample_claims.json)
- File JSONL: [`sample_data/sample_claims.jsonl`](file:///d:/HACKHACK/sample_data/sample_claims.jsonl)
- Dataset FKRTL FHIR 300 Klaim: [`sample_data/claims_300_fkrtl.jsonl`](file:///d:/HACKHACK/sample_data/claims_300_fkrtl.jsonl)
- Berkas Klaim Fisik PDF: [`sample_data/Contoh Dummy RS Haji.pdf`](file:///d:/HACKHACK/sample_data/Contoh%20Dummy%20RS%20Haji.pdf)

Dataset ini mencakup:
- **Kasus Cloning Nyata:** `CLM-2026-001` vs `CLM-2026-002` (Pasien berbeda, dokter sama di RSUD Sehat Sentosa, teks klinis pneumonia identik, biomarker langka identik `CRP: 48.4`, `SpO2: 91%`).
- **Kasus Repeat Billing Nyata:** `CLM-2026-003` vs `CLM-2026-004` (Pasien sama, episode sama `EP-2026-CITRA-APP`, prosedur operasi apendektomi identik, diajukan ulang setelah klaim pertama dibayar/PAID).
- **Kasus Mirip yang Sah (Kontrol Template):** `CLM-2026-005` vs `CLM-2026-006` (Pasien ISPA di Puskesmas menggunakan template poli umum yang serupa namun temuan klinis spesifik berbeda).
- **Kasus Pengulangan Layanan yang Sah (Kontrol Episode Berbeda):** `CLM-2026-007` vs `CLM-2026-008` (Pasien hemodialisis kronis siklus Agustus vs September, otomatis diklasifikasikan Normal).
- **Kasus-kasus Kontrol:** Bedah ortopedi, katarak mata, ICU sepsis, intervensi jantung koroner, dan poli kronis prolanis.

---

## 6. Bagaimana Menambahkan Data Dummy Baru

Ada 3 cara mudah menambahkan data klaim:

### Cara 1: Upload via UI (Halaman "Data Input & OCR")
1. Buka tab **"Data Input & OCR"**.
2. Pada bagian **A. Structured Data Ingestion**, klik area dropzone dan pilih file `sample_data/claims_300_fkrtl.jsonl`, `sample_data/sample_claims.json`, atau file `.jsonl` baru milik Anda.
3. Anda juga dapat langsung mem-paste teks JSON/JSONL pada textarea yang tersedia lalu klik **"Harmonisasikan & Proses Data Masuk"**.

### Cara 2: Menambahkan Dokumen Gambar via OCR atau Berkas PDF
1. Buka tab **"Data Input & OCR"** -> sub-tab **"B. Scanned Document OCR"** atau unggah berkas PDF klaim.
2. Klik tombol preset (contoh: *Preset Resume IGD*) atau upload file dokumen fisik (`.pdf`, `.png`, `.jpg`).
3. Engine OCR akan mengekstrak teks, menghitung confidence score, dan memungkinkan Anda mengedit teks hasil pembacaan sebelum disimpan.

### Cara 3: Menambahkan Langsung ke Kode
Buka file [`src/data/sampleClaims.ts`](file:///d:/HACKHACK/src/data/sampleClaims.ts) dan tambahkan objek baru ke array `SAMPLE_CLAIMS`:
```typescript
{
  claim_id: "CLM-2026-999",
  patient_id: "PAT-CONTOH-01",
  practitioner_id: "DR-CONTOH",
  provider_id: "FASKES-RSUD-01",
  encounter_id: "ENC-999",
  episode_id: "EP-999",
  service_date: "2026-09-10",
  claim_date: "2026-09-12",
  diagnosis: ["J18.9"],
  procedure: ["PROC-CXR"],
  clinical_text: "Deskripsi narasi klinis dokter...",
  rare_fields: { "crp_mg_l": "45.0", "spo2_pct": "93" },
  billed_amount: 2500000,
  claim_status: "submitted",
  data_source: "manual_synthetic"
}
```
Aplikasi akan secara otomatis meregenerasi Candidate Pairs dan Risk Assessments secara real-time.

---

## 8. Alur Simulasi Demo Langsung (Live Pitch Demo)

Sistem telah dikonfigurasi dengan dataset riwayat 300 klaim JKN aktif langsung di backend:
- **Basis Riwayat Backend:** `jkn_historical_300_enriched.jsonl` (300 klaim riwayat terdaftar di sistem, termasuk reference `HIST-008` PAID dan `HIST-011` dengan catatan rekam medis).
- **Berkas Masuk untuk Uji Demo:**
  1. `D:\HACKHACK\DEMO\incoming\cloning_draft.json` (`IN-CL-001`): Menjiplak rekam medis & biomarker `HIST-011` pada pasien berbeda.
  2. `D:\HACKHACK\DEMO\incoming\repeat_billing_draft.json` (`IN-RB-001`): Menagihkan ulang tindakan hemodialisis pasien yang sama setelah `HIST-008` berstatus **PAID**.
  3. `D:\HACKHACK\DEMO\incoming\incoming_demo_2.jsonl`: Berisi kedua berkas di atas sekaligus untuk pengujian komparasi simultan.

### Cara Menjalankan Saat Demo:
1. Buka aplikasi via `jalankan_vireon.bat` (atau `npm run dev`).
2. Masuk ke **Input Data**.
3. Pilih tombol cepat pada panel **"Simulasi Demo Berkas Masuk"** (atau seret berkas dari folder `DEMO\incoming`).
4. Klik **"Kirim Klaim"**.
5. Buka **Antrean Verifikasi** untuk melihat deteksi anomali prioritas tinggi dan klik untuk menelaah visual diff & timeline kronologis.

