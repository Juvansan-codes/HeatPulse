import React from 'react';
import { SeverityLevel } from '../lib/types';

interface MapLegendProps {
  activeLayer: string; // e.g. 'htsi' | 'utci' | 'wbgt' | 'risk' | 'exposure' | 'vulnerability' or label string
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
  const layerKey = activeLayer.toLowerCase();

  // Generate dynamic ranges based on active metric
  let ranges = ['< 0.20', '0.20 – 0.35', '0.35 – 0.50', '0.50 – 0.70', '≥ 0.70'];
  let unitLabel = 'Formula B Index';

  if (layerKey.includes('htsi')) {
    ranges = ['< 55.0', '55.0 – 65.0', '65.0 – 75.0', '75.0 – 85.0', '≥ 85.0'];
    unitLabel = 'HTSI Score';
  } else if (layerKey.includes('utci')) {
    ranges = ['< 32.0°C', '32.0 – 38.0°C', '38.0 – 42.0°C', '42.0 – 46.0°C', '≥ 46.0°C'];
    unitLabel = 'UTCI Thermal';
  } else if (layerKey.includes('wbgt')) {
    ranges = ['< 28.0°C', '28.0 – 30.0°C', '30.0 – 32.0°C', '32.0 – 34.5°C', '≥ 34.5°C'];
    unitLabel = 'WBGT Outdoor';
  } else if (layerKey.includes('exposure') || layerKey.includes('population')) {
    ranges = ['< 15k /km²', '15k – 30k', '30k – 45k', '45k – 55k', '≥ 55k /km²'];
    unitLabel = 'Pop. Density';
  } else if (layerKey.includes('vulnerability')) {
    ranges = ['< 0.35', '0.35 – 0.50', '0.50 – 0.65', '0.65 – 0.80', '≥ 0.80'];
    unitLabel = 'Reduced V';
  }

  const buckets: { level: SeverityLevel; range: string; color: string; desc: string }[] = [
    { level: 'Normal', range: ranges[0], color: '#10b981', desc: 'Minimal risk' },
    { level: 'Moderate', range: ranges[1], color: '#f59e0b', desc: 'Precautionary' },
    { level: 'High', range: ranges[2], color: '#f97316', desc: 'Elevated stress' },
    { level: 'Very High', range: ranges[3], color: '#ef4444', desc: 'High alert' },
    { level: 'Extreme', range: ranges[4], color: '#7c3aed', desc: 'Severe emergency' }
  ];

  return (
    <div
      className={`bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 shadow-2xl text-xs text-slate-300 w-64 select-none ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <span className="font-semibold text-slate-200 tracking-wide uppercase text-[11px]">
          Map Legend
        </span>
        <span className="text-[10px] text-blue-400 font-mono font-medium truncate max-w-[120px] bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-800/40">
          {unitLabel}
        </span>
      </div>

      <div className="space-y-1">
        {buckets.map((b) => {
          const isSelected = selectedLevel === b.level;
          return (
            <button
              key={b.level}
              type="button"
              onClick={() => onSelectLevel?.(isSelected ? 'All' : b.level)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors text-left cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/20 text-white font-medium border border-blue-500/40'
                  : 'hover:bg-slate-800/60 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-xs shrink-0 border border-black/40 shadow-xs"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-xs font-medium">{b.level}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {b.range}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>200 GCC Wards</span>
        {selectedLevel !== 'All' && onSelectLevel && (
          <button
            type="button"
            onClick={() => onSelectLevel('All')}
            className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium underline"
          >
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
};
