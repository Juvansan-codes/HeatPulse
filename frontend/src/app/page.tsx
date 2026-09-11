'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Sidebar, ScreenId } from '../components/Sidebar';
import { MobileNavDrawer } from '../components/MobileNavDrawer';
import { SettingsModal, SettingsConfig } from '../components/SettingsModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { PrototypeController, ViewportMode } from '../components/PrototypeController';
import { HomeDashboardView } from '../views/HomeDashboardView';
import { HeatMapView } from '../views/HeatMapView';
import { ForecastView } from '../views/ForecastView';
import { WardDetailsView } from '../views/WardDetailsView';
import { AlertsView } from '../views/AlertsView';
import { MethodologyView } from '../views/MethodologyView';
import { WARDS_DATA } from '../lib/data';
import { Search, X, ArrowRight, Smartphone } from 'lucide-react';
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

  // Application Shell Phase F1 modals and states
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const [showHotspots, setShowHotspots] = useState<boolean>(false);

  const [settingsConfig, setSettingsConfig] = useState<SettingsConfig>({
    tempUnit: 'C',
    windUnit: 'kmh',
    mapStyle: 'obsidian',
    alertAudio: true,
    autoRefreshInterval: 60,
    showGridOverlay: true,
    extremePulseAnimation: true,
    highContrastMode: false
  });

  // Keyboard shortcut for Cmd+K / Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const screenTitles: Record<ScreenId, string> = {
    dashboard: 'Executive Command Dashboard',
    map: 'Spatial Heat Impact GIS Map (200 Wards)',
    forecast: '5-Day Calibrated Thermal Forecast',
    'ward-details': 'Ward Analysis Dossier',
    alerts: 'Public Health Action Matrix & Advisories',
    methodology: 'Scientific Methodology & Architecture'
  };

  const handleNavigate = useCallback((screen: ScreenId) => {
    setCurrentScreen(screen);
    setViewKey((prev) => prev + 1);
  }, []);

  const handleSelectWard = useCallback((wardId: number) => {
    setSelectedWardId(wardId);
    setCurrentScreen('ward-details');
    setViewKey((prev) => prev + 1);
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  // Search filter
  const searchResults = searchQuery.trim()
    ? WARDS_DATA.filter((w) => {
        const q = searchQuery.toLowerCase();
        return (
          w.ward_name.toLowerCase().includes(q) ||
          w.ward_id.toString().includes(q) ||
          w.zone_name.toLowerCase().includes(q)
        );
      }).slice(0, 20)
    : [];

  const mainAppShell = (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Top Header Command Bar */}
      <Header
        activeScreenTitle={screenTitles[currentScreen]}
        onOpenSearch={() => setIsSearchOpen(true)}
        selectedRole={userRole}
        onChangeRole={setUserRole}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        showHotspots={showHotspots}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Collapsible Desktop) */}
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          showHotspots={showHotspots}
        />

        {/* Dynamic View Canvas with smooth transition: Optimized for GIS and high-density dashboard */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-[#090D16]/95 pb-24">
          <div key={viewKey} className="animate-fadeIn">
            {currentScreen === 'dashboard' && (
              <HomeDashboardView
                onSelectWard={handleSelectWard}
                onNavigateToMap={() => handleNavigate('map')}
                onNavigateToForecast={() => handleNavigate('forecast')}
                onNavigateToAlerts={() => handleNavigate('alerts')}
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

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentScreen={currentScreen}
        onNavigate={(screen) => handleNavigate(screen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
        userRole={userRole}
      />

      {/* Settings & About Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={settingsConfig}
        onSaveConfig={(newConfig) => setSettingsConfig(newConfig)}
      />

      {/* User Profile & Role Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        selectedRole={userRole}
        onChangeRole={setUserRole}
      />

      {/* Global Cmd+K Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 animate-in fade-in duration-150">
          <div className="bg-[#0D1527] border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            {/* Input row */}
            <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-[#0B1120]">
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
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery.trim() === '' ? (
                <div className="p-5 text-center text-xs text-slate-400 space-y-2">
                  <p>Type a ward number (e.g. "114"), area ("Royapuram", "Adyar"), or zone.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {['Royapuram', 'Anna Nagar', 'Tondiarpet', '114', 'Adyar'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSearchQuery(q === '114' ? '114' : q)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700 cursor-pointer"
                      >
                        {q === '114' ? 'Ward 114' : q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No wards found matching "<span className="text-white font-medium">{searchQuery}</span>".
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((w) => (
                    <button
                      key={w.ward_id}
                      type="button"
                      onClick={() => handleSelectWard(w.ward_id)}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between transition-colors text-left group cursor-pointer"
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
                        <span className="text-slate-500 group-hover:text-white transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400 border border-slate-700">ESC</kbd> to exit
              </span>
              <span>200 GCC Wards Indexed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Device Frame Wrapper if in mobile simulated mode */}
      {viewportMode === 'mobile' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#060911] overflow-y-auto">
          <div className="mb-3 flex items-center gap-2 text-xs font-mono text-slate-400">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Figma Prototype Mobile Viewport Simulation (iPhone 15 Pro • 390px)</span>
          </div>
          {/* Smartphone Bezel */}
          <div className="w-full max-w-[390px] h-[844px] bg-[#090D16] rounded-[48px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative ring-1 ring-slate-700/50">
            {/* Dynamic Island / Notch */}
            <div className="h-7 bg-[#090D16] flex items-center justify-center relative shrink-0 z-40">
              <div className="w-24 h-4 bg-black rounded-full" />
            </div>
            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {mainAppShell}
            </div>
          </div>
        </div>
      ) : viewportMode === 'desktop' ? (
        <div className="flex-1 flex flex-col items-center bg-[#070b14] overflow-x-auto">
          <div className="w-full max-w-[1560px] flex-1 shadow-2xl border-x border-slate-800 flex flex-col">
            {mainAppShell}
          </div>
        </div>
      ) : (
        mainAppShell
      )}

      {/* Floating Clickable Prototype Controller & Tour Bar */}
      <PrototypeController
        currentScreen={currentScreen}
        onNavigate={(screen) => handleNavigate(screen)}
        viewportMode={viewportMode}
        onChangeViewportMode={(mode) => setViewportMode(mode)}
        showHotspots={showHotspots}
        onToggleHotspots={() => setShowHotspots(!showHotspots)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />
    </div>
  );
}
