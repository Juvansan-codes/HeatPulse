'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldAlert,
  Clock,
  Layers,
  Globe,
  Menu,
  Settings,
  User,
  Sliders
} from 'lucide-react';

interface HeaderProps {
  activeScreenTitle: string;
  onOpenSearch?: () => void;
  selectedRole?: string;
  onChangeRole?: (role: string) => void;
  language?: 'en' | 'ta';
  onToggleLanguage?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  showHotspots?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreenTitle,
  onOpenSearch,
  selectedRole = 'GCC Disaster Authority',
  onChangeRole,
  language = 'en',
  onToggleLanguage,
  onOpenMobileMenu,
  onOpenSettings,
  onOpenProfile,
  showHotspots = false
}) => {
  const [istTime, setIstTime] = useState<string>('14:30:00 IST');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as IST
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setIstTime(`${new Intl.DateTimeFormat('en-GB', options).format(now)} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left branding & title */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={`p-2 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer transition-colors ${
            showHotspots ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''
          }`}
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {/* HeatPulse Logo Treatment */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-red-500 to-purple-600 flex items-center justify-center p-1.5 shadow-md shadow-red-500/20 shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-full h-full text-white stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">
                Heat<span className="text-red-500 font-extrabold">Pulse</span>
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hidden xs:inline-block">
                GCC CHENNAI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide hidden sm:block">
              Extreme Heat Early Warning Platform
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden lg:block" />

        <div className="hidden lg:flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{activeScreenTitle}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            OPERATIONAL
          </span>
        </div>
      </div>

      {/* Center Alert Marquee / Ticker */}
      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300 max-w-lg truncate">
        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
        <span className="font-semibold text-red-200 shrink-0">STATUS:</span>
        <span className="truncate">
          37 Wards under <strong className="text-red-200">VERY HIGH</strong> risk (Royapuram,
          Tondiarpet). Max UTCI 43.6°C.
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors shadow-sm cursor-pointer ${
            showHotspots ? 'ring-2 ring-cyan-400' : ''
          }`}
          title="Search 200 Wards (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline text-xs">Search 200 Wards</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 rounded border border-slate-700 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Live IST Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{istTime}</span>
        </div>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={onToggleLanguage}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer ${
            showHotspots ? 'ring-2 ring-amber-400' : ''
          }`}
          title="Toggle English / தமிழ்"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'en' ? 'தமிழ்' : 'ENG'}</span>
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
            showHotspots ? 'ring-2 ring-cyan-400' : ''
          }`}
          title="System Preferences & Data Sources"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile button */}
        <button
          type="button"
          onClick={onOpenProfile}
          className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-colors cursor-pointer ${
            showHotspots ? 'ring-2 ring-emerald-400' : ''
          }`}
          title="Officer Profile & Jurisdiction"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-slate-200 hidden xl:inline max-w-[130px] truncate">
            {selectedRole}
          </span>
        </button>
      </div>
    </header>
  );
};
