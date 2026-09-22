import React, { useState } from 'react';
import { WARDS_DATA, CHENNAI_ZONES } from '../lib/data';
import { WardRecord, SeverityLevel } from '../lib/types';
import { RiskBadge } from '../components/RiskBadge';
import { MapLegend } from '../components/MapLegend';
import { ChennaiGisMap } from '../components/ChennaiGisMap';
import { HeatLayerSelector, HeatLayerType, HEAT_LAYERS } from '../components/HeatLayerSelector';
import {
  Navigation,
  ExternalLink,
  Sparkles,
  Search,
  Crosshair,
  Layers,
  MapPin,
  Flame,
  Thermometer,
  Sun,
  ShieldAlert,
  Users,
  Activity,
  ChevronRight,
  Info
} from 'lucide-react';

interface HeatMapViewProps {
  wards: WardRecord[];
  onSelectWard: (wardId: number) => void;
  onOpenExplainability?: (wardId: number) => void;
}

export const HeatMapView: React.FC<HeatMapViewProps> = ({ wards: WARDS_DATA, onSelectWard, onOpenExplainability }) => {
  const [selectedLayer, setSelectedLayer] = useState<HeatLayerType>('risk');
  const [selectedZone, setSelectedZone] = useState<number | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeWard, setActiveWard] = useState<WardRecord | null>(
    WARDS_DATA.find((w) => w.ward_id === 86) || WARDS_DATA[0] || null
  );
  const [showGridsOverlay, setShowGridsOverlay] = useState<boolean>(true);
  const [isLayerSelectorOpen, setIsLayerSelectorOpen] = useState<boolean>(true);

  // Active layer metadata
  const currentLayerMeta = HEAT_LAYERS.find((l) => l.id === selectedLayer) || HEAT_LAYERS[0];

  // Filtered wards count
  const matchingWardsCount = WARDS_DATA.filter((ward) => {
    if (selectedZone !== 'all' && ward.zone_id !== selectedZone) return false;
    if (selectedSeverity !== 'All' && ward.risk_level !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ward.ward_name.toLowerCase().includes(q);
      const matchId = ward.ward_id.toString().includes(q);
      const matchZone = ward.zone_name.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchZone) return false;
    }
    return true;
  }).length;

  const handleWardClick = (wardId: number) => {
    const found = WARDS_DATA.find((w) => w.ward_id === wardId);
    if (found) {
      setActiveWard(found);
    }
    onSelectWard(wardId);
  };

  if (!activeWard || WARDS_DATA.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500">No ward data available.</div>;
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-3 animate-fadeIn">
      {/* ─── Top Command & Control Bar ───────────────────────────────── */}
      <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Left: Active Layer Badge & Quick Jump */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-slate-400 font-medium">Active Layer:</span>
            <span className="font-bold text-white font-mono">{currentLayerMeta.label}</span>
            <span className="text-[10px] text-blue-400 font-mono">({currentLayerMeta.unit})</span>
          </div>

          {/* Quick Jump to Ward 86 hero feature */}
          <button
            type="button"
            onClick={() => {
              const w86 = WARDS_DATA.find((w) => w.ward_id === 86);
              if (w86) {
                setActiveWard(w86);
                setSearchQuery('86');
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 hover:text-white transition-colors cursor-pointer font-medium"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>Hero Ward 86</span>
          </button>
        </div>

        {/* Right: Filters (Zone, Severity, Search, Layer Toggle) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Zone filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) =>
                setSelectedZone(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">All 15 Zones</option>
              {CHENNAI_ZONES.map((z) => (
                <option key={z.zone_id} value={z.zone_id} className="bg-slate-900">
                  Zone {z.zone_id}: {z.zone_name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as SeverityLevel | 'All')}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="All" className="bg-slate-900">All Levels</option>
              <option value="Normal" className="bg-slate-900">Normal</option>
              <option value="Moderate" className="bg-slate-900">Moderate</option>
              <option value="High" className="bg-slate-900">High</option>
              <option value="Very High" className="bg-slate-900">Very High</option>
              <option value="Extreme" className="bg-slate-900">Extreme</option>
            </select>
          </div>

          {/* Ward Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search Ward (1-200)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 rounded-lg pl-8 pr-6 py-1 text-xs w-44 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Toggle ERA5 Grid overlay */}
          <button
            type="button"
            onClick={() => setShowGridsOverlay(!showGridsOverlay)}
            className={`px-2.5 py-1 rounded-lg text-xs border font-medium cursor-pointer transition-colors ${
              showGridsOverlay
                ? 'bg-blue-950/80 border-blue-500/50 text-blue-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            ERA5 Grids {showGridsOverlay ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ─── Main Map Workspace: Interactive GIS Canvas + Floating Panels ─── */}
      <div className="relative flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex">
        {/* Full-Bleed Interactive Vector Map */}
        <div className="flex-1 relative h-full">
          <ChennaiGisMap
            wards={WARDS_DATA}
            activeLayer={selectedLayer}
            selectedWardId={activeWard.ward_id}
            onSelectWard={handleWardClick}
            selectedSeverity={selectedSeverity}
            selectedZone={selectedZone}
            searchQuery={searchQuery}
            showEra5Grids={showGridsOverlay}
          />

          {/* Floating Layer Selector Panel (Top Left) */}
          <div className="absolute top-4 left-18 z-30 w-72 max-w-[calc(100vw-5rem)]">
            <HeatLayerSelector
              activeLayer={selectedLayer}
              onSelectLayer={setSelectedLayer}
            />
          </div>

          {/* Floating Map Legend (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-30">
            <MapLegend
              activeLayer={selectedLayer}
              selectedLevel={selectedSeverity}
              onSelectLevel={setSelectedSeverity}
            />
          </div>
        </div>

        {/* ─── Right Persistent Ward Dossier Panel ───────────────────── */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20 hidden lg:flex">
          <div>
            {/* Header: Ward Number & Region */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    WARD {activeWard.ward_id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{activeWard.region} Chennai</span>
                </div>
                <h3 className="font-bold text-base text-white mt-1 leading-snug">
                  {activeWard.ward_name}
                </h3>
                <p className="text-xs text-slate-400">Zone {activeWard.zone_id} • {activeWard.zone_name}</p>
              </div>
              <RiskBadge level={activeWard.risk_level} size="sm" />
            </div>

            {/* Main Risk Score Card */}
            <div className="my-4 bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Human Heat Impact Risk</span>
                <span className="font-mono text-[10px] text-blue-400">Formula B</span>
              </div>
              <div className="text-3xl font-mono font-bold text-red-400 tabular-nums">
                {activeWard.human_heat_risk.toFixed(3)}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <code className="text-slate-300">H × E × (0.5 + 0.5V)</code>: Retains hazard and population density even when healthcare proxy is low.
              </p>
            </div>

            {/* Tripartite Breakdown: Hazard, Exposure, Vulnerability */}
            <div className="space-y-2.5 text-xs">
              {/* Hazard H */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    Hazard (H = HTSI/100)
                  </span>
                  <span className="font-mono font-bold text-red-400">{activeWard.heat_hazard.toFixed(3)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, activeWard.heat_hazard * 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>HTSI {activeWard.htsi.toFixed(1)}</span>
                  <span>UTCI {activeWard.utci.toFixed(1)}°C</span>
                  <span>WBGT {activeWard.wbgt_outdoor.toFixed(1)}°C</span>
                </div>
              </div>

              {/* Exposure E */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Exposure (E)
                  </span>
                  <span className="font-mono font-bold text-amber-400">{activeWard.exposure_density_norm.toFixed(3)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, activeWard.exposure_density_norm * 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{activeWard.population.toLocaleString()} pop</span>
                  <span>{activeWard.population_density.toLocaleString()}/km²</span>
                </div>
              </div>

              {/* Vulnerability V */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                    Vulnerability (V)
                  </span>
                  <span className="font-mono font-bold text-orange-400">{activeWard.vulnerability.toFixed(3)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, activeWard.vulnerability * 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Adaptive Cap: {activeWard.adaptive_capacity_norm.toFixed(2)}</span>
                  <span>HWCs: {activeWard.healthcare_facility_count}</span>
                </div>
              </div>
            </div>

            {/* Grid Assignment details */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Assigned Grid:</span>
                <span className="text-slate-200">{activeWard.assigned_grid_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Centroid Coordinates:</span>
                <span className="text-slate-200">{activeWard.grid_lat.toFixed(3)}°N, {activeWard.grid_lon.toFixed(3)}°E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Nighttime Stress (N):</span>
                <span className="text-slate-200">{activeWard.nighttime_stress.toFixed(1)} anomaly</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            {onOpenExplainability && (
              <button
                type="button"
                onClick={() => onOpenExplainability(activeWard.ward_id)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs border border-slate-700 hover:border-amber-400/50 group"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Why is Ward {activeWard.ward_id} at {activeWard.risk_level.toUpperCase()} Risk?</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectWard(activeWard.ward_id)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-500/20"
            >
              <span>View Complete Ward Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

