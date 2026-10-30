# HACKHACK Historical 300 Enriched v1

## Prinsip
File ini memakai 300 record Data Sampel JKN FKRTL sebagai backbone historical database.

### Field asli JKN
Disimpan di `jkn_source`:
- participant_reference / PSTV01
- visit_id_fkl02 / FKL02
- tanggal pelayanan
- diagnosis masuk dan diagnosis primer
- diagnosis sekunder hasil join
- INA-CBG
- prosedur
- biaya ditagihkan faskes
- biaya setelah verifikasi BPJS

### Field tambahan HACKHACK
Disimpan di `synthetic_enrichment`:
- claim_record_id: ID internal HACKHACK
- sep_number: SEP sintetis karena No. SEP tidak tersedia di sample
- episode_id: episode sintetis untuk reasoning prototype
- payment_status / paid_date: tidak tersedia di sample; hanya reference Repeat Billing yang sengaja diberi status paid untuk controlled demo
- clinical_text / rare_fields: tidak tersedia di sample; hanya reference Cloning/Repeat demo yang diberi narrative sintetis
- provider/practitioner display name: sintetis untuk kebutuhan UI demo

## Aturan provenance
Jangan menyebut field di `synthetic_enrichment` sebagai data asli BPJS/JKN.

## Cara demo
1. Preload `historical/jkn_historical_300_enriched.jsonl`
2. Upload `incoming/incoming_demo_2.jsonl`
3. Engine harus membandingkan incoming draft dengan 300 historical.
4. `evaluation/ground_truth_demo.json` hanya untuk evaluasi, jangan dibaca scoring engine.
