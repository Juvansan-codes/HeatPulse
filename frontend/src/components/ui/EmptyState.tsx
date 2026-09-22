'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No active heat alerts',
  message = 'All 200 GCC wards are currently within acceptable thermal baseline limits.',
  icon = <ShieldCheck className="w-8 h-8 text-emerald-500" />,
  className = ''
}) => {
  return (
    <div className={`p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 ${className}`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <h3 className="font-bold text-sm text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{message}</p>
    </div>
  );
};
