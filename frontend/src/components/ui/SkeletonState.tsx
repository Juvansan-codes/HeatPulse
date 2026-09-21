'use client';

import React from 'react';

interface SkeletonStateProps {
  lines?: number;
  height?: string;
  className?: string;
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded-xl bg-white border border-slate-200 animate-pulse space-y-3 ${className}`}>
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-5 bg-slate-200 rounded-full w-16" />
    </div>
    <div className="h-8 bg-slate-200 rounded w-2/3" />
    <div className="h-3 bg-slate-100 rounded w-full" />
    <div className="h-3 bg-slate-100 rounded w-4/5" />
  </div>
);

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonText: React.FC<SkeletonStateProps> = ({
  lines = 3,
  height = 'h-4',
  className = ''
}) => (
  <div className={`space-y-2 animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`${height} bg-slate-200 rounded ${
          i === lines - 1 ? 'w-2/3' : 'w-full'
        }`}
      />
    ))}
  </div>
);
