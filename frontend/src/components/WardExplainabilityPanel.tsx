'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import {
  X,
  Thermometer,
  Users,
  Shield,
  Sun,
  TrendingUp,
  Moon,
  Wind,
  Activity,
  Heart,
  AlertTriangle,
  ChevronRight,
  Database,
  Brain,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  FileText,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { WARDS_DATA } from '../lib/data';
import { WardRecord } from '../lib/types';
import { computeWardExplanation } from '../lib/explainability';
import { WardExplanation, RiskDriver } from '../lib/explainabilityTypes';
import { RiskBadge } from './RiskBadge';

// ─── Icon Map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  thermometer: <Thermometer className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  sun: <Sun className="w-4 h-4" />,
  'trending-up': <TrendingUp className="w-4 h-4" />,
  moon: <Moon className="w-4 h-4" />,
  wind: <Wind className="w-4 h-4" />,
  activity: <Activity className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
};

// ─── Risk Level Colors ───────────────────────────────────────────────────────
const RISK_COLORS: Record<string, { bg: string; text: string; border: string; barBg: string; gradient: string }> = {
  Normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', barBg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
  Moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', barBg: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', barBg: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600' },
  'Very High': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', barBg: 'bg-red-500', gradient: 'from-red-500 to-red-600' },
  Extreme: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', barBg: 'bg-purple-600', gradient: 'from-purple-600 to-purple-700' },
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface WardExplainabilityPanelProps {
  wardId: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectWard?: (wardId: number) => void;
}

// ─── Contribution Bar Component ──────────────────────────────────────────────
const ContributionBar: React.FC<{
  label: string;
  percentage: number;
  color: string;
  delay: number;
}> = ({ label, percentage, color, delay }) => (
  <div className="space-y-1" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-700 font-medium">{label}</span>
      <span className="font-mono font-bold text-slate-900 tabular-nums">{percentage.toFixed(1)}%</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div
        className="h-full rounded-full contribution-bar-fill"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
          animationDelay: `${delay + 200}ms`,
        }}
      />
    </div>
  </div>
);

// ─── Driver Card Component ───────────────────────────────────────────────────
const DriverCard: React.FC<{ driver: RiskDriver; index: number }> = ({ driver, index }) => {
  const DirectionIcon = driver.direction === 'increasing' ? ArrowUpRight :
    driver.direction === 'decreasing' ? ArrowDownRight : Minus;
  const directionColor = driver.direction === 'increasing' ? 'text-red-600 bg-red-50 border-red-200' :
    driver.direction === 'decreasing' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    'text-slate-500 bg-slate-50 border-slate-200';

  return (
    <div
      className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 driver-card-stagger"
      style={{ animationDelay: `${index * 80 + 400}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: driver.color + '15', color: driver.color }}>
            {ICON_MAP[driver.icon] || <Activity className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">{driver.label}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                {typeof driver.value === 'number' && driver.value < 10
                  ? driver.value.toFixed(2)
                  : typeof driver.value === 'number' && driver.value < 100
                  ? driver.value.toFixed(1)
                  : driver.value.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">{driver.unit}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${directionColor}`}>
            <DirectionIcon className="w-3 h-3" />
            {driver.direction === 'increasing' ? 'Rising' : driver.direction === 'decreasing' ? 'Falling' : 'Stable'}
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
            {driver.contribution.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed pl-[42px]">
        {driver.explanation}
      </p>
    </div>
  );
};

// ─── Custom Recharts Tooltip ─────────────────────────────────────────────────
const CustomTooltip: React.FC<{ active?: boolean; payload?: Array<{ value: number }>; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 text-xs">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="font-mono text-sm font-bold text-red-600 mt-0.5">
        HTSI {payload[0].value.toFixed(1)}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const WardExplainabilityPanel: React.FC<WardExplainabilityPanelProps> = ({
  wardId,
  isOpen,
  onClose,
  onSelectWard,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const ward: WardRecord | undefined = useMemo(
    () => WARDS_DATA.find((w) => w.ward_id === wardId),
    [wardId]
  );

  const explanation: WardExplanation | null = useMemo(
    () => (ward ? computeWardExplanation(ward) : null),
    [ward]
  );

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Scroll to top when ward changes
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [wardId]);

  if (!isOpen) return null;

  // Empty state
  if (!ward || !explanation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-backdropIn">
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 max-w-md mx-4 text-center animate-modalIn">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-900 mb-2">Explanation Unavailable</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Explanation unavailable for this ward because insufficient data is currently available.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const riskColors = RISK_COLORS[explanation.riskLevel] || RISK_COLORS.Normal;

  // Top 5 drivers for contribution chart
  const topDrivers = explanation.drivers.slice(0, 5);

  // Grouped contributions for high-level chart
  const groupedContributions = [
    {
      label: 'Thermal Stress',
      percentage: explanation.drivers
        .filter((d) => ['HTSI', 'WBGT', 'UTCI'].includes(d.feature))
        .reduce((s, d) => s + d.contribution, 0),
      color: '#ef4444',
    },
    {
      label: 'Population Exposure',
      percentage: explanation.drivers
        .filter((d) => d.feature === 'population_density')
        .reduce((s, d) => s + d.contribution, 0),
      color: '#f59e0b',
    },
    {
      label: 'Vulnerability',
      percentage: explanation.drivers
        .filter((d) => d.feature === 'vulnerability')
        .reduce((s, d) => s + d.contribution, 0),
      color: '#8b5cf6',
    },
    {
      label: 'Heat Persistence',
      percentage: explanation.drivers
        .filter((d) => ['nighttime_stress', 'burden_72h'].includes(d.feature))
        .reduce((s, d) => s + d.contribution, 0),
      color: '#6366f1',
    },
  ].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-backdropIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-[520px] bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto explainability-panel-enter"
      >
        {/* ═══ 1. HEADER ═══ */}
        <div className={`sticky top-0 z-10 bg-white border-b border-slate-200 p-5 pb-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-[#F47C20] border border-orange-200">
                  WARD {explanation.wardId}
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  Zone {explanation.zoneId} • {explanation.zoneName}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
                Why is {explanation.wardName} at{' '}
                <span className={riskColors.text}>{explanation.riskLevel.toUpperCase()}</span> risk?
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RiskBadge level={explanation.riskLevel} size="lg" />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label="Close explanation panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Risk Score Bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span className="font-medium">Impact Risk Score</span>
                <span className="font-mono font-bold text-slate-900">{explanation.humanHeatRisk.toFixed(3)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${riskColors.gradient} contribution-bar-fill`}
                  style={{ width: `${Math.min(100, explanation.humanHeatRisk * 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums leading-none">
                {explanation.riskScore}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">HTSI /100</div>
            </div>
          </div>
        </div>

        {/* ═══ SCROLLABLE CONTENT ═══ */}
        <div className="flex-1 p-5 space-y-5">

          {/* ═══ 2. WHY THIS WARD? — AI Summary ═══ */}
          <section className="explainability-section" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Why This Ward?</h3>
            </div>
            <div className={`p-4 rounded-xl ${riskColors.bg} border ${riskColors.border}`}>
              <p className={`text-sm leading-relaxed ${riskColors.text}`}>
                {explanation.summary}
              </p>
            </div>
          </section>

          {/* ═══ 3. RISK CONTRIBUTION CHART ═══ */}
          <section className="explainability-section" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Risk Contribution</h3>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              {groupedContributions.map((g, i) => (
                <ContributionBar
                  key={g.label}
                  label={g.label}
                  percentage={g.percentage}
                  color={g.color}
                  delay={i * 100 + 300}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic">
              Contributions computed via sensitivity analysis on Formula B: H × E × (0.5 + 0.5V).
            </p>
          </section>

          {/* ═══ 4. TOP RISK DRIVERS ═══ */}
          <section className="explainability-section" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Risk Drivers</h3>
            </div>
            <div className="space-y-2.5">
              {topDrivers.map((driver, idx) => (
                <DriverCard key={driver.feature} driver={driver} index={idx} />
              ))}
            </div>
          </section>

          {/* ═══ 5. THERMAL STRESS ═══ */}
          <section className="explainability-section" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Thermal Stress Profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'HTSI', value: explanation.thermal.htsi.toFixed(1), unit: '/100', color: 'text-red-600' },
                { label: 'UTCI', value: `${explanation.thermal.utci}°C`, unit: '', color: 'text-red-600' },
                { label: 'WBGT', value: `${explanation.thermal.wbgt}°C`, unit: '', color: 'text-orange-600' },
                { label: 'Heat Index', value: `${explanation.thermal.heatIndex}°C`, unit: '', color: 'text-amber-600' },
                { label: 'Temperature', value: `${explanation.thermal.temperature}°C`, unit: '', color: 'text-slate-700' },
                { label: 'Humidity', value: `${explanation.thermal.humidity}%`, unit: '', color: 'text-cyan-600' },
                { label: 'Wind', value: `${explanation.thermal.windSpeed} m/s`, unit: '', color: 'text-blue-600' },
                { label: 'Tmrt', value: `${explanation.thermal.tmrt}°C`, unit: '', color: 'text-pink-600' },
              ].map((m) => (
                <div key={m.label} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{m.label}</div>
                  <div className={`font-mono text-sm font-bold ${m.color} tabular-nums mt-0.5`}>
                    {m.value}{m.unit}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ 6. EXPOSURE & VULNERABILITY ═══ */}
          <section className="explainability-section" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Exposure & Vulnerability</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider mb-1">Population</div>
                <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                  {explanation.exposure.population.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {explanation.exposure.density.toLocaleString()}/km²
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200">
                <div className="text-[10px] text-purple-700 font-semibold uppercase tracking-wider mb-1">Vulnerability</div>
                <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                  {explanation.vulnerability.score.toFixed(3)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  HWC: {explanation.vulnerability.healthcarePer10k.toFixed(2)}/10k
                </div>
              </div>
            </div>
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Area</div>
                <div className="font-mono text-xs font-bold text-slate-800">{explanation.exposure.areaKm2} km²</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">HWC Facilities</div>
                <div className="font-mono text-xs font-bold text-slate-800">{explanation.vulnerability.healthcareFacilities}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Adaptive Cap.</div>
                <div className="font-mono text-xs font-bold text-slate-800">{explanation.vulnerability.adaptiveCapacity.toFixed(3)}</div>
              </div>
            </div>
          </section>

          {/* ═══ 7. FORECAST TREND ═══ */}
          <section className="explainability-section" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">5-Day HTSI Forecast</h3>
              </div>
              <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                explanation.forecast.trend === 'rising' ? 'bg-red-50 text-red-700 border border-red-200' :
                explanation.forecast.trend === 'falling' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-slate-50 text-slate-600 border border-slate-200'
              }`}>
                {explanation.forecast.trend === 'rising' ? <ArrowUpRight className="w-3 h-3" /> :
                 explanation.forecast.trend === 'falling' ? <ArrowDownRight className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
                {explanation.forecast.changePercent > 0 ? '+' : ''}{explanation.forecast.changePercent}% next day
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 pb-1">
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={explanation.forecast.points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="htsiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <ReferenceLine y={72} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <ReferenceLine y={65} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.4} />
                  <Area
                    type="monotone"
                    dataKey="htsi"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#htsiGradient)"
                    dot={{ r: 4, fill: '#fff', stroke: '#ef4444', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pb-2 pt-1">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-[1px] bg-red-400" /> Very High (≥72)
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-[1px] bg-orange-400" /> High (≥65)
                </span>
              </div>
            </div>
          </section>

          {/* ═══ 8. RECOMMENDATIONS ═══ */}
          <section className="explainability-section" style={{ animationDelay: '700ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">What Should Happen Next?</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> For Authorities
                </div>
                <ul className="space-y-1.5">
                  {explanation.recommendations.authorities.map((rec, i) => (
                    <li key={i} className="text-[11px] text-slate-700 leading-relaxed flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="w-3 h-3" /> For Citizens
                </div>
                <ul className="space-y-1.5">
                  {explanation.recommendations.citizens.map((rec, i) => (
                    <li key={i} className="text-[11px] text-slate-700 leading-relaxed flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ═══ 9. DATA SOURCES ═══ */}
          <section className="explainability-section" style={{ animationDelay: '800ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Data Sources</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {explanation.dataSources.map((ds) => (
                <div
                  key={ds.name}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors group"
                  title={ds.description}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ds.color }}
                    />
                    <span className="text-[11px] font-semibold text-slate-800">{ds.name}</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mt-0.5 block">{ds.badge}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ═══ TRANSPARENCY CHAIN ═══ */}
          <section className="explainability-section" style={{ animationDelay: '900ms' }}>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Explainability Chain</div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 flex-wrap">
                {['RAW DATA', 'THERMAL INDICES', 'EXPOSURE', 'VULNERABILITY', 'FORMULA B', 'RISK SCORE', 'WHY THIS WARD?'].map((step, i) => (
                  <React.Fragment key={step}>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold whitespace-nowrap">{step}</span>
                    {i < 6 && <span className="text-slate-400">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ TIMESTAMP ═══ */}
          <div className="text-[10px] text-slate-400 text-center pt-2 pb-4 flex items-center justify-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>Generated {new Date(explanation.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      </div>
    </div>
  );
};
