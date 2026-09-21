import React from 'react';
import { SeverityLevel } from '../lib/types';
import { RISK_TOKENS } from '../lib/design-tokens';

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
  const token = RISK_TOKENS[level] || RISK_TOKENS.Normal;

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
      className={`inline-flex items-center font-bold border rounded-full uppercase tracking-wider ${sizeClasses} ${token.bgClass} ${token.textClass} ${token.borderClass} ${
        isExtreme && pulseExtreme ? 'pulse-extreme' : ''
      } ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${dotSizes} ${
            isExtreme ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: token.dotColor }}
        />
      )}
      <span>{token.label}</span>
    </span>
  );
};

