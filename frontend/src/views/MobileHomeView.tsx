'use client';

import React, { useMemo } from 'react';
import { WARDS_DATA, FORECAST_TODAY } from '../lib/data';
import { RiskBadge } from '../components/RiskBadge';
import { SeverityLevel, WardRecord } from '../lib/types';
import {
  Flame,
  Thermometer,
  MapPin,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Activity,
  Users,
  Shield,
  Sparkles
} from 'lucide-react';

interface MobileHomeViewProps {
  onNavigateToMap: () => void;
  onNavigateToForecast: () => void;
  onNavigateToAlerts: () => void;
  onSelectWard: (wardId: number) => void;
  onOpenExplainability?: (wardId: number) => void;
  onOpenAlertDetail?: (ward: WardRecord) => void;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  onNavigateToMap,
  onNavigateToForecast,
  onNavigateToAlerts,
  onSelectWard,
  onOpenExplainability,
  onOpenAlertDetail
}) => {
  // Compute city-level metrics dynamically
  const cityMetrics = useMemo(() => {
    const sorted = [...WARDS_DATA].sort((a, b) => b.human_heat_risk - a.human_heat_risk);
    const topWard = sorted[0];

    const severityRank: Record<SeverityLevel, number> = {
      Normal: 1, Moderate: 2, High: 3, 'Very High': 4, Extreme: 5
    };
    const cityRiskLevel = WARDS_DATA.reduce<SeverityLevel>(
      (max, w) => (severityRank[w.risk_level] > severityRank[max] ? w.risk_level : max),
      'Normal'
    );

    const maxHtsi = Math.max(...WARDS_DATA.map((w) => w.htsi));
    const maxUtci = Math.max(...WARDS_DATA.map((w) => w.utci));
    const highPlusCount = WARDS_DATA.filter(
      (w) => w.risk_level === 'High' || w.risk_level === 'Very High' || w.risk_level === 'Extreme'
    ).length;

    return { cityRiskLevel, topWard, maxHtsi, maxUtci, highPlusCount };
  }, []);

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Top Header & Location Context */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Heat<span className="text-[#F47C20]">Pulse</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-50 text-[#F47C20] border border-orange-200 font-bold">
              MOBILE
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
            <MapPin className="w-3 h-3 text-[#F47C20]" />
            <span>Chennai (200 Wards) • Today</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
          <Clock className="w-3 h-3 text-[#F47C20]" />
          <span>12:00 IST</span>
        </div>
      </div>

      {/* LARGE CURRENT RISK CARD */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#F47C20]" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
              CURRENT CITY RISK LEVEL
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {cityMetrics.cityRiskLevel.toUpperCase()}
              </span>
              <RiskBadge level={cityMetrics.cityRiskLevel} size="md" />
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ Increasing</span>
          </div>
        </div>

        {/* Dynamic Risk Values */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">MAX HTSI HAZARD</span>
            <span className="text-xl font-bold text-white tabular-nums">
              {cityMetrics.maxHtsi.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">PEAK UTCI STRESS</span>
            <span className="text-xl font-bold text-amber-400 tabular-nums">
              {cityMetrics.maxUtci.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Status Line & Timestamp */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
          <span>{cityMetrics.highPlusCount} wards at High+ risk</span>
          <span className="text-emerald-400 font-mono text-[10px]">Updated 12 mins ago</span>
        </div>
      </div>

      {/* LARGE PRIMARY CTA: VIEW HEAT MAP */}
      <button
        type="button"
        onClick={onNavigateToMap}
        className="w-full py-3.5 px-4 bg-[#F47C20] hover:bg-[#e06c15] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg active:scale-[0.98]"
      >
        <MapPin className="w-4 h-4" />
        <span>View Interactive Heat Map (200 Wards)</span>
        <ArrowUpRight className="w-4 h-4" />
      </button>

      {/* TODAY'S ALERT CARD */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            Today&apos;s Heat Advisory
          </span>
          <span className="text-[10px] font-mono text-amber-800 font-bold px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300">
            ACTIVE
          </span>
        </div>

        <p className="text-xs text-slate-800 leading-relaxed font-sans">
          Extreme heat conditions expected in <strong>{cityMetrics.topWard.zone_name}</strong> wards during afternoon hours (12:00–15:30 IST). Peak thermal stress forecast at <strong>{cityMetrics.maxUtci.toFixed(1)}°C UTCI</strong>.
        </p>

        <div className="pt-1 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-mono">Ward {cityMetrics.topWard.ward_id} • {cityMetrics.topWard.ward_name}</span>
          <button
            type="button"
            onClick={() => onOpenAlertDetail ? onOpenAlertDetail(cityMetrics.topWard) : onNavigateToAlerts()}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* QUICK INSIGHTS HORIZONTAL STRIP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wide px-1">
          <span>Quick Insights</span>
          <span className="text-[10px] text-slate-400 font-mono font-normal">Horizontal Swipe</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          <button
            type="button"
            onClick={() => onSelectWard(cityMetrics.topWard.ward_id)}
            className="min-w-[180px] p-3 rounded-xl bg-white border border-slate-200 text-left snap-start space-y-1 shadow-2xs hover:border-[#F47C20] cursor-pointer"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold">
              <span>THERMAL STRESS</span>
              <Activity className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              HTSI {cityMetrics.maxHtsi.toFixed(0)}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              Highest in Ward {cityMetrics.topWard.ward_id}
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToMap}
            className="min-w-[180px] p-3 rounded-xl bg-white border border-slate-200 text-left snap-start space-y-1 shadow-2xs hover:border-[#F47C20] cursor-pointer"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold">
              <span>POPULATION EXPOSURE</span>
              <Users className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              High Density
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {cityMetrics.highPlusCount} Wards High+
            </div>
          </button>

          <button
            type="button"
            onClick={onNavigateToForecast}
            className="min-w-[180px] p-3 rounded-xl bg-white border border-slate-200 text-left snap-start space-y-1 shadow-2xs hover:border-[#F47C20] cursor-pointer"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold">
              <span>5-DAY FORECAST</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-lg font-bold font-mono text-[#F47C20]">
              ↑ Rising Heat
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              Peak on Day 2
            </div>
          </button>
        </div>
      </div>

      {/* TOP CRITICAL WARDS LIST QUICK LINK */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
            Top High Risk Wards
          </span>
          <button
            type="button"
            onClick={onNavigateToMap}
            className="text-[11px] text-[#F47C20] font-bold flex items-center gap-0.5"
          >
            See All 200 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {WARDS_DATA.slice(0, 4).map((ward) => (
            <div
              key={ward.ward_id}
              onClick={() => onSelectWard(ward.ward_id)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-[#F47C20] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  W{ward.ward_id}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">{ward.ward_name}</div>
                  <div className="text-[10px] text-slate-500">{ward.zone_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-slate-900">{ward.htsi.toFixed(1)}</div>
                  <div className="text-[9px] text-slate-400">HTSI</div>
                </div>
                <RiskBadge level={ward.risk_level} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
