'use client';

import React, { useState } from 'react';
import { CHENNAI_ZONES } from '../lib/data';
import { WardRecord, SeverityLevel } from '../lib/types';
import { RiskBadge } from '../components/RiskBadge';
import { MobileWardSheet } from '../components/MobileWardSheet';
import {
  Search,
  MapPin,
  Layers,
  X,
  Navigation,
  Sparkles
} from 'lucide-react';

interface MobileMapViewProps {
  onSelectWardDetails: (wardId: number) => void;
  onOpenExplainability?: (wardId: number) => void;
  wards: WardRecord[];
}

export const MobileMapView: React.FC<MobileMapViewProps> = ({
  onSelectWardDetails,
  onOpenExplainability,
  wards
}) => {
  const [selectedLayer, setSelectedLayer] = useState<'risk' | 'htsi' | 'utci' | 'exposure'>('risk');
  const [selectedZone, setSelectedZone] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<WardRecord | null>(wards[0] || null);

  // Filtered wards
  const filteredWards = wards.filter((ward) => {
    if (selectedZone !== 'all' && ward.zone_id !== selectedZone) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ward.ward_name.toLowerCase().includes(q);
      const matchId = ward.ward_id.toString().includes(q);
      const matchZone = ward.zone_name.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchZone) return false;
    }
    return true;
  });

  return (
    <div className="relative h-[calc(100vh-7.5rem)] flex flex-col bg-slate-50 animate-fadeIn overflow-hidden">
      {/* Top Mobile Search & Layer Bar */}
      <div className="p-3 bg-white border-b border-slate-200 shadow-2xs space-y-2 z-20 shrink-0">
        <div className="flex items-center gap-2">
          {/* Ward Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Ward (1-200)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-[#F47C20]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Zone Dropdown */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-2 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All 15 Zones</option>
            {CHENNAI_ZONES.map((z) => (
              <option key={z.zone_id} value={z.zone_id}>
                Z{z.zone_id}: {z.zone_name.split(' ')[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Metric Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              ['risk', 'Formula B Risk'],
              ['htsi', 'HTSI Hazard'],
              ['utci', 'UTCI (°C)'],
              ['exposure', 'Exposure']
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedLayer(key)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                selectedLayer === key
                  ? 'bg-[#F47C20] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Polygon Matrix */}
      <div className="flex-1 relative p-3 overflow-y-auto bg-slate-100 pb-48">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium px-1">
          <span>Showing {filteredWards.length} GCC Wards</span>
          <span className="font-mono text-[10px] text-[#F47C20] font-bold">Tap ward to inspect</span>
        </div>

        {/* 2-Column Mobile Ward Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredWards.map((w) => {
            const isSelected = selectedWard?.ward_id === w.ward_id;

            let badgeColor = '#10b981';
            if (w.risk_level === 'Moderate') badgeColor = '#f59e0b';
            if (w.risk_level === 'High') badgeColor = '#f97316';
            if (w.risk_level === 'Very High') badgeColor = '#ef4444';
            if (w.risk_level === 'Extreme') badgeColor = '#7c3aed';

            let metricVal = w.human_heat_risk.toFixed(3);
            let metricUnit = '';
            if (selectedLayer === 'htsi') {
              metricVal = w.htsi.toFixed(1);
              metricUnit = 'pts';
            } else if (selectedLayer === 'utci') {
              metricVal = w.utci.toFixed(1);
              metricUnit = '°C';
            } else if (selectedLayer === 'exposure') {
              metricVal = (w.population_density / 1000).toFixed(1);
              metricUnit = 'k/km²';
            }

            return (
              <button
                key={w.ward_id}
                type="button"
                onClick={() => setSelectedWard(w)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-[#F47C20] ring-2 ring-[#F47C20]/40 bg-orange-50/60'
                    : 'bg-white border-slate-200 active:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    W{w.ward_id}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: badgeColor }}
                  />
                </div>

                <div className="text-xs font-bold text-slate-900 truncate w-full">
                  {w.ward_name}
                </div>
                <div className="text-[10px] text-slate-500 truncate w-full mb-2">
                  {w.zone_name}
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-baseline justify-between w-full font-mono text-[11px]">
                  <span className="text-[9px] uppercase text-slate-400 font-semibold">{selectedLayer}</span>
                  <span className="font-bold text-slate-900">{metricVal} {metricUnit}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Draggable Bottom Sheet */}
      <MobileWardSheet
        ward={selectedWard}
        onClose={() => setSelectedWard(null)}
        onSelectWardDetails={onSelectWardDetails}
        onOpenExplainability={onOpenExplainability}
      />
    </div>
  );
};
