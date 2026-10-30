import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ListFilter,
  FileCheck2,
  Sliders,
  RotateCcw,
  Activity,
  HeartPulse,
} from 'lucide-react';

export type NavTab = 'welcome' | 'dashboard' | 'data-input' | 'review-queue' | 'audit-log';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenConfig: () => void;
  onResetData: () => void;
  pendingReviewCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenConfig,
  onResetData,
  pendingReviewCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/15 flex items-center justify-center p-1.5 shadow-sm">
              <img
                src="/vireon-logo.png"
                alt="Vireon"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">VIREON</span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Prototipe Verifikator Anti-Cloning & Anti-Repeat Billing
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('data-input')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'data-input'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Input Data & OCR</span>
            </button>

            <button
              onClick={() => onTabChange('review-queue')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                currentTab === 'review-queue'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Antrean Verifikasi</span>
              {pendingReviewCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-rose-500 text-white shadow-xs">
                  {pendingReviewCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('audit-log')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'audit-log'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Log Audit</span>
            </button>
          </nav>

          {/* Quick Utility Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenConfig}
              title="Konfigurasi Bobot & Nilai Ambang Batas"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Konfigurasi Bobot</span>
            </button>

            <button
              onClick={onResetData}
              title="Kembalikan ke Contoh Data Sintetis Awal"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-700/60 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
