'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Smartphone,
  Monitor,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Sliders,
  Play,
  Layers,
  HelpCircle,
  Minimize2
} from 'lucide-react';
import { ScreenId } from './Sidebar';

export type ViewportMode = 'responsive' | 'desktop' | 'mobile';

interface PrototypeControllerProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  viewportMode: ViewportMode;
  onChangeViewportMode: (mode: ViewportMode) => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const PrototypeController: React.FC<PrototypeControllerProps> = ({
  currentScreen,
  onNavigate,
  viewportMode,
  onChangeViewportMode,
  showHotspots,
  onToggleHotspots,
  onOpenSettings,
  onOpenProfile
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const prototypeFlows: {
    id: ScreenId | 'settings' | 'profile';
    title: string;
    description: string;
  }[] = [
    {
      id: 'dashboard',
      title: '1. Executive Dashboard',
      description: 'Situational KPIs & Top 10 Critical Wards'
    },
    {
      id: 'map',
      title: '2. Large GIS Heat Map',
      description: '200 Wards, 15 Zones & 5 ERA5 Land Cells'
    },
    {
      id: 'forecast',
      title: '3. 5-Day Thermal Forecast',
      description: 'Diurnal Trajectory & Nocturnal Trap Load'
    },
    {
      id: 'ward-details',
      title: '4. Ward Analysis Dossier',
      description: 'Ward 114 Formula B Mathematical Breakdown'
    },
    {
      id: 'alerts',
      title: '5. Public Health Alerts & SOPs',
      description: 'GCC SOP Matrix & Bilingual Press Releases'
    },
    {
      id: 'methodology',
      title: '6. Methodology & Science',
      description: 'HTSI Weights & XGBoost Calibration Audit'
    }
  ];

  const currentFlowIndex = prototypeFlows.findIndex((f) => f.id === currentScreen);

  const handleNextFlow = () => {
    const nextIndex = (currentFlowIndex + 1) % prototypeFlows.length;
    const target = prototypeFlows[nextIndex];
    if (target.id === 'settings') {
      onOpenSettings();
    } else if (target.id === 'profile') {
      onOpenProfile();
    } else {
      onNavigate(target.id as ScreenId);
    }
  };

  const handlePrevFlow = () => {
    const prevIndex = (currentFlowIndex - 1 + prototypeFlows.length) % prototypeFlows.length;
    const target = prototypeFlows[prevIndex];
    if (target.id === 'settings') {
      onOpenSettings();
    } else if (target.id === 'profile') {
      onOpenProfile();
    } else {
      onNavigate(target.id as ScreenId);
    }
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-[#F47C20] shadow-lg backdrop-blur hover:bg-orange-50 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Prototype Tour Controls</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[94%] pointer-events-auto animate-in slide-in-from-bottom-3 duration-200">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Prototype Flow Controller */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-xs font-semibold text-[#F47C20]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Prototype Flow:</span>
            <span className="text-slate-900">
              {currentFlowIndex >= 0 ? prototypeFlows[currentFlowIndex].title : 'Custom'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevFlow}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title="Previous Screen Flow"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextFlow}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title="Next Screen Flow"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onChangeViewportMode('responsive')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewportMode === 'responsive'
                ? 'bg-[#F47C20] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Fluid Responsive Mode"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden md:inline">Fluid</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewportMode('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewportMode === 'desktop'
                ? 'bg-[#F47C20] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Simulate Large Desktop GIS Workspace (1440px)"
          >
            <Monitor className="w-3 h-3" />
            <span>Desktop GIS</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewportMode('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewportMode === 'mobile'
                ? 'bg-[#F47C20] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Simulate Mobile Device Frame (390px iPhone)"
          >
            <Smartphone className="w-3 h-3" />
            <span>Mobile Phone</span>
          </button>
        </div>

        {/* Right: Interactive Hotspots & Minimize */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleHotspots}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              showHotspots
                ? 'bg-amber-50 border-amber-200 text-amber-800 font-semibold'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Highlight Clickable Figma Prototype Hotspots"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hotspots</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Minimize Prototype Toolbar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
