import React, { useState } from 'react';
import { FORECAST_DAYS } from '../lib/data';
import { ForecastDay, SeverityLevel } from '../lib/types';
import { RiskBadge } from '../components/RiskBadge';
import {
  Calendar,
  Clock,
  TrendingUp,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Sun,
  Wind,
  Droplets,
  Activity,
  Info
} from 'lucide-react';

export const ForecastView: React.FC = () => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(1);
  const selectedDay = FORECAST_DAYS.find((d) => d.day_offset === selectedDayOffset) || FORECAST_DAYS[0];

  // 24-hour simulation data for the selected forecast day
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* 1. Header & Calibration Transparency Notice */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              PHASE 4 ML ENGINE
            </span>
            <span className="text-xs text-slate-400">ECMWF / ERA5-Land Calibrated Predictor</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            5-Day Pointwise & Cumulative Thermal Forecast
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Meteorological boundary states calibrated via gradient-boosted trees and empirical mean bias corrections, validated against Chennai's 2014–2025 canonical ground-truth archive.
          </p>
        </div>

        {/* Operational Recommendation Pill */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 shrink-0 text-xs max-w-sm">
          <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Dual-Engine Model Architecture</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            • <strong>XGBoost:</strong> Calibrates pointwise states (Temp, RH, Wind, UTCI, WBGT).
            <br />
            • <strong>Mean Bias:</strong> Preserves cumulative persistence (<code className="text-slate-300">B24, B72, HTSI</code>).
          </p>
        </div>
      </div>

      {/* 2. 5-Day Progression Cards (D+1 to D+5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {FORECAST_DAYS.map((day) => {
          const isSelected = day.day_offset === selectedDayOffset;
          return (
            <button
              key={day.day_offset}
              type="button"
              onClick={() => setSelectedDayOffset(day.day_offset)}
              className={`p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/30 shadow-lg scale-102'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                    D+{day.day_offset} • {day.day_name}
                  </span>
                  <RiskBadge level={day.risk_level} size="sm" />
                </div>
                <div className="text-sm font-bold text-white mb-2">{day.date}</div>

                {/* Primary Metric: Max HTSI & Max UTCI */}
                <div className="space-y-1 py-2 border-y border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Peak UTCI:</span>
                    <span className="font-mono font-bold text-amber-400 tabular-nums">
                      {day.max_utci}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Peak WBGT:</span>
                    <span className="font-mono font-semibold text-slate-200 tabular-nums">
                      {day.max_wbgt}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Max Air Temp:</span>
                    <span className="font-mono font-semibold text-slate-300 tabular-nums">
                      {day.max_temperature}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">HTSI Index:</span>
                    <span className="font-mono font-bold text-red-400 tabular-nums">
                      {day.max_htsi}
                    </span>
                  </div>
                </div>
              </div>

              {/* Night Stress & Lead MAE footer */}
              <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                <span>MAE ±{day.ml_lead_mae_temp}°C</span>
                {day.nighttime_stress_flag ? (
                  <span className="text-purple-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Night Load
                  </span>
                ) : (
                  <span className="text-slate-500">Night Relief</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Detailed Diurnal Timeline (24 Hours for Selected Day) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Diurnal Hourly Thermal Trajectory — {selectedDay.day_name} ({selectedDay.date})
            </h3>
            <p className="text-xs text-slate-400">
              IST Hourly Progression (00:00 to 23:00). Highlighting peak mid-day danger window and nocturnal retention burden.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              UTCI (°C)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              WBGT (°C)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              Air Temp (°C)
            </span>
          </div>
        </div>

        {/* Hourly Chart Bars Visualization */}
        <div className="overflow-x-auto py-2">
          <div className="min-w-[700px] h-56 flex items-end gap-1.5 px-2 relative">
            {/* Threshold line for UTCI 38°C (Very Strong Stress) */}
            <div className="absolute inset-x-0 top-[28%] border-b border-dashed border-red-500/40 pointer-events-none z-10 flex items-center justify-end pr-2">
              <span className="text-[10px] font-mono text-red-400 bg-slate-950/80 px-1 rounded">
                UTCI 38°C Strong Stress Threshold
              </span>
            </div>

            {/* Threshold line for UTCI 32°C (Moderate/Strong) */}
            <div className="absolute inset-x-0 top-[52%] border-b border-dashed border-amber-500/40 pointer-events-none z-10 flex items-center justify-end pr-2">
              <span className="text-[10px] font-mono text-amber-400 bg-slate-950/80 px-1 rounded">
                UTCI 32°C Threshold
              </span>
            </div>

            {hours.map((hour) => {
              const isNight = hour >= 22 || hour <= 6;
              const isPeak = hour >= 12 && hour <= 15;

              // Compute diurnal bell curve
              const middayPeakFactor = Math.sin(((hour - 4) / 16) * Math.PI);
              const factor = Math.max(0, middayPeakFactor);
              
              const simulatedUtci = 27 + factor * (selectedDay.max_utci - 27);
              const simulatedWbgt = 24 + factor * (selectedDay.max_wbgt - 24);
              const simulatedTemp = selectedDay.min_temperature + factor * (selectedDay.max_temperature - selectedDay.min_temperature);

              // Height in %
              const barHeightPercent = Math.min(100, Math.max(15, (simulatedUtci / 50) * 100));

              return (
                <div
                  key={hour}
                  className={`flex-1 flex flex-col items-center justify-end h-full rounded-t py-1 transition-all ${
                    isNight
                      ? 'bg-purple-950/20 border-b-2 border-b-purple-500'
                      : isPeak
                      ? 'bg-red-950/30 border-b-2 border-b-red-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                  title={`${hour}:00 IST | UTCI: ${simulatedUtci.toFixed(1)}°C, WBGT: ${simulatedWbgt.toFixed(1)}°C, Temp: ${simulatedTemp.toFixed(1)}°C`}
                >
                  <div
                    className="w-full max-w-[14px] rounded-t transition-all"
                    style={{
                      height: `${barHeightPercent}%`,
                      backgroundColor: simulatedUtci >= 38 ? '#ef4444' : simulatedUtci >= 32 ? '#f59e0b' : '#3b82f6'
                    }}
                  />
                  <span className="text-[9px] font-mono text-slate-400 mt-2">
                    {hour.toString().padStart(2, '0')}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend for Time Windows */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-900/60 border border-purple-500" />
              <span>22:00–06:00 IST Nighttime Burden (N)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-red-900/60 border border-red-500" />
              <span>12:00–15:00 IST Peak Sun Exertion Danger</span>
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Timestamps strictly converted to Indian Standard Time (UTC+05:30)
          </span>
        </div>
      </div>

      {/* 4. Scientific Audit: Lead-Time Performance Verification Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Lead-Time Accuracy & Model Calibration Audit (Phase 4 Step 3)
            </h3>
            <p className="text-xs text-slate-400">
              Continuous Mean Absolute Error (MAE) verified against unseen 2025 ground truth for Chennai.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
            PASSED VALIDATION
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2 px-3">Forecast Lead Day</th>
                <th className="py-2 px-3">ECMWF Raw Temperature MAE</th>
                <th className="py-2 px-3">XGBoost Calibrated Temp MAE</th>
                <th className="py-2 px-3">Raw HTSI MAE</th>
                <th className="py-2 px-3">Mean Bias Calibrated HTSI MAE</th>
                <th className="py-2 px-3 text-right">Error Reduction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-2 px-3 font-sans font-semibold text-slate-200">Day 1 (24 Hours)</td>
                <td className="py-2 px-3 text-slate-400">0.93 °C</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">0.85 °C</td>
                <td className="py-2 px-3 text-slate-400">3.63 pts</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">2.93 pts</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">+19.3%</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-semibold text-slate-200">Day 2 (48 Hours)</td>
                <td className="py-2 px-3 text-slate-400">0.97 °C</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">0.88 °C</td>
                <td className="py-2 px-3 text-slate-400">3.75 pts</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">3.00 pts</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">+20.0%</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-semibold text-slate-200">Day 3 (72 Hours)</td>
                <td className="py-2 px-3 text-slate-400">1.03 °C</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">0.92 °C</td>
                <td className="py-2 px-3 text-slate-400">4.05 pts</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">3.14 pts</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">+22.5%</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-semibold text-slate-200">Day 4 (96 Hours)</td>
                <td className="py-2 px-3 text-slate-400">1.06 °C</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">0.93 °C</td>
                <td className="py-2 px-3 text-slate-400">4.64 pts</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">3.22 pts</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">+30.6%</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-sans font-semibold text-slate-200">Day 5 (120 Hours)</td>
                <td className="py-2 px-3 text-slate-400">1.13 °C</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">0.95 °C</td>
                <td className="py-2 px-3 text-slate-400">4.89 pts</td>
                <td className="py-2 px-3 text-emerald-400 font-semibold">3.32 pts</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">+32.1%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
