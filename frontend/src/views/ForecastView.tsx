import React, { useState, useMemo } from 'react';
import { FORECAST_DAYS, FORECAST_TODAY } from '../lib/data';
import { ForecastDay, SeverityLevel } from '../lib/types';
import { useWardForecast, IS_MOCK } from '../lib/api/hooks';
import { buildForecastDays } from '../lib/api/adapter';
import { RiskBadge } from '../components/RiskBadge';
import {
  Sun,
  CalendarDays,
  BarChart3,
  Clock,
  Thermometer,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ChartMetric = 'utci' | 'wbgt' | 'htsi' | 'risk';

interface HourlyRow {
  hour: string;
  temp: number;
  utci: number;
  wbgt: number;
  htsi: number;
  risk: SeverityLevel;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// const ALL_DAYS: ForecastDay[] = [FORECAST_TODAY, ...FORECAST_DAYS];

const riskColor = (level: SeverityLevel) => {
  const map: Record<SeverityLevel, string> = {
    Normal: '#10b981',
    Moderate: '#f59e0b',
    High: '#f97316',
    'Very High': '#ef4444',
    Extreme: '#7c3aed',
  };
  return map[level] ?? '#94a3b8';
};

const riskBgClass = (level: SeverityLevel) => {
  const map: Record<SeverityLevel, string> = {
    Normal: 'bg-emerald-500/10 border-emerald-200',
    Moderate: 'bg-amber-500/10 border-amber-200',
    High: 'bg-orange-500/10 border-orange-200',
    'Very High': 'bg-red-500/10 border-red-200',
    Extreme: 'bg-purple-500/10 border-purple-200',
  };
  return map[level] ?? 'bg-slate-100 border-slate-200';
};

/**
 * Generate hourly data for peak heat hours (10 AM – 6 PM).
 * DEVELOPMENT FIXTURE ONLY - DO NOT USE FOR SCIENTIFIC CALCULATIONS.
 * The backend API will eventually provide exact hourly forecast arrays.
 */
function generateHourlyRows(day: ForecastDay): HourlyRow[] {
  // Temporary hardcoded UI fixtures replacing the previous sine-bell interpolation and risk thresholding
  return [
    { hour: '10 AM', temp: 35.0, utci: 38.0, wbgt: 29.0, htsi: 55.0, risk: 'Moderate' },
    { hour: '12 PM', temp: 37.5, utci: 42.0, wbgt: 32.0, htsi: 72.0, risk: 'Very High' },
    { hour: '2 PM', temp: 38.0, utci: 44.0, wbgt: 33.5, htsi: 81.0, risk: 'Extreme' },
    { hour: '4 PM', temp: 36.5, utci: 40.0, wbgt: 31.0, htsi: 68.0, risk: 'High' },
    { hour: '6 PM', temp: 34.0, utci: 35.0, wbgt: 28.0, htsi: 48.0, risk: 'Normal' },
  ];
}

// ---------------------------------------------------------------------------
// Metric configs for interactive chart
// ---------------------------------------------------------------------------
const METRIC_CFG: Record<ChartMetric, { label: string; unit: string; min: number; max: number; ticks: number[]; color: string; activeClass: string }> = {
  utci: {
    label: 'UTCI',
    unit: '°C',
    min: 30,
    max: 50,
    ticks: [50, 46, 42, 38, 34, 30],
    color: '#dc2626',
    activeClass: 'bg-red-600 text-white shadow-sm',
  },
  wbgt: {
    label: 'WBGT',
    unit: '°C',
    min: 26,
    max: 38,
    ticks: [38, 36, 34, 32, 30, 28, 26],
    color: '#ea580c',
    activeClass: 'bg-orange-600 text-white shadow-sm',
  },
  htsi: {
    label: 'HTSI',
    unit: 'pts',
    min: 40,
    max: 100,
    ticks: [100, 90, 80, 70, 60, 50, 40],
    color: '#F47C20',
    activeClass: 'bg-[#F47C20] text-white shadow-sm',
  },
  risk: {
    label: 'Human Heat Risk',
    unit: '',
    min: 0,
    max: 1,
    ticks: [1.0, 0.8, 0.6, 0.4, 0.2, 0],
    color: '#7c3aed',
    activeClass: 'bg-purple-600 text-white shadow-sm',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ForecastView: React.FC = () => {
  const [selectedOffset, setSelectedOffset] = useState<number>(0);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('utci');
  const [hoveredDayOffset, setHoveredDayOffset] = useState<number | null>(null);

  const forecastApi = useWardForecast(86);
  const ALL_DAYS = useMemo<ForecastDay[]>(() => {
    if (IS_MOCK) return [FORECAST_TODAY, ...FORECAST_DAYS];
    if (forecastApi.data) return buildForecastDays(forecastApi.data.forecast);
    return [];
  }, [forecastApi.data]);

  const selectedDay = ALL_DAYS.find((d) => d.day_offset === selectedOffset) ?? ALL_DAYS[0];
  const hourlyRows = useMemo(() => generateHourlyRows(selectedDay), [selectedDay]);
  const cfg = METRIC_CFG[chartMetric];

  // ------ SVG chart geometry ------
  const W = 640;
  const H = 240;
  const PL = 52;
  const PR = 28;
  const PT = 24;
  const PB = 40;
  const pW = W - PL - PR;
  const pH = H - PT - PB;

  const getY = (v: number) => {
    const frac = (v - cfg.min) / (cfg.max - cfg.min);
    return PT + (1 - Math.max(0, Math.min(1, frac))) * pH;
  };
  const getX = (i: number) => PL + (i / (ALL_DAYS.length - 1)) * pW;

  const chartValue = (day: ForecastDay): number => {
    if (chartMetric === 'utci') return day.max_utci;
    if (chartMetric === 'wbgt') return day.max_wbgt;
    if (chartMetric === 'htsi') return day.max_htsi;
    return day.human_heat_risk;
  };

  const points = ALL_DAYS.map((d, i) => {
    const v = chartValue(d);
    return { ...d, x: getX(i), y: getY(v), v, idx: i };
  });

  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) * 0.45;
    const cx2 = prev.x + (pt.x - prev.x) * 0.55;
    return `${acc} C ${cx1},${prev.y} ${cx2},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${PT + pH} L ${points[0].x},${PT + pH} Z`;

  const formatVal = (v: number) => (chartMetric === 'risk' ? v.toFixed(2) : v.toFixed(1));

  // ------ Render ------
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ================================================================
          1. HEADER
          ================================================================ */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 shadow-lg">
        {/* decorative sun */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400/80 uppercase">
                Phase F5 — Heat Forecast Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              5-Day Heat Forecast
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Chennai — Greater Chennai Corporation
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10 font-mono">
              ECMWF + XGBoost Calibrated
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================
          2. DAY SELECTION CARDS (Today + D1–D5)
          ================================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_DAYS.map((day) => {
          const isSel = day.day_offset === selectedOffset;
          return (
            <button
              key={day.day_offset}
              type="button"
              onClick={() => setSelectedOffset(day.day_offset)}
              className={`relative group p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSel
                  ? `${riskBgClass(day.risk_level)} ring-2 ring-offset-1 ring-current`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
              style={isSel ? { borderColor: riskColor(day.risk_level), color: riskColor(day.risk_level) } : undefined}
            >
              {/* Day label + badge */}
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isSel ? 'text-current' : 'text-slate-500'}`}>
                  {day.day_offset === 0 ? 'TODAY' : day.day_name}
                </span>
                <RiskBadge level={day.risk_level} size="sm" showDot={false} />
              </div>

              {/* Key metrics */}
              <div className="space-y-2 text-xs text-slate-700">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Max UTCI</div>
                  <div className="font-mono font-bold text-base tabular-nums" style={{ color: isSel ? riskColor(day.risk_level) : '#0f172a' }}>
                    {day.max_utci}°C
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Max HTSI</div>
                  <div className="font-mono font-bold text-sm tabular-nums text-slate-800">
                    {day.max_htsi}
                  </div>
                </div>
                <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Human Heat Risk</div>
                  <div className="font-mono font-bold text-sm tabular-nums" style={{ color: riskColor(day.risk_level) }}>
                    {day.human_heat_risk.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Selected indicator */}
              {isSel && (
                <div
                  className="absolute bottom-0 inset-x-0 h-1 rounded-b-xl"
                  style={{ backgroundColor: riskColor(day.risk_level) }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================
          3. INTERACTIVE CHART
          ================================================================ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-[#F47C20]" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Forecast Metric Comparison
            </h3>
          </div>

          {/* Metric toggle pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(Object.keys(METRIC_CFG) as ChartMetric[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setChartMetric(key)}
                className={`px-3 py-1.5 rounded font-semibold cursor-pointer transition-all duration-150 ${
                  chartMetric === key ? METRIC_CFG[key].activeClass : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {METRIC_CFG[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart */}
        <div className="p-5 pt-2">
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 sm:h-60 select-none font-mono">
              <defs>
                <linearGradient id="fg-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid + Y labels */}
              {cfg.ticks.map((t) => {
                const y = getY(t);
                return (
                  <g key={t}>
                    <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={PL - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                      {chartMetric === 'risk' ? t.toFixed(1) : t}
                    </text>
                  </g>
                );
              })}

              {/* Area */}
              <path d={areaD} fill="url(#fg-grad)" />

              {/* Line */}
              <path d={pathD} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data points */}
              {points.map((pt) => {
                const isHovered = hoveredDayOffset === pt.day_offset;
                const isSel = selectedOffset === pt.day_offset;
                const dotC = riskColor(pt.risk_level);
                return (
                  <g
                    key={pt.day_offset}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDayOffset(pt.day_offset)}
                    onMouseLeave={() => setHoveredDayOffset(null)}
                    onClick={() => setSelectedOffset(pt.day_offset)}
                  >
                    {/* Vertical guide */}
                    {(isHovered || isSel) && (
                      <line x1={pt.x} y1={PT} x2={pt.x} y2={PT + pH} stroke={isSel ? cfg.color : '#94a3b8'} strokeWidth="1.5" strokeDasharray="3,3" />
                    )}

                    {/* Halo */}
                    <circle cx={pt.x} cy={pt.y} r={isHovered || isSel ? 12 : 8} fill={dotC} fillOpacity={isHovered || isSel ? 0.25 : 0.12} className="transition-all duration-200" />
                    {/* Dot */}
                    <circle cx={pt.x} cy={pt.y} r={isHovered || isSel ? 6 : 4.5} fill={dotC} stroke="#fff" strokeWidth="2" className="transition-all duration-200" />

                    {/* Value */}
                    <text x={pt.x} y={pt.y - 14} textAnchor="middle" className={`font-mono font-bold ${isHovered || isSel ? 'text-[12px] fill-slate-900' : 'text-[11px] fill-slate-600'}`}>
                      {formatVal(pt.v)}{cfg.unit && cfg.unit !== 'pts' && cfg.unit !== '' ? cfg.unit : ''}
                    </text>

                    {/* X label */}
                    <text x={pt.x} y={PT + pH + 18} textAnchor="middle" className={`text-[11px] font-mono font-bold ${isSel ? 'fill-[#F47C20]' : 'fill-slate-700'}`}>
                      {pt.day_offset === 0 ? 'Today' : `D+${pt.day_offset}`}
                    </text>
                    <text x={pt.x} y={PT + pH + 30} textAnchor="middle" className="text-[10px] fill-slate-400 font-sans">
                      {pt.day_name.slice(0, 3)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* ================================================================
          4. HOURLY FORECAST TABLE FOR SELECTED DAY
          ================================================================ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4.5 h-4.5 text-[#F47C20]" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                Hourly Peak-Window Forecast
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDay.day_offset === 0 ? 'Today' : selectedDay.day_name} — {selectedDay.date} · 10 AM – 6 PM IST
              </p>
            </div>
          </div>
          <RiskBadge level={selectedDay.risk_level} size="md" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider font-semibold bg-slate-50/80">
                <th className="py-3 px-4 w-24">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Time
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3 h-3 text-red-500" />
                    Temp (°C)
                  </div>
                </th>
                <th className="py-3 px-4">UTCI (°C)</th>
                <th className="py-3 px-4">WBGT (°C)</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-[#F47C20]" />
                    HTSI
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hourlyRows.map((row) => {
                const isPeak = row.hour === '12 PM' || row.hour === '2 PM';
                return (
                  <tr key={row.hour} className={`transition-colors ${isPeak ? 'bg-red-50/40' : 'hover:bg-slate-50/60'}`}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {row.hour}
                      {isPeak && (
                        <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">{row.temp}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <span style={{ color: row.utci >= 38 ? '#dc2626' : row.utci >= 32 ? '#f97316' : '#64748b' }} className="font-semibold">
                        {row.utci}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <span style={{ color: row.wbgt >= 33 ? '#ea580c' : row.wbgt >= 28 ? '#f59e0b' : '#64748b' }} className="font-semibold">
                        {row.wbgt}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-bold" style={{ color: riskColor(row.risk) }}>
                      {row.htsi}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <RiskBadge level={row.risk} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer legend */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-100 border border-red-400" />
              12 PM – 2 PM IST Peak Danger Window
            </span>
          </div>
          <span className="font-mono">
            Diurnal model · IST UTC+05:30
          </span>
        </div>
      </div>
    </div>
  );
};
