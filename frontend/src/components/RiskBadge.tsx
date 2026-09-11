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
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    },
    Moderate: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    },
    High: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500'
    },
    'Very High': {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500'
    },
    Extreme: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500'
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
