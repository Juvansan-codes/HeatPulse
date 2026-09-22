'use client';

import React from 'react';
import {
  Home,
  MapPin,
  CalendarDays,
  AlertTriangle,
  Menu,
  Sparkles
} from 'lucide-react';
import { ScreenId } from './Sidebar';

interface MobileBottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenMore: () => void;
  isMoreOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigate,
  onOpenMore,
  isMoreOpen = false
}) => {
  const tabs = [
    {
      id: 'dashboard' as ScreenId,
      label: 'HOME',
      icon: <Home className="w-5 h-5" />
    },
    {
      id: 'map' as ScreenId,
      label: 'MAP',
      icon: <MapPin className="w-5 h-5" />,
      badge: '200'
    },
    {
      id: 'forecast' as ScreenId,
      label: 'FORECAST',
      icon: <CalendarDays className="w-5 h-5" />
    },
    {
      id: 'alerts' as ScreenId,
      label: 'ALERTS',
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: 'SOP'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden shadow-lg select-none pb-safe">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id && !isMoreOpen;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
                isActive ? 'text-[#F47C20] font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-[#F47C20] text-white text-[8px] font-mono font-bold leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono tracking-wider mt-0.5 font-semibold">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#F47C20] rounded-full" />
              )}
            </button>
          );
        })}

        {/* MORE / MENU Tab */}
        <button
          type="button"
          onClick={onOpenMore}
          className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
            isMoreOpen ? 'text-[#F47C20] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-mono tracking-wider mt-0.5 font-semibold">
            MORE
          </span>
          {isMoreOpen && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-[#F47C20] rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
};
