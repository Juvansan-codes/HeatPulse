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
import { WARDS_DATA } from '../lib/data';
import { Search, X, ArrowRight } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [selectedWardId, setSelectedWardId] = useState<number>(114);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('GCC Disaster Authority');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [viewKey, setViewKey] = useState<number>(0);

  // Keyboard shortcut: Cmd+K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        setSearchQuery('');
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

  const handleNavigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    setViewKey((k) => k + 1);
  };

  const handleSelectWard = (wardId: number) => {
    setSelectedWardId(wardId);
    setCurrentScreen('ward-details');
    setViewKey((k) => k + 1);
    setIsSearchOpen(false);
    setSearchQuery('');
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
    <div className="h-screen bg-[#090D16] text-slate-100 flex flex-col overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Top Header Command Bar */}
      <Header
        activeScreenTitle={screenTitles[currentScreen]}
        onOpenSearch={() => { setIsSearchOpen(true); setSearchQuery(''); }}
        selectedRole={userRole}
        onChangeRole={setUserRole}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
      />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex min-h-0">
        {/* Navigation Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          <div key={viewKey} className="animate-view-enter p-5 lg:p-6">
            {currentScreen === 'dashboard' && (
              <HomeDashboardView
                onSelectWard={handleSelectWard}
                onNavigateToMap={() => handleNavigate('map')}
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
          </div>
        </main>
      </div>

      {/* Global Cmd+K Search Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsSearchOpen(false); }}
        >
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Search input row */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search by Ward Name, ID (1-200), or Zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {searchQuery.trim() === '' ? (
                <div className="p-5 text-center text-xs text-slate-400 space-y-3">
                  <p>Type a ward number (e.g. "114"), area name, or zone.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {['Royapuram', 'Anna Nagar', 'Tondiarpet', '114'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSearchQuery(q)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No wards found matching &ldquo;<span className="text-white font-medium">{searchQuery}</span>&rdquo;
                </div>
              ) : (
                <div className="space-y-0.5">
                  {searchResults.map((w) => (
                    <button
                      key={w.ward_id}
                      type="button"
                      onClick={() => handleSelectWard(w.ward_id)}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 shrink-0">
                          W{w.ward_id}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-blue-400 truncate">
                            {w.ward_name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Zone {w.zone_id} · {w.zone_name} · {w.region}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 ml-3">
                        <RiskBadge level={w.risk_level} size="sm" />
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-[#0b1120] border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400 mr-1">ESC</kbd>
                to close
              </span>
              <span className="font-mono">200 GCC Wards</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
