'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MetricCard } from '../components/MetricCard';
import { RiskBadge } from '../components/RiskBadge';
import { MapLegend } from '../components/MapLegend';
import { WARDS_DATA, FORECAST_DAYS, FORECAST_TODAY, CHENNAI_ZONES } from '../lib/data';
import { WardRecord, SeverityLevel } from '../lib/types';
import {
  AlertTriangle,
  Flame,
  Thermometer,
  MapPin,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Info,
  Layers,
  ArrowUpRight,
  Calendar,
  Clock,
  Activity,
  ShieldAlert,
  Zap,
  Wind
} from 'lucide-react';

interface HomeDashboardViewProps {
  onSelectWard: (wardId: number) => void;
  onNavigateToMap?: () => void;
  onNavigateToForecast?: () => void;
  onNavigateToAlerts?: () => void;
}

/* ────────────────────────────────────────────────────────────────────────
   Severity color helper — maps a SeverityLevel to light-theme compatible
   inline and class tokens used across multiple sections.
   ──────────────────────────────────────────────────────────────────────── */
const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; text: string; border: string; dot: string; hex: string; glow: string }> = {
  Normal:    { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981', hex: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  Moderate:  { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b', hex: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  High:      { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5', dot: '#f97316', hex: '#f97316', glow: 'rgba(249,115,22,0.15)' },
  'Very High': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444', hex: '#ef4444', glow: 'rgba(239,68,68,0.15)' },
  Extreme:   { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff', dot: '#7c3aed', hex: '#7c3aed', glow: 'rgba(124,58,237,0.15)' },
};

/* ────────────────────────────────────────────────────────────────────────
   Main Dashboard Component
   ──────────────────────────────────────────────────────────────────────── */
export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onSelectWard,
  onNavigateToMap
}) => {
  // ─── Map toggle state ──────────────────────────────────────────────
  const [mapMode, setMapMode] = useState<'htsi' | 'risk'>('risk');
  const [hoveredWard, setHoveredWard] = useState<WardRecord | null>(null);

  // ─── Live IST clock ────────────────────────────────────────────────
  const [istTime, setIstTime] = useState<string>('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const opts: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      };
      setIstTime(new Intl.DateTimeFormat('en-IN', opts).format(now) + ' IST');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ─── Derived KPI metrics (computed, never hardcoded) ───────────────
  const kpis = useMemo(() => {
    const sorted = [...WARDS_DATA].sort((a, b) => b.human_heat_risk - a.human_heat_risk);
    const highestRiskWard = sorted[0];

    // City-level risk = the maximum ward risk level
    const severityRank: Record<SeverityLevel, number> = { Normal: 1, Moderate: 2, High: 3, 'Very High': 4, Extreme: 5 };
    const cityRiskLevel = WARDS_DATA.reduce<SeverityLevel>((max, w) =>
      severityRank[w.risk_level] > severityRank[max] ? w.risk_level : max
    , 'Normal');

    const maxHtsi = Math.max(...WARDS_DATA.map(w => w.htsi));
    const extremeUtciWards = WARDS_DATA.filter(w => w.utci >= 38).length;

    // Wards in high+ categories
    const highPlusWards = WARDS_DATA.filter(w =>
      w.risk_level === 'High' || w.risk_level === 'Very High' || w.risk_level === 'Extreme'
    );

    return {
      cityRiskLevel,
      maxHtsi,
      highestRiskWard,
      extremeUtciWards,
      highPlusCount: highPlusWards.length,
      sorted,
    };
  }, []);

  // ─── Forecast data (today + 5 days) ────────────────────────────────
  const forecastAll = useMemo(() => [FORECAST_TODAY, ...FORECAST_DAYS], []);

  // ─── Dynamic alert text ────────────────────────────────────────────
  const alertText = useMemo(() => {
    const veryHighWards = WARDS_DATA.filter(w => w.risk_level === 'Very High' || w.risk_level === 'Extreme');
    const affectedZones = [...new Set(veryHighWards.map(w => w.zone_name))];
    const maxUtci = Math.max(...WARDS_DATA.map(w => w.utci));
    const zonesStr = affectedZones.length > 0
      ? affectedZones.slice(0, 3).join(', ')
      : 'select areas';

    return `High heat risk expected in ${zonesStr} wards during afternoon hours (12:00–15:30 IST). Peak UTCI forecast at ${maxUtci.toFixed(1)}°C. Ensure hydration stations are operational and outdoor labor restrictions are enforced.`;
  }, []);


  /* ═══════════════════════════════════════════════════════════════════
     R E N D E R
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — Executive Header Banner
          ═══════════════════════════════════════════════════════════════ */}
      <section
        id="dashboard-header"
        className="bg-white border border-slate-200 rounded-xl p-6 lg:p-7 shadow-xs relative overflow-hidden"
      >
        {/* Subtle top accent border in Mandarin Orange */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#F47C20]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left title area */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#F47C20] flex items-center justify-center p-1.5 shadow-sm text-white">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
                  Heat<span className="text-[#F47C20]">Pulse</span>
                  <span className="text-slate-500 font-normal text-base lg:text-lg ml-2">— Chennai Heat Intelligence</span>
                </h1>
              </div>
            </div>

            {/* Status line */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-bold tracking-wide shadow-2xs"
                style={{
                  backgroundColor: SEVERITY_COLORS[kpis.cityRiskLevel].bg,
                  borderColor: SEVERITY_COLORS[kpis.cityRiskLevel].border,
                  color: SEVERITY_COLORS[kpis.cityRiskLevel].text,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: SEVERITY_COLORS[kpis.cityRiskLevel].dot }}
                />
                <span>Chennai Heat Status: {kpis.cityRiskLevel.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#F47C20]" />
                <span>{istTime}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Impact-based extreme heat early-warning intelligence across <strong className="text-slate-900">200 GCC wards</strong> · 15 zones · 5 ERA5-Land calibrated grids
            </p>
          </div>

          {/* Right — quick stats */}
          <div className="flex flex-col items-end gap-2.5 shrink-0">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Peak Thermal Strain</div>
              <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: SEVERITY_COLORS[kpis.cityRiskLevel].text }}>
                UTCI {Math.max(...WARDS_DATA.map(w => w.utci)).toFixed(1)}°C
              </div>
            </div>
            <button
              type="button"
              onClick={onNavigateToMap}
              className="px-4 py-2 bg-[#F47C20] hover:bg-[#e06c15] text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <span>Explore 200 Wards on GIS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — KPI Metric Cards (dynamically computed)
          ═══════════════════════════════════════════════════════════════ */}
      <section id="kpi-cards" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Card 1: Current Heat Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-300 shadow-xs border-t-2"
          style={{ borderTopColor: SEVERITY_COLORS[kpis.cityRiskLevel].hex }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Current Heat Status
            </span>
            <RiskBadge level={kpis.cityRiskLevel} size="sm" />
          </div>
          <div className="my-1">
            <span
              className="text-3xl font-extrabold tracking-tight tabular-nums"
              style={{ color: SEVERITY_COLORS[kpis.cityRiskLevel].text }}
            >
              {kpis.cityRiskLevel.toUpperCase()}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{kpis.highPlusCount} wards at High+ risk</span>
            <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
              LIVE STATUS
            </span>
          </div>
        </div>

        {/* Card 2: Maximum HTSI */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-300 shadow-xs border-t-2 border-t-red-500">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Maximum HTSI
            </span>
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {kpis.maxHtsi.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-slate-500">/ 100</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Composite Thermal Stress Index</span>
            <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
              CANONICAL HTSI
            </span>
          </div>
        </div>

        {/* Card 3: Highest Risk Ward */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-300 shadow-xs border-t-2 border-t-[#F47C20]">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Highest Risk Ward
            </span>
            <MapPin className="w-4 h-4 text-[#F47C20]" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Ward {kpis.highestRiskWard.ward_id}
            </span>
            <div className="text-xs text-slate-500 mt-0.5">{kpis.highestRiskWard.ward_name}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-red-600 font-semibold tabular-nums">
              Risk: {kpis.highestRiskWard.human_heat_risk.toFixed(3)}
            </span>
            <button
              type="button"
              onClick={() => onSelectWard(kpis.highestRiskWard.ward_id)}
              className="text-[#F47C20] hover:text-[#e06c15] font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              Inspect <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Extreme UTCI Wards */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-300 shadow-xs border-t-2 border-t-amber-500">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Extreme UTCI Wards
            </span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {kpis.extremeUtciWards}
            </span>
            <span className="text-sm font-medium text-slate-500">wards ≥ 38°C</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Strong Heat Stress threshold</span>
            <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
              UTCI ≥ 38°C
            </span>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — Large Chennai Ward Heat Map (200 GCC Wards)
          ═══════════════════════════════════════════════════════════════ */}
      <section id="ward-heat-map" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Map Header with toggle */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F47C20]" />
              Chennai 200-Ward Heat Map
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any ward to inspect thermal decomposition. Colors mapped to 5-tier severity scale.
            </p>
          </div>

          {/* THERMAL STRESS | HUMAN HEAT RISK toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMapMode('htsi')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mapMode === 'htsi'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              THERMAL STRESS
            </button>
            <button
              type="button"
              onClick={() => setMapMode('risk')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mapMode === 'risk'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              HUMAN HEAT RISK
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative p-5 min-h-[420px] lg:min-h-[480px] bg-slate-50/70">
          {/* Grid dot pattern background */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Bay of Bengal label */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase rotate-90 pointer-events-none select-none whitespace-nowrap">
            Bay of Bengal · Coastline →
          </div>

          {/* ERA5 Grid indicator */}
          <div className="absolute left-4 top-3 text-[10px] font-mono text-slate-500 flex items-center gap-1.5 z-20">
            <span className="w-2 h-2 rounded border border-[#F47C20]/60 bg-[#F47C20]/10" />
            <span>5 ERA5-Land Grids (0.1° × 0.1°)</span>
          </div>

          {/* Ward Grid — responsive 5-column layout */}
          <div className="grid grid-cols-5 gap-2.5 w-full max-w-3xl mx-auto pt-6 pb-4 relative z-10">
            {WARDS_DATA.map((ward) => {
              // Determine color based on map mode
              const metric = mapMode === 'htsi' ? ward.htsi : ward.human_heat_risk;
              const level = ward.risk_level;
              const colors = SEVERITY_COLORS[level];

              // Display value
              const displayVal = mapMode === 'htsi'
                ? ward.htsi.toFixed(1)
                : ward.human_heat_risk.toFixed(2);

              return (
                <button
                  key={ward.ward_id}
                  type="button"
                  onClick={() => onSelectWard(ward.ward_id)}
                  onMouseEnter={() => setHoveredWard(ward)}
                  onMouseLeave={() => setHoveredWard(null)}
                  className="ward-cell relative p-2.5 rounded-lg border transition-all text-center flex flex-col items-center justify-center cursor-pointer group shadow-2xs"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  }}
                  title={`Ward ${ward.ward_id}: ${ward.ward_name} (${ward.risk_level})`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-700">
                    W{ward.ward_id}
                  </span>
                  <span
                    className="text-sm font-mono font-extrabold tabular-nums my-0.5"
                    style={{ color: colors.text }}
                  >
                    {displayVal}
                  </span>
                  <span className="text-[9px] text-slate-600 truncate max-w-[65px] font-medium">
                    {ward.zone_name.split(' ')[0]}
                  </span>

                  {/* Hover accent ring */}
                  <div
                    className="absolute inset-0 rounded-lg border-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ borderColor: colors.hex }}
                  />
                </button>
              );
            })}
          </div>

          {/* Hovered Ward Tooltip */}
          {hoveredWard && (
            <div className="tooltip-enter absolute bottom-4 left-4 z-30 bg-white border border-slate-200 shadow-xl rounded-xl p-3.5 text-xs max-w-xs">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
                    W{hoveredWard.ward_id}
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">{hoveredWard.ward_name}</span>
                </div>
                <RiskBadge level={hoveredWard.risk_level} size="sm" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                  <div className="text-slate-500 font-semibold">HTSI</div>
                  <div className="font-mono font-bold text-slate-900 tabular-nums">{hoveredWard.htsi.toFixed(1)}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                  <div className="text-slate-500 font-semibold">UTCI</div>
                  <div className="font-mono font-bold text-amber-700 tabular-nums">{hoveredWard.utci.toFixed(1)}°C</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center">
                  <div className="text-slate-500 font-semibold">Risk</div>
                  <div className="font-mono font-bold text-red-600 tabular-nums">{hoveredWard.human_heat_risk.toFixed(3)}</div>
                </div>
              </div>
              <div className="mt-2 text-slate-500 text-[10px]">
                Zone {hoveredWard.zone_id} · {hoveredWard.zone_name} · {hoveredWard.region} Chennai · Pop: {hoveredWard.population.toLocaleString()}
              </div>
            </div>
          )}

          {/* Inline Map Legend */}
          <div className="absolute bottom-4 right-4 z-20">
            <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3 shadow-md text-xs text-slate-700 w-48">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {mapMode === 'htsi' ? 'HTSI Score' : 'Human Heat Risk'}
              </div>
              <div className="space-y-1">
                {([
                  { level: 'Normal', range: mapMode === 'htsi' ? '< 50' : '< 0.20' },
                  { level: 'Moderate', range: mapMode === 'htsi' ? '50–65' : '0.20–0.35' },
                  { level: 'High', range: mapMode === 'htsi' ? '65–72' : '0.35–0.50' },
                  { level: 'Very High', range: mapMode === 'htsi' ? '72–80' : '0.50–0.70' },
                  { level: 'Extreme', range: mapMode === 'htsi' ? '> 80' : '≥ 0.70' },
                ] as { level: SeverityLevel; range: string }[]).map(b => (
                  <div key={b.level} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-sm border border-slate-300"
                        style={{ backgroundColor: SEVERITY_COLORS[b.level].hex }}
                      />
                      <span className="text-slate-700 font-medium">{b.level}</span>
                    </div>
                    <span className="font-mono text-slate-500 tabular-nums">{b.range}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                200 GCC Wards · {WARDS_DATA.length} shown
              </div>
            </div>
          </div>
        </div>

        {/* Map Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-white">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#F47C20] shrink-0" />
            {mapMode === 'htsi'
              ? <>HTSI: <code className="font-mono text-slate-800">0.64U + 0.16W + 0.10B₂₄ + 0.06B₇₂ + 0.04N</code></>
              : <>Formula B: <code className="font-mono text-slate-800">Risk = H × E × (0.5 + 0.5V)</code></>
            }
          </span>
          <button
            type="button"
            onClick={onNavigateToMap}
            className="text-[#F47C20] hover:text-[#e06c15] font-semibold flex items-center gap-1 text-xs cursor-pointer"
          >
            <span>Open GIS Fullscreen</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — 5-Day Forecast Strip
          ═══════════════════════════════════════════════════════════════ */}
      <section id="forecast-strip" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#F47C20]" />
            5-Day Heat Forecast
          </h2>
          <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-semibold">
            XGBoost + Mean Bias Calibrated
          </span>
        </div>

        <div className="p-4 overflow-x-auto forecast-strip bg-slate-50/50">
          <div className="grid grid-cols-6 gap-3 min-w-[700px]">
            {forecastAll.map((day, idx) => {
              const colors = SEVERITY_COLORS[day.risk_level];
              const isToday = idx === 0;
              const dayLabels = ['TODAY', 'TOMORROW', 'DAY 3', 'DAY 4', 'DAY 5', 'DAY 6'];

              return (
                <div
                  key={day.day_offset}
                  className={`relative rounded-xl border p-3.5 flex flex-col items-center text-center transition-all hover:shadow-xs bg-white ${
                    isToday ? 'ring-2 ring-[#F47C20] border-[#F47C20]' : 'border-slate-200'
                  }`}
                >
                  {/* Day label */}
                  <span className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${
                    isToday ? 'text-[#F47C20]' : 'text-slate-500'
                  }`}>
                    {dayLabels[idx]}
                  </span>

                  {/* Date */}
                  <span className="text-[10px] text-slate-500 font-mono mb-2.5">{day.date}</span>

                  {/* Severity badge */}
                  <RiskBadge level={day.risk_level} size="md" />

                  {/* Key metrics */}
                  <div className="mt-3 space-y-1 w-full border-t border-slate-100 pt-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">HTSI</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">{day.max_htsi.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">UTCI</span>
                      <span className="font-mono font-semibold text-amber-700 tabular-nums">{day.max_utci.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">T₂ₘ</span>
                      <span className="font-mono text-slate-700 tabular-nums">{day.max_temperature.toFixed(1)}°C</span>
                    </div>
                  </div>

                  {/* Nighttime stress flag */}
                  {day.nighttime_stress_flag && (
                    <div className="mt-2 text-[9px] text-purple-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      Night stress
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5 — Alert Banner
          ═══════════════════════════════════════════════════════════════ */}
      <section
        id="dashboard-alert"
        className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 shadow-xs flex items-start gap-4"
      >
        <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Heat Advisory Active
            </span>
            <span className="text-[10px] font-mono text-amber-700 px-1.5 py-0.5 rounded bg-amber-100/70 border border-amber-200 font-semibold">
              AUTO-GENERATED
            </span>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">
            ⚠ {alertText}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            Generated from current ward data and forecast model outputs. Final advisory wording subject to GCC Emergency Control Room review.
          </p>
        </div>
      </section>

    </div>
  );
};
