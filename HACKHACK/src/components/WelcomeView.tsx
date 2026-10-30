import React from 'react';
import {
  Copy,
  Layers,
  Radar,
  Share2,
  ListFilter,
  FileCheck2,
  UploadCloud,
  Sliders,
  ArrowRight,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface WelcomeViewProps {
  onEnterApp: (targetTab?: NavTab) => void;
  claimCount: number;
  pairCount: number;
  pendingReviewCount?: number;
  onLoad300Dataset?: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onEnterApp, claimCount, pairCount }) => {
  const features = [
    { title: 'Deteksi Cloning', desc: 'Membandingkan kemiripan narasi klinis, diagnosis, dan nilai lab antarklaim.', icon: Copy, color: 'text-[#297fbd] bg-[#297fbd]/10', tab: 'review-queue' as NavTab },
    { title: 'Deteksi Repeat Billing', desc: 'Menemukan klaim berulang pada episode, tindakan, dan nominal yang sama.', icon: Layers, color: 'text-[#13712c] bg-emerald-50', tab: 'review-queue' as NavTab },
    { title: 'Diagram Risiko', desc: 'Kandidat, teks klinis, lab langka, faskes & DPJP, episode & tindakan, status bayar.', icon: Radar, color: 'text-indigo-600 bg-indigo-50', tab: 'review-queue' as NavTab },
    { title: 'Relasi Entitas', desc: 'Hubungan Pasien, Episode, Klaim, Faskes, dan DPJP.', icon: Share2, color: 'text-violet-600 bg-violet-50', tab: 'review-queue' as NavTab },
    { title: 'Antrean Verifikasi', desc: 'Kasus diurutkan per prioritas risiko: Tinggi, Sedang, Rendah.', icon: ListFilter, color: 'text-amber-600 bg-amber-50', tab: 'review-queue' as NavTab },
    { title: 'Log Audit', desc: 'Rekam keputusan verifikator dan ekspor ke JSON.', icon: FileCheck2, color: 'text-sky-600 bg-sky-50', tab: 'audit-log' as NavTab },
    { title: 'Input Multi-Format', desc: 'JSONL SATUSEHAT FHIR, PDF, dan citra melalui OCR.', icon: UploadCloud, color: 'text-teal-600 bg-teal-50', tab: 'data-input' as NavTab },
    { title: 'Parameter Skor', desc: 'Atur bobot dan ambang batas penilaian risiko.', icon: Sliders, color: 'text-slate-600 bg-slate-100', tab: 'dashboard' as NavTab },
  ];

  const pillars = [
    { title: 'Dua Jalur Deteksi', desc: 'Cloning dan repeat billing dianalisis terpisah.' },
    { title: 'Multidimensi', desc: 'Narasi, lab, tindakan, diagnosis, dan tanggal layanan.' },
    { title: 'Teraudit', desc: 'Setiap keputusan verifikator tercatat.' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfcfd] text-[#101731] font-sans relative overflow-x-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#297fbd]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-32 w-[550px] h-[550px] bg-[#52b754]/10 rounded-full blur-[130px]" />
        <div className="absolute -bottom-48 left-1/3 w-[650px] h-[650px] bg-[#d6df41]/10 rounded-full blur-[160px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 h-16 apple-glass-header px-4 sm:px-8 flex items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200 shadow-xs p-1.5 flex items-center justify-center">
            <img src="/vireon-logo.png" alt="Logo VIREON" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base tracking-tight">VIREON</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 relative z-10">
        {/* Hero */}
        <section className="text-center flex flex-col items-center">
          <div className="apple-glass-pill px-4 py-1.5 mb-6 text-xs font-semibold text-[#297fbd] border-[#297fbd]/30 bg-white/80">
            Platform Deteksi Anomali Klaim Kesehatan FKRTL
          </div>

          <div className="w-32 h-32 sm:w-40 sm:h-40 mb-6 rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-blue-900/10 p-5 sm:p-6 flex items-center justify-center">
            <img src="/vireon-logo.png" alt="Logo VIREON" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">VIREON</h1>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-lg sm:text-2xl font-bold">
            <span className="text-[#297fbd]">Anti-Cloning</span>
            <span className="text-[#101731]">&amp;</span>
            <span className="text-[#13712c]">Anti-Repeat Billing</span>
          </div>

          <p className="mt-4 text-sm text-slate-600 max-w-xl leading-relaxed">
            Deteksi dini klaim kloning dan penagihan berulang untuk verifikasi klaim yang lebih cepat dan akurat.
          </p>

          <button
            onClick={() => onEnterApp('dashboard')}
            className="mt-8 inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-[#297fbd] to-[#52b754] text-white text-sm font-bold rounded-full shadow-lg shadow-[#297fbd]/25 hover:opacity-95 transition cursor-pointer"
          >
            <span>Masuk ke Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <span className="apple-glass-pill px-3.5 py-1 bg-white">
              Basis Data Riwayat: <strong className="text-[#101731] font-mono">{claimCount}</strong> klaim
            </span>
            <span className="apple-glass-pill px-3.5 py-1 bg-white">
              {pairCount > 0 ? (
                <>Pasangan Dianalisis: <strong className="text-[#101731] font-mono">{pairCount}</strong></>
              ) : (
                <span className="text-[#13712c] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52b754] animate-pulse"></span>
                  Sistem Siap Menguji Berkas Masuk
                </span>
              )}
            </span>
          </div>
        </section>

        {/* Fitur */}
        <section className="space-y-5">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-center">Fitur Utama</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  onClick={() => onEnterApp(f.tab)}
                  className="apple-glass-card rounded-3xl p-5 border border-slate-200/90 bg-white/85 hover:border-[#297fbd]/50 hover:shadow-md transition cursor-pointer group"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold group-hover:text-[#297fbd] transition">{f.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pilar */}
        <section className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 bg-white/85">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {pillars.map((p, i) => (
              <div key={p.title} className={i > 0 ? 'md:border-l md:border-slate-200' : ''}>
                <div className="text-base font-bold">{p.title}</div>
                <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="apple-glass-header border-t py-5 px-6 text-xs relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-mono font-extrabold text-sm text-[#101731]">VIREON 2026</span>
          <span className="text-slate-500">Anti-Cloning &amp; Anti-Repeat Billing</span>
        </div>
      </footer>
    </div>
  );
};

