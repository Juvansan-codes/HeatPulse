'use client';

import React from 'react';
import { WardRecord } from '../lib/types';
import { RiskBadge } from './RiskBadge';
import {
  X,
  AlertTriangle,
  Clock,
  MapPin,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface MobileAlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ward: WardRecord;
  onSelectWardDetails: (wardId: number) => void;
  onOpenExplainability?: (wardId: number) => void;
}

export const MobileAlertDetailModal: React.FC<MobileAlertDetailModalProps> = ({
  isOpen,
  onClose,
  ward,
  onSelectWardDetails,
  onOpenExplainability
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  Heat Advisory Detail
                </span>
                <RiskBadge level={ward.risk_level} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500">Official Municipal Action Protocol</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Ward & Risk Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                WARD {ward.ward_id}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Today • 12:00 PM IST</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white leading-snug">
              {ward.ward_name} ({ward.zone_name})
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">HTSI</span>
                <span className="text-base font-bold text-white">{ward.htsi.toFixed(1)}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">UTCI</span>
                <span className="text-base font-bold text-amber-400">{ward.utci.toFixed(1)}°C</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">WBGT</span>
                <span className="text-base font-bold text-orange-400">{ward.wbgt_outdoor.toFixed(1)}°C</span>
              </div>
            </div>
          </div>

          {/* WHY THIS ALERT? */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
            <span className="font-bold text-amber-950 text-xs uppercase tracking-wider block flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              Why Was This Alert Triggered?
            </span>
            <p className="text-slate-800 text-xs leading-relaxed">
              Elevated thermal stress (HTSI {ward.htsi.toFixed(1)}, peak UTCI {ward.utci.toFixed(1)}°C) combined with high population exposure ({ward.population.toLocaleString()} residents) has increased operational heat risk to <strong className="text-red-700">{ward.risk_level.toUpperCase()}</strong> status in Ward {ward.ward_id}.
            </p>
          </div>

          {/* WHAT TO DO (ACTIONABLE NON-MEDICAL SOPS) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Recommended Municipal & Public Actions
            </span>

            <ul className="space-y-2 text-slate-700 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Ensure Hydration Stations:</strong> Position mobile drinking water tankers near high-density residential zones in Ward {ward.ward_id}.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Enforce Labor Advisory:</strong> Restrict heavy outdoor construction work between 12:00 PM and 3:30 PM IST.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Cooling Shelter Activation:</strong> Open local GCC Health and Wellness Centres ({ward.healthcare_facility_count} active facilities) for climate relief.</span>
              </li>
            </ul>
          </div>

          {/* Timestamp & Non-Medical Disclaimer */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-[10px] text-slate-500 space-y-1">
            <div className="flex justify-between font-mono">
              <span>Data Timestamp: 2026-09-21 12:00 IST</span>
              <span>Model: XGBoost Calibrated</span>
            </div>
            <p className="text-slate-600 italic">
              Disclaimer: Operational safety recommendations support decision-making and do not constitute direct individual medical advice.
            </p>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2 shrink-0">
          {onOpenExplainability && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenExplainability(ward.ward_id);
              }}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Why This Ward?</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectWardDetails(ward.ward_id);
            }}
            className="flex-1 py-2.5 bg-[#F47C20] hover:bg-[#e06c15] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>View Ward Dossier</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
