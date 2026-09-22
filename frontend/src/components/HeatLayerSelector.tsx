import React from 'react';
import { Flame, Thermometer, Sun, ShieldAlert, Users, HeartHandshake } from 'lucide-react';

export type HeatLayerType = 'htsi' | 'utci' | 'wbgt' | 'risk' | 'exposure' | 'vulnerability';

interface HeatLayerSelectorProps {
  activeLayer: HeatLayerType;
  onSelectLayer: (layer: HeatLayerType) => void;
  className?: string;
}

interface LayerOption {
  id: HeatLayerType;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const HEAT_LAYERS: LayerOption[] = [
  {
    id: 'htsi',
    label: 'HTSI',
    shortLabel: 'HTSI Hazard',
    unit: '0 – 100 Index',
    description: 'High-Temperature Stress Index composite thermal load',
    icon: Flame
  },
  {
    id: 'utci',
    label: 'UTCI',
    shortLabel: 'UTCI (°C)',
    unit: '°C Thermal Stress',
    description: 'Universal Thermal Climate Index (ISO 7730)',
    icon: Thermometer
  },
  {
    id: 'wbgt',
    label: 'WBGT',
    shortLabel: 'WBGT (°C)',
    unit: '°C Outdoor Globe',
    description: 'Liljegren outdoor wet bulb globe temperature',
    icon: Sun
  },
  {
    id: 'risk',
    label: 'Human Heat Risk',
    shortLabel: 'Formula B Risk',
    unit: '0 – 1.0 Risk Score',
    description: 'Selected Formula B: H × E × (0.5 + 0.5V)',
    icon: ShieldAlert
  },
  {
    id: 'exposure',
    label: 'Population Exposure',
    shortLabel: 'Exposure Density',
    unit: 'People / km²',
    description: 'Derived WorldPop R2025A population density',
    icon: Users
  },
  {
    id: 'vulnerability',
    label: 'Vulnerability',
    shortLabel: 'Reduced V',
    unit: '0 – 1.0 Vulnerability',
    description: 'Structural sensitivity vs HWC adaptive capacity',
    icon: HeartHandshake
  }
];

export const HeatLayerSelector: React.FC<HeatLayerSelectorProps> = ({
  activeLayer,
  onSelectLayer,
  className = ''
}) => {
  return (
    <div
      className={`bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-2xl ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Heat Layers
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
          Single Layer Active
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-3 leading-snug">
        Select a layer to re-render the 200-ward choropleth mesh:
      </p>

      {/* Layer Radio List */}
      <div className="space-y-1.5" role="radiogroup" aria-label="Heat Layers">
        {HEAT_LAYERS.map((layer) => {
          const isSelected = activeLayer === layer.id;
          const Icon = layer.icon;

          return (
            <label
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-start gap-3 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500/60 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              {/* Radio Indicator */}
              <div className="pt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-blue-400 bg-blue-600'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                  )}
                </div>
              </div>

              {/* Layer Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white font-bold' : 'text-slate-300'
                      }`}
                    >
                      {layer.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {layer.unit}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {layer.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
