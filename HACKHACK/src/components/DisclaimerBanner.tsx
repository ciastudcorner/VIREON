import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = () => {
  return (
    <div className="apple-glass-card border border-amber-200/90 rounded-2xl p-3 flex items-center gap-3 shadow-xs bg-amber-50/40 text-xs text-slate-600">
      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
      <span>Skor analitik berfungsi sebagai pendukung verifikasi klaim medis.</span>
    </div>
  );
};
