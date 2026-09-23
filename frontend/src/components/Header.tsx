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
  alertText?: React.ReactNode;
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
  showHotspots = false,
  alertText // kept for prop compatibility but not rendered to save space
}) => {
  const [istTime, setIstTime] = useState<string>('14:30 IST');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      setIstTime(`${new Intl.DateTimeFormat('en-GB', options).format(now)} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute instead of second to reduce visual noise
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 select-none shadow-sm">
      {/* Left section: Branding & Context */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer transition-colors"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F47C20] to-orange-600 flex items-center justify-center shadow-sm shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Heat<span className="text-[#F47C20]">Pulse</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 hidden sm:inline-block">
                GCC
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-600 tracking-wide uppercase">System Online</span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block" />

        <div className="hidden lg:flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Current Module</span>
          <span className="text-sm font-semibold text-slate-800">{activeScreenTitle}</span>
        </div>
      </div>

      {/* Right section: Tools & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group w-48 lg:w-64"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-[#F47C20] transition-colors" />
          <span className="flex-1 text-left">Search locations...</span>
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-400 shadow-xs">
            ⌘K
          </kbd>
        </button>

        <button type="button" onClick={onOpenSearch} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <Search className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{istTime}</span>
        </div>

        <button
          type="button"
          onClick={onToggleLanguage}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#F47C20] transition-colors cursor-pointer"
          title="Toggle Language"
        >
          <Globe className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#F47C20] transition-colors cursor-pointer"
          title="System Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-slate-200 hover:border-[#F47C20] hover:bg-orange-50 transition-all cursor-pointer ml-1 sm:ml-2"
        >
          <div className="w-7 h-7 rounded-full bg-[#F47C20] flex items-center justify-center text-white shadow-sm shrink-0">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden lg:inline max-w-[120px] truncate">
            {selectedRole}
          </span>
        </button>
      </div>
    </header>
  );
};
