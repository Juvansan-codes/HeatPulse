import React, { useState } from 'react';
import { WARDS_DATA } from '../lib/data';
import { RiskBadge } from '../components/RiskBadge';
import { MetricCard } from '../components/MetricCard';
import {
  Sun,
  Activity,
  AlertOctagon,
  Calculator
} from 'lucide-react';

interface WardDetailsViewProps {
  selectedWardId?: number;
  onSelectWard: (wardId: number) => void;
}

export const WardDetailsView: React.FC<WardDetailsViewProps> = ({
  selectedWardId = 114,
  onSelectWard
}) => {
  const [activeFormula, setActiveFormula] = useState<'b' | 'a'>('b');
  const ward = WARDS_DATA.find((w) => w.ward_id === selectedWardId) || WARDS_DATA[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Ward Selection Header & Primary Metadata */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              WARD {ward.ward_id}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Zone {ward.zone_id} • {ward.zone_name} ({ward.region} Chennai)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Grid: {ward.assigned_grid_id}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            {ward.ward_name}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Centroid: {ward.grid_lat.toFixed(4)}°N, {ward.grid_lon.toFixed(4)}°E • Area: {ward.area_km2} km² • Derived WorldPop: {ward.population.toLocaleString()} residents
          </p>
        </div>

        {/* Ward Switcher Dropdown & Severity Badge */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Switch Ward:</span>
            <select
              value={ward.ward_id}
              onChange={(e) => onSelectWard(Number(e.target.value))}
              className="bg-transparent text-white font-mono font-semibold focus:outline-none cursor-pointer"
            >
              {WARDS_DATA.map((w) => (
                <option key={w.ward_id} value={w.ward_id} className="bg-slate-900 text-white">
                  W{w.ward_id}: {w.ward_name} ({w.risk_level})
                </option>
              ))}
            </select>
          </div>

          <RiskBadge level={ward.risk_level} size="lg" />
        </div>
      </div>

      {/* 2. Top-Level Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Human Heat Risk (Formula B)"
          value={ward.human_heat_risk.toFixed(3)}
          unit="Impact Score"
          subtitle="Operational Triage Rank"
          provenanceTag="SELECTED MODEL"
          severityAccent={ward.risk_level}
          statusBadge={<RiskBadge level={ward.risk_level} size="sm" />}
        />

        <MetricCard
          label="Thermal Hazard (H)"
          value={ward.heat_hazard.toFixed(3)}
          unit="HTSI / 100"
          subtitle={`Raw HTSI: ${ward.htsi.toFixed(1)} pts`}
          provenanceTag="CANONICAL HTSI"
          severityAccent={ward.htsi_label}
        />

        <MetricCard
          label="Exposure Proxy (E)"
          value={ward.exposure_density_norm.toFixed(3)}
          unit="Norm Density"
          subtitle={`${ward.population_density.toLocaleString()} people/km²`}
          provenanceTag="WORLDPOP 2020"
        />

        <MetricCard
          label="Reduced Vulnerability (V)"
          value={ward.vulnerability.toFixed(3)}
          unit="0.5S + 0.5(1-A)"
          subtitle={`HWC Availability: ${ward.healthcare_facilities_per_10k.toFixed(2)}/10k`}
          provenanceTag="GCC 140 HWC"
        />
      </div>

      {/* 3. Mathematical Formula Decomposition Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              Impact Risk Mathematical Formulation & Decomposition
            </h3>
            <p className="text-xs text-slate-400">
              Interactive step-by-step calculation showing why Formula B was selected over Formula A.
            </p>
          </div>

          {/* Formula Comparison Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveFormula('b')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeFormula === 'b'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Formula B (Selected)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormula('a')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeFormula === 'a'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Formula A (Alternative)
            </button>
          </div>
        </div>

        {/* Formula Math Breakdown */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800/80">
            <span className="font-bold text-blue-400">
              {activeFormula === 'b'
                ? 'Formula B: Risk = H × E × (0.5 + 0.5V)'
                : 'Formula A: Risk = H × E × V'}
            </span>
            <span className="text-slate-500 text-[11px]">
              Calculated Value:{' '}
              <strong className="text-white text-sm">
                {activeFormula === 'b'
                  ? ward.human_heat_risk_formula_b.toFixed(3)
                  : ward.human_heat_risk_formula_a.toFixed(3)}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                Step 1: Thermal Hazard (H)
              </span>
              <div className="font-mono text-base font-bold text-red-400">
                {ward.heat_hazard.toFixed(3)}
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Derived directly from grid-level HTSI ({ward.htsi.toFixed(1)} / 100), bounded strictly in [0, 1].
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                Step 2: Population Exposure (E)
              </span>
              <div className="font-mono text-base font-bold text-amber-400">
                {ward.exposure_density_norm.toFixed(3)}
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Min-max normalized WorldPop 2020 density ({ward.population_density.toLocaleString()} /km²).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">
                Step 3: Reduced Vulnerability (V)
              </span>
              <div className="font-mono text-base font-bold text-orange-400">
                {ward.vulnerability.toFixed(3)}
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                <code className="font-mono text-slate-300">0.5*S + 0.5*(1-A)</code>, where S is sensitivity and A is HWC facility access.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 font-sans text-xs leading-relaxed">
            <strong className="text-slate-200">Scientific Rationale for Formula B:</strong> Formula B retains operational hazard and population density prioritization even when incomplete vulnerability evidence produces a low score. In municipal emergency response, an extreme hazard in a high-density ward must never be zeroed or deprioritized due to missing socioeconomic proxies.
          </div>
        </div>
      </div>

      {/* 4. Deep Thermal Environment Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Thermal Stress Indices */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            Biophysical Thermal Stress Indicators
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Universal Thermal Climate Index (UTCI)</span>
                <span className="text-[11px] text-slate-400">6th-order polynomial with Tmrt radiation load</span>
              </div>
              <span className="font-mono font-bold text-base text-red-400 tabular-nums">
                {ward.utci}°C
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Wet Bulb Globe Temperature (WBGT)</span>
                <span className="text-[11px] text-slate-400">Liljegren (2008) Outdoor non-linear mass transfer</span>
              </div>
              <span className="font-mono font-bold text-base text-amber-400 tabular-nums">
                {ward.wbgt_outdoor}°C
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Mean Radiant Temperature (Tmrt)</span>
                <span className="text-[11px] text-slate-400">ISO 7726 / Spencer solar geometry</span>
              </div>
              <span className="font-mono font-semibold text-sm text-slate-200 tabular-nums">
                {ward.tmrt}°C
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">NOAA Heat Index</span>
                <span className="text-[11px] text-slate-400">Rothfusz apparent temperature (supporting)</span>
              </div>
              <span className="font-mono font-semibold text-sm text-slate-200 tabular-nums">
                {ward.heat_index}°C
              </span>
            </div>
          </div>
        </div>

        {/* Right: Trailing Burden & Nighttime Persistence */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Persistence Burdens & Nighttime Load
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Trailing 24-Hour Burden (B24)</span>
                <span className="text-[11px] text-slate-400">Rolling hourly UTCI excess burden (max 0, U-20)</span>
              </div>
              <span className="font-mono font-bold text-base text-purple-400 tabular-nums">
                {ward.burden_24h.toFixed(1)} / 100
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Trailing 72-Hour Burden (B72)</span>
                <span className="text-[11px] text-slate-400">Multi-day physiological heat accumulation</span>
              </div>
              <span className="font-mono font-bold text-base text-purple-400 tabular-nums">
                {ward.burden_72h.toFixed(1)} / 100
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Nighttime Stress Anomaly (N)</span>
                <span className="text-[11px] text-slate-400">22:00–06:00 IST nocturnal temperature percentile</span>
              </div>
              <span className="font-mono font-bold text-base text-indigo-400 tabular-nums">
                P{ward.nighttime_stress.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Extreme Thermal Event Flag</span>
                <span className="text-[11px] text-slate-400">Triggered strictly when UTCI ≥ 46.0°C</span>
              </div>
              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${ward.is_extreme_event ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                {ward.is_extreme_event ? 'TRIGGERED (≥46°C)' : 'INACTIVE (<46°C)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Scientific Limitations & Audit Notice */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <span>Operational Boundaries & Stated Limitations</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
          <li><strong>Human Heat Risk:</strong> This score is an operational municipal prioritization index, not a medical prediction of mortality, clinical heat stroke incidence, or individual physiological vulnerability.</li>
          <li><strong>Omitted Variables:</strong> Slum/informal settlement spatial boundaries and green canopy cooling are intentionally omitted because current, authoritative, ward-compatible geometries were unavailable.</li>
          <li><strong>Population Provenance:</strong> Population figures are derived from WorldPop R2025A 2020 100m grid aggregations; they do not constitute official Census 2026 counts.</li>
        </ul>
      </div>
    </div>
  );
};
