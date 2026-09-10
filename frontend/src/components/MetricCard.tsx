import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  provenanceTag?: string;
  statusBadge?: React.ReactNode;
  delta?: {
    value: string;
    isIncrease: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  severityAccent?: 'Normal' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  provenanceTag,
  statusBadge,
  delta,
  severityAccent,
  className = ''
}) => {
  const accentBorders: Record<string, string> = {
    Normal: 'border-t-2 border-t-emerald-500',
    Moderate: 'border-t-2 border-t-amber-500',
    High: 'border-t-2 border-t-orange-500',
    'Very High': 'border-t-2 border-t-red-500',
    Extreme: 'border-t-2 border-t-purple-600'
  };

  const accentClass = severityAccent ? accentBorders[severityAccent] : '';

  return (
    <div
      className={`bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 shadow-md ${accentClass} ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {statusBadge && <div>{statusBadge}</div>}
      </div>

      <div className="my-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold font-mono tracking-tight text-slate-50 tabular-nums">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="truncate pr-2">
          {subtitle && <span>{subtitle}</span>}
          {delta && (
            <span
              className={`font-mono text-[11px] font-medium ${
                delta.isNeutral
                  ? 'text-slate-400'
                  : delta.isIncrease
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {delta.isIncrease ? '▲ ' : delta.isNeutral ? '• ' : '▼ '}
              {delta.value} {delta.label && <span className="text-slate-400 font-sans">{delta.label}</span>}
            </span>
          )}
        </div>
        {provenanceTag && (
          <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
            {provenanceTag}
          </span>
        )}
      </div>
    </div>
  );
};
