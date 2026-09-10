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
  Database
} from 'lucide-react';

export type ScreenId = 'dashboard' | 'map' | 'forecast' | 'ward-details' | 'alerts' | 'methodology';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  collapsed,
  onToggleCollapse
}) => {
  const navItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Home Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />
    },
    {
      id: 'map',
      label: 'Heat Map (GIS)',
      icon: <MapPin className="w-4 h-4 shrink-0" />,
      badge: '200 Wards'
    },
    {
      id: 'forecast',
      label: '5-Day Forecast',
      icon: <CalendarDays className="w-4 h-4 shrink-0" />,
      badge: 'ML-XGB'
    },
    {
      id: 'ward-details',
      label: 'Ward Details',
      icon: <FileText className="w-4 h-4 shrink-0" />
    },
    {
      id: 'alerts',
      label: 'Alerts & Advisories',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      badge: 'SOPs'
    },
    {
      id: 'methodology',
      label: 'Methodology & Science',
      icon: <BookOpen className="w-4 h-4 shrink-0" />
    }
  ];

  return (
    <aside
      className={`bg-[#0B1120] border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out z-20 select-none ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Top navigation links */}
      <div className="p-3 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
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
              className={`relative w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-blue-600/12 text-blue-400 font-semibold sidebar-active-indicator'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                <span className={`transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 font-semibold'
                      : 'bg-slate-800 text-slate-500'
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
      <div className="p-3 border-t border-slate-800 space-y-3">
        {!collapsed && (
          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300 text-xs">
              <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Canonical Foundations</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Derived WorldPop 2020 (4.35M pop) aggregated to official 2025 GCC 200 wards. 140 HWC health proxy.
            </p>
            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
              <span>15 Zones • 5 ERA5 Grids</span>
              <span className="text-emerald-400 font-semibold">QC PASSED</span>
            </div>
          </div>
        )}

        {/* Version badge */}
        {!collapsed && (
          <div className="text-center text-[10px] font-mono text-slate-600">
            HeatPulse v1.0 • SIH 2024
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer text-xs gap-2"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
