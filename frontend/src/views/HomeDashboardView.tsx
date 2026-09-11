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
  onNavigateToMap: () => void;
}

/* ────────────────────────────────────────────────────────────────────────
   Severity color helper — maps a SeverityLevel to tailwind-compatible
   inline and class tokens used across multiple sections.
   ──────────────────────────────────────────────────────────────────────── */
const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; text: string; border: string; dot: string; hex: string; glow: string }> = {
  Normal:    { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: '#059669', dot: '#10b981', hex: '#10b981', glow: 'rgba(16,185,129,0.25)' },
  Moderate:  { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: '#d97706', dot: '#f59e0b', hex: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
  High:      { bg: 'rgba(249,115,22,0.12)', text: '#f97316', border: '#ea580c', dot: '#f97316', hex: '#f97316', glow: 'rgba(249,115,22,0.3)' },
  'Very High': { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: '#dc2626', dot: '#ef4444', hex: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  Extreme:   { bg: 'rgba(124,58,237,0.15)', text: '#a855f7', border: '#7c3aed', dot: '#7c3aed', hex: '#7c3aed', glow: 'rgba(124,58,237,0.4)' },
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
        className="dashboard-header-bg border border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle radial accent glow */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ background: `radial-gradient(circle, ${SEVERITY_COLORS[kpis.cityRiskLevel].hex}44, transparent 70%)` }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left title area */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-red-500 to-purple-600 flex items-center justify-center p-1.5 shadow-lg shadow-red-500/20">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
                  Heat<span className="text-red-500">Pulse</span>
                  <span className="text-slate-400 font-normal text-base lg:text-lg ml-2">— Chennai Heat Intelligence</span>
                </h1>
              </div>
            </div>

            {/* Status line */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="status-breathe inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-bold tracking-wide"
                style={{
                  backgroundColor: SEVERITY_COLORS[kpis.cityRiskLevel].bg,
                  borderColor: SEVERITY_COLORS[kpis.cityRiskLevel].border,
                  color: SEVERITY_COLORS[kpis.cityRiskLevel].text,
                  boxShadow: `0 0 20px ${SEVERITY_COLORS[kpis.cityRiskLevel].glow}`,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: SEVERITY_COLORS[kpis.cityRiskLevel].dot }}
                />
                <span>Chennai Heat Status: {kpis.cityRiskLevel.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{istTime}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Impact-based extreme heat early-warning intelligence across <strong className="text-slate-200">200 GCC wards</strong> · 15 zones · 5 ERA5-Land calibrated grids
            </p>
          </div>

          {/* Right — quick stats */}
          <div className="flex flex-col items-end gap-2.5 shrink-0">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Peak Thermal Strain</div>
              <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: SEVERITY_COLORS[kpis.cityRiskLevel].text }}>
                UTCI {Math.max(...WARDS_DATA.map(w => w.utci)).toFixed(1)}°C
              </div>
            </div>
            <button
              type="button"
              onClick={onNavigateToMap}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/25 cursor-pointer"
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
        <div className="kpi-card-enter bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 shadow-md border-t-2"
          style={{ borderTopColor: SEVERITY_COLORS[kpis.cityRiskLevel].hex }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>{kpis.highPlusCount} wards at High+ risk</span>
            <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
              LIVE STATUS
            </span>
          </div>
        </div>

        {/* Card 2: Maximum HTSI */}
        <div className="kpi-card-enter bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 shadow-md border-t-2 border-t-red-500">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Maximum HTSI
            </span>
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-50 tabular-nums">
              {kpis.maxHtsi.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Composite Thermal Stress Index</span>
            <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
              CANONICAL HTSI
            </span>
          </div>
        </div>

        {/* Card 3: Highest Risk Ward */}
        <div className="kpi-card-enter bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 shadow-md border-t-2 border-t-orange-500">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Highest Risk Ward
            </span>
            <MapPin className="w-4 h-4 text-orange-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold tracking-tight text-white">
              Ward {kpis.highestRiskWard.ward_id}
            </span>
            <div className="text-xs text-slate-400 mt-0.5">{kpis.highestRiskWard.ward_name}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-red-400 font-semibold tabular-nums">
              Risk: {kpis.highestRiskWard.human_heat_risk.toFixed(3)}
            </span>
            <button
              type="button"
              onClick={() => onSelectWard(kpis.highestRiskWard.ward_id)}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-[11px] cursor-pointer"
            >
              Inspect <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Extreme UTCI Wards */}
        <div className="kpi-card-enter bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 shadow-md border-t-2 border-t-amber-500">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Extreme UTCI Wards
            </span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-50 tabular-nums">
              {kpis.extremeUtciWards}
            </span>
            <span className="text-sm font-medium text-slate-400">wards ≥ 38°C</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Strong Heat Stress threshold</span>
            <span className="shrink-0 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
              UTCI ≥ 38°C
            </span>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — Large Chennai Ward Heat Map (200 GCC Wards)
          ═══════════════════════════════════════════════════════════════ */}
      <section id="ward-heat-map" className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Map Header with toggle */}
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Chennai 200-Ward Heat Map
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any ward to inspect thermal decomposition. Colors mapped to 5-tier severity scale.
            </p>
          </div>

          {/* THERMAL STRESS | HUMAN HEAT RISK toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMapMode('htsi')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mapMode === 'htsi'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              THERMAL STRESS
            </button>
            <button
              type="button"
              onClick={() => setMapMode('risk')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mapMode === 'risk'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              HUMAN HEAT RISK
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative p-5 min-h-[420px] lg:min-h-[480px] bg-slate-950/60">
          {/* Grid dot pattern background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* Bay of Bengal label */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono tracking-[0.2em] text-cyan-500/30 uppercase rotate-90 pointer-events-none select-none whitespace-nowrap">
            Bay of Bengal · Coastline →
          </div>

          {/* ERA5 Grid indicator */}
          <div className="absolute left-4 top-3 text-[10px] font-mono text-slate-500 flex items-center gap-1.5 z-20">
            <span className="w-2 h-2 rounded border border-blue-400/60 bg-blue-500/10" />
            <span>5 ERA5-Land Grids (0.1° × 0.1°)</span>
          </div>

          {/* Ward Grid — responsive 5-column layout */}
          <div className="grid grid-cols-5 gap-2 w-full max-w-3xl mx-auto pt-6 pb-4 relative z-10">
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
                  className="ward-cell relative p-2.5 rounded-lg border transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: `${colors.hex}44`,
                    boxShadow: level === 'Very High' || level === 'Extreme'
                      ? `0 0 12px ${colors.glow}`
                      : 'none',
                  }}
                  title={`Ward ${ward.ward_id}: ${ward.ward_name} (${ward.risk_level})`}
                >
                  <span className="text-[10px] font-mono font-bold text-white/80">
                    W{ward.ward_id}
                  </span>
                  <span
                    className="text-sm font-mono font-extrabold tabular-nums my-0.5"
                    style={{ color: colors.text }}
                  >
                    {displayVal}
                  </span>
                  <span className="text-[9px] text-white/60 truncate max-w-[65px]">
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
            <div className="tooltip-enter absolute bottom-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-xl p-3.5 text-xs max-w-xs">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                    W{hoveredWard.ward_id}
                  </span>
                  <span className="font-semibold text-white text-sm">{hoveredWard.ward_name}</span>
                </div>
                <RiskBadge level={hoveredWard.risk_level} size="sm" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-slate-950 rounded p-1.5 text-center">
                  <div className="text-slate-500 font-semibold">HTSI</div>
                  <div className="font-mono font-bold text-white tabular-nums">{hoveredWard.htsi.toFixed(1)}</div>
                </div>
                <div className="bg-slate-950 rounded p-1.5 text-center">
                  <div className="text-slate-500 font-semibold">UTCI</div>
                  <div className="font-mono font-bold text-amber-300 tabular-nums">{hoveredWard.utci.toFixed(1)}°C</div>
                </div>
                <div className="bg-slate-950 rounded p-1.5 text-center">
                  <div className="text-slate-500 font-semibold">Risk</div>
                  <div className="font-mono font-bold text-red-400 tabular-nums">{hoveredWard.human_heat_risk.toFixed(3)}</div>
                </div>
              </div>
              <div className="mt-2 text-slate-400 text-[10px]">
                Zone {hoveredWard.zone_id} · {hoveredWard.zone_name} · {hoveredWard.region} Chennai · Pop: {hoveredWard.population.toLocaleString()}
              </div>
            </div>
          )}

          {/* Inline Map Legend */}
          <div className="absolute bottom-4 right-4 z-20">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl text-xs text-slate-300 w-48">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
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
                        className="w-3 h-3 rounded-sm border border-black/20"
                        style={{ backgroundColor: SEVERITY_COLORS[b.level].hex }}
                      />
                      <span className="text-slate-300">{b.level}</span>
                    </div>
                    <span className="font-mono text-slate-500 tabular-nums">{b.range}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                200 GCC Wards · {WARDS_DATA.length} shown
              </div>
            </div>
          </div>
        </div>

        {/* Map Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            {mapMode === 'htsi'
              ? <>HTSI: <code className="font-mono text-slate-300">0.64U + 0.16W + 0.10B₂₄ + 0.06B₇₂ + 0.04N</code></>
              : <>Formula B: <code className="font-mono text-slate-300">Risk = H × E × (0.5 + 0.5V)</code></>
            }
          </span>
          <button
            type="button"
            onClick={onNavigateToMap}
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-xs cursor-pointer"
          >
            <span>Open GIS Fullscreen</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — 5-Day Forecast Strip
          ═══════════════════════════════════════════════════════════════ */}
      <section id="forecast-strip" className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            5-Day Heat Forecast
          </h2>
          <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            XGBoost + Mean Bias Calibrated
          </span>
        </div>

        <div className="p-4 overflow-x-auto forecast-strip">
          <div className="grid grid-cols-6 gap-3 min-w-[700px]">
            {forecastAll.map((day, idx) => {
              const colors = SEVERITY_COLORS[day.risk_level];
              const isToday = idx === 0;
              const dayLabels = ['TODAY', 'TOMORROW', 'DAY 3', 'DAY 4', 'DAY 5', 'DAY 6'];

              return (
                <div
                  key={day.day_offset}
                  className={`relative rounded-xl border p-4 flex flex-col items-center text-center transition-all hover:scale-[1.02] ${
                    isToday ? 'ring-2 ring-blue-500/40 ring-offset-1 ring-offset-slate-950' : ''
                  }`}
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: `${colors.hex}33`,
                  }}
                >
                  {/* Day label */}
                  <span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    isToday ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {dayLabels[idx]}
                  </span>

                  {/* Date */}
                  <span className="text-[10px] text-slate-500 font-mono mb-3">{day.date}</span>

                  {/* Severity badge */}
                  <RiskBadge level={day.risk_level} size="md" />

                  {/* Key metrics */}
                  <div className="mt-3 space-y-1 w-full">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">HTSI</span>
                      <span className="font-mono font-bold text-slate-200 tabular-nums">{day.max_htsi.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">UTCI</span>
                      <span className="font-mono font-semibold text-amber-300 tabular-nums">{day.max_utci.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">T₂ₘ</span>
                      <span className="font-mono text-slate-300 tabular-nums">{day.max_temperature.toFixed(1)}°C</span>
                    </div>
                  </div>

                  {/* Nighttime stress flag */}
                  {day.nighttime_stress_flag && (
                    <div className="mt-2 text-[9px] text-purple-400/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />
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
        className="bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 border border-amber-800/30 rounded-2xl p-5 shadow-xl flex items-start gap-4"
      >
        <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Heat Advisory Active
            </span>
            <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
              AUTO-GENERATED
            </span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
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
