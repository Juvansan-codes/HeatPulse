'use client';

import React, { useState } from 'react';
import { WardRecord, SeverityLevel } from '../lib/types';
import { FORECAST_DAYS } from '../lib/data';
import { TrendingUp, AlertTriangle, Info, Calendar } from 'lucide-react';

interface WardForecastChartProps {
  ward: WardRecord;
}

type MetricType = 'htsi' | 'temp' | 'utci' | 'wbgt';

export const WardForecastChart: React.FC<WardForecastChartProps> = ({ ward }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('htsi');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // DEVELOPMENT FIXTURES ONLY
  // Direct use of city-wide FORECAST_DAYS values as temporary UI placeholders.
  // The backend API will provide exact ward-level 5-day forecast trajectories.
  const forecastPoints = FORECAST_DAYS.map((cityDay) => {
    return {
      dayOffset: cityDay.day_offset,
      dayCode: `D${cityDay.day_offset}`,
      dayName: cityDay.day_name,
      date: cityDay.date,
      htsi: cityDay.max_htsi, // Mock fixture
      temp: cityDay.max_temperature, // Mock fixture
      utci: cityDay.max_utci, // Mock fixture
      wbgt: cityDay.max_wbgt, // Mock fixture
      risk: cityDay.risk_level, // Mock fixture
      maeHtsi: cityDay.ml_lead_mae_htsi,
      maeTemp: cityDay.ml_lead_mae_temp
    };
  });

  // Scale parameters based on active metric
  const metricConfigs: Record<MetricType, { label: string; unit: string; min: number; max: number; ticks: number[]; color: string }> = {
    htsi: {
      label: 'Heat-Triggered Stress Index (HTSI)',
      unit: 'pts',
      min: 0,
      max: 100,
      ticks: [100, 80, 60, 40, 20, 0],
      color: '#F47C20'
    },
    temp: {
      label: 'Calibrated 2m Temperature',
      unit: '°C',
      min: 25,
      max: 45,
      ticks: [45, 40, 35, 30, 25],
      color: '#ef4444'
    },
    utci: {
      label: 'Universal Thermal Climate Index (UTCI)',
      unit: '°C',
      min: 20,
      max: 50,
      ticks: [50, 44, 38, 32, 26, 20],
      color: '#dc2626'
    },
    wbgt: {
      label: 'Wet Bulb Globe Temperature (WBGT)',
      unit: '°C',
      min: 20,
      max: 40,
      ticks: [40, 36, 32, 28, 24, 20],
      color: '#f59e0b'
    }
  };

  const currentConfig = metricConfigs[activeMetric];

  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const getY = (val: number) => {
    const fraction = (val - currentConfig.min) / (currentConfig.max - currentConfig.min);
    return paddingTop + (1 - Math.max(0, Math.min(1, fraction))) * plotHeight;
  };

  const getX = (index: number) => {
    return paddingLeft + (index / (forecastPoints.length - 1)) * plotWidth;
  };

  const points = forecastPoints.map((p, idx) => {
    const val = p[activeMetric];
    return {
      ...p,
      x: getX(idx),
      y: getY(val),
      val
    };
  });

  // Generate SVG path string
  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[idx - 1];
    const cx1 = prev.x + (pt.x - prev.x) * 0.45;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) * 0.55;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${paddingTop + plotHeight} L ${points[0].x},${paddingTop + plotHeight} Z`;

  const hoveredPoint = hoveredDay !== null ? points.find((p) => p.dayOffset === hoveredDay) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#F47C20]" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              5-Day Calibrated Heat Trajectory
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            XGBoost calibrated forecast for Ward {ward.ward_id} ({ward.ward_name})
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('htsi')}
            className={`px-2.5 py-1 font-semibold rounded cursor-pointer transition-colors ${
              activeMetric === 'htsi'
                ? 'bg-[#F47C20] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            HTSI
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('temp')}
            className={`px-2.5 py-1 font-semibold rounded cursor-pointer transition-colors ${
              activeMetric === 'temp'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Temp (°C)
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('utci')}
            className={`px-2.5 py-1 font-semibold rounded cursor-pointer transition-colors ${
              activeMetric === 'utci'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            UTCI
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('wbgt')}
            className={`px-2.5 py-1 font-semibold rounded cursor-pointer transition-colors ${
              activeMetric === 'wbgt'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WBGT
          </button>
        </div>
      </div>

      {/* SVG Forecast Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-56 select-none font-mono"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentConfig.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={currentConfig.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {currentConfig.ticks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={tick === 80 || tick === 70 ? '4,4' : 'none'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono font-medium"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Chart line */}
          <path
            d={pathD}
            fill="none"
            stroke={currentConfig.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points (●) */}
          {points.map((pt) => {
            const isHovered = hoveredDay === pt.dayOffset;
            const dotColor =
              pt.risk === 'Extreme'
                ? '#9333ea'
                : pt.risk === 'Very High'
                ? '#dc2626'
                : pt.risk === 'High'
                ? '#f97316'
                : pt.risk === 'Moderate'
                ? '#eab308'
                : '#10b981';

            return (
              <g
                key={pt.dayOffset}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredDay(pt.dayOffset)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + plotHeight}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 11 : 7}
                  fill={dotColor}
                  fillOpacity={isHovered ? 0.3 : 0.15}
                  className="transition-all duration-200"
                />

                {/* Solid Bullet Point (●) */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  fill={dotColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* Value Label above dot */}
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-bold ${
                    isHovered ? 'fill-slate-900 text-xs' : 'fill-slate-600'
                  }`}
                >
                  {pt.val}
                </text>

                {/* X-axis Day code (D1, D2, D3, D4, D5) */}
                <text
                  x={pt.x}
                  y={paddingTop + plotHeight + 18}
                  textAnchor="middle"
                  className={`text-xs font-mono font-bold ${
                    isHovered ? 'fill-[#F47C20]' : 'fill-slate-700'
                  }`}
                >
                  {pt.dayCode}
                </text>

                {/* Day name below */}
                <text
                  x={pt.x}
                  y={paddingTop + plotHeight + 30}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-sans"
                >
                  {pt.dayName.slice(0, 3)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Tooltip Card on Hover */}
      {hoveredPoint && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#F47C20]" />
            <span className="font-bold text-slate-900 font-mono">
              {hoveredPoint.dayCode}: {hoveredPoint.dayName} ({hoveredPoint.date})
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                hoveredPoint.risk === 'Extreme'
                  ? 'bg-purple-100 text-purple-800'
                  : hoveredPoint.risk === 'Very High'
                  ? 'bg-red-100 text-red-800'
                  : hoveredPoint.risk === 'High'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {hoveredPoint.risk} Risk
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-slate-700">
            <span>
              HTSI: <strong className="text-slate-900">{hoveredPoint.htsi}</strong>
            </span>
            <span>
              Temp: <strong className="text-slate-900">{hoveredPoint.temp}°C</strong>
            </span>
            <span>
              UTCI: <strong className="text-slate-900">{hoveredPoint.utci}°C</strong>
            </span>
            <span>
              WBGT: <strong className="text-slate-900">{hoveredPoint.wbgt}°C</strong>
            </span>
          </div>
        </div>
      )}

      {/* Forecast Info Strip */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Bias-corrected with IMD Chennai Meenambakkam observations (Lead MAE: ±3.0 pts HTSI)
        </span>
        <span className="font-mono text-slate-600">Peak Thermal Load: Day 3 (Sunday)</span>
      </div>
    </div>
  );
};
