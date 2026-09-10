'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar, ScreenId } from '../components/Sidebar';
import { HomeDashboardView } from '../views/HomeDashboardView';
import { HeatMapView } from '../views/HeatMapView';
import { ForecastView } from '../views/ForecastView';
import { WardDetailsView } from '../views/WardDetailsView';
import { AlertsView } from '../views/AlertsView';
import { MethodologyView } from '../views/MethodologyView';
import { WARDS_DATA, CHENNAI_ZONES } from '../lib/data';
import { Search, X, MapPin, Building, ArrowRight } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [selectedWardId, setSelectedWardId] = useState<number>(114);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('GCC Disaster Authority');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');

  // Keyboard shortcut for Cmd+K / Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const screenTitles: Record<ScreenId, string> = {
    dashboard: 'Executive Command Dashboard',
    map: 'Spatial Heat Impact GIS Map (200 Wards)',
    forecast: '5-Day Calibrated Thermal Forecast',
    'ward-details': 'Ward Intelligence Dossier',
    alerts: 'Public Health Action Matrix & Advisories',
    methodology: 'Scientific Methodology & Architecture'
  };

  const handleSelectWard = (wardId: number) => {
    setSelectedWardId(wardId);
    setCurrentScreen('ward-details');
    setIsSearchOpen(false);
  };

  // Search filter
  const searchResults = searchQuery.trim()
    ? WARDS_DATA.filter((w) => {
        const q = searchQuery.toLowerCase();
        return (
          w.ward_name.toLowerCase().includes(q) ||
          w.ward_id.toString().includes(q) ||
          w.zone_name.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Command Bar */}
      <Header
        activeScreenTitle={screenTitles[currentScreen]}
        onOpenSearch={() => setIsSearchOpen(true)}
        selectedRole={userRole}
        onChangeRole={setUserRole}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#090D16]/95">
          {currentScreen === 'dashboard' && (
            <HomeDashboardView
              onSelectWard={handleSelectWard}
              onNavigateToMap={() => setCurrentScreen('map')}
            />
          )}

          {currentScreen === 'map' && (
            <HeatMapView onSelectWard={handleSelectWard} />
          )}

          {currentScreen === 'forecast' && <ForecastView />}

          {currentScreen === 'ward-details' && (
            <WardDetailsView
              selectedWardId={selectedWardId}
              onSelectWard={(id) => setSelectedWardId(id)}
            />
          )}

          {currentScreen === 'alerts' && <AlertsView />}

          {currentScreen === 'methodology' && <MethodologyView />}
        </main>
      </div>

      {/* Global Cmd+K Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Input row */}
            <div className="p-3 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search by Ward Name, ID (1-200), or Zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery.trim() === '' ? (
                <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                  <p>Type a ward number (e.g. "114"), area ("Royapuram", "Adyar"), or zone.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSearchQuery('Royapuram')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                    >
                      Royapuram
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('Anna Nagar')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                    >
                      Anna Nagar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('Tondiarpet')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                    >
                      Tondiarpet
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('114')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                    >
                      Ward 114
                    </button>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No wards found matching "<span className="text-white">{searchQuery}</span>".
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((w) => (
                    <button
                      key={w.ward_id}
                      type="button"
                      onClick={() => handleSelectWard(w.ward_id)}
                      className="w-full p-2.5 rounded-lg hover:bg-slate-800 flex items-center justify-between transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          W{w.ward_id}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {w.ward_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Zone {w.zone_id} • {w.zone_name} ({w.region})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <RiskBadge level={w.risk_level} size="sm" />
                        <span className="text-slate-500 group-hover:text-white">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-slate-400">ESC</kbd> to exit</span>
              <span>200 GCC Wards Indexed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
