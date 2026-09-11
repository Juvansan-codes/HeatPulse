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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F47C20] to-orange-600 flex items-center justify-center p-1.5 shadow-xs">
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
                <span className="font-bold text-base text-slate-900 tracking-tight">
                  Heat<span className="text-[#F47C20]">Pulse</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-50 text-[#F47C20] border border-orange-200 font-semibold">
                  GCC
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Extreme Heat Early Warning</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search in Drawer */}
        <div className="p-3 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search 200 Wards...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    ? 'bg-orange-50 text-[#F47C20] border border-orange-200 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#F47C20]' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      isActive
                        ? 'bg-orange-100 text-[#F47C20] font-semibold'
                        : 'bg-slate-100 text-slate-500'
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
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          {/* User profile card */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-[#F47C20]">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-900 truncate">{userRole}</div>
                <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={onToggleLanguage}
              className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#F47C20]" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
