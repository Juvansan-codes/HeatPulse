import React from 'react';
import { SeverityLevel } from '../lib/types';

interface RiskBadgeProps {
  level: SeverityLevel;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  pulseExtreme?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showDot = true,
  pulseExtreme = true,
  className = ''
}) => {
  const styles: Record<SeverityLevel, { bg: string; text: string; border: string; dot: string }> = {
    Normal: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400'
    },
    Moderate: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400'
    },
    High: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      dot: 'bg-orange-400'
    },
    'Very High': {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-400'
    },
    Extreme: {
      bg: 'bg-purple-600/15',
      text: 'text-purple-300',
      border: 'border-purple-500/40',
      dot: 'bg-purple-400'
    }
  };

  const current = styles[level] || styles.Normal;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold'
  }[size];

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  const isExtreme = level === 'Extreme';

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full uppercase tracking-wider ${sizeClasses} ${current.bg} ${current.text} ${current.border} ${
        isExtreme && pulseExtreme ? 'pulse-extreme' : ''
      } ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${dotSizes} ${current.dot} ${
            isExtreme ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{level}</span>
    </span>
  );
};
