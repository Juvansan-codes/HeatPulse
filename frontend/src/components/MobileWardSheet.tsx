'use client';

import React, { useState } from 'react';
import { WardRecord } from '../lib/types';
import { RiskBadge } from './RiskBadge';
import {
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  Sparkles,
  MapPin,
  Users,
  Activity,
  Shield
} from 'lucide-react';

interface MobileWardSheetProps {
  ward: WardRecord | null;
  onClose: () => void;
  onSelectWardDetails: (wardId: number) => void;
  onOpenExplainability?: (wardId: number) => void;
}

export const MobileWardSheet: React.FC<MobileWardSheetProps> = ({
  ward,
  onClose,
  onSelectWardDetails,
  onOpenExplainability
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!ward) return null;

  return (
    <div className="fixed inset-x-0 bottom-14 z-30 pointer-events-auto transition-all duration-300 ease-out animate-in slide-in-from-bottom duration-200">
      <div className="mx-auto max-w-md bg-white border-t border-x border-slate-200 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Drag Handle Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 bg-slate-100 border-b border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
        >
          <div className="w-12 h-1 bg-slate-300 rounded-full mb-1" />
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
            <span>{isExpanded ? 'Collapse Sheet' : 'Tap or Drag to Expand'}</span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </div>
        </div>

        {/* Ward Header */}
        <div className="p-4 bg-white space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-[#F47C20] border border-orange-200">
                  WARD {ward.ward_id}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Zone {ward.zone_id} • {ward.zone_name}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {ward.ward_name}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <RiskBadge level={ward.risk_level} size="md" />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">HTSI SCORE</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {ward.htsi.toFixed(1)} <span className="text-[10px] text-slate-400">/100</span>
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">UTCI TEMP</span>
              <span className="text-sm font-bold text-amber-700 tabular-nums">
                {ward.utci.toFixed(1)}°C
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">HUMAN RISK</span>
              <span className="text-sm font-bold text-red-600 tabular-nums">
                {ward.human_heat_risk.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Key Drivers Bullet List */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
            <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider block">
              Primary Risk Drivers:
            </span>
            <ul className="space-y-1 text-slate-700 text-[11px]">
              <li className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Thermal Stress: HTSI {ward.htsi.toFixed(1)} (UTCI {ward.utci}°C)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Population Exposure: {ward.population.toLocaleString()} residents ({ward.population_density.toLocaleString()}/km²)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>Adaptive Capacity: {ward.healthcare_facility_count} HWC clinics ({ward.healthcare_facilities_per_10k.toFixed(1)}/10k)</span>
              </li>
            </ul>
          </div>

          {/* Expanded Content (when toggled) */}
          {isExpanded && (
            <div className="space-y-3 pt-2 border-t border-slate-200 text-xs animate-fadeIn">
              <div className="p-2.5 rounded-lg bg-slate-900 text-white space-y-1">
                <span className="font-mono text-amber-400 font-bold text-[10px] block">FORMULA B BREAKDOWN</span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  Risk = H ({ward.heat_hazard.toFixed(3)}) × E ({ward.exposure_density_norm.toFixed(3)}) × (0.5 + 0.5V [{ward.vulnerability.toFixed(3)}]) = <strong className="text-amber-400">{ward.human_heat_risk.toFixed(3)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onOpenExplainability && (
              <button
                type="button"
                onClick={() => onOpenExplainability(ward.ward_id)}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Why This Ward?</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectWardDetails(ward.ward_id)}
              className={`py-2.5 px-3 bg-[#F47C20] hover:bg-[#e06c15] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                !onOpenExplainability ? 'col-span-2' : ''
              }`}
            >
              <span>View Ward Details</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
