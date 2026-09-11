'use client';

import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  CalendarDays,
  FileText,
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export type ScreenId = 'dashboard' | 'map' | 'forecast' | 'ward-details' | 'alerts' | 'methodology';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  showHotspots?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  collapsed,
  onToggleCollapse,
  showHotspots = false
}) => {
  const navItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />
    },
    {
      id: 'map',
      label: 'Heat Map',
      icon: <MapPin className="w-4 h-4 shrink-0" />,
      badge: '200 Wards'
    },
    {
      id: 'forecast',
      label: 'Forecast',
      icon: <CalendarDays className="w-4 h-4 shrink-0" />,
      badge: '5-Day ML'
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      badge: 'Active SOPs'
    },
    {
      id: 'ward-details',
      label: 'Ward Analysis',
      icon: <FileText className="w-4 h-4 shrink-0" />,
      badge: 'Formula B'
    },
    {
      id: 'methodology',
      label: 'Methodology',
      icon: <BookOpen className="w-4 h-4 shrink-0" />
    }
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-20 select-none ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Top navigation links */}
      <div className="p-3 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Command Modules
          </div>
        )}
        {collapsed && <div className="h-8" />}

        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative w-full flex items-center ${
                collapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-orange-50 text-[#F47C20] border border-orange-200 shadow-xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${showHotspots && !isActive ? 'hover:ring-1 hover:ring-orange-400' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                <span
                  className={`transition-colors ${
                    isActive ? 'text-[#F47C20]' : 'text-slate-500 group-hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
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

      {/* Bottom system provenance and collapse toggle */}
      <div className="p-3 border-t border-slate-200 space-y-3">
        {!collapsed && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
              <Database className="w-3.5 h-3.5 text-[#F47C20] shrink-0" />
              <span>Canonical Foundations</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Derived WorldPop 2020 (4.35M pop) aggregated to official 2025 GCC 200 wards. 140 HWC health proxy.
            </p>
            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
              <span>15 Zones • 5 ERA5 Grids</span>
              <span className="text-emerald-700 font-semibold">QC PASSED</span>
            </div>
          </div>
        )}

        {/* Version badge */}
        {!collapsed && (
          <div className="text-center text-[10px] font-mono text-slate-400">
            HeatPulse v1.2.0 • GCC Chennai
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer text-xs gap-2"
          title={collapsed ? 'Expand sidebar (256px)' : 'Collapse sidebar (72px)'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
