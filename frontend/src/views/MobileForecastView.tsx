'use client';

import React from 'react';
import { FORECAST_DAYS, FORECAST_TODAY } from '../lib/data';
import { RiskBadge } from '../components/RiskBadge';
import {
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const MobileForecastView: React.FC = () => {
  const forecastAll = [FORECAST_TODAY, ...FORECAST_DAYS];
  const dayLabels = ['TODAY', 'MON', 'TUE', 'WED', 'THU', 'FRI'];

  const chartData = forecastAll.map((d, i) => ({
    day: dayLabels[i],
    date: d.date,
    htsi: d.max_htsi,
    utci: d.max_utci,
    risk: d.risk_level
  }));

  return (
    <div className="space-y-4 pb-20 animate-fadeIn text-slate-900">
      {/* Mobile Forecast Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#F47C20]" />
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              5-Day Heat Forecast
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            XGBoost ML + Mean Bias Calibrated Model
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-50 text-[#F47C20] border border-orange-200 font-bold">
          0.1° GRID
        </span>
      </div>

      {/* HORIZONTALLY SCROLLABLE DAY CARDS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wide px-1">
          <span>Daily Forecast Strip</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">Swipe →</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {forecastAll.map((day, idx) => {
            const isToday = idx === 0;

            return (
              <div
                key={day.day_offset}
                className={`min-w-[140px] p-3 rounded-2xl border text-center snap-start flex flex-col justify-between space-y-2 bg-white shadow-2xs ${
                  isToday ? 'border-[#F47C20] ring-2 ring-[#F47C20]/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={`font-bold ${isToday ? 'text-[#F47C20]' : 'text-slate-500'}`}>
                    {dayLabels[idx]}
                  </span>
                  <span className="text-slate-400">{day.date.slice(5)}</span>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {day.max_htsi.toFixed(0)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">HTSI HAZARD</div>
                </div>

                <div className="pt-1 flex justify-center">
                  <RiskBadge level={day.risk_level} size="sm" />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>UTCI Peak</span>
                  <span className="font-bold text-amber-700">{day.max_utci.toFixed(1)}°C</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECHARTS HTSI TREND LINE CHART */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-bold text-xs uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#F47C20]" />
            HTSI Hazard Trend
          </span>
          <span className="text-[10px] font-mono text-slate-400">0–100 SCALE</span>
        </div>

        <div className="h-52 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="htsiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F47C20" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F47C20" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg font-mono">
                        <div className="font-bold text-amber-400">{data.day} ({data.date})</div>
                        <div>HTSI: {data.htsi.toFixed(1)} / 100</div>
                        <div>UTCI: {data.utci.toFixed(1)}°C</div>
                        <div>Risk: {data.risk}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="htsi"
                stroke="#F47C20"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#htsiGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">Forecast Model Notes:</div>
          <p className="leading-relaxed">
            HTSI combines continuous UTCI radiation physics, local WBGT climatological anomalies, and 24h/72h cumulative heat burden to prevent surprise heat stress spikes.
          </p>
        </div>
      </div>
    </div>
  );
};
