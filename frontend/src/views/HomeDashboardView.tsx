import React, { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { RiskBadge } from '../components/RiskBadge';
import { WARDS_DATA } from '../lib/data';
import { WardRecord } from '../lib/types';
import {
  Flame,
  Users,
  Moon,
  ChevronRight,
  ExternalLink,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface HomeDashboardViewProps {
  onSelectWard: (wardId: number) => void;
  onNavigateToMap: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onSelectWard,
  onNavigateToMap
}) => {
  const [activeMapLayer, setActiveMapLayer] = useState<'risk' | 'htsi' | 'utci' | 'wbgt'>('risk');
  const [selectedWardPreview, setSelectedWardPreview] = useState<WardRecord>(WARDS_DATA[0]);

  // Sort wards by human_heat_risk descending
  const sortedWards = [...WARDS_DATA].sort((a, b) => b.human_heat_risk - a.human_heat_risk);
  const miniMapWards = sortedWards.slice(0, 20); // Top 20 for mini preview
  const topCriticalWards = sortedWards.slice(0, 10); // Top 10 for triage table

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Executive Heat Alert Banner */}
      <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border-l-4 border-l-red-500 border-y border-r border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <RiskBadge level="Very High" size="lg" />
              <span className="text-xs font-mono font-medium text-red-400 uppercase tracking-wider">
                MUNICIPAL HEAT EMERGENCY ADVISORY ACTIVE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Elevated Thermal Hazard across North & Central Chennai
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Model fusion identifies <strong className="text-white">37 GCC Wards</strong> with high human heat impact. Extreme nocturnal temperature retention (IST 22:00–06:00) prevents physiological cooling in high-density informal dwellings.
            </p>
          </div>

          <div className="flex flex-row lg:flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Peak Thermal Strain</div>
              <div className="text-xl font-bold font-mono text-red-400 tabular-nums">UTCI 43.6°C</div>
            </div>
            <button
              type="button"
              onClick={onNavigateToMap}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <span>Explore 200 Wards on GIS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Peak Ward Impact Risk"
          value="0.678"
          unit="Formula B"
          subtitle="Ward 53 • Royapuram Harbour"
          provenanceTag="DERIVED PROXY"
          severityAccent="Very High"
          statusBadge={<RiskBadge level="Very High" size="sm" />}
          delta={{ value: "+0.042", isIncrease: true, label: "vs 24h avg" }}
        />

        <MetricCard
          label="Max Biophysical Strain"
          value="43.6"
          unit="°C UTCI"
          subtitle="Very Strong Heat Stress"
          provenanceTag="XGB CALIBRATED"
          severityAccent="Very High"
          statusBadge={<span className="text-[11px] font-mono text-amber-400 font-semibold">T2m: 38.2°C</span>}
          delta={{ value: "+1.8°C", isIncrease: true, label: "vs seasonal baseline" }}
        />

        <MetricCard
          label="Population at High+ Risk"
          value="1,236,000"
          unit="residents"
          subtitle="Across 37 Wards in Zones 4, 5, 6 & 8"
          provenanceTag="WORLDPOP 2020"
          severityAccent="High"
          statusBadge={<Users className="w-4 h-4 text-orange-400" />}
          delta={{ value: "28.4%", isIncrease: true, isNeutral: true, label: "of city population" }}
        />

        <MetricCard
          label="Nighttime Retention (N)"
          value="P86.0"
          unit="anomaly"
          subtitle="22:00–06:00 IST Nocturnal Load"
          provenanceTag="CANONICAL HTSI"
          severityAccent="Very High"
          statusBadge={<Moon className="w-4 h-4 text-indigo-400" />}
          delta={{ value: "High Nocturnal Strain", isIncrease: true, label: "" }}
        />
      </div>

      {/* 3. Main Split View: Mini GIS Choropleth & Selected Ward Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Mini GIS Map preview (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Spatial Heat Impact Choropleth
                </h3>
                <p className="text-xs text-slate-400">
                  Top 20 high-risk ward preview • Click to inspect decomposition
                </p>
              </div>

              {/* Layer switch buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('risk')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    activeMapLayer === 'risk'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Human Risk
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('htsi')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    activeMapLayer === 'htsi'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  HTSI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('utci')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    activeMapLayer === 'utci'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  UTCI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('wbgt')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    activeMapLayer === 'wbgt'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WBGT
                </button>
              </div>
            </div>

            {/* Choropleth Mini Grid Canvas */}
            <div className="relative my-4 bg-slate-950/80 rounded-lg border border-slate-800/80 p-4 min-h-[260px] flex flex-col justify-center items-center overflow-hidden">
              {/* Background Map Grid & Coastline Visual */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Bay of Bengal Label on the East */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono tracking-widest text-cyan-500/40 uppercase rotate-90 pointer-events-none">
                Bay of Bengal (Coastline)
              </div>

              {/* 5 ERA5 Grid boundaries overlay */}
              <div className="w-full text-[10px] font-mono text-slate-500 flex items-center justify-between mb-2 z-10">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded border border-blue-400/60 bg-blue-500/10" />
                  ERA5-Land Grid Integration Active (0.1° × 0.1°)
                </span>
                <span className="text-slate-400 font-sans">Showing top 20 critical wards</span>
              </div>

              {/* Interactive Ward Grid Visual */}
              <div className="grid grid-cols-5 gap-2 w-full max-w-lg z-10">
                {miniMapWards.map((ward) => {
                  const isSelected = selectedWardPreview.ward_id === ward.ward_id;
                  let colorClass = 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300';
                  if (ward.risk_level === 'Moderate') colorClass = 'bg-amber-500/30 border-amber-500/50 text-amber-300';
                  if (ward.risk_level === 'High') colorClass = 'bg-orange-500/40 border-orange-500/60 text-orange-300';
                  if (ward.risk_level === 'Very High') colorClass = 'bg-red-500/50 border-red-500/70 text-red-200 shadow-sm shadow-red-500/20';
                  if (ward.risk_level === 'Extreme') colorClass = 'bg-purple-600/60 border-purple-500/80 text-purple-200 shadow-md shadow-purple-500/40';

                  let displayVal = ward.human_heat_risk.toFixed(2);
                  if (activeMapLayer === 'htsi') displayVal = ward.htsi.toFixed(0);
                  if (activeMapLayer === 'utci') displayVal = `${ward.utci.toFixed(1)}°`;
                  if (activeMapLayer === 'wbgt') displayVal = `${ward.wbgt_outdoor.toFixed(1)}°`;

                  return (
                    <button
                      key={ward.ward_id}
                      type="button"
                      onClick={() => setSelectedWardPreview(ward)}
                      className={`p-2 rounded-lg border transition-all text-center flex flex-col items-center justify-between cursor-pointer ${colorClass} ${
                        isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105 z-20 font-bold'
                          : 'hover:scale-102 hover:brightness-125'
                      }`}
                      title={`Ward ${ward.ward_id}: ${ward.ward_name} (${ward.risk_level})`}
                    >
                      <span className="text-[10px] font-mono text-white/90">W{ward.ward_id}</span>
                      <span className="text-xs font-mono font-bold text-white tabular-nums my-0.5">
                        {displayVal}
                      </span>
                      <span className="text-[9px] text-slate-300 truncate max-w-[55px]">
                        {ward.zone_name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              Formula B: <code className="font-mono text-slate-300">Risk = H × E × (0.5 + 0.5V)</code>
            </span>
            <button
              type="button"
              onClick={onNavigateToMap}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-xs cursor-pointer"
            >
              <span>Explore All 200 Wards on Interactive GIS</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Selected Ward Inspector Dossier (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                    WARD {selectedWardPreview.ward_id}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Zone {selectedWardPreview.zone_id} • {selectedWardPreview.zone_name}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">
                  {selectedWardPreview.ward_name}
                </h4>
              </div>
              <RiskBadge level={selectedWardPreview.risk_level} size="md" />
            </div>

            {/* Micro Score Decomposition Grid */}
            <div className="grid grid-cols-3 gap-2.5 my-4">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Hazard (H)</div>
                <div className="text-lg font-mono font-bold text-red-400 tabular-nums my-0.5">
                  {selectedWardPreview.heat_hazard.toFixed(3)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">HTSI {selectedWardPreview.htsi.toFixed(1)}</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Exposure (E)</div>
                <div className="text-lg font-mono font-bold text-amber-400 tabular-nums my-0.5">
                  {selectedWardPreview.exposure_density_norm.toFixed(3)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{selectedWardPreview.population_density.toLocaleString()} /km²</div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Vulnerability (V)</div>
                <div className="text-lg font-mono font-bold text-orange-400 tabular-nums my-0.5">
                  {selectedWardPreview.vulnerability.toFixed(3)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">0.5S + 0.5(1-A)</div>
              </div>
            </div>

            {/* Thermal & Health Metrics Breakdown List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">UTCI Biophysical Strain</span>
                <span className="font-mono font-semibold text-slate-200 tabular-nums">
                  {selectedWardPreview.utci}°C (Outdoor)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">WBGT (Liljegren Shaded/Outdoor)</span>
                <span className="font-mono font-semibold text-slate-200 tabular-nums">
                  {selectedWardPreview.wbgt_outdoor}°C
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Derived Population (WorldPop)</span>
                <span className="font-mono font-semibold text-slate-200 tabular-nums">
                  {selectedWardPreview.population.toLocaleString()} residents
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">UPHC / HWC Facilities</span>
                <span className="font-mono font-semibold text-slate-200 tabular-nums">
                  {selectedWardPreview.healthcare_facility_count} clinics ({selectedWardPreview.healthcare_facilities_per_10k.toFixed(2)} /10k)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Assigned ERA5 Grid</span>
                <span className="font-mono text-slate-300">
                  {selectedWardPreview.assigned_grid_id} ({selectedWardPreview.grid_lat}°N, {selectedWardPreview.grid_lon}°E)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Formula B Score: <strong className="text-white">{selectedWardPreview.human_heat_risk.toFixed(3)}</strong>
            </span>
            <button
              type="button"
              onClick={() => onSelectWard(selectedWardPreview.ward_id)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Full Ward Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Top Critical Wards Triage Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              Top Priority High-Impact Wards (Operational Triage)
            </h3>
            <p className="text-xs text-slate-400">
              Ranked strictly by formula B: Risk = H × E × (0.5 + 0.5V). Direct municipal intervention required.
            </p>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 self-start sm:self-auto">
            10 of 200 Wards Shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Ward ID</th>
                <th className="py-2.5 px-3">Ward Name</th>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3 text-right">Human Risk</th>
                <th className="py-2.5 px-3 text-right">HTSI Hazard</th>
                <th className="py-2.5 px-3 text-right">UTCI (°C)</th>
                <th className="py-2.5 px-3 text-right">Pop. Density</th>
                <th className="py-2.5 px-3 text-right">HWC Clinics</th>
                <th className="py-2.5 px-3 text-center">Severity</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {topCriticalWards.map((w, idx) => (
                <tr
                  key={w.ward_id}
                  className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  onClick={() => onSelectWard(w.ward_id)}
                >
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-300">
                    #{idx + 1} <span className="text-slate-400 ml-1">W{w.ward_id}</span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white group-hover:text-blue-400 transition-colors">
                    {w.ward_name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{w.zone_name}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-red-400 tabular-nums">
                    {w.human_heat_risk.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300 tabular-nums">
                    {w.htsi.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300 tabular-nums">
                    {w.utci.toFixed(1)}°C
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">
                    {w.population_density.toLocaleString()} /km²
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">
                    {w.healthcare_facility_count}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <RiskBadge level={w.risk_level} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 text-[11px]">
                      Inspect <ChevronRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
