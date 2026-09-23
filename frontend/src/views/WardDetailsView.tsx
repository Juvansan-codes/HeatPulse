'use client';

import React, { useState } from 'react';
import type { WardRecord } from '../lib/types';
import { WardForecastChart } from '../components/WardForecastChart';
import { RiskCompositionSection } from '../components/RiskCompositionSection';
import {
  Thermometer,
  Sun,
  Droplets,
  Activity,
  AlertOctagon,
  Calculator,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Compass,
  AlertTriangle
} from 'lucide-react';

interface WardDetailsViewProps {
  selectedWardId?: number;
  onSelectWard: (wardId: number) => void;
  onOpenExplainability?: (wardId: number) => void;
  wards: WardRecord[];
}

export const WardDetailsView: React.FC<WardDetailsViewProps> = ({
  selectedWardId = 114,
  onSelectWard,
  onOpenExplainability,
  wards
}) => {
  const [activeFormula, setActiveFormula] = useState<'b' | 'a'>('b');

  // Find selected ward or fallback to Ward 86 or first ward
  const ward =
    wards.find((w) => w.ward_id === selectedWardId) ||
    wards.find((w) => w.ward_id === 86) ||
    wards[0];

  const currentWardIdx = wards.findIndex((w) => w.ward_id === ward?.ward_id);
  const prevWard = currentWardIdx > 0 ? wards[currentWardIdx - 1] : null;
  const nextWard = currentWardIdx < wards.length - 1 ? wards[currentWardIdx + 1] : null;

  if (!ward) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading ward analysis...</div>;
  }

  // Header Risk styling mapping
  const riskStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    Normal: {
      bg: 'bg-emerald-600',
      text: 'text-white',
      border: 'border-emerald-700',
      glow: 'shadow-emerald-500/20'
    },
    Moderate: {
      bg: 'bg-amber-500',
      text: 'text-white',
      border: 'border-amber-600',
      glow: 'shadow-amber-500/20'
    },
    High: {
      bg: 'bg-orange-500',
      text: 'text-white',
      border: 'border-orange-600',
      glow: 'shadow-orange-500/20'
    },
    'Very High': {
      bg: 'bg-red-600',
      text: 'text-white',
      border: 'border-red-700',
      glow: 'shadow-red-500/25'
    },
    Extreme: {
      bg: 'bg-purple-700',
      text: 'text-white',
      border: 'border-purple-800',
      glow: 'shadow-purple-500/30'
    }
  };

  const currentRiskStyle = riskStyles[ward.risk_level] || riskStyles['Very High'];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* 1. HEADER (Phase F4 Specification) */}
      {/* Ward 86 / Zone 10 / VERY HIGH HEAT RISK */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        {/* Subtle accent color top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F47C20] via-red-500 to-purple-600" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Hierarchical Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                Ward {ward.ward_id}
              </span>
              <span className="text-slate-400 font-light text-2xl">/</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-700">
                {ward.ward_name}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm sm:text-base font-medium text-slate-600">
              <span className="font-semibold text-slate-900">
                Zone {ward.zone_id}
              </span>
              <span>•</span>
              <span>{ward.zone_name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-normal">
                {ward.region} Chennai
              </span>
              <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                Grid: {ward.assigned_grid_id}
              </span>
            </div>

            {/* VERY HIGH HEAT RISK Prominent Badge */}
            <div className="pt-2">
              <span
                className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-sm sm:text-base font-black tracking-wider uppercase shadow-md ${currentRiskStyle.bg} ${currentRiskStyle.text} ${currentRiskStyle.border} ${currentRiskStyle.glow}`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                {ward.risk_level.toUpperCase()} HEAT RISK
              </span>
            </div>
          </div>

          {/* Right Column: Ward Switcher & Navigation Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            {/* Quick Demo Jump Button for Ward 86 */}
            {ward.ward_id !== 86 && (
              <button
                type="button"
                onClick={() => onSelectWard(86)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 text-[#F47C20] hover:bg-orange-100 border border-orange-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Jump to Demo Ward 86</span>
              </button>
            )}

            {/* Ward Switcher Dropdown & Prev/Next navigation */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs">
              <span className="text-slate-500 font-medium pl-1">Switch Ward:</span>
              <select
                value={ward.ward_id}
                onChange={(e) => onSelectWard(Number(e.target.value))}
                aria-label="Select Chennai Ward"
                className="bg-white border border-slate-200 text-slate-900 font-mono font-bold px-2.5 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47C20] cursor-pointer"
              >
                {wards.map((w) => (
                  <option key={w.ward_id} value={w.ward_id}>
                    W{w.ward_id}: {w.ward_name} (Z{w.zone_id} • {w.risk_level})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  disabled={!prevWard}
                  onClick={() => prevWard && onSelectWard(prevWard.ward_id)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <button
                  type="button"
                  disabled={!nextWard}
                  onClick={() => nextWard && onSelectWard(nextWard.ward_id)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Explainability CTA */}
            {onOpenExplainability && (
              <button
                type="button"
                onClick={() => onOpenExplainability(ward.ward_id)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-slate-700 hover:border-amber-400/50 group"
              >
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Why is Ward {ward.ward_id} at {ward.risk_level.toUpperCase()} Risk?</span>
              </button>
            )}

            {/* Ward Centroid & Spatial Metadata */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>{ward.grid_lat.toFixed(4)}°N, {ward.grid_lon.toFixed(4)}°E</span>
              <span>•</span>
              <span>Area: {ward.area_km2} km²</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CURRENT CONDITIONS */}
      {/* 5 Cards: Temperature, UTCI, WBGT, HTSI, Human Heat Risk */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono">
            Current Thermal Conditions (Observed & Calibrated)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Observation Time: 14:00 IST • Model Grid: {ward.assigned_grid_id}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Temperature */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Temperature
              </span>
              <Thermometer className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {ward.temperature_2m.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-slate-500">°C</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Ambient 2m air temp (+2.6°C vs normal)
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>RH: {ward.relative_humidity}%</span>
              <span>Wind: {ward.wind_speed_10m} m/s</span>
            </div>
          </div>

          {/* Card 2: UTCI */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                UTCI
              </span>
              <Sun className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-rose-600">
                {ward.utci.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-slate-500">°C</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-rose-700">
              Very Strong Heat Stress
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 truncate">
              6th-order polynomial radiation load
            </div>
          </div>

          {/* Card 3: WBGT */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                WBGT
              </span>
              <Droplets className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-amber-600">
                {ward.wbgt_outdoor.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-slate-500">°C</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-amber-700">
              Extreme Caution
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 truncate">
              Liljegren outdoor mass-transfer model
            </div>
          </div>

          {/* Card 4: HTSI */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                HTSI
              </span>
              <Activity className="w-4 h-4 text-[#F47C20]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-[#F47C20]">
                {ward.htsi.toFixed(1)}
              </span>
              <span className="text-xs font-mono font-medium text-slate-500">/ 100</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-orange-700">
              Level {ward.htsi_level}: {ward.htsi_label}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 truncate">
              Heat-Triggered Stress Index
            </div>
          </div>

          {/* Card 5: Human Heat Risk */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Human Heat Risk
              </span>
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-purple-700">
                {ward.human_heat_risk.toFixed(3)}
              </span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-purple-700">
              Formula B Triage Score
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 truncate">
              Operational Priority: {ward.risk_level}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FORECAST CHART (Phase F4 Specification) */}
      {/* HTSI 100 / 80 / 60 / 40 / 20 over D1 D2 D3 D4 D5 */}
      {/* ========================================================================= */}
      <div>
        <WardForecastChart ward={ward} />
      </div>

      {/* ========================================================================= */}
      {/* 4 & 5. RISK COMPOSITION & VULNERABILITY INFORMATION (Phase F4 Spec) */}
      {/* Thermal Hazard (78%), Exposure (64%), Reduced Vulnerability (48%) */}
      {/* Population Exposure, Population Density, Healthcare Availability, Vulnerability */}
      {/* Tooltip: Population is a derived WorldPop 2020 estimate aggregated to current GCC 2025 wards. */}
      {/* ========================================================================= */}
      <div>
        <RiskCompositionSection ward={ward} />
      </div>

      {/* ========================================================================= */}
      {/* 6. MATHEMATICAL FORMULATION & DECOMPOSITION (Formula B vs Formula A) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#F47C20]" />
              Impact Risk Mathematical Formulation & Decomposition
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive step-by-step calculation demonstrating why Formula B was selected over Formula A
            </p>
          </div>

          {/* Formula Comparison Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveFormula('b')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeFormula === 'b'
                  ? 'bg-[#F47C20] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Formula B (Selected)
            </button>
            <button
              type="button"
              onClick={() => setActiveFormula('a')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeFormula === 'a'
                  ? 'bg-[#F47C20] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Formula A (Alternative)
            </button>
          </div>
        </div>

        {/* Formula Math Breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-700 pb-2 border-b border-slate-200 gap-2">
            <span className="font-bold text-[#F47C20] text-sm">
              {activeFormula === 'b'
                ? 'Formula B: Risk = H × E × (0.5 + 0.5V)'
                : 'Formula A: Risk = H × E × V'}
            </span>
            <span className="text-slate-500 text-xs">
              Calculated Priority Score:{' '}
              <strong className="text-slate-900 text-sm font-bold">
                {activeFormula === 'b'
                  ? ward.human_heat_risk_formula_b.toFixed(3)
                  : ward.human_heat_risk_formula_a.toFixed(3)}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="font-mono text-slate-500 uppercase text-[10px] block mb-1 font-semibold">
                Factor 1: Thermal Hazard (H)
              </span>
              <div className="font-mono text-lg font-bold text-red-600">
                {ward.heat_hazard.toFixed(3)}
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Derived directly from grid-level HTSI ({ward.htsi.toFixed(1)} / 100), bounded strictly in [0, 1].
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="font-mono text-slate-500 uppercase text-[10px] block mb-1 font-semibold">
                Factor 2: Population Exposure (E)
              </span>
              <div className="font-mono text-lg font-bold text-amber-700">
                {ward.exposure_density_norm.toFixed(3)}
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Min-max normalized WorldPop 2020 density ({ward.population_density.toLocaleString()} people/km²).
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="font-mono text-slate-500 uppercase text-[10px] block mb-1 font-semibold">
                Factor 3: Reduced Vulnerability (V)
              </span>
              <div className="font-mono text-lg font-bold text-purple-700">
                {ward.vulnerability.toFixed(3)}
              </div>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Reduced model: <code className="font-mono text-slate-800 font-semibold">0.5×S + 0.5×(1 - A)</code>, where S is sensitivity and A is HWC facility access.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-sans text-xs leading-relaxed">
            <strong className="text-slate-900">Scientific Rationale for Formula B:</strong> In municipal emergency response, an extreme hazard occurring in a high-density ward must never be zeroed out or deprioritized due to incomplete socioeconomic census data. Formula B guarantees that Hazard and Population Exposure maintain baseline weight even when the reduced vulnerability score is low.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. SCIENTIFIC LIMITATIONS & AUDIT NOTICE */}
      {/* ========================================================================= */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-bold">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Operational Boundaries & Stated Methodological Limitations</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
          <li><strong>Human Heat Risk:</strong> This score is an operational municipal prioritization triage metric, not a clinical prediction of mortality, heat stroke incidence, or individual physiological morbidity.</li>
          <li><strong>Reduced Vulnerability:</strong> The vulnerability model is explicitly reduced. Informal settlement (slum) boundaries and micro-urban green canopy cooling are omitted because authoritative ward-level GIS layers are not yet published by the municipality.</li>
          <li><strong>Population Provenance:</strong> Population figures are derived from WorldPop R2025A 2020 100m raster aggregations mapped to GCC 2025 ward boundaries; they do not constitute official Census 2026 counts.</li>
        </ul>
      </div>
    </div>
  );
};
