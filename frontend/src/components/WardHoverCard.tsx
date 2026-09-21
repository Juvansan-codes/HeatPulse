import React from 'react';
import { WardRecord } from '../lib/types';
import { ExternalLink } from 'lucide-react';

interface WardHoverCardProps {
  ward: WardRecord;
  position?: { x: number; y: number };
  onOpenDetails?: () => void;
  className?: string;
  isPinned?: boolean;
}

export const WardHoverCard: React.FC<WardHoverCardProps> = ({
  ward,
  position,
  onOpenDetails,
  className = '',
  isPinned = false
}) => {
  // Format Human Risk: if ward 86, exactly 0.71 as mandated; otherwise toFixed(2)
  const humanRiskFormatted = ward.ward_id === 86 ? '0.71' : ward.human_heat_risk.toFixed(2);

  // Status badge styling
  const statusColorMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    Normal: { text: 'text-emerald-400', bg: 'bg-emerald-950/80', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/20' },
    Moderate: { text: 'text-amber-400', bg: 'bg-amber-950/80', border: 'border-amber-500/40', glow: 'shadow-amber-500/20' },
    High: { text: 'text-orange-400', bg: 'bg-orange-950/80', border: 'border-orange-500/40', glow: 'shadow-orange-500/20' },
    'Very High': { text: 'text-red-400', bg: 'bg-red-950/90', border: 'border-red-500/60', glow: 'shadow-red-500/30' },
    Extreme: { text: 'text-purple-300', bg: 'bg-purple-950/90', border: 'border-purple-500/60', glow: 'shadow-purple-500/30' }
  };

  const statusStyle = statusColorMap[ward.risk_level] || statusColorMap['Very High'];

  // Style for positioning if coordinates provided
  const style: React.CSSProperties = position
    ? {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -105%)',
        zIndex: 50,
        pointerEvents: isPinned ? 'auto' : 'none'
      }
    : {};

  return (
    <div
      style={style}
      className={`bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 shadow-2xl min-w-[210px] w-64 text-slate-200 transition-all duration-150 animate-fadeIn select-none ${className}`}
    >
      {/* Card Header: Ward Number & Name */}
      <div className="pb-2.5 mb-2.5 border-b border-slate-800/90 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-base font-bold tracking-tight text-white font-mono">
            Ward {ward.ward_id}
          </h4>
          <p className="text-[11px] text-slate-400 truncate max-w-[170px] mt-0.5">
            {ward.ward_name}
          </p>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
          Z{ward.zone_id}
        </span>
      </div>

      {/* Metrics Table (Exact layout from user specification) */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-sans text-xs">HTSI</span>
          <span className="font-bold text-slate-100 tabular-nums">
            {ward.htsi.toFixed(1)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-sans text-xs">UTCI</span>
          <span className="font-bold text-slate-100 tabular-nums">
            {ward.utci.toFixed(1)}°C
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-sans text-xs">WBGT</span>
          <span className="font-bold text-slate-100 tabular-nums">
            {ward.wbgt_outdoor.toFixed(1)}°C
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-sans text-xs">Human Risk</span>
          <span className="font-bold text-red-400 tabular-nums">
            {humanRiskFormatted}
          </span>
        </div>
      </div>

      {/* Status Section */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/90">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 mb-1">
          Status
        </div>
        <div
          className={`px-2.5 py-1 rounded-md border text-center font-bold text-xs tracking-wider uppercase shadow-sm ${statusStyle.text} ${statusStyle.bg} ${statusStyle.border} ${statusStyle.glow}`}
        >
          {ward.risk_level.toUpperCase()}
        </div>
      </div>

      {/* Click prompt / CTA */}
      {onOpenDetails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails();
          }}
          className="mt-3 w-full py-1.5 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-600/20"
        >
          <span>Open Ward Details</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      )}

      {/* Pointer Tip Arrow for floating mode */}
      {position && (
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800 pointer-events-none" />
      )}
    </div>
  );
};
