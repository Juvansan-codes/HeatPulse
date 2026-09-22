'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  Brain,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';
import { WARDS_DATA } from '../lib/data';
import { WardRecord } from '../lib/types';
import { getMockExplanationContract } from '../lib/explainability';
import { ExplanationContract } from '../lib/types';
import { RiskBadge } from './RiskBadge';

interface WardExplainabilityPanelProps {
  wardId: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectWard?: (wardId: number) => void;
}

export const WardExplainabilityPanel: React.FC<WardExplainabilityPanelProps> = ({
  wardId,
  isOpen,
  onClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const ward: WardRecord | undefined = useMemo(
    () => WARDS_DATA.find((w) => w.ward_id === wardId),
    [wardId]
  );

  // Directly fetch the backend contract mock fixture
  const explanation: ExplanationContract | null = useMemo(
    () => (ward ? getMockExplanationContract(ward.ward_id) : null),
    [ward]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [wardId]);

  if (!isOpen) return null;

  if (!ward || !explanation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-backdropIn">
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 max-w-md mx-4 text-center animate-modalIn">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-900 mb-2">Explanation Unavailable</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Explanation unavailable for this ward because insufficient data is currently available.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-backdropIn">
      <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        className="relative w-full max-w-[520px] bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto explainability-panel-enter"
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-[#F47C20] border border-orange-200">
                  WARD {ward.ward_id}
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  Zone {ward.zone_id} • {ward.zone_name}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
                Risk Explanation: {ward.ward_name}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RiskBadge level={ward.risk_level} size="lg" />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5">
          <section className="explainability-section">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Summary</h3>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm leading-relaxed text-blue-900">
                {explanation.summary}
              </p>
            </div>
          </section>

          <section className="explainability-section">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Risk Core Components</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Risk (HHR)', value: explanation.risk, color: 'text-red-600' },
                { label: 'Hazard (H)', value: explanation.heat_hazard, color: 'text-orange-600' },
                { label: 'Exposure (E)', value: explanation.exposure, color: 'text-amber-600' },
                { label: 'Vulnerability (V)', value: explanation.vulnerability, color: 'text-purple-600' },
              ].map((m) => (
                <div key={m.label} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{m.label}</div>
                  <div className={`font-mono text-sm font-bold ${m.color} tabular-nums mt-0.5`}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
