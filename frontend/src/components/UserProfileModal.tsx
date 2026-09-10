'use client';

import React from 'react';
import {
  X,
  User,
  Shield,
  MapPin,
  Building2,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ExternalLink,
  Radio
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: string;
  onChangeRole?: (role: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  selectedRole,
  onChangeRole
}) => {
  if (!isOpen) return null;

  const roleProfiles: Record<
    string,
    {
      name: string;
      designation: string;
      jurisdiction: string;
      id: string;
      clearance: string;
      phone: string;
      office: string;
    }
  > = {
    'GCC Disaster Authority': {
      name: 'Dr. J. Radhakrishnan, IAS',
      designation: 'Special Officer & Disaster Management Lead',
      jurisdiction: 'Greater Chennai Corporation (All 15 Zones, 200 Wards)',
      id: 'GCC-DM-001',
      clearance: 'Tier 5 Executive Override (All Directives)',
      phone: '044-2538 4520 (Ripon Control Room)',
      office: 'Disaster Control Center, Ripon Building, Chennai'
    },
    'Public Health Director': {
      name: 'Dr. M. Jagadeesan, MD',
      designation: 'City Health Officer & Epidemiologist',
      jurisdiction: '140 Health & Wellness Centers, 200 Wards',
      id: 'GCC-PHD-042',
      clearance: 'Clinical Advisory & ORS Dispatch Clearance',
      phone: '044-2561 9200 (Public Health Desk)',
      office: 'Public Health Department, Ripon Building'
    },
    'Zonal Officer (Zones 1-15)': {
      name: 'Thiru. S. Venkatesan',
      designation: 'Zonal Officer — Zone 5 (Royapuram)',
      jurisdiction: 'Wards 49 to 63 (High Vulnerability Sector)',
      id: 'GCC-ZO-005',
      clearance: 'Local Shelter Activation & Labor Moratorium',
      phone: '044-2595 1234 (Royapuram Zonal Office)',
      office: 'Zonal Office V, Old Washermanpet, Chennai'
    },
    'Emergency Medical Services': {
      name: 'Dr. P. Sharmila',
      designation: '108 Ambulance Dispatch Coordinator',
      jurisdiction: 'Chennai Metro Fleet (124 Ambulances)',
      id: 'TN-EMS-108',
      clearance: 'Heat Stroke Hospital Triage & Pre-hospital Care',
      phone: '108 / 044-2836 4900 (State Operations Center)',
      office: '108 EMRI Central Command, DMS Compound, Teynampet'
    }
  };

  const currentProfile =
    roleProfiles[selectedRole] || roleProfiles['GCC Disaster Authority'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0D1527] border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header with Avatar */}
        <div className="p-6 bg-gradient-to-b from-[#131D31] to-[#0D1527] border-b border-slate-800 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white relative">
              <User className="w-7 h-7" />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0D1527]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {currentProfile.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-xs text-blue-400 font-medium mt-0.5">
                {currentProfile.designation}
              </p>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Badge: <span className="text-slate-300 font-semibold">{currentProfile.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Quick Role Switcher */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              Switch Operational Role Simulation
            </label>
            <select
              value={selectedRole}
              onChange={(e) => onChangeRole?.(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="GCC Disaster Authority">GCC Disaster Authority (Executive Lead)</option>
              <option value="Public Health Director">Public Health Director (Epidemiologist)</option>
              <option value="Zonal Officer (Zones 1-15)">Zonal Officer (Zone 5 Royapuram)</option>
              <option value="Emergency Medical Services">Emergency Medical Services (108 Dispatch)</option>
            </select>
          </div>

          {/* Officer Details Grid */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400 text-[11px]">Command Jurisdiction</div>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {currentProfile.jurisdiction}
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400 text-[11px]">SOP Directive Clearance</div>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {currentProfile.clearance}
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="flex items-start gap-3">
              <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400 text-[11px]">Official Hotline & Duty Desk</div>
                <div className="text-slate-200 font-mono font-medium mt-0.5">
                  {currentProfile.phone}
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-400 text-[11px]">Physical Headquarters</div>
                <div className="text-slate-200 mt-0.5">{currentProfile.office}</div>
              </div>
            </div>
          </div>

          {/* Active Session telemetry */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Session: Active (TLS 1.3)</span>
            </div>
            <span>IP: GCC-INTRA-10.4.20.1</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0B1120] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
