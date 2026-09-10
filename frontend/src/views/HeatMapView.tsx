import React, { useState } from 'react';
import { WARDS_DATA, CHENNAI_ZONES, ERA5_GRIDS } from '../lib/data';
import { WardRecord, SeverityLevel } from '../lib/types';
import { RiskBadge } from '../components/RiskBadge';
import { MapLegend } from '../components/MapLegend';
import {
  Layers,
  Filter,
  Search,
  MapPin,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Navigation,
  ExternalLink,
  ShieldAlert,
  Building
} from 'lucide-react';

interface HeatMapViewProps {
  onSelectWard: (wardId: number) => void;
}

export const HeatMapView: React.FC<HeatMapViewProps> = ({ onSelectWard }) => {
  const [selectedLayer, setSelectedLayer] = useState<
    'risk' | 'htsi' | 'utci' | 'wbgt' | 'exposure' | 'healthcare'
  >('risk');
  const [selectedZone, setSelectedZone] = useState<number | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeWard, setActiveWard] = useState<WardRecord>(WARDS_DATA[0]);
  const [showGridsOverlay, setShowGridsOverlay] = useState<boolean>(true);

  // Filtered wards
  const filteredWards = WARDS_DATA.filter((ward) => {
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
  });

  const layerLabels: Record<string, string> = {
    risk: 'Human Heat Risk (Formula B)',
    htsi: 'HTSI Hazard Score (0-100)',
    utci: 'UTCI Thermal Stress (°C)',
    wbgt: 'Liljegren Outdoor WBGT (°C)',
    exposure: 'Exposure (Pop. Density)',
    healthcare: 'Adaptive Capacity (HWC Proxy)'
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-4">
      {/* Top Filter Bar */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Layer Select Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          {(
            [
              ['risk', 'Formula B Risk'],
              ['htsi', 'HTSI Hazard'],
              ['utci', 'UTCI (°C)'],
              ['wbgt', 'WBGT (°C)'],
              ['exposure', 'Exposure'],
              ['healthcare', 'HWC Access']
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedLayer(key)}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors shrink-0 cursor-pointer ${
                selectedLayer === key
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters: Zone, Severity, Search */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Zone filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-400 text-[11px]">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) =>
                setSelectedZone(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
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
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-400 text-[11px]">Level:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as SeverityLevel | 'All')}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
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
            <input
              type="text"
              placeholder="Search Ward (1-200)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 rounded px-2.5 py-1 text-xs w-44 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Toggle ERA5 Grid overlay */}
          <button
            type="button"
            onClick={() => setShowGridsOverlay(!showGridsOverlay)}
            className={`px-2 py-1 rounded text-xs border font-medium cursor-pointer transition-colors ${
              showGridsOverlay
                ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            ERA5 Grids {showGridsOverlay ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Map Workspace: Canvas + Floating Panels */}
      <div className="relative flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex">
        {/* Full-Bleed GIS Canvas */}
        <div className="flex-1 relative flex items-center justify-center p-6 select-none overflow-auto">
          {/* Subtle Geospatial Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] [background-size:32px_32px]" />

          {/* Compass Rose */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-2 text-center text-[10px] text-slate-400 flex flex-col items-center">
            <Navigation className="w-4 h-4 text-blue-400 mb-0.5" />
            <span className="font-mono font-bold text-slate-200">N</span>
          </div>

          {/* Coastal Water Feature (Bay of Bengal) */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-950/30 to-transparent pointer-events-none flex items-center justify-center">
            <div className="rotate-90 text-[11px] font-mono tracking-widest text-cyan-400/30 uppercase">
              Bay of Bengal (Coastal Boundary)
            </div>
          </div>

          {/* River Labels */}
          <div className="absolute top-1/3 left-6 text-[10px] font-mono text-cyan-500/40 pointer-events-none">
            ~ ~ ~ Cooum River Corridor ~ ~ ~
          </div>
          <div className="absolute bottom-1/3 left-6 text-[10px] font-mono text-cyan-500/40 pointer-events-none">
            ~ ~ ~ Adyar River Basin ~ ~ ~
          </div>

          {/* ERA5 Grids Overlay Bounding Boxes */}
          {showGridsOverlay && (
            <div className="absolute inset-x-12 inset-y-8 pointer-events-none border border-dashed border-blue-500/20 rounded-xl flex flex-col justify-between p-4">
              {ERA5_GRIDS.map((g) => (
                <div key={g.grid_id} className="flex items-center justify-between text-[10px] font-mono text-blue-400/40">
                  <span className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-blue-500/20">
                    {g.grid_id} ({g.lat}°N, {g.lon}°E)
                  </span>
                  <span>{g.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Ward Polygon Grid Simulation */}
          <div className="relative z-10 w-full max-w-2xl py-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="font-semibold text-slate-300">
                Displaying {filteredWards.length} GCC Wards (Filtered)
              </span>
              <span className="font-mono text-[11px]">
                Active Metric: <strong className="text-blue-400">{layerLabels[selectedLayer]}</strong>
              </span>
            </div>

            {/* Ward Polygons Display Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {filteredWards.map((w) => {
                const isActive = activeWard.ward_id === w.ward_id;

                let badgeColor = '#10b981';
                if (w.risk_level === 'Moderate') badgeColor = '#f59e0b';
                if (w.risk_level === 'High') badgeColor = '#f97316';
                if (w.risk_level === 'Very High') badgeColor = '#ef4444';
                if (w.risk_level === 'Extreme') badgeColor = '#7c3aed';

                // Display dynamic value according to selected layer
                let metricVal = w.human_heat_risk.toFixed(3);
                let metricUnit = '';
                if (selectedLayer === 'htsi') {
                  metricVal = w.htsi.toFixed(1);
                  metricUnit = 'pts';
                } else if (selectedLayer === 'utci') {
                  metricVal = w.utci.toFixed(1);
                  metricUnit = '°C';
                } else if (selectedLayer === 'wbgt') {
                  metricVal = w.wbgt_outdoor.toFixed(1);
                  metricUnit = '°C';
                } else if (selectedLayer === 'exposure') {
                  metricVal = (w.population_density / 1000).toFixed(1);
                  metricUnit = 'k/km²';
                } else if (selectedLayer === 'healthcare') {
                  metricVal = w.healthcare_facilities_per_10k.toFixed(2);
                  metricUnit = '/10k';
                }

                return (
                  <button
                    key={w.ward_id}
                    type="button"
                    onClick={() => setActiveWard(w)}
                    className={`relative p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer bg-slate-900/90 shadow-md flex flex-col justify-between ${
                      isActive
                        ? 'border-blue-400 ring-2 ring-blue-500/50 scale-102 bg-slate-800'
                        : 'border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                    }`}
                  >
                    {/* Top row: Ward ID & Risk Dot */}
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        W{w.ward_id}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: badgeColor }}
                      />
                    </div>

                    {/* Ward Name */}
                    <div className="text-[11px] font-medium text-slate-300 truncate w-full" title={w.ward_name}>
                      {w.ward_name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate w-full mb-2">
                      {w.zone_name}
                    </div>

                    {/* Metric Value */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between w-full">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400">
                        {selectedLayer}
                      </span>
                      <span className="font-mono font-bold text-xs text-white tabular-nums">
                        {metricVal} {metricUnit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating Map Legend (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-20">
            <MapLegend
              activeLayer={layerLabels[selectedLayer]}
              selectedLevel={selectedSeverity}
              onSelectLevel={setSelectedSeverity}
            />
          </div>
        </div>

        {/* Right Slide-Over Inspector Drawer (Persistent Dossier) */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20">
          <div>
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

            {/* Tripartite Breakdown: H, E, V */}
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">Hazard (H = HTSI/100)</span>
                  <span className="font-mono font-bold text-red-400">{activeWard.heat_hazard.toFixed(3)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${activeWard.heat_hazard * 100}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>HTSI {activeWard.htsi.toFixed(1)}</span>
                  <span>UTCI {activeWard.utci}°C</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">Exposure (E)</span>
                  <span className="font-mono font-bold text-amber-400">{activeWard.exposure_density_norm.toFixed(3)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${activeWard.exposure_density_norm * 100}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{activeWard.population.toLocaleString()} pop</span>
                  <span>{activeWard.population_density.toLocaleString()}/km²</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">Vulnerability (V)</span>
                  <span className="font-mono font-bold text-orange-400">{activeWard.vulnerability.toFixed(3)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${activeWard.vulnerability * 100}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Adaptive Capacity A: {activeWard.adaptive_capacity_norm.toFixed(2)}</span>
                  <span>HWCs: {activeWard.healthcare_facility_count}</span>
                </div>
              </div>
            </div>

            {/* Grid Assignment details */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Assigned Grid:</span>
                <span className="font-mono text-slate-200">{activeWard.assigned_grid_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Centroid Coordinates:</span>
                <span className="font-mono text-slate-200">{activeWard.grid_lat}°N, {activeWard.grid_lon}°E</span>
              </div>
              <div className="flex justify-between">
                <span>Nighttime Stress (N):</span>
                <span className="font-mono text-slate-200">{activeWard.nighttime_stress.toFixed(1)} anomaly</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onSelectWard(activeWard.ward_id)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
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
