'use client';

import React from 'react';
import {
  X,
  LayoutDashboard,
  MapPin,
  CalendarDays,
  FileText,
  AlertTriangle,
  BookOpen,
  Settings,
  User,
  Globe,
  Database,
  Search,
  ExternalLink
} from 'lucide-react';
import { ScreenId } from './Sidebar';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
  language: 'en' | 'ta';
  onToggleLanguage: () => void;
  userRole: string;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onNavigate,
  onOpenSettings,
  onOpenProfile,
  onOpenSearch,
  language,
  onToggleLanguage,
  userRole
}) => {
  if (!isOpen) return null;

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />
    },
    {
      id: 'map',
      label: 'Heat Map (GIS)',
      icon: <MapPin className="w-5 h-5 shrink-0" />,
      badge: '200 Wards'
    },
    {
      id: 'forecast',
      label: 'Forecast (5-Day)',
      icon: <CalendarDays className="w-5 h-5 shrink-0" />,
      badge: 'ML-XGB'
    },
    {
      id: 'alerts',
      label: 'Alerts & SOPs',
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      badge: 'Active'
    },
    {
      id: 'ward-details',
      label: 'Ward Analysis',
      icon: <FileText className="w-5 h-5 shrink-0" />
    },
    {
      id: 'methodology',
      label: 'Methodology & Science',
      icon: <BookOpen className="w-5 h-5 shrink-0" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0B1120] border-r border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090D16]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-red-500 to-purple-600 flex items-center justify-center p-1.5 shadow-md shadow-red-500/20">
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
                <span className="font-bold text-base text-white tracking-tight">
                  Heat<span className="text-red-500">Pulse</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  GCC
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Extreme Heat Early Warning</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search in Drawer */}
        <div className="p-3 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/70 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search 200 Wards...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 rounded border border-slate-700 text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Command Modules
          </div>

          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      isActive
                        ? 'bg-blue-500/20 text-blue-300 font-semibold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer User & Settings Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#090D16] space-y-2">
          {/* User profile card */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{userRole}</div>
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Authenticated Session
                </div>
              </div>
            </div>
          </button>

          {/* Settings & Language */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={onToggleLanguage}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
