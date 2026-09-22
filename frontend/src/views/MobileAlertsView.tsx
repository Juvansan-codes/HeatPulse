'use client';

import React, { useState } from 'react';
import { WARDS_DATA } from '../lib/data';
import { WardRecord } from '../lib/types';
import { RiskBadge } from '../components/RiskBadge';
import { MobileAlertDetailModal } from '../components/MobileAlertDetailModal';
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Bell
} from 'lucide-react';

interface MobileAlertsViewProps {
  onSelectWardDetails: (wardId: number) => void;
  onOpenExplainability?: (wardId: number) => void;
}

export const MobileAlertsView: React.FC<MobileAlertsViewProps> = ({
  onSelectWardDetails,
  onOpenExplainability
}) => {
  const [selectedWardForModal, setSelectedWardForModal] = useState<WardRecord | null>(null);

  // Filter high/very high/extreme risk wards for alerts
  const alertWards = WARDS_DATA.filter(
    (w) => w.risk_level === 'Extreme' || w.risk_level === 'Very High' || w.risk_level === 'High'
  ).sort((a, b) => b.human_heat_risk - a.human_heat_risk);

  return (
    <div className="space-y-4 pb-20 animate-fadeIn text-slate-900">
      {/* Mobile Alerts Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-red-500" />
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Heat Alerts & Advisories
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {alertWards.length} Active Ward Advisories Across GCC
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
          LIVE SOP
        </span>
      </div>

      {/* ALERT CARDS LIST */}
      {alertWards.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">You&apos;re all clear.</h3>
          <p className="text-xs text-slate-500">No active heat alerts are currently available for GCC wards.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertWards.map((ward) => (
            <div
              key={ward.ward_id}
              onClick={() => setSelectedWardForModal(ward)}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-[#F47C20] border border-orange-200">
                      WARD {ward.ward_id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{ward.zone_name}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {ward.ward_name}
                  </h3>
                </div>

                <RiskBadge level={ward.risk_level} size="md" />
              </div>

              {/* Alert Summary */}
              <p className="text-xs text-slate-700 leading-relaxed">
                Severe thermal stress expected during afternoon hours. HTSI score is <strong>{ward.htsi.toFixed(1)}/100</strong> with peak UTCI at <strong>{ward.utci.toFixed(1)}°C</strong>.
              </p>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                  <Clock className="w-3 h-3 text-[#F47C20]" />
                  <span>Today • 12:00 PM</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWardForModal(ward);
                  }}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALERT DETAIL MODAL */}
      {selectedWardForModal && (
        <MobileAlertDetailModal
          isOpen={Boolean(selectedWardForModal)}
          onClose={() => setSelectedWardForModal(null)}
          ward={selectedWardForModal}
          onSelectWardDetails={onSelectWardDetails}
          onOpenExplainability={onOpenExplainability}
        />
      )}
    </div>
  );
};
