'use client';

import React from 'react';
import { Clock, Info } from 'lucide-react';

interface StaleBadgeProps {
  timestamp?: string;
  isStale?: boolean;
  className?: string;
}

export const StaleBadge: React.FC<StaleBadgeProps> = ({
  timestamp = 'Last synced today at 12:00 IST',
  isStale = false,
  className = ''
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium border ${
        isStale
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'
      } ${className}`}
    >
      <Clock className={`w-3 h-3 ${isStale ? 'text-amber-600' : 'text-[#F47C20]'}`} />
      <span>{isStale ? `Showing cached data • ${timestamp}` : timestamp}</span>
    </div>
  );
};
