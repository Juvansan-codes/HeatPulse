'use client';

import React from 'react';
import { WARDS_DATA, FORECAST_DAYS, FORECAST_TODAY } from '../lib/data';
import { RiskBadge } from '../components/RiskBadge';
import {
  Sparkles,
  Sun,
  Users,
  Shield,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  Activity,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface MobileWardViewProps {
  selectedWardId?: number;
  onSelectWard: (wardId: number) => void;
  onOpenExplainability?: (wardId: number) => void;
}

export const MobileWardView: React.FC<MobileWardViewProps> = ({
  selectedWardId = 114,
  onSelectWard,
  onOpenExplainability
}) => {
  const ward = WARDS_DATA.find((w) => w.ward_id === selectedWardId) || WARDS_DATA[0];
  const forecastAll = [FORECAST_TODAY, ...FORECAST_DAYS];

  return (
    <div className="space-y-4 pb-20 animate-fadeIn text-slate-900">
      {/* Mobile Ward Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#F47C20]" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-[#F47C20] border border-orange-200">
              WARD {ward.ward_id}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Zone {ward.zone_id} • {ward.zone_name}
            </span>
          </div>

          <RiskBadge level={ward.risk_level} size="md" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {ward.ward_name}
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {ward.grid_lat.toFixed(4)}°N, {ward.grid_lon.toFixed(4)}°E • Area: {ward.area_km2} km²
          </p>
        </div>

        {/* Ward Switcher */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Switch Ward:</span>
          <select
            value={ward.ward_id}
            onChange={(e) => onSelectWard(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
          >
            {WARDS_DATA.map((w) => (
              <option key={w.ward_id} value={w.ward_id}>
                W{w.ward_id}: {w.ward_name} ({w.risk_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CARD 1 — WHY THIS WARD? (EXPLAINABILITY) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg space-y-3 border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            CARD 1 — WHY THIS WARD?
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-semibold">
            FORMULA B SENSITIVITY
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          "{ward.ward_name} (Ward {ward.ward_id}) is currently classified as <strong>{ward.risk_level.toUpperCase()}</strong> risk primarily due to elevated thermal stress (HTSI {ward.htsi.toFixed(1)}) and high population exposure ({ward.population.toLocaleString()} residents)."
        </p>

        <div className="space-y-2 pt-1">
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Thermal Stress (Hazard H):</span>
              <span className="font-bold text-red-400">42%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div className="bg-red-500 h-full rounded-full" style={{ width: '42%' }} />
            </div>
          </div>

          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Population Exposure (E):</span>
              <span className="font-bold text-amber-400">35%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '35%' }} />
            </div>
          </div>

          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Reduced Vulnerability (V):</span>
              <span className="font-bold text-orange-400">23%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div className="bg-orange-500 h-full rounded-full" style={{ width: '23%' }} />
            </div>
          </div>
        </div>

        {onOpenExplainability && (
          <button
            type="button"
            onClick={() => onOpenExplainability(ward.ward_id)}
            className="w-full mt-2 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>See Full Risk Drivers & Sensitivity</span>
          </button>
        )}
      </div>

      {/* CARD 2 — THERMAL STRESS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-bold text-xs uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-500" />
            CARD 2 — THERMAL STRESS
          </span>
          <span className="text-[10px] font-mono text-slate-400">GRID LEVEL</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center font-mono">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-sans font-semibold">HTSI HAZARD</span>
            <span className="text-xl font-bold text-slate-900">{ward.htsi.toFixed(1)}</span>
            <span className="text-[9px] text-slate-400 block">/ 100 pts</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-sans font-semibold">UTCI TEMP</span>
            <span className="text-xl font-bold text-red-600">{ward.utci.toFixed(1)}°C</span>
            <span className="text-[9px] text-slate-400 block">6th-order poly</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-sans font-semibold">OUTDOOR WBGT</span>
            <span className="text-xl font-bold text-amber-700">{ward.wbgt_outdoor.toFixed(1)}°C</span>
            <span className="text-[9px] text-slate-400 block">Liljegren mass balance</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-sans font-semibold">HEAT INDEX</span>
            <span className="text-xl font-bold text-orange-600">{ward.heat_index.toFixed(1)}°C</span>
            <span className="text-[9px] text-slate-400 block">NOAA apparent</span>
          </div>
        </div>
      </div>

      {/* CARD 3 — EXPOSURE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-bold text-xs uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-orange-500" />
            CARD 3 — EXPOSURE
          </span>
          <span className="text-[10px] font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-semibold">WORLDPOP 2020</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
            <span className="text-slate-600">Population Exposure:</span>
            <span className="font-bold text-slate-900">{ward.population.toLocaleString()} residents</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
            <span className="text-slate-600">Population Density:</span>
            <span className="font-bold text-amber-700">{ward.population_density.toLocaleString()} people/km²</span>
          </div>

          <p className="text-[10px] text-slate-500 italic">
            * Population derived from WorldPop 2020 100m grid aggregations.
          </p>
        </div>
      </div>

      {/* CARD 4 — VULNERABILITY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-bold text-xs uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            CARD 4 — VULNERABILITY
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">HWC PROXY</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
            <span className="text-slate-600">Vulnerability Score (V):</span>
            <span className="font-bold text-orange-700">{ward.vulnerability.toFixed(3)}</span>
          </div>

          <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
            <span className="text-slate-600">HWC Clinic Availability:</span>
            <span className="font-bold text-slate-900">{ward.healthcare_facilities_per_10k.toFixed(2)} / 10k pop</span>
          </div>

          <p className="text-[10px] text-slate-500 italic">
            * Represents primary clinic accessibility (GCC 140 HWC directory), not emergency ICU bed capacity.
          </p>
        </div>
      </div>

      {/* CARD 5 — FORECAST */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-bold text-xs uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            CARD 5 — 5-DAY THERMAL FORECAST
          </span>
          <span className="text-[10px] font-mono text-slate-400">XGBOOST ML</span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 overflow-x-auto text-center font-mono">
          {forecastAll.map((day, idx) => (
            <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 min-w-[55px] space-y-1">
              <div className="text-[9px] font-bold text-slate-500 uppercase">{idx === 0 ? 'TODAY' : `DAY ${idx+1}`}</div>
              <div className="text-xs font-bold text-slate-900">{day.max_htsi.toFixed(0)}</div>
              <RiskBadge level={day.risk_level} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* CARD 6 — ACTIONABLE RECOMMENDATIONS */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-amber-200">
          <span className="font-bold text-xs uppercase tracking-wide text-amber-950 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            CARD 6 — ACTIONABLE SOP RECOMMENDATIONS
          </span>
          <span className="text-[10px] font-mono text-amber-800 font-bold">MUNICIPAL SOP</span>
        </div>

        <ul className="space-y-2 text-xs text-slate-800">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Position mobile hydration units in Ward {ward.ward_id} residential centers.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Enforce mandatory labor rest intervals between 12:00 PM – 3:30 PM IST.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Open {ward.healthcare_facility_count} GCC HWC facilities for climate cooling relief.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
