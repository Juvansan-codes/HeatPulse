import React from 'react';
import { SeverityLevel } from '../lib/types';

interface MapLegendProps {
  activeLayer: string;
  selectedLevel?: SeverityLevel | 'All';
  onSelectLevel?: (level: SeverityLevel | 'All') => void;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  activeLayer,
  selectedLevel = 'All',
  onSelectLevel,
  className = ''
}) => {
  const buckets: { level: SeverityLevel; range: string; color: string; desc: string }[] = [
    { level: 'Normal', range: '< 0.20', color: '#10b981', desc: 'Minimal risk' },
    { level: 'Moderate', range: '0.20 – 0.35', color: '#f59e0b', desc: 'Precautionary' },
    { level: 'High', range: '0.35 – 0.50', color: '#f97316', desc: 'Elevated stress' },
    { level: 'Very High', range: '0.50 – 0.70', color: '#ef4444', desc: 'High alert' },
    { level: 'Extreme', range: '≥ 0.70', color: '#7c3aed', desc: 'Severe emergency' }
  ];

  return (
    <div
      className={`bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-md text-xs text-slate-700 w-64 ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
        <span className="font-semibold text-slate-900 tracking-wide uppercase text-[11px]">
          GIS Choropleth Legend
        </span>
        <span className="text-[10px] text-[#F47C20] font-mono font-medium truncate max-w-[110px]">
          {activeLayer}
        </span>
      </div>

      <div className="space-y-1.5">
        {buckets.map((b) => {
          const isSelected = selectedLevel === b.level;
          return (
            <button
              key={b.level}
              type="button"
              onClick={() => onSelectLevel?.(isSelected ? 'All' : b.level)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors text-left ${
                isSelected
                  ? 'bg-slate-100 text-slate-900 font-medium border border-slate-200'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm shrink-0 border border-black/20"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-xs">{b.level}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {b.range}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <span>200 GCC Wards</span>
        {selectedLevel !== 'All' && onSelectLevel && (
          <button
            type="button"
            onClick={() => onSelectLevel('All')}
            className="text-[#F47C20] hover:underline cursor-pointer font-medium"
          >
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
};
