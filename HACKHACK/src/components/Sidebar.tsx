import React from 'react';
import {
  Home,
  LayoutDashboard,
  FileSpreadsheet,
  ListFilter,
  FileCheck2,
  Sliders,
  RotateCcw,
  ShieldCheck,
  PanelLeftClose,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenConfig: () => void;
  onResetData: () => void;
  pendingReviewCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onExitToLanding?: () => void;
  verifierName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenConfig,
  onResetData,
  pendingReviewCount,
  isOpen,
  onToggle,
  onExitToLanding,
  verifierName,
}) => {
  const verifierInitials = (verifierName || 'dr. Hendra P.')
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      sublabel: 'Dashboard Kontrol',
      icon: LayoutDashboard,
    },
    {
      id: 'data-input' as NavTab,
      label: 'Input Data',
      sublabel: 'JSONL, PDF & Citra',
      icon: FileSpreadsheet,
    },
    {
      id: 'review-queue' as NavTab,
      label: 'Antrean Verifikasi',
      sublabel: 'Prioritas Risiko',
      icon: ListFilter,
      badge: pendingReviewCount,
    },
    {
      id: 'audit-log' as NavTab,
      label: 'Log Audit',
      sublabel: 'Jejak Keputusan',
      icon: FileCheck2,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 h-screen z-40 apple-glass-sidebar flex flex-col justify-between transition-all duration-300 ease-in-out select-none shrink-0 ${
          isOpen
            ? 'w-64 p-4 translate-x-0 opacity-100 shadow-2xl'
            : 'w-0 p-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 overflow-hidden border-r-0'
        }`}
      >
        {/* Top Section: Brand & Navigation */}
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div
              onClick={onExitToLanding}
              className="flex items-center gap-3 cursor-pointer group"
              title="Kembali ke Halaman Utama VIREON"
            >
              <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 group-hover:border-[#297fbd] flex items-center justify-center p-1.5 shadow-sm shrink-0 transition">
                <img
                  src="/vireon-logo.png"
                  alt="Vireon"
                  className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-[#101731] group-hover:text-[#297fbd] transition">VIREON</span>
                </div>
                <p className="text-[11px] text-[#297fbd] font-medium leading-tight">
                  Anti-Cloning &amp; Anti-Repeat Billing
                </p>
              </div>
            </div>

            <button
              onClick={onToggle}
              title="Tutup Panel Samping"
              className="p-1.5 rounded-xl text-slate-400 hover:text-[#101731] hover:bg-slate-100 transition cursor-pointer shrink-0 ml-1"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-2">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#90a29f]">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#297fbd] to-[#52b754] text-white shadow-md shadow-[#297fbd]/25 border border-transparent'
                      : 'text-[#212b50] hover:text-[#101731] hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white shadow-xs'
                          : 'bg-slate-100 text-[#212b50] group-hover:text-[#297fbd] group-hover:bg-[#297fbd]/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className={isActive ? 'text-white font-bold' : 'text-[#212b50] group-hover:text-[#101731]'}>
                        {item.label}
                      </div>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full font-mono transition shadow-xs ${
                        isActive
                          ? 'bg-white text-rose-700 shadow-xs'
                          : item.badge > 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* System Settings & Actions */}
          <div className="space-y-1.5 pt-2">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#90a29f]">
              Alat Verifikator
            </div>

            {onExitToLanding && (
              <button
                onClick={onExitToLanding}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-medium text-[#212b50] hover:text-[#297fbd] hover:bg-slate-100 transition cursor-pointer"
              >
                <div className="p-1.5 rounded-xl bg-slate-100 text-[#212b50]">
                  <Home className="w-4 h-4 text-[#297fbd]" />
                </div>
                <span>Halaman Utama</span>
              </button>
            )}

            <button
              onClick={onOpenConfig}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-medium text-[#212b50] hover:text-[#297fbd] hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="p-1.5 rounded-xl bg-slate-100 text-[#212b50]">
                <Sliders className="w-4 h-4" />
              </div>
              <span>Parameter Skor</span>
            </button>

            <button
              onClick={onResetData}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-medium text-[#212b50] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <div className="p-1.5 rounded-xl bg-slate-100 text-[#212b50]">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span>Reset Data Demo</span>
            </button>
          </div>
        </div>

        {/* Bottom Section: Verifier Profile Card */}
        <div className="pt-4 border-t border-slate-200">
          <div className="p-3 bg-white/90 border border-slate-200/80 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#297fbd] to-[#52b754] p-0.5 shadow-xs">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-[#297fbd] font-bold text-sm">
                  {verifierInitials || 'V'}
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#52b754] border-2 border-white rounded-full"></span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#101731] truncate">{verifierName || 'dr. Hendra P.'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#297fbd] shrink-0" />
              </div>
              <p className="text-[10px] text-[#90a29f] truncate">Verifikator Medis BPJS</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
