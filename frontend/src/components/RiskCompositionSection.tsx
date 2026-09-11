'use client';

import React, { useState } from 'react';
import { WardRecord } from '../lib/types';
import {
  Flame,
  Users,
  ShieldAlert,
  Building2,
  Info,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface RiskCompositionSectionProps {
  ward: WardRecord;
}

export const RiskCompositionSection: React.FC<RiskCompositionSectionProps> = ({ ward }) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Calculate percentages (bounded 0-100)
  const hazardPct = Math.min(100, Math.max(0, Math.round(ward.heat_hazard * 100)));
  const exposurePct = Math.min(100, Math.max(0, Math.round(ward.exposure_density_norm * 100)));
  const vulnerabilityPct = Math.min(100, Math.max(0, Math.round(ward.vulnerability * 100)));

  return (
    <div className="space-y-6">
      {/* 1. Risk Composition Bars Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#F47C20]" />
              Risk Composition (Tri-Factor Model)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Decomposed components contributing to Ward {ward.ward_id}&apos;s overall Heat Impact Priority
            </p>
          </div>

          {/* Model Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-orange-50 text-[#F47C20] border border-orange-200 self-start sm:self-auto">
            Formula B: H × E × (0.5 + 0.5V)
          </span>
        </div>

        {/* The 3 Composition Bars */}
        <div className="space-y-4">
          {/* Bar 1: Thermal Hazard */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 tracking-wide uppercase">
                  Thermal Hazard (H)
                </span>
                <span className="text-[11px] text-slate-500">
                  • Derived from grid HTSI ({ward.htsi.toFixed(1)} / 100)
                </span>
              </div>
              <span className="font-mono font-bold text-red-600 text-sm">
                {hazardPct}%
              </span>
            </div>
            {/* Visual Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-500"
                style={{ width: `${hazardPct}%` }}
              />
            </div>
          </div>

          {/* Bar 2: Exposure */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 tracking-wide uppercase">
                  Exposure (E)
                </span>
                <span className="text-[11px] text-slate-500">
                  • Min-max normalized WorldPop 2020 density
                </span>
              </div>
              <span className="font-mono font-bold text-amber-600 text-sm">
                {exposurePct}%
              </span>
            </div>
            {/* Visual Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${exposurePct}%` }}
              />
            </div>
          </div>

          {/* Bar 3: Reduced Vulnerability */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-slate-900 tracking-wide uppercase">
                  Reduced Vulnerability (V)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold uppercase">
                  Reduced Model: 0.5×S + 0.5×(1-A)
                </span>
              </div>
              <span className="font-mono font-bold text-purple-600 text-sm">
                {vulnerabilityPct}%
              </span>
            </div>
            {/* Visual Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${vulnerabilityPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scientific Precision Label for Reduced Vulnerability */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-amber-950">Scientific Boundary Label: </strong>
            This is explicitly a <strong className="underline decoration-amber-400">Reduced Vulnerability Model</strong>, not a comprehensive socio-economic vulnerability index. It accounts for population sensitivity and primary healthcare adaptive capacity (HWC/UPHC access). Informal settlement / slum boundaries and roof material thermal emissivity are omitted due to lack of validated ward-level municipal GIS layers.
          </div>
        </div>
      </div>

      {/* 2. Vulnerability Information Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Vulnerability Information & Demographic Indicators
            </h3>
          </div>

          {/* Tooltip trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTooltip((prev) => !prev)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#F47C20]" />
              <span>Data Provenance</span>
            </button>

            {/* Tooltip popover */}
            {showTooltip && (
              <div className="absolute right-0 top-8 z-30 w-72 bg-slate-900 text-slate-100 text-xs rounded-lg p-3 shadow-xl border border-slate-700 animate-fadeIn space-y-1.5">
                <p className="font-semibold text-orange-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Scientific Credibility Notice
                </p>
                <p className="leading-relaxed text-slate-200 text-[11px]">
                  Population is a derived WorldPop 2020 estimate aggregated to current GCC 2025 wards.
                </p>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Spatial disaggregation via 100m constrained raster zonal statistics mapped to Greater Chennai Corporation ward shapefiles.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4 Cards Required by Prompt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Population Exposure */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Population Exposure
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {ward.population.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Derived resident headcount
            </p>
          </div>

          {/* Card 2: Population Density */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Population Density
              </span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {ward.population_density.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-500">/ km²</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Area: {ward.area_km2} km²
            </p>
          </div>

          {/* Card 3: Healthcare Availability */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Healthcare Availability
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {ward.healthcare_facility_count} <span className="text-sm font-sans font-normal text-slate-500">HWC facilities</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {ward.healthcare_facilities_per_10k.toFixed(2)} facilities per 10k pop
            </p>
          </div>

          {/* Card 4: Vulnerability */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">
                Vulnerability
              </span>
              <ShieldAlert className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-700 mt-1">
              {ward.vulnerability.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Normalized score [0.00 – 1.00]
            </p>
          </div>
        </div>

        {/* Scientific Credibility Callout Required by Prompt */}
        <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">
              <strong className="font-semibold text-emerald-900">Demographic Source of Truth:</strong> Population is a derived WorldPop 2020 estimate aggregated to current GCC 2025 wards.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
            Scientific Credibility
          </span>
        </div>
      </div>
    </div>
  );
};
